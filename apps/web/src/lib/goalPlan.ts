import { parseLocalDay } from './toolArgs'

const DAY = 86_400_000
const DAYS_PER_MONTH = 365.25 / 12

/** Same three-word vocabulary as budgets, plus the two ends of a goal's life. */
export type GoalStatus = 'reached' | 'onTrack' | 'behind' | 'overdue' | null

export interface GoalPlan {
  remaining: number
  /** Whole days until the deadline (0 on the day); null without one. */
  daysLeft: number | null
  /** What to put away each month from now to land on the deadline; null when not applicable. */
  perMonth: number | null
  /** On track = within 1% of the target of the even-pace share for the time gone since the goal was set. */
  status: GoalStatus
  /** How far below the even pace (only when behind). */
  shortBy: number
}

/**
 * Where a goal stands. Pace is linear from creation to deadline, so a goal
 * set 3 months ago with 6 to go should be a third of the way there. Under a
 * month left, the whole remainder is this month's amount.
 */
export function goalPlan(
  goal: { targetAmount: number; savedAmount: number; deadline?: string | null; createdAt: string },
  today: Date = new Date()
): GoalPlan {
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const base = { remaining, daysLeft: null, perMonth: null, shortBy: 0 }
  if (remaining === 0) return { ...base, status: 'reached' }
  if (!goal.deadline) return { ...base, status: null }

  const deadline = parseLocalDay(goal.deadline)
  const daysLeft = Math.round((deadline.getTime() - start.getTime()) / DAY)
  if (daysLeft < 0) return { ...base, daysLeft, status: 'overdue' }

  const perMonth = remaining / Math.max(1, daysLeft / DAYS_PER_MONTH)
  const created = new Date(goal.createdAt)
  const total = deadline.getTime() - created.getTime()
  const elapsed = Math.min(1, Math.max(0, (start.getTime() - created.getTime()) / (total || 1)))
  const expected = goal.targetAmount * elapsed
  const shortBy = Math.max(0, expected - goal.savedAmount)
  // A few euros under an exact straight line isn't "behind" — allow 1% of the target.
  const behind = shortBy > goal.targetAmount * 0.01
  return { remaining, daysLeft, perMonth, status: behind ? 'behind' : 'onTrack', shortBy: behind ? shortBy : 0 }
}
