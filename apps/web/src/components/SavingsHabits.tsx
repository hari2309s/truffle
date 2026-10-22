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
import { useSectionAddForm } from '@/contexts/SectionAddFormContext'
import { EmojiField, HABIT_SUGGESTIONS } from './EmojiField'

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
  const { open: showAdd, setOpen: setShowAdd } = useSectionAddForm()

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

  const addForm = showAdd && (
    <AddHabitForm
      userId={userId}
      onDone={() => setShowAdd(false)}
      onCancel={() => setShowAdd(false)}
    />
  )

  if (habits.length === 0) {
    return (
      <>
        {addForm}
        {!showAdd && (
          <>
            <p className="m-0 font-grotesk text-sm text-truffle-text2">{t.savingsHabits.noHabits}</p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="h-12 rounded-lg border border-dashed border-truffle-text grid place-items-center text-xs font-bold uppercase"
            >
              {t.savingsHabits.startHabit}
            </button>
          </>
        )}
      </>
    )
  }

  return (
    <motion.div
      className="flex flex-col gap-3"
      initial="hidden"
      animate="show"
      variants={staggerListVariants}
    >
      {addForm}
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

type Frequency = 'weekly' | 'monthly'

/** "+ New" habit: icon (any emoji), name, amount and how often. */
function AddHabitForm({
  userId,
  onDone,
  onCancel,
}: {
  userId: string
  onDone: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const { symbol } = useCurrency()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ emoji: '💰', name: '', amount: '', frequency: 'weekly' as Frequency })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sh = t.savingsHabits

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!form.name.trim() || !(amount > 0)) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          amount,
          frequency: form.frequency,
          emoji: form.emoji,
        }),
      })
      if (!res.ok) throw new Error()
      await queryClient.invalidateQueries({ queryKey: ['habits', userId] })
      onDone()
    } catch {
      setError(sh.createError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 print-in">
      <EmojiField
        value={form.emoji}
        onChange={(emoji) => setForm((f) => ({ ...f, emoji }))}
        label={sh.iconLabel}
        suggestions={HABIT_SUGGESTIONS}
      />
      <input
        type="text"
        placeholder={sh.namePlaceholder}
        aria-label={sh.namePlaceholder}
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        maxLength={200}
        required
        className="field h-11"
      />
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <label className="relative">
          <span className="sr-only">{sh.amountLabel}</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2 text-sm">{symbol}</span>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            placeholder={sh.amountLabel}
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
            className="field h-11 pl-7 font-bold"
          />
        </label>
        <div
          role="radiogroup"
          aria-label={sh.frequencyLabel}
          className="grid grid-cols-2 border border-truffle-border rounded-lg overflow-hidden"
        >
          {(['weekly', 'monthly'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={form.frequency === f}
              onClick={() => setForm((prev) => ({ ...prev, frequency: f }))}
              className={`h-11 px-3 text-xs font-bold uppercase ${
                form.frequency === f ? 'bg-truffle-text text-truffle-bg' : 'text-truffle-text2'
              }`}
            >
              {f === 'weekly' ? sh.frequencyWeekly : sh.frequencyMonthly}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="m-0 text-[11px] font-bold uppercase text-truffle-negative">
          ■ {error}
        </p>
      )}
      <div className="grid grid-cols-[1fr_2fr] gap-2">
        <button type="button" onClick={onCancel} className="key key-line key-3 h-11 text-xs uppercase">
          {t.common.cancel}
        </button>
        <button type="submit" disabled={isLoading} className="key key-ink key-3 h-11 text-xs uppercase">
          {isLoading ? t.common.saving : sh.create}
        </button>
      </div>
    </form>
  )
}
