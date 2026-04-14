import { createServerClient } from '@truffle/db'
import type { Anomaly, SavingsGoal, Transaction, MonthlySnapshot } from '@truffle/types'

/**
 * Checks whether a nudge with this key has already been sent to this user.
 * nudge_key has a unique index per user, so duplicate inserts will be rejected
 * by the DB — this pre-check just avoids an unnecessary LLM call.
 */
async function alreadySent(
  db: ReturnType<typeof createServerClient>,
  userId: string,
  nudgeKey: string
): Promise<boolean> {
  const { data } = await db
    .from('chat_messages')
    .select('id')
    .eq('user_id', userId)
    .eq('nudge_key', nudgeKey)
    .limit(1)
  return (data?.length ?? 0) > 0
}

async function writeNudge(
  db: ReturnType<typeof createServerClient>,
  userId: string,
  content: string,
  nudgeKey: string
) {
  await db.from('chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content,
    is_proactive: true,
    nudge_key: nudgeKey,
  })
}

export async function sendAnomalyNudge(params: {
  userId: string
  anomaly: Anomaly
  transactions: Transaction[]
  snapshot: MonthlySnapshot | null
}) {
  const { userId, anomaly, transactions, snapshot } = params
  const nudgeKey = `anomaly:${anomaly.transactionId}`
  const db = createServerClient()

  if (await alreadySent(db, userId, nudgeKey)) return

  const { generateProactiveMessage } = await import('@truffle/ai')
  const message = await generateProactiveMessage(
    {
      type: 'anomaly',
      anomaly,
      transactions,
      snapshot,
    },
    userId
  )
  if (!message) return

  await writeNudge(db, userId, message, nudgeKey)
}

export async function sendGoalMilestoneNudge(params: {
  userId: string
  goal: SavingsGoal
  milestone: 25 | 50 | 75 | 100
  snapshot: MonthlySnapshot | null
}) {
  const { userId, goal, milestone, snapshot } = params
  const nudgeKey = `goal:${goal.id}:${milestone}`
  const db = createServerClient()

  if (await alreadySent(db, userId, nudgeKey)) return

  const { generateProactiveMessage } = await import('@truffle/ai')
  const message = await generateProactiveMessage(
    {
      type: 'goal_milestone',
      goal,
      milestone,
      snapshot,
    },
    userId
  )
  if (!message) return

  await writeNudge(db, userId, message, nudgeKey)
}

export async function sendGoalAtRiskNudge(params: {
  userId: string
  goal: SavingsGoal
  daysRemaining: number
  projectedShortfall: number
}) {
  const { userId, goal, daysRemaining, projectedShortfall } = params
  const nudgeKey = `goal-at-risk:${goal.id}:${new Date().toISOString().slice(0, 7)}`
  const db = createServerClient()

  if (await alreadySent(db, userId, nudgeKey)) return

  const { generateProactiveMessage } = await import('@truffle/ai')
  const message = await generateProactiveMessage(
    { type: 'goal_at_risk', goal, daysRemaining, projectedShortfall },
    userId
  )
  if (!message) return

  await writeNudge(db, userId, message, nudgeKey)
}

export async function sendHabitStreakNudge(params: {
  userId: string
  habitId: string
  habitName: string
  habitEmoji: string
  streak: number
}) {
  const { userId, habitId, habitName, habitEmoji, streak } = params
  const nudgeKey = `habit-streak:${habitId}:${streak}`
  const db = createServerClient()

  if (await alreadySent(db, userId, nudgeKey)) return

  const { generateProactiveMessage } = await import('@truffle/ai')
  const message = await generateProactiveMessage(
    { type: 'habit_streak', habitId, habitName, habitEmoji, streak },
    userId
  )
  if (!message) return

  await writeNudge(db, userId, message, nudgeKey)
}

export async function sendHabitCheckInNudge(params: {
  userId: string
  habitId: string
  habitName: string
  habitEmoji: string
  frequency: 'weekly' | 'monthly'
  amount: number
  period: string
  lastStreak: number
}) {
  const { userId, habitId, habitName, habitEmoji, frequency, amount, period, lastStreak } = params
  const nudgeKey = `habit-checkin:${habitId}:${period}`
  const db = createServerClient()

  if (await alreadySent(db, userId, nudgeKey)) return

  const { generateProactiveMessage } = await import('@truffle/ai')
  const message = await generateProactiveMessage(
    {
      type: 'habit_check_in',
      habitId,
      habitName,
      habitEmoji,
      frequency,
      amount,
      period,
      lastStreak,
    },
    userId
  )
  if (!message) return

  await writeNudge(db, userId, message, nudgeKey)
}
