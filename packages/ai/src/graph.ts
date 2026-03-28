import { StateGraph, END } from '@langchain/langgraph'
import type { TruffleState } from '@truffle/types'
import { routeIntent } from './agents/intentRouter'
import { analyseSpending } from './agents/spendingAnalyst'
import { queryTransactions } from './vectorStore'

// Minimal state type for the graph
type GraphState = Pick<TruffleState, 'userQuery' | 'agentResponse' | 'intent'> & {
  transactions: TruffleState['transactions']
  currentMonth: TruffleState['currentMonth']
}

async function intentRouterNode(state: GraphState): Promise<Partial<GraphState>> {
  const intent = await routeIntent(state.userQuery ?? '')
  return { intent }
}

async function spendingAnalystNode(state: GraphState): Promise<Partial<GraphState>> {
  const userId = state.transactions[0]?.userId ?? ''
  const retrieved = await queryTransactions(userId, state.userQuery ?? '', 20)
  const transactions = retrieved.length > 0 ? retrieved : state.transactions

  const analysis = await analyseSpending(
    state.userQuery ?? '',
    transactions,
    state.currentMonth
  )
  return { agentResponse: analysis }
}

async function generalNode(state: GraphState): Promise<Partial<GraphState>> {
  // For unhandled intents, fall back to spending analyst
  return spendingAnalystNode(state)
}

function routeAfterIntent(state: GraphState): string {
  switch (state.intent) {
    case 'spending_summary':
    case 'category_breakdown':
      return 'spendingAnalyst'
    default:
      return 'general'
  }
}

export function buildTruffleGraph() {
  const graph = new StateGraph<GraphState>({
    channels: {
      userQuery: { value: (x: string, y: string) => y ?? x, default: () => '' },
      agentResponse: { value: (x: string, y: string) => y ?? x, default: () => '' },
      intent: { value: (x: string, y: string) => y ?? x, default: () => 'general_advice' },
      transactions: { value: (x: unknown[], y: unknown[]) => y ?? x, default: () => [] },
      currentMonth: { value: (x: unknown, y: unknown) => y ?? x, default: () => ({}) },
    },
  })

  graph.addNode('intentRouter', intentRouterNode)
  graph.addNode('spendingAnalyst', spendingAnalystNode)
  graph.addNode('general', generalNode)

  graph.setEntryPoint('intentRouter')
  graph.addConditionalEdges('intentRouter', routeAfterIntent, {
    spendingAnalyst: 'spendingAnalyst',
    general: 'general',
  })
  graph.addEdge('spendingAnalyst', END)
  graph.addEdge('general', END)

  return graph.compile()
}
