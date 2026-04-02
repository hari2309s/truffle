'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SavingsGoal } from '@truffle/types'

const GOAL_EMOJIS = ['🎯', '✈️', '🏠', '🚗', '💻', '🎓', '💍', '🏖️', '🎸', '📱', '🏋️', '🌍']

interface SavingsGoalsProps {
  userId: string
}

export function SavingsGoals({ userId }: SavingsGoalsProps) {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['goals', userId],
    queryFn: async () => {
      const res = await fetch(`/api/goals?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch goals')
      return res.json() as Promise<{ goals: SavingsGoal[] }>
    },
  })

  const goals = (data?.goals ?? []).map((g) => ({
    ...g,
    targetAmount: Number(
      g.targetAmount ?? (g as unknown as Record<string, unknown>)['target_amount']
    ),
    savedAmount: Number(g.savedAmount ?? (g as unknown as Record<string, unknown>)['saved_amount']),
  }))

  const handleAddFunds = async (goalId: string, current: number, amount: number) => {
    const newAmount = Math.min(
      current + amount,
      goals.find((g) => g.id === goalId)?.targetAmount ?? Infinity
    )
    await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, goalId, savedAmount: newAmount }),
    })
    await queryClient.invalidateQueries({ queryKey: ['goals', userId] })
  }

  const handleDelete = async (goalId: string) => {
    await fetch(`/api/goals?userId=${userId}&goalId=${goalId}`, { method: 'DELETE' })
    await queryClient.invalidateQueries({ queryKey: ['goals', userId] })
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-truffle-text-secondary uppercase tracking-wide">
          Savings Goals
        </h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs text-truffle-amber hover:text-truffle-amber-light transition-colors"
        >
          {showAdd ? 'Cancel' : '+ New goal'}
        </button>
      </div>

      {showAdd && (
        <AddGoalForm
          userId={userId}
          onDone={() => {
            setShowAdd(false)
            queryClient.invalidateQueries({ queryKey: ['goals', userId] })
          }}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : goals.length === 0 && !showAdd ? (
        <div className="card border-dashed text-center text-truffle-muted text-sm py-6">
          No goals yet — set one to start saving towards something
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddFunds={(amount) => handleAddFunds(goal.id, goal.savedAmount, amount)}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function GoalCard({
  goal,
  onAddFunds,
  onDelete,
}: {
  goal: SavingsGoal
  onAddFunds: (amount: number) => void
  onDelete: () => void
}) {
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')

  const progress = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount)
  const done = goal.savedAmount >= goal.targetAmount

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.emoji}</span>
          <div>
            <p className="font-medium text-truffle-text text-sm">{goal.name}</p>
            <p className="text-xs text-truffle-muted">
              €{goal.savedAmount.toFixed(0)} / €{goal.targetAmount.toFixed(0)}
              {daysLeft !== null && daysLeft > 0 && ` · ${daysLeft}d left`}
              {daysLeft !== null && daysLeft <= 0 && ' · deadline passed'}
            </p>
          </div>
        </div>
        {done ? (
          <span className="text-xs text-truffle-green font-medium">Complete!</span>
        ) : (
          <button
            onClick={onDelete}
            className="text-truffle-muted hover:text-truffle-red transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-truffle-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-truffle-green' : 'bg-truffle-amber'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {!done && (
        <>
          {showDeposit ? (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={`€0 — €${remaining.toFixed(0)} remaining`}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0"
                step="0.01"
                className="flex-1 bg-truffle-surface border border-truffle-border rounded-xl px-3 py-2 text-sm text-truffle-text placeholder-truffle-muted focus:outline-none focus:border-truffle-amber"
              />
              <button
                onClick={() => {
                  const amt = parseFloat(depositAmount)
                  if (amt > 0) {
                    onAddFunds(amt)
                    setDepositAmount('')
                    setShowDeposit(false)
                  }
                }}
                className="btn-primary text-xs px-3 py-2"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeposit(true)}
              className="text-xs text-truffle-amber hover:text-truffle-amber-light transition-colors"
            >
              + Add funds
            </button>
          )}
        </>
      )}
    </div>
  )
}

function AddGoalForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    emoji: '🎯',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.targetAmount) return
    setIsLoading(true)
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: form.name,
          targetAmount: parseFloat(form.targetAmount),
          deadline: form.deadline || undefined,
          emoji: form.emoji,
        }),
      })
      onDone()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3 mb-3">
      <div className="flex gap-2 flex-wrap">
        {GOAL_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setForm((f) => ({ ...f, emoji: e }))}
            className={`text-xl p-1 rounded-lg transition-all ${form.emoji === e ? 'bg-truffle-amber/20 ring-1 ring-truffle-amber' : 'hover:bg-truffle-surface'}`}
          >
            {e}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Goal name (e.g. Amsterdam trip)"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
            placeholder="Target amount"
            value={form.targetAmount}
            onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
            min="1"
            step="0.01"
            className="w-full bg-truffle-surface border border-truffle-border rounded-xl pl-7 pr-4 py-3 text-sm text-truffle-text placeholder-truffle-muted focus:outline-none focus:border-truffle-amber"
            required
          />
        </div>
        <input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          className="bg-truffle-surface border border-truffle-border rounded-xl px-3 py-3 text-sm text-truffle-text focus:outline-none focus:border-truffle-amber"
        />
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-50">
        {isLoading ? 'Creating…' : 'Create goal'}
      </button>
    </form>
  )
}
