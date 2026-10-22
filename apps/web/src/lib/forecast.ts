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
   * All-time net when the server supplies it (`allTimeBalance`); otherwise
   * this month's net. `balanceIsAllTime` says which.
   */
  balance: number
  balanceIsAllTime: boolean
  /** Money in so far this calendar month (positive number). */
  incomeThisMonth: number
  /** Spending so far this calendar month (positive) — not money moved to savings. */
  spentThisMonth: number
  /**
   * Moved to savings and investments this month (category 'savings'), net of
   * anything taken back out — negative when more came out than went in.
   */
  savedThisMonth: number
  /** This month's income minus everything out, spending and savings alike. */
  netThisMonth: number
  /** Average spending per elapsed day this month — savings don't count. */
  dailyRate: number
  /** Spend projected for the whole month at the current daily rate. */
  forecastMonthSpend: number
  /** Income − projected spend − saved: where the month closes. */
  projectedClose: number
  /** Last day of the current month (for the "Projected spend · 31 Oct" line). */
  monthEnd: Date
  /**
   * Spend this month vs last month over the same number of days:
   * 'ahead' = spending less, 'behind' = spending more, 'even' = within €1,
   * null = no last-month data.
   */
  pace: 'ahead' | 'behind' | 'even' | null
  /** How far apart the two are (always ≥ 0); 0 when pace is null. */
  paceDelta: number
  /** First day of last month (for "ahead of September"). */
  lastMonth: Date
}

/**
 * Everything the Home statement slip prints. Pure — `today` is injectable so
 * tests can pin the calendar.
 */
export function computeStatement(
  transactions: { amount: number | string; date: string; category?: string }[],
  today: Date = new Date(),
  allTimeBalance: number | null = null
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
  let savedThisMonth = 0
  let incomeThisMonth = 0
  let spentLastMonthToDate = 0
  let hasLastMonth = false
  let hasThisMonth = false
  for (const tx of transactions) {
    const amount = Number(tx.amount)
    const date = String(tx.date)
    if (date.startsWith(thisMonth)) {
      hasThisMonth = true
      balance += amount
      // Savings and investment transfers stay yours: they're out of the
      // month's money but not spending, so they don't drive the daily rate.
      // A goal withdrawal (positive, 'savings') is money back from savings, not income.
      if (tx.category === 'savings') savedThisMonth -= amount
      else if (amount < 0) spentThisMonth += -amount
      else incomeThisMonth += amount
    }
    if (date.startsWith(prevMonth)) {
      hasLastMonth = true
      if (amount < 0 && tx.category !== 'savings' && Number(date.slice(8, 10)) <= dayOfMonth) {
        spentLastMonthToDate += -amount
      }
    }
  }

  if (!hasThisMonth) return null

  const dailyRate = spentThisMonth / dayOfMonth
  const daysRemaining = daysInMonth - dayOfMonth

  const forecastMonthSpend = spentThisMonth + dailyRate * daysRemaining
  const paceGap = spentThisMonth - spentLastMonthToDate
  return {
    balance: allTimeBalance ?? balance,
    balanceIsAllTime: allTimeBalance !== null,
    incomeThisMonth,
    spentThisMonth,
    savedThisMonth,
    netThisMonth: balance,
    dailyRate,
    forecastMonthSpend,
    projectedClose: incomeThisMonth - forecastMonthSpend - savedThisMonth,
    monthEnd: new Date(y, m, daysInMonth),
    pace: !hasLastMonth ? null : Math.abs(paceGap) < 1 ? 'even' : paceGap < 0 ? 'ahead' : 'behind',
    paceDelta: hasLastMonth ? Math.abs(paceGap) : 0,
    lastMonth: lastMonthDate,
  }
}
