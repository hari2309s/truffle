'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { CategoryBudget } from '@truffle/types'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'
import { LeaderRow, Sheet } from './Tally'

const STEP = 10
const HEADS_UP = 80
const round10 = (n: number) => Math.max(STEP, Math.round(n / STEP) * STEP)

/** Edit one category's monthly limit against what it actually costs. */
export function BudgetEditSheet({
  budget,
  userId,
  onClose,
}: {
  budget: CategoryBudget
  userId: string
  onClose: () => void
}) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const queryClient = useQueryClient()
  const { data: txData } = useTransactionsQuery(userId)
  const [limit, setLimit] = useState(budget.amount)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const b = t.budgetEdit
  const category = t.categories[budget.category] ?? budget.category
  const whole = (n: number) =>
    formatAmount(n).replace(/[.,]00(?=\D*$)/, '')

  // Spend in this category for this month and the two before it.
  const months = useMemo(() => {
    const now = new Date()
    return [2, 1, 0].map((back) => {
      const d = new Date(now.getFullYear(), now.getMonth() - back, 1)
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const spent = (txData?.transactions ?? [])
        .filter((tx) => tx.category === budget.category && tx.amount < 0 && tx.date.startsWith(prefix))
        .reduce((s, tx) => s - tx.amount, 0)
      return {
        label:
          back === 0
            ? b.soFar(d.toLocaleDateString(toDateLocale(locale), { month: 'long' }))
            : d.toLocaleDateString(toDateLocale(locale), { month: 'long' }),
        spent,
        current: back === 0,
      }
    })
  }, [txData, budget.category, b, locale])

  const spentNow = months[2]!.spent
  const pctAt = (l: number) => (l > 0 ? Math.round((spentNow / l) * 100) : 0)
  const statusAt = (l: number) => {
    const pct = pctAt(l)
    return pct > 100
      ? { glyph: '■', word: t.monthlyBudgets.statusOver, color: 'text-truffle-negative', bar: 'bg-truffle-negative' }
      : pct >= HEADS_UP
        ? { glyph: '▲', word: t.monthlyBudgets.statusHeadsUp, color: 'text-truffle-warning', bar: 'bg-truffle-warning' }
        : { glyph: '●', word: t.monthlyBudgets.statusOnTrack, color: 'text-truffle-positive', bar: 'bg-truffle-positive' }
  }
  const nowStatus = statusAt(budget.amount)
  const newStatus = statusAt(limit)

  // Quick picks around what the category really costs.
  const history = months.map((m) => m.spent).filter((s) => s > 0)
  const avg = history.length ? history.reduce((a, c) => a + c, 0) / history.length : budget.amount
  const chips = Array.from(
    new Set([round10(avg * 0.85), round10(budget.amount), round10(avg * 1.1), round10(Math.max(...history, avg) * 1.25)])
  ).sort((x, y) => x - y)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, category: budget.category, amount: limit }),
      })
      if (!res.ok) throw new Error()
      await queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
      onClose()
    } catch {
      setError(b.error)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/budgets?userId=${userId}&budgetId=${budget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
      onClose()
    } catch {
      setError(b.error)
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      title={b.title}
      onClose={onClose}
      closeLabel={t.common.close}
      closeGlyph="←"
      right={
        <button
          type="button"
          onClick={() => setConfirmDelete((v) => !v)}
          aria-label={t.monthlyBudgets.removeBudget}
          aria-expanded={confirmDelete}
          className="text-truffle-negative"
        >
          ✕
        </button>
      }
      footer={
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button type="button" onClick={onClose} className="key key-line h-14 text-[13px] uppercase">
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || limit === budget.amount}
            className="key key-accent h-14 text-sm uppercase"
          >
            {busy ? t.common.saving : b.save(whole(limit))}
          </button>
        </div>
      }
    >
      <div className="px-6 pt-3 flex flex-col gap-1">
        <h2 className="m-0 font-grotesk text-4xl font-medium">{category}</h2>
        <span className={`text-xs font-bold uppercase ${nowStatus.color}`}>
          {nowStatus.glyph} {nowStatus.word} · {b.ofLimit(whole(spentNow), whole(budget.amount))} ·{' '}
          {pctAt(budget.amount)}%
        </span>
      </div>

      {confirmDelete && (
        <div className="mx-4 mt-3 p-3.5 bg-truffle-surface border-t-[6px] border-truffle-negative grid grid-cols-[1fr_auto_auto] items-center gap-1.5 print-in">
          <span className="text-[11px] font-bold uppercase text-truffle-negative">
            {t.monthlyBudgets.deleteConfirm}
          </span>
          <button type="button" onClick={() => setConfirmDelete(false)} className="key key-outline h-9 px-3 text-[11px] uppercase">
            {t.common.cancel}
          </button>
          <button type="button" onClick={remove} disabled={busy} className="key key-danger h-9 px-3 text-[11px] uppercase">
            ✕ {t.transactions.delete}
          </button>
        </div>
      )}

      <div className="paper print-in mx-4 mt-4 p-[18px] flex flex-col gap-3.5">
        <span className="text-xs font-bold uppercase">{b.monthlyLimit}</span>
        <div className="grid grid-cols-[52px_1fr_52px] gap-2 items-center">
          <button
            type="button"
            onClick={() => setLimit((l) => Math.max(STEP, l - STEP))}
            aria-label={b.decrease}
            className="key key-line h-[52px] text-xl"
          >
            −
          </button>
          <span className="text-center text-[44px] font-bold leading-none" aria-live="polite">
            {whole(limit)}
          </span>
          <button
            type="button"
            onClick={() => setLimit((l) => l + STEP)}
            aria-label={b.increase}
            className="key key-line h-[52px] text-xl"
          >
            +
          </button>
        </div>
        <div className="relative h-3.5 bg-truffle-surface border border-truffle-border">
          <div
            className={`h-full transition-[width] duration-300 ${newStatus.bar}`}
            style={{ width: `${Math.min(100, pctAt(limit))}%` }}
          />
          <div
            aria-hidden
            className="absolute -top-1 -bottom-1 w-0.5 bg-truffle-text"
            style={{ left: `${HEADS_UP}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-bold uppercase">
          <span className={newStatus.color}>
            {newStatus.glyph} {b.atLimit(whole(limit), pctAt(limit))}
          </span>
          <span className="text-truffle-text2">| {HEADS_UP}%</span>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${chips.length}, minmax(0, 1fr))` }}>
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={limit === c}
              onClick={() => setLimit(c)}
              className={`h-10 rounded-md border border-truffle-border text-xs font-bold ${limit === c ? 'bg-truffle-text text-truffle-bg' : ''}`}
            >
              {whole(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="slip mx-4 mt-3.5 px-[18px] pt-3.5 pb-[26px] flex flex-col gap-1.5 text-[13px]">
        <span className="text-xs font-bold uppercase pb-1">{b.lastThree}</span>
        {months.map((m) => (
          <LeaderRow
            key={m.label}
            className={m.current ? 'font-bold' : ''}
            left={m.label}
            right={whole(m.spent)}
          />
        ))}
      </div>

      <div className="mx-4 mt-3.5 px-1 flex justify-between items-center min-h-12 text-[13px]">
        <span>{b.headsUpAt}</span>
        <span className="font-bold">{HEADS_UP}%</span>
      </div>
      {error && (
        <p role="alert" className="mx-4 text-[11px] font-bold uppercase text-truffle-negative">
          ■ {error}
        </p>
      )}
    </Sheet>
  )
}
