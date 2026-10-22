'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueries, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { SkeletonPulse } from './PageMotion'
import { useTransactionFilters } from '@/hooks/useTransactionFilters'
import {
  monthTransactionsQuery,
  useTransactionsQuery,
  type TransactionsResult,
} from '@/hooks/useTransactionsQuery'
import { TransactionFilterPanel } from './TransactionFilterPanel'
import { LeaderRow, MINUS } from './Tally'
import { exportToCSV } from '@/lib/exportCsv'
import type { Transaction } from '@truffle/types'
import { EditForm, type EditFocus } from './TransactionEditForm'
import { TransactionDetailSheet } from './TransactionDetailSheet'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'

/**
 * Merges the older-month queries. Module-level so its reference is stable —
 * TanStack re-runs `combine` whenever the function identity changes.
 */
function combineOlderMonths(results: UseQueryResult<TransactionsResult>[]) {
  return {
    transactions: results.flatMap((r) => r.data?.transactions ?? []),
    loading: results.some((r) => r.isLoading),
    // Whether anything exists before the oldest month loaded so far.
    hasOlder: results.length ? (results[results.length - 1]?.data?.hasOlder ?? true) : null,
  }
}

interface TransactionListProps {
  userId: string
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
  const [detail, setDetail] = useState<Transaction | null>(null)

  const [visibleMonthCount, setVisibleMonthCount] = useState(1)

  const cutoffDate = useMemo(() => {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() - (visibleMonthCount - 1), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }, [visibleMonthCount])

  // Months the user has paged back to beyond the default 12-month window are
  // fetched one at a time from the server.
  const windowFrom = data?.from ?? null
  const olderMonths = useMemo(() => {
    if (!windowFrom || cutoffDate >= windowFrom) return []
    const months: string[] = []
    const [y, m] = windowFrom.split('-').map(Number)
    for (let d = new Date(y!, m! - 2, 1); ; d = new Date(d.getFullYear(), d.getMonth() - 1, 1)) {
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (`${ym}-01` < cutoffDate) break
      months.push(ym)
    }
    return months
  }, [windowFrom, cutoffDate])
  const older = useQueries({
    queries: olderMonths.map((month) => monthTransactionsQuery(userId, month)),
    combine: combineOlderMonths,
  })

  const allTransactions = useMemo(
    () => [...(data?.transactions ?? []), ...older.transactions],
    [data?.transactions, older.transactions]
  )
  const loadingOlder = older.loading

  const filters = useTransactionFilters(allTransactions)
  const { filtered, isFiltered, clearFilters } = filters

  const windowed = useMemo(
    () => allTransactions.filter((tx) => tx.date >= cutoffDate),
    [allTransactions, cutoffDate]
  )

  const hasMore = useMemo(() => {
    if (isFiltered) return false
    if (allTransactions.some((tx) => tx.date < cutoffDate)) return true
    return older.hasOlder ?? Boolean(data?.hasOlder)
  }, [isFiltered, allTransactions, cutoffDate, older.hasOlder, data?.hasOlder])

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
        isFiltered && filters.search.trim() ? (
          <div className="slip-sm print-in mt-1 px-4 pt-4 pb-[26px] flex flex-col gap-1.5 text-[13px] bg-truffle-surface">
            <LeaderRow
              left={t.transactions.matchesFor(filters.search.trim())}
              right={<b>0</b>}
            />
            <p className="m-0 font-grotesk text-sm leading-[1.45] text-truffle-text2">
              {t.transactions.noMatchesHint}
            </p>
          </div>
        ) : (
          <p className="rule-soft py-3 font-grotesk text-sm text-truffle-text2">
            {isFiltered ? t.transactions.noMatching : t.transactions.noThisMonth}
          </p>
        )
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
                        <div className="flex flex-col gap-2 pt-2.5">
                        <div className="grid grid-cols-3 gap-1.5">
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
                          <button
                            type="button"
                            onClick={() => setDetail(tx)}
                            className="self-start min-h-8 text-[11px] font-bold uppercase underline underline-offset-2"
                          >
                            {t.entryDetail.view} →
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
          {loadingOlder ? t.transactions.loadingMonth : t.transactions.loadMonth(nextMonthLabel)}
        </button>
      )}
      <AnimatePresence>
        {detail && (
          <TransactionDetailSheet
            key={detail.id}
            tx={detail}
            userId={userId}
            onClose={() => {
              setDetail(null)
              setOpenId(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
