'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import type { Transaction } from '@truffle/types'
import { staggerItemVariants, staggerListVariants } from '@/lib/motion'
import { SkeletonPulse } from './PageMotion'
import { offlineDb, mapTransactionRow } from '@/lib/offline-db'
import { CATEGORY_EMOJI, formatCategory } from '@/lib/categories'
import { useTransactionFilters } from '@/hooks/useTransactionFilters'
import { TransactionFilterPanel } from './TransactionFilterPanel'

interface TransactionListProps {
  userId: string
}

export function TransactionList({ userId }: TransactionListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/transactions?userId=${userId}`)
        if (!res.ok) throw new Error('Failed to fetch transactions')
        const json = await res.json()
        const transactions: Transaction[] = (json.transactions ?? []).map(mapTransactionRow)
        await offlineDb.transactions.bulkPut(transactions)
        return { transactions, fromCache: false }
      } catch {
        const cached = await offlineDb.transactions.where('userId').equals(userId).toArray()
        cached.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        return { transactions: cached, fromCache: true }
      }
    },
    networkMode: 'always',
  })

  const allTransactions = data?.transactions ?? []
  const fromCache = data?.fromCache ?? false

  const filters = useTransactionFilters(allTransactions)
  const { filtered, isFiltered, clearFilters } = filters

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

  if (allTransactions.length === 0) {
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
    <div className="space-y-3">
      {fromCache && <p className="text-xs text-truffle-muted text-center">Showing cached data</p>}

      <TransactionFilterPanel {...filters} />

      {/* Result count + clear */}
      {isFiltered && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-truffle-muted">
            {filtered.length} of {allTransactions.length} transactions
          </p>
          <button
            onClick={clearFilters}
            className="text-xs text-truffle-muted hover:text-truffle-text underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* List */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            className="card border-dashed text-center py-6"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-truffle-muted text-sm">No matching transactions.</p>
          </motion.div>
        ) : (
          <motion.div
            key={`list-${filtered.length}`}
            className="space-y-2"
            initial="hidden"
            animate="show"
            variants={staggerListVariants}
          >
            {filtered.map((tx) => (
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
                    {new Date(tx.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
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
        )}
      </AnimatePresence>
    </div>
  )
}
