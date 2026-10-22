import { createServerClient } from '@truffle/db'
import { currentYearMonth } from './date'
import type { RecurringOverride, RecurringOverrides } from './recurring'

/**
 * Recomputes the monthly snapshot for a given user from the transactions table.
 * Called after any write that affects balance (new transactions, goal deposits).
 */
export async function recomputeSnapshot(userId: string, db: ReturnType<typeof createServerClient>) {
  const currentMonth = currentYearMonth()
  const startDate = `${currentMonth}-01`
  const [yearStr, monthStr] = currentMonth.split('-')
  const year = parseInt(yearStr!, 10)
  const month = parseInt(monthStr!, 10) - 1 // 0-indexed
  // Use Date.UTC so month rollover arithmetic is timezone-independent
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1))
  const nextMonthStart = `${nextMonthDate.getUTCFullYear()}-${String(nextMonthDate.getUTCMonth() + 1).padStart(2, '0')}-01`

  const { data: txs, error: txsError } = await db
    .from('transactions')
    .select('amount, category')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lt('date', nextMonthStart)
    .order('date', { ascending: true })
    .limit(5000)

  if (txsError) throw txsError
  if (!txs) return
  if (txs.length === 5000) {
    console.warn(`[recomputeSnapshot] transaction cap hit for user ${userId} in ${currentMonth}`)
  }

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

/**
 * True when Postgres/PostgREST rejected a query because a column or function
 * doesn't exist yet — i.e. the latest migration hasn't been applied. Callers
 * fall back to the previous behaviour instead of failing.
 */
export function isMissingSchema(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  return (
    error.code === '42703' || // undefined_column
    error.code === '42883' || // undefined_function
    error.code === 'PGRST204' || // column not in schema cache
    error.code === 'PGRST202' || // function not in schema cache
    error.code === '42P01' || // undefined_table
    error.code === 'PGRST205' // table not in schema cache
  )
}

export const MIGRATION_NEEDED = {
  error: 'This needs a database update (supabase/migrations/20261022000001). Please apply it.',
  code: 'MIGRATION_REQUIRED',
} as const

export const RECURRING_MIGRATION_NEEDED = {
  error: 'This needs a database update (supabase/migrations/20261022000002). Please apply it.',
  code: 'MIGRATION_REQUIRED',
} as const

/** The user's recurring-payment corrections; {} before the migration is applied. */
export async function fetchRecurringOverrides(
  db: ReturnType<typeof createServerClient>,
  userId: string
): Promise<{ overrides: RecurringOverrides; available: boolean }> {
  const { data, error } = await db
    .from('recurring_overrides')
    .select('item_key, choice')
    .eq('user_id', userId)
  if (error) {
    if (isMissingSchema(error)) return { overrides: {}, available: false }
    throw error
  }
  const overrides: RecurringOverrides = {}
  for (const row of (data ?? []) as { item_key: string; choice: RecurringOverride }[]) {
    overrides[row.item_key] = row.choice
  }
  return { overrides, available: true }
}

/**
 * Every transaction on or after `from` (YYYY-MM-DD), paging past PostgREST's
 * 1,000-row response cap. Server-side reads (chat context) use this so their
 * figures come from the same complete data the Home statement uses.
 */
export async function fetchTransactionsSince(
  db: ReturnType<typeof createServerClient>,
  userId: string,
  from: string
): Promise<{ amount: number; category: string; date: string; description: string; merchant: string | null; currency: string }[]> {
  const PAGE = 1000
  const rows: Record<string, unknown>[] = []
  for (let page = 0; page < 20; page++) {
    const { data, error } = await db
      .from('transactions')
      .select('amount, category, date, description, merchant, currency')
      .eq('user_id', userId)
      .gte('date', from)
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1)
    if (error) throw error
    rows.push(...((data ?? []) as Record<string, unknown>[]))
    if ((data ?? []).length < PAGE) break
  }
  return rows.map((r) => ({
    amount: Number(r.amount),
    category: String(r.category),
    date: String(r.date),
    description: String(r.description ?? ''),
    merchant: (r.merchant as string | null) ?? null,
    currency: String(r.currency ?? 'EUR'),
  }))
}

/** All-time net and count, or null before the totals function exists. */
export async function fetchTotals(
  db: ReturnType<typeof createServerClient>,
  userId: string
): Promise<{ balance: number; count: number } | null> {
  const { data, error } = await db.rpc('transaction_totals', { p_user_id: userId })
  if (error) {
    if (!isMissingSchema(error)) console.warn('transaction_totals failed (non-fatal):', error.message)
    return null
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    | { balance: number | string; transaction_count: number | string }
    | undefined
  return row ? { balance: Number(row.balance), count: Number(row.transaction_count) } : null
}
