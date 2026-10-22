'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useHabitsQuery } from '@/hooks/useHabitsQuery'
import { getCurrentPeriod } from '@/lib/habits'
import { staggerItemVariants, staggerListVariants } from '@/lib/motion'
import { SkeletonPulse } from './PageMotion'
import { LeaderRow } from './Tally'
import { HabitDetailSheet } from './HabitDetailSheet'
import type { HabitWithStats } from '@truffle/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'

interface SavingsHabitsProps {
  userId: string
}

export function SavingsHabits({ userId }: SavingsHabitsProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const queryClient = useQueryClient()
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [logError, setLogError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const { data, isLoading } = useHabitsQuery(userId)

  const habits = data ?? []
  const openHabit = habits.find((h) => h.id === openId) ?? null

  const handleLogContribution = async (habit: HabitWithStats) => {
    setLoggingId(habit.id)
    setLogError(null)
    try {
      const period = getCurrentPeriod(habit.frequency)
      const payload = { habitId: habit.id, period, amount: habit.amount, currency }

      const res = await fetch('/api/habits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        console.error('Failed to log habit contribution:', res.status)
        setLogError('Failed to log contribution. Please try again.')
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['habits', userId] })
    } finally {
      setLoggingId(null)
    }
  }

  if (isLoading) {
    return (
      <SkeletonPulse className="flex flex-col gap-2">
        <div className="h-3 bg-truffle-border" />
        <div className="h-[18px] bg-truffle-border w-1/2" />
      </SkeletonPulse>
    )
  }

  if (habits.length === 0) {
    return <p className="font-grotesk text-sm text-truffle-text2">{t.savingsHabits.noHabits}</p>
  }

  return (
    <motion.div
      className="flex flex-col gap-3"
      initial="hidden"
      animate="show"
      variants={staggerListVariants}
    >
      {logError && (
        <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
          ■ {logError}
        </p>
      )}
      {habits.map((habit) => (
        <motion.div key={habit.id} variants={staggerItemVariants}>
          <HabitRow
            habit={habit}
            isLogging={loggingId === habit.id}
            onLog={() => handleLogContribution(habit)}
            onOpen={() => setOpenId(habit.id)}
          />
        </motion.div>
      ))}

      <AnimatePresence>
        {openHabit && (
          <HabitDetailSheet
            key={openHabit.id}
            habit={openHabit}
            userId={userId}
            onClose={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const STREAK_DOTS = 8

function HabitRow({
  habit,
  isLogging,
  onLog,
  onOpen,
}: {
  habit: HabitWithStats
  isLogging: boolean
  onLog: () => void
  onOpen: () => void
}) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const periodLabel =
    habit.frequency === 'weekly' ? t.savingsHabits.periodWeek : t.savingsHabits.periodMonth
  const lit = Math.min(habit.streak, STREAK_DOTS)

  return (
    <div className="flex flex-col gap-[5px]">
      <button type="button" onClick={onOpen} className="text-left">
        <LeaderRow
          left={
            <span className="underline-offset-2 hover:underline">
              {habit.emoji} {habit.name}
            </span>
          }
          right={<b aria-label={t.savingsHabits.streak(habit.streak)}>×{habit.streak} →</b>}
        />
      </button>
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: STREAK_DOTS }, (_, i) => (
          <div
            key={i}
            aria-hidden
            className={`w-[18px] h-[18px] border-2 ${i < lit ? 'bg-truffle-accent border-truffle-accent' : 'border-truffle-border'}`}
          />
        ))}
        <span className="ml-auto">
          {habit.currentPeriodLogged ? (
            <span className="text-[11px] font-bold uppercase text-truffle-positive">
              ● {t.savingsHabits.done}
            </span>
          ) : (
            <button
              type="button"
              onClick={onLog}
              disabled={isLogging}
              className="key key-ink key-3 h-9 px-3 text-[11px] uppercase"
            >
              {isLogging ? '…' : t.savingsHabits.log}
            </button>
          )}
        </span>
      </div>
      <span className="text-[11px] text-truffle-text2">
        {formatAmount(habit.amount)}/{periodLabel} ·{' '}
        {t.savingsHabits.totalSaved(formatAmount(habit.totalSaved))}
      </span>
    </div>
  )
}
