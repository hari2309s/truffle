import { useQuery } from '@tanstack/react-query'
import type { HabitWithStats } from '@truffle/types'

/** Canonical query for the ['habits', userId] cache key. */
export function useHabitsQuery(userId: string) {
  return useQuery({
    queryKey: ['habits', userId],
    queryFn: async () => {
      const res = await fetch('/api/habits')
      if (!res.ok) throw new Error('Failed to fetch habits')
      const json = await res.json()
      return json.habits as HabitWithStats[]
    },
  })
}
