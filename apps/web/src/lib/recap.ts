/** Facts for the weekly recap: the last 7 days against a usual week. */
export interface RecapFacts {
  /** ISO week number of `today`. */
  week: number
  from: Date
  to: Date
  /** Spend in the last 7 days (positive). */
  spent: number
  /** Average weekly spend over the 4 weeks before that, or null without history. */
  usual: number | null
  income: number
  /** The category with the most spend this week. */
  top: { category: string; amount: number; count: number; weekday: number } | null
  transactionCount: number
}

const DAY = 86_400_000

export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY + 1) / 7)
}

/** Local-midnight timestamp for a YYYY-MM-DD date string. */
function dayStart(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, d ?? 1).getTime()
}

/**
 * Pure: `today` is injectable for tests. The week is the 7 days ending today;
 * "usual" averages the 28 days before it, only when there's spend in them.
 */
export function buildRecap(
  transactions: { amount: number | string; category: string; date: string }[],
  today: Date = new Date()
): RecapFacts | null {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const weekStart = end - 6 * DAY
  const usualStart = weekStart - 28 * DAY

  let spent = 0
  let income = 0
  let usualSpent = 0
  let count = 0
  const byCategory = new Map<string, { amount: number; count: number; byDay: number[] }>()

  for (const tx of transactions) {
    const t = dayStart(String(tx.date))
    const amount = Number(tx.amount)
    if (t >= weekStart && t <= end) {
      count++
      if (amount > 0) income += amount
      else {
        spent -= amount
        const entry = byCategory.get(tx.category) ?? {
          amount: 0,
          count: 0,
          byDay: [0, 0, 0, 0, 0, 0, 0],
        }
        entry.amount -= amount
        entry.count++
        entry.byDay[new Date(t).getDay()]! -= amount
        byCategory.set(tx.category, entry)
      }
    } else if (t >= usualStart && t < weekStart && amount < 0) {
      usualSpent -= amount
    }
  }

  if (count === 0) return null

  let top: RecapFacts['top'] = null
  for (const [category, entry] of byCategory) {
    if (!top || entry.amount > top.amount) {
      const weekday = entry.byDay.indexOf(Math.max(...entry.byDay))
      top = { category, amount: entry.amount, count: entry.count, weekday }
    }
  }

  return {
    week: isoWeek(today),
    from: new Date(weekStart),
    to: new Date(end),
    spent,
    usual: usualSpent > 0 ? usualSpent / 4 : null,
    income,
    top,
    transactionCount: count,
  }
}
