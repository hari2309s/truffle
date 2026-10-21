'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePostHog } from 'posthog-js/react'
import { TRANSACTION_CATEGORIES, type TransactionCategory } from '@truffle/types'
import { Rule, Sheet } from './Tally'
import { useBudgetsQuery } from '@/hooks/useBudgetsQuery'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { currentYearMonth } from '@/lib/date'

// The chips shown before "+ More" — the everyday ones first.
const QUICK_CATEGORIES: TransactionCategory[] = [
  'food_delivery',
  'food_groceries',
  'transport',
  'shopping',
]

interface AddTransactionFormProps {
  userId: string
  onClose: () => void
}

export function AddTransactionForm({ userId, onClose }: AddTransactionFormProps) {
  const { t } = useLanguage()
  const { symbol, currency, formatAmount } = useCurrency()
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'other' as TransactionCategory,
    date: new Date().toISOString().slice(0, 10),
    merchant: '',
    isExpense: true,
  })

  const { data: budgets = [] } = useBudgetsQuery(userId)
  const { data: txData } = useTransactionsQuery(userId)

  const amount = parseFloat(form.amount)
  const validAmount = !isNaN(amount) && amount > 0

  // Gentle heads-up when this entry pushes its category to 80%+ of budget.
  const budgetNote = useMemo(() => {
    if (!form.isExpense || !validAmount) return null
    const budget = budgets.find((b) => b.category === form.category)
    if (!budget || budget.amount <= 0) return null
    const prefix = currentYearMonth()
    const spent = (txData?.transactions ?? [])
      .filter((tx) => tx.category === form.category && tx.amount < 0 && tx.date.startsWith(prefix))
      .reduce((s, tx) => s - tx.amount, 0)
    const category = t.categories[form.category] ?? form.category
    if (spent >= budget.amount) return t.addTransaction.overBudget(category, formatAmount(amount))
    const pct = Math.round(((spent + amount) / budget.amount) * 100)
    return pct >= 80 ? t.addTransaction.nearBudget(category, pct) : null
  }, [budgets, txData, form.category, form.isExpense, amount, validAmount, t, formatAmount])

  const categories = showAllCategories
    ? TRANSACTION_CATEGORIES
    : [...QUICK_CATEGORIES, ...(QUICK_CATEGORIES.includes(form.category) ? [] : [form.category])]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description || !validAmount) return

    setIsLoading(true)
    setError(null)
    try {
      const signed = amount * (form.isExpense ? -1 : 1)
      const transaction = {
        description: form.description,
        amount: signed,
        currency,
        category: form.category,
        date: form.date,
        merchant: form.merchant || undefined,
        isRecurring: false,
        userId,
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, transactions: [transaction] }),
      })

      if (!res.ok) throw new Error('Failed to save')

      posthog.capture('transaction_added', {
        category: form.category,
        is_expense: form.isExpense,
      })

      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      await queryClient.invalidateQueries({ queryKey: ['insights', userId] })
      onClose()
    } catch (err) {
      console.error('Failed to add transaction:', err)
      setError(t.addTransaction.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet
      title={t.addTransaction.title}
      onClose={onClose}
      closeLabel={t.common.close}
      footer={
        <button
          type="submit"
          form="add-transaction"
          disabled={isLoading || !validAmount || !form.description}
          className="key key-accent w-full h-[60px] text-[15px] uppercase"
        >
          {isLoading
            ? t.addTransaction.saving
            : t.addTransaction.printLog(validAmount ? formatAmount(amount) : `${symbol}0`)}
        </button>
      }
    >
      <form
        id="add-transaction"
        onSubmit={handleSubmit}
        className="slip mx-4 mt-3 px-[18px] pt-4 pb-7 flex flex-col gap-3"
      >
        <div
          role="radiogroup"
          aria-label={t.addTransaction.typeLabel}
          className="grid grid-cols-2 border border-truffle-border rounded-lg overflow-hidden"
        >
          {[true, false].map((isExpense) => {
            const selected = form.isExpense === isExpense
            return (
              <button
                key={String(isExpense)}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setForm((f) => ({ ...f, isExpense }))}
                className={`h-11 grid place-items-center text-[13px] font-bold uppercase ${
                  selected ? 'bg-truffle-text text-truffle-bg' : 'text-truffle-text2'
                }`}
              >
                {isExpense ? `− ${t.addTransaction.expense}` : `+ ${t.addTransaction.income}`}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="h-10 px-2.5 rounded-md border border-truffle-border flex items-center gap-1.5 text-[13px] font-bold flex-none">
            {symbol} {currency}
          </span>
          <label htmlFor="tx-amount" className="sr-only">
            {t.addTransaction.amountLabel}
          </label>
          <input
            id="tx-amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            step="0.01"
            min="0"
            required
            autoFocus
            className="min-w-0 w-full bg-transparent text-right text-[52px] font-bold leading-none caret-truffle-accent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <Rule />

        <EntryRow label={t.addTransaction.whatLabel} htmlFor="tx-description">
          <input
            id="tx-description"
            type="text"
            placeholder={t.addTransaction.descriptionPlaceholder}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            className="field-inline w-full"
          />
        </EntryRow>
        <EntryRow label={t.addTransaction.merchantLabel} htmlFor="tx-merchant">
          <input
            id="tx-merchant"
            type="text"
            placeholder={t.addTransaction.optional}
            value={form.merchant}
            onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))}
            className="field-inline w-full"
          />
        </EntryRow>
        <EntryRow label={t.addTransaction.dateLabel} htmlFor="tx-date">
          <input
            id="tx-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="field-inline"
          />
        </EntryRow>

        <div role="group" aria-label={t.addTransaction.categoryLabel} className="flex flex-wrap gap-1.5">
          {categories.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={form.category === key}
              onClick={() => {
                const isIncome = key === 'income' || key === 'savings'
                setForm((f) => ({ ...f, category: key, isExpense: !isIncome }))
              }}
              className="chip uppercase"
            >
              {t.categories[key] ?? key}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAllCategories((v) => !v)}
            aria-expanded={showAllCategories}
            className="chip uppercase"
          >
            {showAllCategories ? t.addTransaction.less : t.addTransaction.more}
          </button>
        </div>

        {budgetNote && (
          <p className="text-[11px] font-bold uppercase text-truffle-warning">▲ {budgetNote}</p>
        )}
        {error && (
          <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
            ■ {error}
          </p>
        )}
      </form>
    </Sheet>
  )
}

function EntryRow({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-1.5 text-sm min-h-7 items-center">
      <label htmlFor={htmlFor} className="text-truffle-text2 whitespace-nowrap">
        {label}
      </label>
      <span aria-hidden className="leader !-mb-1 !min-w-4 !flex-[0_1_40px]" />
      <div className="flex-1 min-w-0 flex justify-end">{children}</div>
    </div>
  )
}
