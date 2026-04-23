'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CategoryBudget, Transaction, TransactionCategory } from '@truffle/types'
import { TRANSACTION_CATEGORIES } from '@truffle/types'
import { CATEGORY_EMOJI, formatCategory } from '@/lib/categories'
import { offlineDb, registerBackgroundSync } from '@/lib/offline-db'
import { SkeletonPulse } from './PageMotion'

interface MonthlyBudgetsProps {
  userId: string
  transactions: Transaction[]
  addBudgetOpen?: boolean
  onAddBudgetOpenChange?: (open: boolean) => void
}

function mapBudget(row: Record<string, unknown>): CategoryBudget {
  return {
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    category: row.category as TransactionCategory,
    amount: Number(row.amount),
    createdAt: (row.created_at ?? row.createdAt) as string,
  }
}

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}

/** Compute how much was spent in a given category this calendar month. */
function spentThisMonth(transactions: Transaction[], category: TransactionCategory): number {
  const prefix = currentYearMonth()
  return transactions
    .filter((tx) => tx.amount < 0 && tx.category === category && tx.date.startsWith(prefix))
    .reduce((s, tx) => s + Math.abs(tx.amount), 0)
}

export function MonthlyBudgets({
  userId,
  transactions,
  addBudgetOpen,
  onAddBudgetOpenChange,
}: MonthlyBudgetsProps) {
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/budgets?userId=${userId}`)
        if (!res.ok) throw new Error('Failed to fetch budgets')
        const json = await res.json()
        const mapped: CategoryBudget[] = (json.budgets ?? []).map(mapBudget)
        await offlineDb.budgets.bulkPut(mapped)
        return mapped
      } catch {
        return offlineDb.budgets.where('userId').equals(userId).toArray()
      }
    },
    networkMode: 'always',
  })

  const handleDelete = async (budgetId: string) => {
    setDeletingId(budgetId)
    try {
      if (!navigator.onLine) {
        await offlineDb.budgets.delete(budgetId)
        await offlineDb.queuedActions.add({
          type: 'delete_budget',
          payload: { userId, budgetId },
          createdAt: Date.now(),
        })
        await registerBackgroundSync()
        await queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
        return
      }
      await fetch(`/api/budgets?userId=${userId}&budgetId=${budgetId}`, { method: 'DELETE' })
      await queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
    } finally {
      setDeletingId(null)
    }
  }

  const showAdd = Boolean(addBudgetOpen)

  return (
    <>
      {showAdd && (
        <AddBudgetForm
          userId={userId}
          existingCategories={budgets.map((b) => b.category)}
          onDone={() => {
            onAddBudgetOpenChange?.(false)
            queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
          }}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <SkeletonPulse key={i} className="card h-16" />
          ))}
        </div>
      ) : budgets.length === 0 && !showAdd ? (
        <div className="card border-dashed text-center text-truffle-muted text-sm py-6">
          No budgets yet — set one to track category spending
        </div>
      ) : (
        <div className="space-y-2">
          {budgets.map((budget) => {
            const spent = spentThisMonth(transactions, budget.category)
            return (
              <BudgetCard
                key={budget.id}
                budget={budget}
                spent={spent}
                onDelete={() => handleDelete(budget.id)}
                isDeleting={deletingId === budget.id}
              />
            )
          })}
        </div>
      )}
    </>
  )
}

function BudgetCard({
  budget,
  spent,
  onDelete,
  isDeleting,
}: {
  budget: CategoryBudget
  spent: number
  onDelete: () => void
  isDeleting: boolean
}) {
  const pct = Math.min(100, budget.amount > 0 ? (spent / budget.amount) * 100 : 0)
  const remaining = Math.max(0, budget.amount - spent)
  const isOver = spent > budget.amount

  const barColor = isOver ? 'bg-truffle-red' : pct >= 80 ? 'bg-truffle-amber' : 'bg-truffle-green'

  const amountColor = isOver
    ? 'text-red-400'
    : pct >= 80
      ? 'text-truffle-amber'
      : 'text-truffle-text-secondary'

  return (
    <div
      className={`card space-y-2 transition-opacity ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{CATEGORY_EMOJI[budget.category]}</span>
          <div>
            <p className="text-sm font-medium text-truffle-text">
              {formatCategory(budget.category)}
            </p>
            <p className="text-xs text-truffle-muted">
              {isOver
                ? `€${(spent - budget.amount).toFixed(0)} over`
                : `€${remaining.toFixed(0)} left`}{' '}
              · budget €{budget.amount.toFixed(0)}/mo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold tabular-nums ${amountColor}`}>
            €{spent.toFixed(0)}
          </span>
          <button
            onClick={onDelete}
            className="text-truffle-muted hover:text-truffle-red transition-colors text-xs"
            aria-label="Remove budget"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="h-1.5 bg-truffle-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Spendable categories (exclude income / savings which aren't expenses)
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
  const queryClient = useQueryClient()
  const available = BUDGET_CATEGORIES.filter((c) => !existingCategories.includes(c))
  const [category, setCategory] = useState<TransactionCategory>(available[0] ?? 'other')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (available.length === 0) {
    return (
      <div className="card border-dashed text-center text-truffle-muted text-sm py-4 mb-2">
        All spendable categories already have a budget.
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setIsLoading(true)
    try {
      const payload = { userId, category, amount: amt }

      if (!navigator.onLine) {
        const optimistic: CategoryBudget = {
          id: crypto.randomUUID(),
          userId,
          category,
          amount: amt,
          createdAt: new Date().toISOString(),
        }
        await offlineDb.budgets.put(optimistic)
        await offlineDb.queuedActions.add({
          type: 'upsert_budget',
          payload,
          createdAt: Date.now(),
        })
        await registerBackgroundSync()
        await queryClient.invalidateQueries({ queryKey: ['budgets', userId] })
        onDone()
        return
      }

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
    <form onSubmit={handleSubmit} className="card space-y-3 mb-2">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as TransactionCategory)}
        className="w-full bg-truffle-surface border border-truffle-border rounded-xl px-4 py-3 text-sm text-truffle-text focus:outline-none focus:border-truffle-amber"
      >
        {available.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_EMOJI[c]} {formatCategory(c)}
          </option>
        ))}
      </select>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-muted text-sm">
          €
        </span>
        <input
          type="number"
          placeholder="Monthly limit"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          step="1"
          required
          className="w-full bg-truffle-surface border border-truffle-border rounded-xl pl-7 pr-4 py-3 text-sm text-truffle-text placeholder-truffle-muted focus:outline-none focus:border-truffle-amber"
        />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
        {isLoading ? 'Saving…' : 'Set budget'}
      </button>
    </form>
  )
}
