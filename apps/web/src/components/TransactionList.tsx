'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { SkeletonPulse } from './PageMotion'
import { useTransactionFilters } from '@/hooks/useTransactionFilters'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { TransactionFilterPanel } from './TransactionFilterPanel'
import { MINUS } from './Tally'
import { TRANSACTION_CATEGORIES } from '@truffle/types'
import type { Transaction, TransactionCategory } from '@truffle/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'

function exportToCSV(transactions: Transaction[]) {
  const header = ['Date', 'Description', 'Category', 'Merchant', 'Amount', 'Currency']
  const rows = transactions.map((tx) => [
    tx.date,
    `"${tx.description.replace(/"/g, '""')}"`,
    tx.category,
    `"${(tx.merchant ?? '').replace(/"/g, '""')}"`,
    tx.amount.toFixed(2),
    tx.currency,
  ])
  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `truffle-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface TransactionListProps {
  userId: string
}

const EDIT_CATEGORIES = TRANSACTION_CATEGORIES

interface EditFormState {
  description: string
  amount: string
  category: TransactionCategory
  merchant: string
  date: string
}

type EditFocus = 'amount' | 'category'

function EditForm({
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
  })
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
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      onSave()
    } catch {
      // Keep form open on error
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

export function TransactionList({ userId }: TransactionListProps) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const queryClient = useQueryClient()
  const { data, isLoading } = useTransactionsQuery(userId)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string; focus: EditFocus } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const allTransactions = data?.transactions ?? []
  const [visibleMonthCount, setVisibleMonthCount] = useState(1)

  const filters = useTransactionFilters(allTransactions)
  const { filtered, isFiltered, clearFilters } = filters

  const cutoffDate = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() - (visibleMonthCount - 1), 1)
      .toISOString()
      .slice(0, 10)
  }, [visibleMonthCount])

  const windowed = useMemo(
    () => allTransactions.filter((tx) => tx.date >= cutoffDate),
    [allTransactions, cutoffDate]
  )

  const hasMore = useMemo(
    () => !isFiltered && allTransactions.some((tx) => tx.date < cutoffDate),
    [isFiltered, allTransactions, cutoffDate]
  )

  const nextMonthLabel = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() - visibleMonthCount, 1).toLocaleDateString(
      toDateLocale(locale),
      { month: 'long', year: 'numeric' }
    )
  }, [visibleMonthCount, locale])

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const formatDay = (date: string) =>
    date === todayStr
      ? t.transactions.today
      : new Date(date + 'T12:00:00').toLocaleDateString(toDateLocale(locale), {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })

  const displayed = isFiltered ? filtered : windowed

  const handleSaveEdit = async () => {
    setEditing(null)
    setOpenId(null)
    await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
  }

  const handleDelete = async (txId: string) => {
    setDeletingId(txId)
    try {
      await fetch(`/api/transactions?userId=${userId}&transactionId=${txId}`, { method: 'DELETE' })
      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
      setOpenId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[1, 2, 3].map((i) => (
          <SkeletonPulse key={i} className="rule-soft py-3 flex flex-col gap-2">
            <div className="h-3.5 bg-truffle-border w-full" />
            <div className="h-2.5 bg-truffle-border w-1/2" />
          </SkeletonPulse>
        ))}
      </div>
    )
  }

  if (allTransactions.length === 0) {
    return (
      <div className="rule-soft pt-3 font-grotesk text-sm text-truffle-text2">
        <p>{t.transactions.noTransactions}</p>
        <p>{t.transactions.noTransactionsHint}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <TransactionFilterPanel filters={filters} />

      <div className="flex items-center justify-between py-2 text-[11px] text-truffle-text2 uppercase">
        <span>
          {isFiltered
            ? t.transactions.filteredCount(filtered.length, allTransactions.length)
            : t.transactions.count(windowed.length)}
        </span>
        <span className="flex items-center gap-3">
          {isFiltered && (
            <button onClick={clearFilters} className="underline underline-offset-2 uppercase">
              {t.transactions.clear}
            </button>
          )}
          <button
            onClick={() => exportToCSV(filtered)}
            className="underline underline-offset-2 uppercase text-truffle-text"
          >
            {t.transactions.exportCSV}
          </button>
        </span>
      </div>

      {displayed.length === 0 ? (
        <p className="rule-soft py-3 font-grotesk text-sm text-truffle-text2">
          {isFiltered ? t.transactions.noMatching : t.transactions.noThisMonth}
        </p>
      ) : (
        <ul className="flex flex-col">
          {displayed.map((tx, i) => {
            const isOpen = openId === tx.id
            const isEditing = editing?.id === tx.id
            const isConfirmingDelete = confirmDeleteId === tx.id
            const isBeingDeleted = deletingId === tx.id
            const isIncome = tx.amount > 0

            return (
              <li
                key={tx.id}
                className={`rule-soft py-2.5 flex flex-col print-in transition-opacity ${isBeingDeleted ? 'opacity-40 pointer-events-none' : ''}`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(isOpen ? null : tx.id)
                    setEditing(null)
                    setConfirmDeleteId(null)
                  }}
                  aria-expanded={isOpen}
                  className="flex flex-col text-left w-full"
                >
                  <span className="flex gap-1.5 text-sm items-baseline w-full">
                    <span className="font-bold whitespace-nowrap truncate min-w-0">
                      {tx.description}
                    </span>
                    <span aria-hidden className="leader !mb-1" />
                    <span
                      className={`font-bold whitespace-nowrap ${isIncome ? 'text-truffle-positive' : ''}`}
                    >
                      {isIncome ? '+' : MINUS}
                      {formatAmount(tx.amount)}
                    </span>
                  </span>
                  <span className="flex justify-between gap-3 text-[11px] text-truffle-text2 pt-0.5 w-full">
                    <span className="truncate">
                      {t.categories[tx.category] ?? tx.category} · {formatDay(tx.date)}
                      {tx.merchant ? ` · ${tx.merchant}` : ''}
                    </span>
                    {isIncome && (
                      <b className="text-truffle-positive whitespace-nowrap uppercase">
                        {t.transactions.credit}
                      </b>
                    )}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {isEditing ? (
                        <EditForm
                          tx={tx}
                          userId={userId}
                          focus={editing.focus}
                          onSave={handleSaveEdit}
                          onCancel={() => setEditing(null)}
                        />
                      ) : isConfirmingDelete ? (
                        <div className="pt-2.5 flex flex-col gap-2">
                          <span className="text-xs font-bold text-truffle-negative uppercase">
                            ✂ {t.transactions.deleteConfirm}
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="key key-outline h-11 text-xs uppercase"
                            >
                              {t.transactions.cancel}
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="key key-danger h-11 text-xs uppercase"
                            >
                              ✕ {t.transactions.delete}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5 pt-2.5">
                          <button
                            onClick={() => setEditing({ id: tx.id, focus: 'amount' })}
                            className="key key-outline h-11 text-xs uppercase"
                          >
                            ✎ {t.transactions.editAmount}
                          </button>
                          <button
                            onClick={() => setEditing({ id: tx.id, focus: 'category' })}
                            className="key key-outline h-11 text-xs uppercase"
                          >
                            ✎ {t.transactions.editCategory}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(tx.id)}
                            className="key key-danger h-11 text-xs uppercase"
                          >
                            ✕ {t.transactions.delete}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore && (
        <button
          onClick={() => setVisibleMonthCount((n) => n + 1)}
          className="key key-line key-3 h-11 mt-3 mb-1 text-xs uppercase"
        >
          {t.transactions.loadMonth(nextMonthLabel)}
        </button>
      )}
    </div>
  )
}
