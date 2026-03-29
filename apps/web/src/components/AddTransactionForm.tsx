'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TransactionCategory } from '@truffle/types'

const CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'food_groceries', label: '🛒 Groceries' },
  { value: 'food_delivery', label: '🍕 Food Delivery' },
  { value: 'transport', label: '🚇 Transport' },
  { value: 'housing', label: '🏠 Housing' },
  { value: 'utilities', label: '💡 Utilities' },
  { value: 'subscriptions', label: '📱 Subscriptions' },
  { value: 'health', label: '💊 Health' },
  { value: 'entertainment', label: '🎬 Entertainment' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'income', label: '💰 Income' },
  { value: 'savings', label: '🏦 Savings' },
  { value: 'other', label: '📦 Other' },
]

interface AddTransactionFormProps {
  userId: string
  onClose?: () => void
}

export function AddTransactionForm({ userId, onClose }: AddTransactionFormProps) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'other' as TransactionCategory,
    date: new Date().toISOString().slice(0, 10),
    merchant: '',
    isExpense: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description || !form.amount) return

    setIsLoading(true)
    try {
      const amount = parseFloat(form.amount) * (form.isExpense ? -1 : 1)
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          transactions: [
            {
              description: form.description,
              amount,
              currency: 'EUR',
              category: form.category,
              date: form.date,
              merchant: form.merchant || undefined,
              isRecurring: false,
              userId,
            },
          ],
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      await queryClient.invalidateQueries({ queryKey: ['transactions', userId] })
      await queryClient.invalidateQueries({ queryKey: ['insights', userId] })

      setForm({
        description: '',
        amount: '',
        category: 'other',
        date: new Date().toISOString().slice(0, 10),
        merchant: '',
        isExpense: true,
      })
      onClose?.()
    } catch (err) {
      console.error('Failed to add transaction:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h3 className="font-semibold text-truffle-text">Add Transaction</h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, isExpense: true }))}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            form.isExpense
              ? 'bg-truffle-amber text-truffle-bg'
              : 'bg-truffle-surface text-truffle-muted'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, isExpense: false }))}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            !form.isExpense
              ? 'bg-truffle-green text-truffle-bg'
              : 'bg-truffle-surface text-truffle-muted'
          }`}
        >
          Income
        </button>
      </div>

      <input
        type="text"
        placeholder="Description (e.g. Coffee at Rewe)"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className="w-full bg-truffle-surface border border-truffle-border rounded-xl px-4 py-3 text-sm text-truffle-text placeholder-truffle-muted focus:outline-none focus:border-truffle-amber"
        required
      />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-truffle-muted text-sm">
            €
          </span>
          <input
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            step="0.01"
            min="0"
            className="w-full bg-truffle-surface border border-truffle-border rounded-xl pl-7 pr-4 py-3 text-sm text-truffle-text placeholder-truffle-muted focus:outline-none focus:border-truffle-amber"
            required
          />
        </div>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="bg-truffle-surface border border-truffle-border rounded-xl px-3 py-3 text-sm text-truffle-text focus:outline-none focus:border-truffle-amber"
        />
      </div>

      <select
        value={form.category}
        onChange={(e) =>
          setForm((f) => ({ ...f, category: e.target.value as TransactionCategory }))
        }
        className="w-full bg-truffle-surface border border-truffle-border rounded-xl px-4 py-3 text-sm text-truffle-text focus:outline-none focus:border-truffle-amber"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Add Transaction'}
      </button>
    </form>
  )
}
