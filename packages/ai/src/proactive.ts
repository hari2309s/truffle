import { StateGraph, END, START } from '@langchain/langgraph'
import type { Transaction, Anomaly, SavingsGoal, MonthlySnapshot } from '@truffle/types'
import { reviewAnomalies } from './agents/anomalyReviewer'
import { adviseSavingsGoals } from './agents/savingsGoalAdvisor'
import { adviseHabit } from './agents/habitAdvisor'
import { GraphAnnotation } from './graph'
import { langfuse } from './langfuse'
import { currentYearMonth } from './date'

type ProactiveState = typeof GraphAnnotation.State

function emptySnapshot(): MonthlySnapshot {
  return {
    month: currentYearMonth(),
    totalIncome: 0,
    totalExpenses: 0,
    byCategory: {} as MonthlySnapshot['byCategory'],
    savingsRate: 0,
    balance: 0,
  }
}

function routeByIntent(state: ProactiveState): string {
  if (state.intent === 'anomaly_review') return 'anomalyNudge'
  if (state.intent === 'habit_setting') return 'habitNudge'
  return 'goalNudge'
}

/**
 * Proactive graph — skips the intent router since the trigger already tells us
 * what kind of insight to surface. Routes directly to the relevant analyst node.
 * traceId is threaded via closure so each node can attach child generations to
 * the parent Langfuse trace.
 */
function buildProactiveGraph(traceId: string) {
  async function anomalyNudgeNode(state: ProactiveState): Promise<Partial<ProactiveState>> {
    const response = await reviewAnomalies(
      state.userQuery,
      state.transactions,
      state.anomalies,
      traceId
    )
    return { agentResponse: response }
  }

  async function goalNudgeNode(state: ProactiveState): Promise<Partial<ProactiveState>> {
    const response = await adviseSavingsGoals(
      state.userQuery,
      state.savingsGoals,
      state.currentMonth ?? emptySnapshot(),
      traceId
    )
    return { agentResponse: response }
  }

  async function habitNudgeNode(state: ProactiveState): Promise<Partial<ProactiveState>> {
    const response = await adviseHabit(state.userQuery, traceId)
    return { agentResponse: response }
  }

  return new StateGraph(GraphAnnotation)
    .addNode('anomalyNudge', anomalyNudgeNode)
    .addNode('goalNudge', goalNudgeNode)
    .addNode('habitNudge', habitNudgeNode)
    .addConditionalEdges(START, routeByIntent, {
      anomalyNudge: 'anomalyNudge',
      goalNudge: 'goalNudge',
      habitNudge: 'habitNudge',
    })
    .addEdge('anomalyNudge', END)
    .addEdge('goalNudge', END)
    .addEdge('habitNudge', END)
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

export interface GoalAtRiskTrigger {
  type: 'goal_at_risk'
  goal: SavingsGoal
  daysRemaining: number
  projectedShortfall: number
}

export interface HabitStreakTrigger {
  type: 'habit_streak'
  habitId: string
  habitName: string
  habitEmoji: string
  streak: number
}

export interface HabitCheckInTrigger {
  type: 'habit_check_in'
  habitId: string
  habitName: string
  habitEmoji: string
  frequency: 'weekly' | 'monthly'
  amount: number
  period: string
  lastStreak: number
}

export interface BudgetWarningTrigger {
  type: 'budget_warning'
  category: string
  categoryEmoji: string
  spentAmount: number
  budgetAmount: number
  percentUsed: number // 80 = 80%, 100+ = over budget
  month: string // YYYY-MM
}

type ProactiveTrigger =
  | AnomalyTrigger
  | GoalMilestoneTrigger
  | GoalAtRiskTrigger
  | HabitStreakTrigger
  | HabitCheckInTrigger
  | BudgetWarningTrigger

function getNudgeKey(trigger: ProactiveTrigger): string {
  switch (trigger.type) {
    case 'anomaly':
      return `anomaly:${trigger.anomaly.transactionId}`
    case 'goal_milestone':
      return `goal:${trigger.goal.id}:${trigger.milestone}`
    case 'goal_at_risk':
      return `goal-at-risk:${trigger.goal.id}:${currentYearMonth()}`
    case 'habit_streak':
      return `habit-streak:${trigger.habitId}:${trigger.streak}`
    case 'habit_check_in':
      return `habit-checkin:${trigger.habitId}:${trigger.period}`
    case 'budget_warning':
      return `budget-warning:${trigger.category}:${trigger.month}:${trigger.percentUsed >= 100 ? '100' : '80'}`
  }
}

export async function generateProactiveMessage(
  trigger: ProactiveTrigger,
  userId?: string
): Promise<string | null> {
  const nudgeKey = getNudgeKey(trigger)

  const input = buildGraphInput(trigger)

  const trace = langfuse.trace({
    name: 'proactive_nudge',
    userId,
    input: input.userQuery,
    metadata: { triggerType: trigger.type, nudgeKey },
  })

  const graph = buildProactiveGraph(trace.id)
  const result = await graph.invoke(input)
  const message = result.agentResponse?.trim() || null

  trace.update({ output: message ?? '' })
  await langfuse.flushAsync()
  return message
}

function buildGraphInput(trigger: ProactiveTrigger) {
  const empty = {
    transactions: [] as Transaction[],
    anomalies: [] as Anomaly[],
    savingsGoals: [] as SavingsGoal[],
    currentMonth: null as MonthlySnapshot | null,
  }

  switch (trigger.type) {
    case 'anomaly':
      return {
        ...empty,
        userQuery: `You just detected an anomaly: "${trigger.anomaly.description}". Write a brief, warm proactive message for the user — no more than 2-3 sentences.`,
        intent: 'anomaly_review' as const,
        transactions: trigger.transactions,
        anomalies: [trigger.anomaly],
        currentMonth: trigger.snapshot,
      }
    case 'goal_milestone':
      return {
        ...empty,
        userQuery: `The user just hit ${trigger.milestone}% of their "${trigger.goal.name}" goal (${trigger.goal.emoji}). Celebrate this briefly and mention their momentum — 1-2 sentences.`,
        intent: 'savings_goal_check' as const,
        savingsGoals: [trigger.goal],
        currentMonth: trigger.snapshot,
      }
    case 'goal_at_risk':
      return {
        ...empty,
        userQuery: `The user's "${trigger.goal.name}" savings goal (${trigger.goal.emoji}) has ${trigger.daysRemaining} days until its deadline, but they still need €${trigger.projectedShortfall.toFixed(0)} to reach their €${trigger.goal.targetAmount} target. They've saved €${trigger.goal.savedAmount} so far. Write a brief, encouraging nudge — 1-2 sentences. Motivate without being preachy.`,
        intent: 'savings_goal_check' as const,
        savingsGoals: [trigger.goal],
      }
    case 'habit_streak':
      return {
        ...empty,
        userQuery: `The user just logged their "${trigger.habitName}" (${trigger.habitEmoji}) savings habit and hit a ${trigger.streak}-period streak! Write a brief, warm celebration — 1-2 sentences. Acknowledge the consistency.`,
        intent: 'habit_setting' as const,
      }
    case 'habit_check_in':
      return {
        ...empty,
        userQuery: `The user's "${trigger.habitName}" (${trigger.habitEmoji}) savings habit hasn't been logged yet this ${trigger.frequency === 'weekly' ? 'week' : 'month'}. They save €${trigger.amount} per ${trigger.frequency === 'weekly' ? 'week' : 'month'}${trigger.lastStreak > 0 ? ` and had a ${trigger.lastStreak}-period streak going` : ''}. Write a gentle, non-judgmental reminder — 1-2 sentences. Don't be pushy.`,
        intent: 'habit_setting' as const,
      }
    case 'budget_warning': {
      const catLabel = trigger.category.replace(/_/g, ' ')
      const isOver = trigger.percentUsed >= 100
      return {
        ...empty,
        userQuery: isOver
          ? `The user has exceeded their ${trigger.categoryEmoji} ${catLabel} budget this month — they've spent €${trigger.spentAmount.toFixed(0)} against a €${trigger.budgetAmount.toFixed(0)} limit (${trigger.percentUsed.toFixed(0)}% used). Write a brief, calm, non-judgmental heads-up — 1-2 sentences. Don't lecture.`
          : `The user has used ${trigger.percentUsed.toFixed(0)}% of their ${trigger.categoryEmoji} ${catLabel} budget this month — €${trigger.spentAmount.toFixed(0)} of €${trigger.budgetAmount.toFixed(0)}. Write a brief, friendly heads-up noting they're getting close — 1-2 sentences.`,
        intent: 'spending_summary' as const,
      }
    }
  }
}
