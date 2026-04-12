import { useQuery } from '@tanstack/react-query'
import type { Transaction } from '@truffle/types'
import { offlineDb, mapTransactionRow } from '@/lib/offline-db'

/**
 * Canonical query for the ['transactions', userId] cache key.
 *
 * All components that read transaction data must use this hook so that
 * TanStack Query's shared cache is always populated with a consistent
 * shape and offline fallback strategy.
 */
export function useTransactionsQuery(userId: string) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/transactions?userId=${userId}`)
        if (!res.ok) throw new Error('Failed to fetch transactions')
        const json = await res.json()
        const transactions: Transaction[] = (json.transactions ?? []).map(mapTransactionRow)
        await offlineDb.transactions.bulkPut(transactions)
        return { transactions, fromCache: false }
      } catch {
        const cached = await offlineDb.transactions.where('userId').equals(userId).toArray()
        cached.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        return { transactions: cached as Transaction[], fromCache: true }
      }
    },
    networkMode: 'always',
  })
}
