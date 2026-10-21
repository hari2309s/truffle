import { currentYearMonth } from './date'

export interface Forecast {
  currentBalance: number
  projectedEndOfMonth: number
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]
}

export function computeForecast(
  transactions: { amount: number | string; currency?: string; date: string }[],
  formatAmount: (n: number) => string = (n) => `€${Math.abs(n).toFixed(2)}`
): Forecast | null {
  const currentMonth = currentYearMonth()
  const txs = transactions.filter((t) => String(t.date).startsWith(currentMonth))
  if (txs.length === 0) return null

  const amounts = txs.map((t) => Number(t.amount))
  const totalIncome = amounts.filter((a) => a > 0).reduce((s, a) => s + a, 0)
  const totalExpenses = amounts.filter((a) => a < 0).reduce((s, a) => s + a, 0)
  const balance = amounts.reduce((s, a) => s + a, 0)

  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysElapsed = today.getDate()
  const daysRemaining = daysInMonth - daysElapsed
  const dailySpendRate = daysElapsed > 0 && totalExpenses < 0 ? totalExpenses / daysElapsed : 0
  const projectedEndOfMonth = balance + dailySpendRate * daysRemaining

  const monthName = today.toLocaleString('default', { month: 'long' })
  const count = txs.length

  return {
    currentBalance: balance,
    projectedEndOfMonth,
    confidence: count >= 10 ? 'high' : count >= 3 ? 'medium' : 'low',
    assumptions: [
      `Based on ${count} transaction${count !== 1 ? 's' : ''} in ${monthName}`,
      `Daily spend rate: ${formatAmount(Math.abs(dailySpendRate))}`,
      `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`,
      `Income this month: ${formatAmount(totalIncome)}`,
    ],
  }
}

export interface Statement {
  /**
   * Net of this month's transactions (income minus spend). Deliberately not
   * all-time: the client only holds the newest 500 transactions, so an
   * all-time sum would be silently wrong for long-standing users.
   */
  balance: number
  /** Money out so far this calendar month (positive number). */
  spentThisMonth: number
  /** Average spend per elapsed day this month (positive number). */
  dailyRate: number
  /** Spend projected for the whole month at the current daily rate. */
  forecastMonthSpend: number
  /** This month's net at month end if spending continues at the daily rate. */
  projectedClose: number
  /** Last day of the current month (for the "Forecast 31 Oct" line). */
  monthEnd: Date
  /**
   * Spend this month vs last month over the same number of days:
   * 'ahead' = spending less, 'behind' = spending more, null = no last-month data.
   */
  pace: 'ahead' | 'behind' | null
  /** First day of last month (for "ahead of September"). */
  lastMonth: Date
}

/**
 * Everything the Home statement slip prints. Pure — `today` is injectable so
 * tests can pin the calendar.
 */
export function computeStatement(
  transactions: { amount: number | string; date: string }[],
  today: Date = new Date()
): Statement | null {
  if (transactions.length === 0) return null

  const y = today.getFullYear()
  const m = today.getMonth()
  const ym = (yy: number, mm: number) => `${yy}-${String(mm + 1).padStart(2, '0')}`
  const thisMonth = ym(y, m)
  const lastMonthDate = new Date(y, m - 1, 1)
  const prevMonth = ym(lastMonthDate.getFullYear(), lastMonthDate.getMonth())
  const dayOfMonth = today.getDate()
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  let balance = 0
  let spentThisMonth = 0
  let spentLastMonthToDate = 0
  let hasLastMonth = false
  let hasThisMonth = false
  for (const tx of transactions) {
    const amount = Number(tx.amount)
    const date = String(tx.date)
    if (date.startsWith(thisMonth)) {
      hasThisMonth = true
      balance += amount
      if (amount < 0) spentThisMonth += -amount
    }
    if (date.startsWith(prevMonth)) {
      hasLastMonth = true
      if (amount < 0 && Number(date.slice(8, 10)) <= dayOfMonth) spentLastMonthToDate += -amount
    }
  }

  if (!hasThisMonth) return null

  const dailyRate = spentThisMonth / dayOfMonth
  const daysRemaining = daysInMonth - dayOfMonth

  return {
    balance,
    spentThisMonth,
    dailyRate,
    forecastMonthSpend: spentThisMonth + dailyRate * daysRemaining,
    projectedClose: balance - dailyRate * daysRemaining,
    monthEnd: new Date(y, m, daysInMonth),
    pace: hasLastMonth ? (spentThisMonth <= spentLastMonthToDate ? 'ahead' : 'behind') : null,
    lastMonth: lastMonthDate,
  }
}
