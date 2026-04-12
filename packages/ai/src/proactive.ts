import { StateGraph, END, START } from '@langchain/langgraph'
import type { Transaction, Anomaly, SavingsGoal, MonthlySnapshot } from '@truffle/types'
import { reviewAnomalies } from './agents/anomalyReviewer'
import { adviseSavingsGoals } from './agents/savingsGoalAdvisor'
import { GraphAnnotation } from './graph'
import { langfuse } from './langfuse'

type ProactiveState = typeof GraphAnnotation.State

function emptySnapshot(): MonthlySnapshot {
  return {
    month: new Date().toISOString().slice(0, 7),
    totalIncome: 0,
    totalExpenses: 0,
    byCategory: {} as MonthlySnapshot['byCategory'],
    savingsRate: 0,
    balance: 0,
  }
}

async function anomalyNudgeNode(state: ProactiveState): Promise<Partial<ProactiveState>> {
  const response = await reviewAnomalies(state.userQuery, state.transactions, state.anomalies)
  return { agentResponse: response }
}

async function goalNudgeNode(state: ProactiveState): Promise<Partial<ProactiveState>> {
  const response = await adviseSavingsGoals(
    state.userQuery,
    state.savingsGoals,
    state.currentMonth ?? emptySnapshot()
  )
  return { agentResponse: response }
}

function routeByIntent(state: ProactiveState): string {
  return state.intent === 'anomaly_review' ? 'anomalyNudge' : 'goalNudge'
}

/**
 * Proactive graph — skips the intent router since the trigger already tells us
 * what kind of insight to surface. Routes directly to the relevant analyst node.
 */
function buildProactiveGraph() {
  return new StateGraph(GraphAnnotation)
    .addNode('anomalyNudge', anomalyNudgeNode)
    .addNode('goalNudge', goalNudgeNode)
    .addConditionalEdges(START, routeByIntent, {
      anomalyNudge: 'anomalyNudge',
      goalNudge: 'goalNudge',
    })
    .addEdge('anomalyNudge', END)
    .addEdge('goalNudge', END)
    .compile()
}

export interface AnomalyTrigger {
  type: 'anomaly'
  anomaly: Anomaly
  transactions: Transaction[]
  snapshot: MonthlySnapshot | null
}

export interface GoalMilestoneTrigger {
  type: 'goal_milestone'
  goal: SavingsGoal
  milestone: 25 | 50 | 75 | 100
  snapshot: MonthlySnapshot | null
}

export async function generateProactiveMessage(
  trigger: AnomalyTrigger | GoalMilestoneTrigger,
  userId?: string
): Promise<string | null> {
  const graph = buildProactiveGraph()

  const nodeName = trigger.type === 'anomaly' ? 'anomalyNudge' : 'goalNudge'
  const nudgeKey =
    trigger.type === 'anomaly'
      ? `anomaly:${trigger.anomaly.transactionId}`
      : `goal:${trigger.goal.id}:${trigger.milestone}`

  const input =
    trigger.type === 'anomaly'
      ? {
          userQuery: `You just detected an anomaly: "${trigger.anomaly.description}". Write a brief, warm proactive message for the user — no more than 2-3 sentences.`,
          intent: 'anomaly_review' as const,
          transactions: trigger.transactions,
          anomalies: [trigger.anomaly],
          savingsGoals: [] as SavingsGoal[],
          currentMonth: trigger.snapshot,
        }
      : {
          userQuery: `The user just hit ${trigger.milestone}% of their "${trigger.goal.name}" goal (${trigger.goal.emoji}). Celebrate this briefly and mention their momentum — 1-2 sentences.`,
          intent: 'savings_goal_check' as const,
          transactions: [] as Transaction[],
          anomalies: [] as Anomaly[],
          savingsGoals: [trigger.goal],
          currentMonth: trigger.snapshot,
        }

  const trace = langfuse.trace({
    name: 'proactive_nudge',
    userId,
    input: input.userQuery,
    metadata: { triggerType: trigger.type, nudgeKey },
  })
  const span = trace.span({ name: nodeName, input: input.userQuery })

  const result = await graph.invoke(input)
  const message = result.agentResponse?.trim() || null

  span.end({ output: message ?? '' })
  await langfuse.flushAsync()

  return message
}
