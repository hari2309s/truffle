'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { staggerItemVariants, staggerListVariants } from '@/lib/motion'
import { SkeletonPulse } from './PageMotion'
import { CATEGORY_EMOJI, formatCategory } from '@/lib/categories'
import { useTransactionFilters } from '@/hooks/useTransactionFilters'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { TransactionFilterPanel } from './TransactionFilterPanel'
import type { Transaction } from '@truffle/types'

function exportToCSV(transactions: Transaction[]) {
  const header = ['Date', 'Description', 'Category', 'Merchant', 'Amount', 'Currency']
  const rows = transactions.map((tx) => [
    tx.date,
    `"${tx.description.replace(/"/g, '""')}"`,
    formatCategory(tx.category),
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

export function TransactionList({ userId }: TransactionListProps) {
  const { data, isLoading } = useTransactionsQuery(userId)

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

      {/* Count row — always shown when there are transactions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-truffle-muted">
          {isFiltered
            ? `${filtered.length} of ${allTransactions.length} transactions`
            : `${allTransactions.length} transactions`}
        </p>
        <div className="flex items-center gap-3">
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="text-xs text-truffle-muted hover:text-truffle-text underline underline-offset-2"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => exportToCSV(filtered)}
            className="text-xs text-truffle-amber hover:text-truffle-amber-light transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

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
