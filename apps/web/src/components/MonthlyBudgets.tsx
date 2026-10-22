'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import type { CategoryBudget, Transaction, TransactionCategory } from '@truffle/types'
import { TRANSACTION_CATEGORIES } from '@truffle/types'
import { SkeletonPulse } from './PageMotion'
import { LeaderRow } from './Tally'
import { BudgetEditSheet } from './BudgetEditSheet'
import { useBudgetsQuery } from '@/hooks/useBudgetsQuery'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSectionAddForm } from '@/contexts/SectionAddFormContext'

interface MonthlyBudgetsProps {
  userId: string
  transactions: Transaction[]
}

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

/** Single pass over transactions building a category -> spend map, instead of
 * filtering+reducing the full array once per budget on every render. */
function useSpendByCategory(transactions: Transaction[]): Partial<Record<TransactionCategory, number>> {
  return useMemo(() => {
    const prefix = currentYearMonth()
    const map: Partial<Record<TransactionCategory, number>> = {}
    for (const tx of transactions) {
      if (tx.amount < 0 && tx.date.startsWith(prefix)) {
        map[tx.category] = (map[tx.category] ?? 0) + Math.abs(tx.amount)
      }
    }
    return map
  }, [transactions])
}

export function MonthlyBudgets({ userId, transactions }: MonthlyBudgetsProps) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const { open: showAdd, setOpen: setShowAdd } = useSectionAddForm()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<CategoryBudget | null>(null)
  const spendByCategory = useSpendByCategory(transactions)

  const { data: budgets = [], isLoading } = useBudgetsQuery(userId)

  const handleDelete = async (budgetId: string) => {
    setDeletingId(budgetId)
    try {
      await fetch(`/api/budgets?userId=${userId}&budgetId=${budgetId}`, { method: 'DELETE' })
      await queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <>
      {showAdd && (
        <AddBudgetForm
          userId={userId}
          existingCategories={budgets.map((b) => b.category)}
          onDone={() => {
            setShowAdd(false)
            queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
          }}
        />
      )}

      {isLoading ? (
        <SkeletonPulse className="flex flex-col gap-2">
          <div className="h-3 bg-truffle-border" />
          <div className="h-3.5 bg-truffle-border" />
        </SkeletonPulse>
      ) : budgets.length === 0 && !showAdd ? (
        <p className="font-grotesk text-sm text-truffle-text2">{t.monthlyBudgets.noBudgets}</p>
      ) : (
        budgets.map((budget) => (
          <BudgetRow
            key={budget.id}
            budget={budget}
            spent={spendByCategory[budget.category] ?? 0}
            onDelete={() => handleDelete(budget.id)}
            isDeleting={deletingId === budget.id}
            isConfirmingDelete={confirmDeleteId === budget.id}
            onRequestDelete={() => setConfirmDeleteId(budget.id)}
            onCancelDelete={() => setConfirmDeleteId(null)}
            onOpen={() => setEditing(budget)}
          />
        ))
      )}

      <AnimatePresence>
        {editing && (
          <BudgetEditSheet
            key={editing.id}
            budget={editing}
            userId={userId}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function BudgetRow({
  budget,
  spent,
  onDelete,
  isDeleting,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onOpen,
}: {
  budget: CategoryBudget
  spent: number
  onDelete: () => void
  isDeleting: boolean
  isConfirmingDelete: boolean
  onRequestDelete: () => void
  onCancelDelete: () => void
  onOpen: () => void
}) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const rawPct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
  const remaining = Math.max(0, budget.amount - spent)
  const isOver = spent > budget.amount
  const isHeadsUp = !isOver && rawPct >= 80

  const status = isOver
    ? { glyph: '■', word: t.monthlyBudgets.statusOver, color: 'text-truffle-negative', fill: 'bg-truffle-negative border-truffle-negative' }
    : isHeadsUp
      ? { glyph: '▲', word: t.monthlyBudgets.statusHeadsUp, color: 'text-truffle-warning', fill: 'bg-truffle-warning border-truffle-warning' }
      : { glyph: '●', word: t.monthlyBudgets.statusOnTrack, color: 'text-truffle-positive', fill: 'bg-truffle-positive border-truffle-positive' }
  const filled = Math.min(10, Math.round(rawPct / 10))
  const note = isOver
    ? t.monthlyBudgets.over(formatAmount(spent - budget.amount))
    : t.monthlyBudgets.left(formatAmount(remaining))

  return (
    <div
      className={`flex flex-col gap-[5px] transition-opacity ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpen}
          aria-label={t.budgetEdit.open(t.categories[budget.category] ?? budget.category)}
          className="flex-1 min-w-0 text-left"
        >
          <LeaderRow
            left={<span className="underline-offset-2 hover:underline">{t.categories[budget.category] ?? budget.category}</span>}
            right={`${formatAmount(spent)}/${formatAmount(budget.amount)} →`}
          />
        </button>
        <button
          type="button"
          onClick={() => (isConfirmingDelete ? onCancelDelete() : onRequestDelete())}
          aria-label={t.monthlyBudgets.removeBudget}
          aria-expanded={isConfirmingDelete}
          className={`w-7 h-7 -my-1 -mr-1.5 grid place-items-center text-[11px] ${isConfirmingDelete ? 'text-truffle-negative' : 'text-truffle-text2'}`}
        >
          ✕
        </button>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(rawPct)}
        aria-label={t.categories[budget.category] ?? budget.category}
        className="grid grid-cols-10 gap-0.5"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`h-3.5 border ${i < filled ? status.fill : 'border-truffle-border'}`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-bold uppercase ${status.color}`}>
        {status.glyph} {status.word} {Math.round(rawPct)}% · {note}
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
                {t.monthlyBudgets.deleteConfirm}
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
    </div>
  )
}

const BUDGET_CATEGORIES = TRANSACTION_CATEGORIES.filter((c) => c !== 'income' && c !== 'savings')

function AddBudgetForm({
  userId,
  existingCategories,
  onDone,
}: {
  userId: string
  existingCategories: TransactionCategory[]
  onDone: () => void
}) {
  const { t } = useLanguage()
  const { symbol } = useCurrency()
  const available = BUDGET_CATEGORIES.filter((c) => !existingCategories.includes(c))
  const [category, setCategory] = useState<TransactionCategory>(available[0] ?? 'other')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (available.length === 0) {
    return (
      <p className="font-grotesk text-sm text-truffle-text2">
        {t.monthlyBudgets.allCategoriesHaveBudget}
      </p>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setIsLoading(true)
    try {
      const payload = { userId, category, amount: amt }

      await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      onDone()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_110px] gap-2 print-in">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as TransactionCategory)}
        aria-label={t.addTransaction.categoryLabel}
        className="field h-11"
      >
        {available.map((c) => (
          <option key={c} value={c}>
            {t.categories[c] ?? c}
          </option>
        ))}
      </select>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-text2 text-sm">
          {symbol}
        </span>
        <input
          type="number"
          inputMode="decimal"
          placeholder={t.monthlyBudgets.monthlyLimit}
          aria-label={t.monthlyBudgets.monthlyLimit}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          step="1"
          required
          className="field h-11 pl-7 font-bold"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="key key-accent key-3 h-11 col-span-2 text-xs uppercase"
      >
        {isLoading ? t.monthlyBudgets.saving : t.monthlyBudgets.setBudget}
      </button>
    </form>
  )
}
