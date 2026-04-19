import { createServerClient } from '@truffle/db'
import { currentYearMonth } from './date'

/**
 * Recomputes the monthly snapshot for a given user from the transactions table.
 * Called after any write that affects balance (new transactions, goal deposits).
 */
export async function recomputeSnapshot(userId: string, db: ReturnType<typeof createServerClient>) {
  const currentMonth = currentYearMonth()
  const startDate = `${currentMonth}-01`

  const { data: txs } = await db
    .from('transactions')
    .select('amount, category')
    .eq('user_id', userId)
    .gte('date', startDate)

  if (!txs) return

  const rows = txs as { amount: number | string; category: string }[]

  const snapshot = {
    month: currentMonth,
    totalIncome: rows.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0),
    totalExpenses: rows
      .filter((t) => Number(t.amount) < 0)
      .reduce((s, t) => s + Number(t.amount), 0),
    byCategory: {} as Record<string, number>,
    savingsRate: 0,
    balance: rows.reduce((s, t) => s + Number(t.amount), 0),
    transactionCount: rows.length,
  }

  for (const tx of rows) {
    snapshot.byCategory[tx.category] = (snapshot.byCategory[tx.category] ?? 0) + Number(tx.amount)
  }

  if (snapshot.totalIncome > 0) {
    snapshot.savingsRate = Math.max(
      0,
      (snapshot.totalIncome + snapshot.totalExpenses) / snapshot.totalIncome
    )
  }

  await db
    .from('monthly_snapshots')
    .upsert(
      { user_id: userId, month: currentMonth, data: snapshot },
      { onConflict: 'user_id,month' }
    )
}
