export interface Forecast {
  currentBalance: number
  projectedEndOfMonth: number
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]
}

export function computeForecast(
  transactions: { amount: number | string; date: string }[]
): Forecast | null {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const txs = transactions.filter((t) => String(t.date).startsWith(currentMonth))
  if (txs.length === 0) return null

  const totalIncome = txs
    .filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0)
  const totalExpenses = txs
    .filter((t) => Number(t.amount) < 0)
    .reduce((s, t) => s + Number(t.amount), 0)
  const balance = txs.reduce((s, t) => s + Number(t.amount), 0)

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
      `Daily spend rate: €${Math.abs(dailySpendRate).toFixed(2)}`,
      `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`,
      `Income this month: €${totalIncome.toFixed(2)}`,
    ],
  }
}
