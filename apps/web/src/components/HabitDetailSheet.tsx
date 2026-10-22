'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HabitWithStats } from '@truffle/types'
import { getCurrentPeriod } from '@/lib/habits'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'
import { LeaderRow, Rule, Sheet } from './Tally'

const STREAK_DOTS = 8
const HABIT_EMOJIS = ['💰', '🐷', '☕', '🍱', '🚲', '📚', '🧾', '🌱']

/** "2026-W42" → "Week 42", "2026-10" → "Oct 2026". */
function periodLabel(period: string, weekLabel: (n: number) => string, dateLocale: string) {
  const week = period.match(/-W(\d+)$/)
  if (week) return weekLabel(Number(week[1]))
  const [y, m] = period.split('-').map(Number)
  return new Date(y!, (m ?? 1) - 1, 1).toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' })
}

/** One saving habit: streak, history, log, edit, stop. */
export function HabitDetailSheet({
  habit,
  userId,
  onClose,
}: {
  habit: HabitWithStats
  userId: string
  onClose: () => void
}) {
  const { t, locale } = useLanguage()
  const { formatAmount, currency, symbol } = useCurrency()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmStop, setConfirmStop] = useState(false)
  const [form, setForm] = useState({ name: habit.name, emoji: habit.emoji, amount: String(habit.amount) })

  const h = t.habitDetail
  const dateLocale = toDateLocale(locale)
  const period = habit.frequency === 'weekly' ? t.savingsHabits.periodWeek : t.savingsHabits.periodMonth
  const lit = Math.min(habit.streak, STREAK_DOTS)

  const call = async (init: RequestInit & { url?: string }) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(init.url ?? '/api/habits', init)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? h.error)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits', userId] }),
        queryClient.invalidateQueries({ queryKey: ['transactions', userId] }),
      ])
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : h.error)
      return false
    } finally {
      setBusy(false)
    }
  }

  const log = async () => {
    const ok = await call({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habitId: habit.id,
        period: getCurrentPeriod(habit.frequency),
        amount: habit.amount,
        currency,
      }),
    })
    if (ok) onClose()
  }

  const save = async () => {
    const amount = parseFloat(form.amount)
    if (!form.name.trim() || !(amount > 0)) return
    const ok = await call({
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', habitId: habit.id, name: form.name.trim(), emoji: form.emoji, amount }),
    })
    if (ok) onClose()
  }

  const stop = async () => {
    const ok = await call({ method: 'DELETE', url: `/api/habits?habitId=${encodeURIComponent(habit.id)}` })
    if (ok) onClose()
  }

  return (
    <Sheet
      title={h.title}
      onClose={onClose}
      closeLabel={t.common.close}
      closeGlyph="←"
      right={
        !editing && (
          <button type="button" onClick={() => setEditing(true)} className="uppercase">
            {h.edit}
          </button>
        )
      }
      footer={
        editing ? (
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <button type="button" onClick={() => setEditing(false)} className="key key-line h-14 text-[13px] uppercase">
              {t.common.cancel}
            </button>
            <button type="button" onClick={save} disabled={busy} className="key key-accent h-14 text-sm uppercase">
              {busy ? t.common.saving : h.save}
            </button>
          </div>
        ) : habit.currentPeriodLogged ? (
          <div className="h-14 grid place-items-center text-sm font-bold uppercase text-truffle-positive">
            ● {h.loggedThis(period)}
          </div>
        ) : (
          <button type="button" onClick={log} disabled={busy} className="key key-accent w-full h-14 text-sm uppercase">
            {busy ? t.common.saving : h.logThis(period, formatAmount(habit.amount))}
          </button>
        )
      }
    >
      {editing ? (
        <div className="slip mx-4 mt-3 px-[18px] pt-4 pb-7 flex flex-col gap-3 text-sm">
          <div role="group" aria-label={h.icon} className="flex gap-1 flex-wrap">
            {HABIT_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={form.emoji === e}
                onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                className={`w-9 h-9 grid place-items-center text-lg rounded-md border ${form.emoji === e ? 'border-truffle-text bg-truffle-accent-soft' : 'border-transparent'}`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            aria-label={h.name}
            placeholder={h.name}
            className="field h-11"
          />
          <label className="relative">
            <span className="sr-only">{h.amountPer(period)}</span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2">{symbol}</span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="field h-11 pl-7 font-bold"
            />
          </label>
          <span className="text-[11px] text-truffle-text2 uppercase">{h.amountPer(period)}</span>
          {error && (
            <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
              ■ {error}
            </p>
          )}
          <Rule className="mt-2" />
          {confirmStop ? (
            <div className="flex flex-col gap-2">
              <p className="m-0 font-grotesk text-sm text-truffle-text2">{h.stopNote}</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => setConfirmStop(false)} className="key key-outline h-10 text-[11px] uppercase">
                  {t.common.cancel}
                </button>
                <button type="button" onClick={stop} disabled={busy} className="key key-danger h-10 text-[11px] uppercase">
                  ✕ {h.stop}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmStop(true)}
              className="self-start min-h-9 text-xs font-bold uppercase text-truffle-negative"
            >
              ✕ {h.stop}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="px-6 pt-3 flex flex-col gap-1">
            <h2 className="m-0 font-grotesk text-4xl font-medium">
              {habit.emoji} {habit.name}
            </h2>
            <span className="text-xs text-truffle-text2 uppercase">
              {formatAmount(habit.amount)} / {period} ·{' '}
              {h.since(
                new Date(habit.createdAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
              )}
            </span>
          </div>

          <div className="paper print-in mx-4 mt-4 p-[18px] flex flex-col gap-3 border-t-[6px] border-truffle-accent">
            <div className="flex items-baseline gap-3">
              <span className="text-[40px] font-bold leading-none">×{habit.streak}</span>
              <span className="text-xs font-bold uppercase text-truffle-text2">{h.inARow(period)}</span>
            </div>
            <div aria-hidden className="flex gap-[3px]">
              {Array.from({ length: STREAK_DOTS }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-[18px] border-2 ${i < lit ? 'bg-truffle-accent border-truffle-accent' : 'border-truffle-border'}`}
                />
              ))}
            </div>
            <LeaderRow
              className="text-[13px]"
              left={h.totalSaved}
              right={<b>{formatAmount(habit.totalSaved)}</b>}
            />
          </div>

          <div className="slip mx-4 mt-4 px-4 pt-4 pb-7 flex flex-col gap-2 text-[13px]">
            <span className="font-bold tracking-[.08em] uppercase">{h.history}</span>
            {(habit.history ?? []).length === 0 ? (
              <p className="m-0 rule-soft pt-2 font-grotesk text-sm text-truffle-text2">{h.noHistory}</p>
            ) : (
              (habit.history ?? []).map((c, i) => (
                <div key={c.period} className="rule-soft pt-2 print-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <LeaderRow
                    left={periodLabel(c.period, h.week, dateLocale)}
                    right={<b className="text-truffle-positive">+{formatAmount(c.amount)}</b>}
                  />
                </div>
              ))
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
