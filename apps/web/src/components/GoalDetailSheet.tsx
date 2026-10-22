'use client'

import { DEFAULT_GOAL_EMOJI, EmojiField } from './EmojiField'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { SavingsGoal } from '@truffle/types'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'
import { LeaderRow, MINUS, Rule, Sheet } from './Tally'
import { GoalStatus } from './GoalStatus'
import { goalPlan } from '@/lib/goalPlan'
import { parseLocalDay } from '@/lib/toolArgs'

type Mode = 'view' | 'deposit' | 'withdraw' | 'edit'

/**
 * One savings goal: progress, status and the monthly amount to the deadline, deposit
 * history, and deposit / withdraw / edit / delete.
 */
export function GoalDetailSheet({
  goal,
  userId,
  onClose,
}: {
  goal: SavingsGoal
  userId: string
  onClose: () => void
}) {
  const { t, locale } = useLanguage()
  const { formatAmount, currency, symbol } = useCurrency()
  const queryClient = useQueryClient()
  const { data: txData } = useTransactionsQuery(userId)
  const [mode, setMode] = useState<Mode>('view')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({
    name: goal.name,
    emoji: goal.emoji,
    target: String(goal.targetAmount),
    deadline: goal.deadline ?? '',
  })

  const g = t.goalDetail
  const dateLocale = toDateLocale(locale)
  const plan = goalPlan(goal)
  const { remaining } = plan
  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0
  const done = plan.status === 'reached'
  const filled = Math.floor(pct / 10)

  // Deposits/withdrawals the goals API records, linked by goal_id. Before the
  // goal-link migration (goalId undefined) fall back to matching the name.
  const deposits = useMemo(
    () =>
      (txData?.transactions ?? [])
        .filter((tx) =>
          tx.goalId !== undefined
            ? tx.goalId === goal.id
            : tx.category === 'savings' && tx.merchant === goal.name
        )
        .slice(0, 12),
    [txData, goal.id, goal.name]
  )

  const deadlineLabel = goal.deadline
    ? parseLocalDay(goal.deadline).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const perMonth = plan.perMonth !== null ? formatAmount(plan.perMonth) : ''

  const note =
    plan.status === 'reached'
      ? g.noteDone
      : plan.status === 'overdue'
        ? g.noteOverdue
        : plan.status === 'behind' && deadlineLabel
          ? g.noteBehind(formatAmount(plan.shortBy), perMonth, deadlineLabel)
          : plan.status === 'onTrack' && deadlineLabel
            ? g.notePace(perMonth, deadlineLabel)
            : g.noteNoDeadline

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['goals', userId] }),
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
    ])

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: goal.id, ...body }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? g.error)
      await invalidate()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : g.error)
      return false
    } finally {
      setBusy(false)
    }
  }

  const submitAmount = async () => {
    const value = parseFloat(amount)
    if (!(value > 0)) return
    const ok =
      mode === 'deposit'
        ? await patch({ savedAmount: Math.min(goal.savedAmount + value, goal.targetAmount), currency })
        : await patch({ action: 'withdraw', amount: value, currency })
    if (ok) {
      setAmount('')
      setMode('view')
      onClose()
    }
  }

  const submitEdit = async () => {
    const target = parseFloat(form.target)
    if (!form.name.trim() || !(target > 0)) return
    const ok = await patch({
      action: 'edit',
      name: form.name.trim(),
      emoji: form.emoji || DEFAULT_GOAL_EMOJI,
      targetAmount: target,
      deadline: form.deadline || null,
    })
    if (ok) onClose()
  }

  const handleDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/goals?goalId=${encodeURIComponent(goal.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await invalidate()
      onClose()
    } catch {
      setError(g.error)
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  const footer =
    mode === 'edit' ? (
      <div className="grid grid-cols-[1fr_2fr] gap-2">
        <button type="button" onClick={() => setMode('view')} className="key key-line h-14 text-[13px] uppercase">
          {t.common.cancel}
        </button>
        <button
          type="button"
          onClick={submitEdit}
          disabled={busy}
          className="key key-accent h-14 text-sm uppercase"
        >
          {busy ? t.common.saving : g.saveChanges}
        </button>
      </div>
    ) : mode === 'view' ? (
      !done && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('withdraw')}
            disabled={goal.savedAmount <= 0}
            className="key key-line h-14 text-[13px] uppercase"
          >
            {g.withdraw}
          </button>
          <button
            type="button"
            onClick={() => setMode('deposit')}
            className="key key-accent h-14 text-[13px] uppercase"
          >
            + {g.addDeposit}
          </button>
        </div>
      )
    ) : (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="relative">
            <span className="sr-only">{mode === 'deposit' ? g.addDeposit : g.withdraw}</span>
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-truffle-text2">{symbol}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={
                mode === 'deposit'
                  ? t.savingsGoals.remaining(formatAmount(remaining))
                  : g.available(formatAmount(goal.savedAmount))
              }
              className="field h-14 pl-8 text-base font-bold"
            />
          </label>
          <button type="button" onClick={() => setMode('view')} className="key key-line h-14 px-4 text-xs uppercase">
            {t.common.cancel}
          </button>
        </div>
        <button
          type="button"
          onClick={submitAmount}
          disabled={busy || !(parseFloat(amount) > 0)}
          className={`key ${mode === 'deposit' ? 'key-accent' : 'key-ink'} h-14 text-sm uppercase`}
        >
          {busy
            ? t.common.saving
            : mode === 'deposit'
              ? g.confirmDeposit(formatAmount(parseFloat(amount) || 0))
              : g.confirmWithdraw(formatAmount(parseFloat(amount) || 0))}
        </button>
      </div>
    )

  return (
    <Sheet
      title={g.title}
      onClose={onClose}
      closeLabel={t.common.close}
      closeGlyph="←"
      right={
        mode === 'view' && (
          <button type="button" onClick={() => setMode('edit')} className="uppercase">
            {g.edit}
          </button>
        )
      }
      footer={footer}
    >
      {mode === 'edit' ? (
        <div className="slip mx-4 mt-3 px-[18px] pt-4 pb-7 flex flex-col gap-3 text-sm">
          <EmojiField
            value={form.emoji}
            onChange={(emoji) => setForm((f) => ({ ...f, emoji }))}
            label={t.savingsGoals.iconLabel}
            fallback={DEFAULT_GOAL_EMOJI}
          />
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            aria-label={t.savingsGoals.goalNamePlaceholder}
            placeholder={t.savingsGoals.goalNamePlaceholder}
            className="field h-11"
          />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="relative">
              <span className="sr-only">{t.savingsGoals.targetAmount}</span>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2">{symbol}</span>
              <input
                type="number"
                inputMode="decimal"
                min={goal.savedAmount}
                step="0.01"
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                className="field h-11 pl-7 font-bold"
              />
            </label>
            <input
              type="date"
              value={form.deadline}
              aria-label={t.savingsGoals.deadlineLabel}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              className="field h-11 w-auto"
            />
          </div>
          {error && (
            <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
              ■ {error}
            </p>
          )}
          <Rule className="mt-2" />
          {confirmDelete ? (
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase text-truffle-negative">
                {t.savingsGoals.deleteConfirm}
              </span>
              <button type="button" onClick={() => setConfirmDelete(false)} className="key key-outline h-9 px-3 text-[11px] uppercase">
                {t.common.cancel}
              </button>
              <button type="button" onClick={handleDelete} disabled={busy} className="key key-danger h-9 px-3 text-[11px] uppercase">
                ✕ {t.transactions.delete}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="self-start min-h-9 text-xs font-bold uppercase text-truffle-negative"
            >
              ✕ {t.savingsGoals.deleteGoal}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="px-6 pt-3 flex flex-col gap-1">
            <h2 className="m-0 font-grotesk text-4xl font-medium">
              {goal.emoji} {goal.name}
            </h2>
            <span className="text-xs text-truffle-text2 uppercase">
              {g.target(formatAmount(goal.targetAmount))}
              {deadlineLabel ? ` · ${deadlineLabel}` : ''}
            </span>
          </div>

          <div className="paper print-in mx-4 mt-4 p-[18px] flex flex-col gap-2.5 border-t-[6px] border-truffle-accent">
            <div className="flex justify-between items-baseline">
              <span className="text-[40px] font-bold leading-none">{formatAmount(goal.savedAmount)}</span>
              <span className="text-[22px] font-bold">{Math.round(pct)}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              aria-label={goal.name}
              className="grid grid-cols-10 gap-[3px]"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`h-[18px] border ${i < filled ? 'bg-truffle-accent border-truffle-accent-edge' : 'border-truffle-border'}`}
                />
              ))}
            </div>
            <span className="text-xs text-truffle-text2 uppercase">
              {done ? `● ${t.savingsGoals.complete}` : g.toGo(formatAmount(remaining))}
            </span>
            <GoalStatus plan={plan} />
          </div>

          <p className="mx-4 mt-3.5 mb-0 py-3 px-3.5 bg-truffle-surface font-grotesk text-[15px] leading-[1.45]">
            {note}
          </p>

          <div className="slip mx-4 mt-4 px-4 pt-4 pb-7 flex flex-col gap-2 text-[13px]">
            <span className="font-bold tracking-[.08em] uppercase">{g.deposits}</span>
            {deposits.length === 0 ? (
              <p className="m-0 rule-soft pt-2 font-grotesk text-sm text-truffle-text2">{g.noDeposits}</p>
            ) : (
              deposits.map((tx, i) => {
                const isDeposit = tx.amount < 0
                return (
                  <div
                    key={tx.id}
                    className="rule-soft pt-2 print-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <LeaderRow
                      left={
                        <span>
                          {new Date(tx.date + 'T12:00:00').toLocaleDateString(dateLocale, {
                            day: 'numeric',
                            month: 'short',
                          })}
                          <span className="text-truffle-text2">
                            {' '}
                            · {isDeposit ? g.deposit : g.withdrawal}
                          </span>
                        </span>
                      }
                      right={
                        <b className={isDeposit ? 'text-truffle-positive' : 'text-truffle-text2'}>
                          {isDeposit ? '+' : MINUS}
                          {formatAmount(tx.amount)}
                        </b>
                      }
                    />
                  </div>
                )
              })
            )}
          </div>
          {error && (
            <p role="alert" className="mx-4 mt-3 text-[11px] font-bold uppercase text-truffle-negative">
              ■ {error}
            </p>
          )}
        </>
      )}
    </Sheet>
  )
}
