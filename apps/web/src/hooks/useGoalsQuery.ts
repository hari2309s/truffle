import { useQuery } from '@tanstack/react-query'
import type { SavingsGoal } from '@truffle/types'

function mapGoal(row: Record<string, unknown>): SavingsGoal {
  return {
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    name: row.name as string,
    targetAmount: Number(row.target_amount ?? row.targetAmount),
    savedAmount: Number(row.saved_amount ?? row.savedAmount),
    deadline: (row.deadline as string | undefined) ?? undefined,
    emoji: row.emoji as string,
    createdAt: (row.created_at ?? row.createdAt) as string,
  }
}

/** Canonical query for the ['goals', userId] cache key. */
export function useGoalsQuery(userId: string) {
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: async () => {
      const res = await fetch('/api/goals')
      if (!res.ok) throw new Error('Failed to fetch goals')
      const json = await res.json()
      return (json.goals ?? []).map(mapGoal) as SavingsGoal[]
    },
  })
}
