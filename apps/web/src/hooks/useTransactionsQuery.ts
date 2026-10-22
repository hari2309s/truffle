import { useQuery } from '@tanstack/react-query'
import type { Transaction } from '@truffle/types'

/** Maps a raw Supabase row (snake_case) or already-mapped object to a Transaction. */
export function mapTransactionRow(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    amount: Number(row.amount),
    currency: row.currency as Transaction['currency'],
    description: row.description as string,
    category: row.category as Transaction['category'],
    merchant: row.merchant as string,
    date: row.date as string,
    isRecurring: (row.is_recurring ?? row.isRecurring) as boolean,
    note: (row.note ?? null) as string | null,
    // undefined (not null) when the API predates goal links, so callers can
    // tell "no goal" from "not tracked" and fall back to name matching.
    goalId: ('goal_id' in row ? row.goal_id : row.goalId) as string | null | undefined,
  }
}

export interface TransactionsResult {
  transactions: Transaction[]
  /** All-time net and count, or null before the totals function exists. */
  totals: { balance: number; count: number } | null
  /** Older rows exist before this window. */
  hasOlder: boolean
  /** First date (YYYY-MM-DD) the window covers, or null for everything. */
  from: string | null
}

async function fetchTransactions(query = ''): Promise<TransactionsResult> {
  const res = await fetch(`/api/transactions${query}`)
  if (!res.ok) throw new Error('Failed to fetch transactions')
  const json = await res.json()
  return {
    transactions: (json.transactions ?? []).map(mapTransactionRow),
    totals: json.totals ?? null,
    hasOlder: Boolean(json.hasOlder),
    from: json.from ?? null,
  }
}

/**
 * Canonical query for the ['transactions', userId] cache key — the last 12
 * months plus all-time totals.
 *
 * All components that read transaction data must use this hook so that
 * TanStack Query's shared cache is always populated with a consistent shape.
 */
export function useTransactionsQuery(userId: string) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => fetchTransactions(),
  })
}

/** One older month (YYYY-MM), loaded on demand past the default window. */
export function monthTransactionsQuery(userId: string, month: string) {
  return {
    // Prefixed with ['transactions', userId] so invalidating it refreshes these too.
    queryKey: ['transactions', userId, 'month', month],
    queryFn: () => fetchTransactions(`?month=${month}`),
  }
}

/** Every transaction (exports). */
export async function fetchAllTransactions(): Promise<Transaction[]> {
  return (await fetchTransactions('?all=1')).transactions
}
