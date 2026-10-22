import { useQuery } from '@tanstack/react-query'
import type { CategoryBudget, TransactionCategory } from '@truffle/types'

function mapBudget(row: Record<string, unknown>): CategoryBudget {
  return {
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    category: row.category as TransactionCategory,
    amount: Number(row.amount),
    createdAt: (row.created_at ?? row.createdAt) as string,
    rollover: (row.rollover as boolean | undefined) ?? false,
    alertPct: row.alertPct === undefined ? 80 : (row.alertPct as number | null),
  }
}

/** Canonical query for the ['budgets', userId] cache key. */
export function useBudgetsQuery(userId: string) {
  return useQuery({
    queryKey: ['budgets', userId],
    queryFn: async () => {
      const res = await fetch(`/api/budgets?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch budgets')
      const json = await res.json()
      return (json.budgets ?? []).map(mapBudget) as CategoryBudget[]
    },
  })
}
