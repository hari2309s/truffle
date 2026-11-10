import type { MonthlySnapshot, SpendTrend, TransactionCategory } from '@truffle/types'

/** A category must be ≥50 % above its 3-month average to count as a trend. */
const MIN_CHANGE_PCT = 50
/** Absolute increase must exceed €30 to avoid noise on small amounts. */
const MIN_ABSOLUTE_DELTA = 30
/** Need at least 2 baseline months with non-zero spend in the category. */
const MIN_ACTIVE_MONTHS = 2
/** Categories that are not "spending". */
const EXCLUDED: Set<string> = new Set(['income', 'savings'])

/**
 * Detects categories where the user's current-month spending is significantly
 * above their recent rolling average.
 *
 * @param currentSpendByCategory Positive amounts per category for the current
 *   month (same shape as `budgets.spendByCategory()`).
 * @param baselineSnapshots      Up to 3 previous `MonthlySnapshot` objects.
 *   `byCategory` stores signed values (expenses negative).
 * @returns Trends sorted by absoluteDelta descending.
 */
export function detectSpendTrends(
  currentSpendByCategory: Record<string, number>,
  baselineSnapshots: MonthlySnapshot[]
): SpendTrend[] {
  if (baselineSnapshots.length === 0) return []

  const trends: SpendTrend[] = []

  for (const [category, currentSpend] of Object.entries(currentSpendByCategory)) {
    if (EXCLUDED.has(category)) continue
    if (currentSpend <= 0) continue

    // Count how many baseline months had non-zero spend in this category and
    // accumulate the total so we can compute the average across ALL baseline
    // months (including zeros — a zero month drags the average down, making a
    // spike this month more visible).
    let activeMonths = 0
    let totalBaseline = 0
    for (const snap of baselineSnapshots) {
      const raw = snap.byCategory[category as TransactionCategory] ?? 0
      // byCategory stores signed values (expenses negative) → convert
      const positive = Math.abs(Math.min(raw, 0))
      if (positive > 0) activeMonths++
      totalBaseline += positive
    }

    if (activeMonths < MIN_ACTIVE_MONTHS) continue

    const averageSpend = totalBaseline / baselineSnapshots.length
    if (averageSpend <= 0) continue

    const absoluteDelta = currentSpend - averageSpend
    const changePct = (absoluteDelta / averageSpend) * 100

    if (changePct >= MIN_CHANGE_PCT && absoluteDelta >= MIN_ABSOLUTE_DELTA) {
      trends.push({
        category: category as TransactionCategory,
        currentSpend,
        averageSpend,
        changePct,
        absoluteDelta,
      })
    }
  }

  return trends.sort((a, b) => b.absoluteDelta - a.absoluteDelta)
}
