'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import type { Transaction } from '@truffle/types'
import { staggerItemVariants, staggerListVariants } from '@/lib/motion'
import { SkeletonPulse } from './PageMotion'

interface TransactionListProps {
  userId: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  food_groceries: '🛒',
  food_delivery: '🍕',
  transport: '🚇',
  housing: '🏠',
  utilities: '💡',
  subscriptions: '📱',
  health: '💊',
  entertainment: '🎬',
  shopping: '🛍️',
  income: '💰',
  savings: '🏦',
  other: '📦',
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function TransactionList({ userId }: TransactionListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
  })

  const transactions: Transaction[] =
    data?.transactions?.map((row: Record<string, unknown>) => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount),
      currency: row.currency,
      description: row.description,
      category: row.category,
      merchant: row.merchant,
      date: row.date,
      isRecurring: row.is_recurring,
    })) ?? []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <SkeletonPulse key={i} className="card flex gap-3">
            <div className="w-10 h-10 bg-truffle-border rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-truffle-border rounded w-2/3" />
              <div className="h-3 bg-truffle-border rounded w-1/3" />
            </div>
            <div className="h-4 bg-truffle-border rounded w-16 flex-shrink-0" />
          </SkeletonPulse>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        className="card border-dashed text-center py-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.4, 0, 0.2, 1] }}
      >
        <p className="text-truffle-muted text-sm">No transactions yet.</p>
        <p className="text-truffle-muted text-xs mt-1">Add one below to get started.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="space-y-2"
      initial="hidden"
      animate="show"
      variants={staggerListVariants}
    >
      {transactions.map((tx) => (
        <motion.div
          key={tx.id}
          className="card flex items-center gap-3"
          variants={staggerItemVariants}
        >
          <div className="w-10 h-10 rounded-xl bg-truffle-surface flex items-center justify-center text-lg flex-shrink-0">
            {CATEGORY_EMOJI[tx.category] ?? '📦'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-truffle-text truncate">{tx.description}</p>
            <p className="text-xs text-truffle-muted">
              {formatCategory(tx.category)} ·{' '}
              {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <span
            className={`text-sm font-semibold flex-shrink-0 ${tx.amount > 0 ? 'text-truffle-green' : 'text-red-400'}`}
          >
            {tx.amount > 0 ? '+' : '-'}€{Math.abs(tx.amount).toFixed(2)}
          </span>
        </motion.div>
      ))}
    </motion.div>
  )
}
