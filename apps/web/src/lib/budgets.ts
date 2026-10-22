/**
 * Budget maths shared by the UI and the nudge check on the server.
 */

export const DEFAULT_ALERT_PCT = 80

/**
 * This month's limit: the base amount plus, with rollover, last month's
 * unused part. Only budgets that already existed before this month began can
 * roll anything over — a budget created this month had no "last month".
 */
export function effectiveLimit(
  budget: { amount: number; rollover?: boolean; createdAt?: string },
  spentLastMonth: number,
  now: Date = new Date()
): number {
  if (!budget.rollover) return budget.amount
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  if (budget.createdAt && new Date(budget.createdAt) >= monthStart) return budget.amount
  return budget.amount + Math.max(0, budget.amount - spentLastMonth)
}

export type BudgetStatus = 'over' | 'headsUp' | 'onTrack'

/** Over at >100%; heads-up from the alert threshold (if not switched off). */
export function budgetStatus(spent: number, limit: number, alertPct: number | null | undefined): BudgetStatus {
  const pct = limit > 0 ? (spent / limit) * 100 : 0
  if (pct > 100) return 'over'
  const threshold = alertPct === undefined ? DEFAULT_ALERT_PCT : alertPct
  if (threshold !== null && pct >= threshold) return 'headsUp'
  return 'onTrack'
}

/** YYYY-MM for the month before `ym`. */
export function previousMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y!, (m ?? 1) - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Spend (positive) per category for one month (YYYY-MM). */
export function spendByCategory(
  transactions: { amount: number; category: string; date: string }[],
  ym: string
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const tx of transactions) {
    if (tx.amount < 0 && tx.date.startsWith(ym)) map[tx.category] = (map[tx.category] ?? 0) - tx.amount
  }
  return map
}

export interface BudgetView {
  spent: number
  /** This month's limit, including any rolled-over amount. */
  limit: number
  rolledOver: number
  pct: number
  status: BudgetStatus
}

/** Everything a budget row needs for the current month. */
export function budgetView(
  budget: {
    amount: number
    category: string
    rollover?: boolean
    alertPct?: number | null
    createdAt?: string
  },
  transactions: { amount: number; category: string; date: string }[],
  now: Date = new Date()
): BudgetView {
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const spent = spendByCategory(transactions, ym)[budget.category] ?? 0
  const lastSpent = spendByCategory(transactions, previousMonth(ym))[budget.category] ?? 0
  const limit = effectiveLimit(budget, lastSpent, now)
  return {
    spent,
    limit,
    rolledOver: limit - budget.amount,
    pct: limit > 0 ? (spent / limit) * 100 : 0,
    status: budgetStatus(spent, limit, budget.alertPct),
  }
}
