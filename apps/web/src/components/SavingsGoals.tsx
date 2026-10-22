'use client'

import { EmojiField, GOAL_SUGGESTIONS } from './EmojiField'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SkeletonPulse } from './PageMotion'
import { useQueryClient } from '@tanstack/react-query'
import { useGoalsQuery } from '@/hooks/useGoalsQuery'
import { usePostHog } from 'posthog-js/react'
import type { SavingsGoal } from '@truffle/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSectionAddForm } from '@/contexts/SectionAddFormContext'
import { LeaderRow } from './Tally'
import { GoalDetailSheet } from './GoalDetailSheet'


interface SavingsGoalsBodyProps {
  userId: string
  showAdd: boolean
  onShowAddChange: (open: boolean) => void
}

/** Shared content — fetches goals, renders the add form and goal list. No section wrapper or header. */
function SavingsGoalsBody({ userId, showAdd, onShowAddChange }: SavingsGoalsBodyProps) {
  const { t } = useLanguage()
  const { currency, formatAmount } = useCurrency()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [fundsError, setFundsError] = useState<string | null>(null)

  const { data: goals = [], isLoading } = useGoalsQuery(userId)
  // Look the open goal up by id so the sheet shows fresh data after edits.
  const openGoal = goals.find((g) => g.id === openId) ?? null

  const handleAddFunds = async (goalId: string, currentSaved: number, deposit: number) => {
    setFundsError(null)
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return
    const newAmount = Math.min(currentSaved + deposit, goal.targetAmount)
    const payload = { goalId, savedAmount: newAmount, currency }

    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.status === 409) {
      // Concurrent update — invalidate to get the latest state; the user can retry
      await queryClient.invalidateQueries({ queryKey: ['goals', userId] })
      return
    }
    if (!res.ok) {
      // Invalidate stale cache (e.g. targetAmount changed concurrently) before showing error
      await queryClient.invalidateQueries({ queryKey: ['goals', userId] })
      setFundsError('Failed to add funds. Please try again.')
      return
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['goals', userId] }),
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
    ])
  }

  const handleDelete = async (goalId: string) => {
    setDeletingId(goalId)
    try {
      await fetch(`/api/goals?goalId=${encodeURIComponent(goalId)}`, { method: 'DELETE' })
      await queryClient.invalidateQueries({ queryKey: ['goals', userId] })
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <>
      {showAdd && (
        <AddGoalForm
          userId={userId}
          onDone={() => {
            onShowAddChange(false)
            queryClient.invalidateQueries({ queryKey: ['goals', userId] })
          }}
        />
      )}

      {fundsError && (
        <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
          ■ {fundsError}
        </p>
      )}

      {isLoading ? (
        <SkeletonPulse className="flex flex-col gap-2">
          <div className="h-3 bg-truffle-border" />
          <div className="h-3.5 bg-truffle-border" />
        </SkeletonPulse>
      ) : goals.length === 0 && !showAdd ? (
        <>
          <LeaderRow className="text-truffle-text2" left={t.savingsGoals.noGoalsShort} right={formatAmount(0)} />
          <p className="font-grotesk text-sm text-truffle-text2">{t.savingsGoals.noGoals}</p>
          <button
            type="button"
            onClick={() => onShowAddChange(true)}
            className="h-12 rounded-lg border border-dashed border-truffle-text grid place-items-center text-xs font-bold uppercase"
          >
            {t.savingsGoals.startGoal}
          </button>
        </>
      ) : (
        goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            onAddFunds={(amount) => handleAddFunds(goal.id, goal.savedAmount, amount)}
            onDelete={() => handleDelete(goal.id)}
            isDeleting={deletingId === goal.id}
            isConfirmingDelete={confirmDeleteId === goal.id}
            onRequestDelete={() => setConfirmDeleteId(goal.id)}
            onCancelDelete={() => setConfirmDeleteId(null)}
            onOpen={() => setOpenId(goal.id)}
          />
        ))
      )}

      <AnimatePresence>
        {openGoal && (
          <GoalDetailSheet
            key={openGoal.id}
            goal={openGoal}
            userId={userId}
            onClose={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

interface SavingsGoalsProps {
  userId: string
}

/** Standalone savings goals section: owns its own open/close state and renders its own header + wrapper. */
export function SavingsGoals({ userId }: SavingsGoalsProps) {
  const { t } = useLanguage()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <section className="flex flex-col gap-3 text-[13px]">
      <div className="flex items-center justify-between">
        <h2 className="font-bold tracking-[.08em] uppercase">{t.savingsGoals.title}</h2>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs font-bold uppercase underline underline-offset-2"
        >
          {showAdd ? t.savingsGoals.cancel : t.savingsGoals.newGoal}
        </button>
      </div>

      <SavingsGoalsBody userId={userId} showAdd={showAdd} onShowAddChange={setShowAdd} />
    </section>
  )
}

/**
 * Variant for embedding inside an Insights statement section: no wrapper, no header —
 * the section owns the header/toggle button itself. Open/close state comes from the
 * `SectionAddFormProvider` the section is wrapped in, rather than controlled props.
 */
export function SavingsGoalsEmbedded({ userId }: SavingsGoalsProps) {
  const { open, setOpen } = useSectionAddForm()
  return <SavingsGoalsBody userId={userId} showAdd={open} onShowAddChange={setOpen} />
}

function GoalRow({
  goal,
  onAddFunds,
  onDelete,
  isDeleting,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onOpen,
}: {
  goal: SavingsGoal
  onAddFunds: (amount: number) => void
  onDelete: () => void
  isDeleting: boolean
  isConfirmingDelete: boolean
  onRequestDelete: () => void
  onCancelDelete: () => void
  onOpen: () => void
}) {
  const { t } = useLanguage()
  const { formatAmount, symbol } = useCurrency()
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')

  const progress = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
  const done = goal.savedAmount >= goal.targetAmount

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <div
      className={`flex flex-col gap-[5px] transition-opacity ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-1 text-sm">
        <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
          <LeaderRow
            left={
              <b className="underline-offset-2 hover:underline">
                {goal.emoji} {goal.name}
              </b>
            }
            right={<b>{Math.round(progress)}% →</b>}
          />
        </button>
        {!done && (
          <button
            type="button"
            onClick={() => (isConfirmingDelete ? onCancelDelete() : onRequestDelete())}
            aria-label={t.savingsGoals.deleteGoal}
            aria-expanded={isConfirmingDelete}
            className={`w-7 h-7 -my-1 -mr-1.5 grid place-items-center text-[11px] ${isConfirmingDelete ? 'text-truffle-negative' : 'text-truffle-text2'}`}
          >
            ✕
          </button>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label={goal.name}
        className="h-3.5 bg-truffle-surface border border-truffle-border"
      >
        <div
          className={`h-full transition-[width] duration-500 ${done ? 'bg-truffle-positive' : 'bg-truffle-accent'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-[11px] text-truffle-text2">
        {t.savingsGoals.ofTarget(formatAmount(goal.savedAmount), formatAmount(goal.targetAmount))}
        {done && <b className="text-truffle-positive uppercase"> · ● {t.savingsGoals.complete}</b>}
        {!done && daysLeft !== null && daysLeft > 0 && ` · ${t.savingsGoals.daysLeft(daysLeft)}`}
        {!done && daysLeft !== null && daysLeft <= 0 && ` · ${t.savingsGoals.deadlinePassed}`}
      </span>

      <AnimatePresence>
        {isConfirmingDelete && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase text-truffle-negative">
                {t.savingsGoals.deleteConfirm}
              </span>
              <button
                type="button"
                onClick={onCancelDelete}
                className="key key-outline h-9 px-3 text-[11px] uppercase"
              >
                {t.savingsGoals.cancel}
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="key key-danger h-9 px-3 text-[11px] uppercase"
              >
                ✕ {t.transactions.delete}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!done &&
        (showDeposit ? (
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 pt-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2 text-sm">
                {symbol}
              </span>
              <input
                type="number"
                inputMode="decimal"
                placeholder={t.savingsGoals.remaining(formatAmount(remaining))}
                aria-label={t.savingsGoals.addFunds}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
                className="field h-11 pl-7"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const amt = parseFloat(depositAmount)
                if (amt > 0) {
                  onAddFunds(amt)
                  setDepositAmount('')
                  setShowDeposit(false)
                }
              }}
              className="key key-accent key-3 h-11 px-4 text-xs uppercase"
            >
              {t.savingsGoals.add}
            </button>
            <button
              type="button"
              onClick={() => {
                setDepositAmount('')
                setShowDeposit(false)
              }}
              className="key key-line key-3 h-11 px-3 text-xs uppercase"
            >
              {t.savingsGoals.cancel}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeposit(true)}
            className="self-start min-h-8 text-[11px] font-bold uppercase underline underline-offset-2"
          >
            {t.savingsGoals.addFunds}
          </button>
        ))}
    </div>
  )
}

function AddGoalForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { t } = useLanguage()
  const { symbol } = useCurrency()
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const [form, setForm] = useState({ name: '', targetAmount: '', deadline: '', emoji: '🎯' })
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.targetAmount) return
    setIsLoading(true)
    setSubmitError(null)
    // Capture form values immediately so concurrent React renders can't change them mid-submit
    const { name, targetAmount: targetAmountStr, deadline, emoji } = form
    const targetAmount = parseFloat(targetAmountStr)
    try {
      const payload = {
        name,
        targetAmount,
        deadline: deadline || undefined,
        emoji,
      }

      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create goal')

      posthog.capture('goal_created', {
        target_amount: targetAmount,
        has_deadline: Boolean(deadline),
      })

      onDone()
    } catch {
      setSubmitError('Failed to create goal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 print-in">
      <EmojiField
        value={form.emoji}
        onChange={(emoji) => setForm((f) => ({ ...f, emoji }))}
        label={t.savingsGoals.iconLabel}
        suggestions={GOAL_SUGGESTIONS}
      />

      <input
        type="text"
        placeholder={t.savingsGoals.goalNamePlaceholder}
        aria-label={t.savingsGoals.goalNamePlaceholder}
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        className="field h-11"
        required
      />

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2 text-sm">
            {symbol}
          </span>
          <input
            type="number"
            inputMode="decimal"
            placeholder={t.savingsGoals.targetAmount}
            aria-label={t.savingsGoals.targetAmount}
            value={form.targetAmount}
            onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
            min="1"
            step="0.01"
            className="field h-11 pl-7 font-bold"
            required
          />
        </div>
        <input
          type="date"
          value={form.deadline}
          aria-label={t.savingsGoals.deadlineLabel}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          className="field h-11 w-auto"
        />
      </div>

      {submitError && (
        <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
          ■ {submitError}
        </p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="key key-ink key-3 h-11 text-xs uppercase"
      >
        {isLoading ? t.savingsGoals.creating : t.savingsGoals.createGoal}
      </button>
    </form>
  )
}
