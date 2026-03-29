import { StateGraph, END, START, Annotation } from '@langchain/langgraph'
import type { MonthlySnapshot, Transaction, QueryIntent } from '@truffle/types'
import { routeIntent } from './agents/intentRouter'
import { analyseSpending } from './agents/spendingAnalyst'
import { queryTransactions } from './vectorStore'

const GraphAnnotation = Annotation.Root({
  userQuery: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  agentResponse: Annotation<string>({ reducer: (x, y) => y ?? x, default: () => '' }),
  intent: Annotation<QueryIntent>({ reducer: (x, y) => y ?? x, default: () => 'general_advice' as QueryIntent }),
  transactions: Annotation<Transaction[]>({ reducer: (x, y) => y ?? x, default: () => [] }),
  currentMonth: Annotation<MonthlySnapshot | null>({ reducer: (x, y) => y ?? x, default: () => null }),
})

type GraphState = typeof GraphAnnotation.State

async function intentRouterNode(state: GraphState): Promise<Partial<GraphState>> {
  const intent = await routeIntent(state.userQuery)
  return { intent }
}

async function spendingAnalystNode(state: GraphState): Promise<Partial<GraphState>> {
  const userId = state.transactions[0]?.userId ?? ''
  const retrieved = await queryTransactions(userId, state.userQuery, 20)
  const transactions = retrieved.length > 0 ? retrieved : state.transactions

  const analysis = await analyseSpending(
    state.userQuery,
    transactions,
    state.currentMonth ?? {
      month: new Date().toISOString().slice(0, 7),
      totalIncome: 0,
      totalExpenses: 0,
      byCategory: {} as MonthlySnapshot['byCategory'],
      savingsRate: 0,
      balance: 0,
    }
  )
  return { agentResponse: analysis }
}

function routeAfterIntent(state: GraphState): string {
  switch (state.intent) {
    case 'spending_summary':
    case 'category_breakdown':
      return 'spendingAnalyst'
    default:
      return 'spendingAnalyst'
  }
}

export function buildTruffleGraph() {
  return new StateGraph(GraphAnnotation)
    .addNode('intentRouter', intentRouterNode)
    .addNode('spendingAnalyst', spendingAnalystNode)
    .addEdge(START, 'intentRouter')
    .addConditionalEdges('intentRouter', routeAfterIntent, {
      spendingAnalyst: 'spendingAnalyst',
    })
    .addEdge('spendingAnalyst', END)
    .compile()
}
