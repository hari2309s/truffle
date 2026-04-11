'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentPeriod } from '@/lib/habits'
import { staggerItemVariants, staggerListVariants, truffleEase } from '@/lib/motion'
import { SkeletonPulse } from './PageMotion'
import type { HabitWithStats } from '@truffle/types'
import { offlineDb, registerBackgroundSync } from '@/lib/offline-db'

interface SavingsHabitsProps {
  userId: string
}

export function SavingsHabits({ userId }: SavingsHabitsProps) {
  const queryClient = useQueryClient()
  const [loggingId, setLoggingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['habits', userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/habits?userId=${userId}`)
        if (!res.ok) throw new Error('Failed to fetch habits')
        const json = await res.json()
        const habits = json.habits as HabitWithStats[]
        await offlineDb.habitsWithStats.bulkPut(habits)
        return habits
      } catch {
        return offlineDb.habitsWithStats.where('userId').equals(userId).toArray()
      }
    },
    networkMode: 'always',
  })

  const habits = data ?? []

  const handleLogContribution = async (habit: HabitWithStats) => {
    setLoggingId(habit.id)
    try {
      const period = getCurrentPeriod(habit.frequency)
      const payload = { userId, habitId: habit.id, period, amount: habit.amount }

      if (!navigator.onLine) {
        // Optimistically mark as logged for this period in the cached record
        await offlineDb.habitsWithStats.update(habit.id, {
          currentPeriodLogged: true,
          totalSaved: habit.totalSaved + habit.amount,
        })
        await offlineDb.queuedActions.add({
          type: 'log_habit_contribution',
          payload,
          createdAt: Date.now(),
        })
        await registerBackgroundSync()
        await queryClient.invalidateQueries({ queryKey: ['habits', userId] })
        return
      }

      await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      await queryClient.invalidateQueries({ queryKey: ['habits', userId] })
    } finally {
      setLoggingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <SkeletonPulse key={i} className="card h-20" />
        ))}
      </div>
    )
  }

  if (habits.length === 0) {
    return (
      <motion.div
        className="card border-dashed text-center text-truffle-muted text-sm py-6"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: truffleEase }}
      >
        No saving habits yet — ask Truffle to set one up
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-3"
      initial="hidden"
      animate="show"
      variants={staggerListVariants}
    >
      {habits.map((habit) => (
        <motion.div key={habit.id} variants={staggerItemVariants}>
          <HabitCard
            habit={habit}
            isLogging={loggingId === habit.id}
            onLog={() => handleLogContribution(habit)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

function HabitCard({
  habit,
  isLogging,
  onLog,
}: {
  habit: HabitWithStats
  isLogging: boolean
  onLog: () => void
}) {
  const periodLabel = habit.frequency === 'weekly' ? 'week' : 'month'
  const streakLabel = habit.streak > 0 ? `🔥 ${habit.streak} in a row` : null

  return (
    <div className="card flex items-center gap-3">
      <span className="text-2xl flex-shrink-0">{habit.emoji}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-truffle-text truncate">{habit.name}</p>
          {streakLabel && (
            <span className="text-xs text-truffle-amber flex-shrink-0">{streakLabel}</span>
          )}
        </div>
        <p className="text-xs text-truffle-muted">
          €{habit.amount.toFixed(2)}/{periodLabel} · €{habit.totalSaved.toFixed(2)} total saved
        </p>
      </div>

      <div className="flex-shrink-0">
        {habit.currentPeriodLogged ? (
          <span className="text-xs px-2 py-1 rounded-full bg-truffle-green/20 text-truffle-green">
            ✓ done
          </span>
        ) : (
          <button
            onClick={onLog}
            disabled={isLogging}
            className="text-xs px-3 py-1.5 rounded-full bg-truffle-amber/20 text-truffle-amber hover:bg-truffle-amber/30 transition-colors disabled:opacity-50"
          >
            {isLogging ? '…' : `+ Log`}
          </button>
        )}
      </div>
    </div>
  )
}
