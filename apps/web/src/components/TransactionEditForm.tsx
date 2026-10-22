'use client'

import { useState } from 'react'
import { TRANSACTION_CATEGORIES } from '@truffle/types'
import type { Transaction, TransactionCategory } from '@truffle/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'

const EDIT_CATEGORIES = TRANSACTION_CATEGORIES

interface EditFormState {
  description: string
  amount: string
  category: TransactionCategory
  merchant: string
  date: string
  note: string
}

export type EditFocus = 'amount' | 'category'

export function EditForm({
  tx,
  userId,
  focus,
  onSave,
  onCancel,
}: {
  tx: Transaction
  userId: string
  focus: EditFocus
  onSave: () => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const { symbol } = useCurrency()
  const [form, setForm] = useState<EditFormState>({
    description: tx.description,
    amount: tx.amount.toString(),
    category: tx.category,
    merchant: tx.merchant ?? '',
    date: tx.date,
    note: tx.note ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (isNaN(amt)) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactionId: tx.id,
          description: form.description.trim(),
          amount: amt,
          category: form.category,
          merchant: form.merchant.trim() || undefined,
          date: form.date,
          note: form.note.trim() || null,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? t.transactions.saveError)
      }
      onSave()
    } catch (e) {
      // Keep form open on error
      setError(e instanceof Error ? e.message : t.transactions.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pt-2.5 flex flex-col gap-2 print-in">
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder={t.transactions.descriptionPlaceholder}
          aria-label={t.transactions.descriptionPlaceholder}
          required
          className="field h-11"
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2 text-sm">
            {symbol}
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="-0.00"
            aria-label={t.addTransaction.amountLabel}
            step="0.01"
            required
            autoFocus={focus === 'amount'}
            className="field h-11 pl-7 font-bold"
          />
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          value={form.category}
          onChange={(e) =>
            setForm((f) => ({ ...f, category: e.target.value as TransactionCategory }))
          }
          aria-label={t.addTransaction.categoryLabel}
          autoFocus={focus === 'category'}
          className="field h-11"
        >
          {EDIT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t.categories[c] ?? c}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          aria-label={t.addTransaction.dateLabel}
          required
          className="field h-11 w-auto"
        />
      </div>
      <input
        type="text"
        value={form.merchant}
        onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
        placeholder={t.transactions.merchantPlaceholder}
        aria-label={t.transactions.merchantPlaceholder}
        className="field h-11"
      />
      <textarea
        value={form.note}
        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        placeholder={t.transactions.notePlaceholder}
        aria-label={t.transactions.notePlaceholder}
        maxLength={500}
        rows={2}
        className="field h-auto py-2.5 resize-none font-grotesk text-sm"
      />
      {error && (
        <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
          ■ {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
        <button type="button" onClick={onCancel} className="key key-line key-3 h-11 text-xs uppercase">
          {t.transactions.cancel}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="key key-ink key-3 h-11 text-xs uppercase"
        >
          {isSaving ? `${t.transactions.save}…` : t.transactions.save}
        </button>
      </div>
    </form>
  )
}
