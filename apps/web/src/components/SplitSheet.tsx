'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TRANSACTION_CATEGORIES, type Transaction, type TransactionCategory } from '@truffle/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { LeaderRow, MINUS, Rule, Sheet } from './Tally'

interface Part {
  amount: string
  category: TransactionCategory
  description: string
}

const MAX_PARTS = 10
const cents = (s: string) => Math.round((parseFloat(s) || 0) * 100)

/** Split one entry into several, e.g. a supermarket shop that was half household. */
export function SplitSheet({
  tx,
  userId,
  onClose,
  onDone,
}: {
  tx: Transaction
  userId: string
  onClose: () => void
  onDone: () => void
}) {
  const { t } = useLanguage()
  const { formatAmount, symbol } = useCurrency()
  const queryClient = useQueryClient()
  const sp = t.split
  const total = Math.abs(Math.round(tx.amount * 100))
  const sign = tx.amount < 0 ? -1 : 1
  const [parts, setParts] = useState<Part[]>([
    { amount: (total / 100).toFixed(2), category: tx.category, description: tx.description },
    { amount: '', category: 'other', description: '' },
  ])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allocated = parts.reduce((s, p) => s + cents(p.amount), 0)
  const left = total - allocated
  const valid =
    left === 0 && parts.every((p) => cents(p.amount) > 0 && p.description.trim().length > 0)

  const update = (i: number, patch: Partial<Part>) =>
    setParts((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/transactions/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: tx.id,
          parts: parts.map((p) => ({
            amount: (sign * cents(p.amount)) / 100,
            category: p.category,
            description: p.description.trim(),
          })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? sp.error)
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : sp.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      title={sp.title}
      onClose={onClose}
      closeLabel={t.common.close}
      closeGlyph="←"
      footer={
        <button
          type="button"
          onClick={save}
          disabled={!valid || busy}
          className="key key-accent w-full h-14 text-sm uppercase"
        >
          {busy ? t.common.saving : sp.save(parts.length)}
        </button>
      }
    >
      <div className="slip mx-4 mt-3 px-[18px] pt-4 pb-7 flex flex-col gap-2 text-[13px]">
        <LeaderRow
          className="text-[15px]"
          left={<b>{tx.description}</b>}
          right={
            <b>
              {sign < 0 ? MINUS : '+'}
              {formatAmount(tx.amount)}
            </b>
          }
        />
        {parts.map((part, i) => (
          <div key={i} className="rule-soft pt-3 mt-1 flex flex-col gap-2 print-in">
            <div className="flex justify-between items-center text-xs font-bold uppercase">
              <span>{sp.part(i + 1)}</span>
              {parts.length > 2 && (
                <button
                  type="button"
                  onClick={() => setParts((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={sp.remove(i + 1)}
                  className="w-8 h-8 -my-1 grid place-items-center text-truffle-text2"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <input
                value={part.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder={t.transactions.descriptionPlaceholder}
                aria-label={`${sp.part(i + 1)} · ${t.transactions.descriptionPlaceholder}`}
                maxLength={200}
                className="field h-11"
              />
              <label className="relative">
                <span className="sr-only">{`${sp.part(i + 1)} · ${t.addTransaction.amountLabel}`}</span>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2">{symbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={part.amount}
                  onChange={(e) => update(i, { amount: e.target.value })}
                  className="field h-11 pl-7 font-bold"
                />
              </label>
            </div>
            <select
              value={part.category}
              onChange={(e) => update(i, { category: e.target.value as TransactionCategory })}
              aria-label={`${sp.part(i + 1)} · ${t.addTransaction.categoryLabel}`}
              className="field h-11"
            >
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.categories[c] ?? c}
                </option>
              ))}
            </select>
          </div>
        ))}
        {parts.length < MAX_PARTS && (
          <button
            type="button"
            onClick={() =>
              setParts((prev) => [
                ...prev,
                { amount: left > 0 ? (left / 100).toFixed(2) : '', category: 'other', description: '' },
              ])
            }
            className="mt-2 h-11 rounded-lg border border-dashed border-truffle-text text-xs font-bold uppercase"
          >
            + {sp.addPart}
          </button>
        )}
        <Rule className="mt-2" />
        <div
          className={`flex justify-between font-bold uppercase ${left === 0 ? 'text-truffle-positive' : 'text-truffle-warning'}`}
          aria-live="polite"
        >
          <span>{left === 0 ? `● ${sp.balanced}` : left > 0 ? `▲ ${sp.left}` : `▲ ${sp.over}`}</span>
          <span>{formatAmount(left / 100)}</span>
        </div>
      </div>
      {error && (
        <p role="alert" className="mx-4 mt-3 text-[11px] font-bold uppercase text-truffle-negative">
          ■ {error}
        </p>
      )}
    </Sheet>
  )
}
