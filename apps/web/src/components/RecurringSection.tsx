'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  detectRecurring,
  RECURRING_GROUPS,
  recurringTotals,
  type RecurringGroup,
  type RecurringItem,
  type RecurringOverride,
  type RecurringOverrides,
} from '@/lib/recurring'
import { parseLocalDay } from '@/lib/toolArgs'
import { toDateLocale } from '@/lib/date'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { truffleEase, transitionSnappy } from '@/lib/motion'
import { LeaderRow, Rule } from './Tally'

/** Colored swatch per recurring group, matching the design spec. */
const GROUP_SWATCH: Record<RecurringGroup, { bg: string; border: string }> = {
  fixed:         { bg: 'var(--t-text)',        border: 'none' },
  investing:     { bg: 'var(--t-accent)',      border: '2px solid var(--t-accent-edge)' },
  subscriptions: { bg: 'var(--t-accent-edge)', border: 'none' },
  other:         { bg: 'transparent',          border: '2px dashed var(--t-text2)' },
}

interface Tx {
  amount: number
  description: string
  merchant?: string | null
  date: string
  category: string
}

/**
 * Recurring payments, grouped as fixed costs, investing & savings plans,
 * subscriptions and other, with a monthly total. Every item can be moved to
 * another group or marked not recurring; the choice is saved per user.
 */
export function RecurringSection({ userId, transactions, viewDate }: { userId: string; transactions: Tx[]; viewDate?: Date }) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const queryClient = useQueryClient()
  const r = t.insights.recurring
  const queryKey = ['recurringOverrides', userId]
  const [editing, setEditing] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const toggleGroup = (group: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })

  const { data: overrides = {} } = useQuery({
    queryKey,
    queryFn: async (): Promise<RecurringOverrides> => {
      const res = await fetch('/api/recurring', { cache: 'no-store' })
      if (!res.ok) return {}
      return ((await res.json()).overrides ?? {}) as RecurringOverrides
    },
  })

  const items = useMemo(() => detectRecurring(transactions, viewDate ?? new Date(), overrides), [transactions, overrides, viewDate])
  const shown = items.filter((i) => !i.hidden)
  const hidden = items.filter((i) => i.hidden)
  const totals = recurringTotals(items)
  const hasPossible = shown.some((i) => i.confidence === 'possible')

  const choose = async (item: RecurringItem, choice: RecurringOverride | null) => {
    setEditing(null)
    setError(null)
    // Stop a refetch landing on top of this change; on failure undo only this item.
    await queryClient.cancelQueries({ queryKey })
    const before = queryClient.getQueryData<RecurringOverrides>(queryKey)?.[item.key]
    const setKey = (value: RecurringOverride | undefined) =>
      queryClient.setQueryData<RecurringOverrides>(queryKey, (current = {}) => {
        const next = { ...current }
        if (value === undefined) delete next[item.key]
        else next[item.key] = value
        return next
      })
    setKey(choice ?? undefined)
    try {
      const res = await fetch('/api/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: item.key, choice }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? r.error)
    } catch (e) {
      setKey(before)
      setError(e instanceof Error ? e.message : r.error)
    }
  }

  if (items.length === 0) {
    return <p className="font-grotesk text-sm text-truffle-text2">{t.insights.subsEmpty}</p>
  }

  const lastCharged = (date: string) =>
    parseLocalDay(date).toLocaleDateString(toDateLocale(locale), { day: 'numeric', month: 'short' })

  const row = (item: RecurringItem, idx: number) => (
    <motion.div
      key={item.key}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...transitionSnappy, delay: idx * 0.04 }}
      className="flex flex-col gap-1.5"
    >
      <LeaderRow
        left={
          <span>
            {item.displayName}
            <span className="block text-[11px] text-truffle-text2">
              {item.every && item.every !== 'month' && `${r.every[item.every](formatAmount(item.perCharge))} · `}
              {t.insights.detected(item.monthsDetected)} · {r.last(lastCharged(item.lastCharged))}
              {item.confidence === 'possible' && <b className="text-truffle-warning"> · ▲ {r.possible}</b>}
            </span>
          </span>
        }
        right={
          <span className="flex items-center gap-2">
            <span className={item.confidence === 'possible' ? 'text-truffle-text2' : ''}>
              {formatAmount(item.monthlyAmount)}
            </span>
            <button
              type="button"
              onClick={() => setEditing(editing === item.key ? null : item.key)}
              aria-expanded={editing === item.key}
              aria-label={r.changeFor(item.displayName)}
              className="text-[11px] font-bold uppercase underline underline-offset-2"
            >
              {r.change}
            </button>
          </span>
        }
      />
      <AnimatePresence>
        {editing === item.key && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: truffleEase }}
            style={{ overflow: 'hidden' }}
          >
            <div role="group" aria-label={r.changeFor(item.displayName)} className="flex flex-wrap gap-1.5">
              {RECURRING_GROUPS.filter((g) => g !== item.group || item.confidence === 'possible').map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => choose(item, g)}
                  className="key key-line h-9 px-3 text-[11px] uppercase"
                >
                  {g === item.group ? r.confirm : r.moveTo(r.groups[g])}
                </button>
              ))}
              <button type="button" onClick={() => choose(item, 'none')} className="key key-line h-9 px-3 text-[11px] uppercase">
                ✕ {r.notRecurring}
              </button>
              {item.overridden && (
                <button type="button" onClick={() => choose(item, null)} className="key key-plain h-9 px-3 text-[11px] uppercase">
                  {r.reset}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <div className="flex justify-between font-bold text-[15px] uppercase">
          <span>{r.total}</span>
          <span>{formatAmount(totals.total)}</span>
        </div>
        {hasPossible && <span className="text-[11px] text-truffle-text2">{r.confirmedOnly}</span>}
      </div>

      {RECURRING_GROUPS.map((group) => {
        const inGroup = shown.filter((i) => i.group === group)
        if (inGroup.length === 0) return null
        const isCollapsed = collapsed.has(group)
        return (
          <section key={group} aria-label={r.groups[group]} className="flex flex-col gap-2">
            <Rule soft />
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              aria-expanded={!isCollapsed}
              className="flex justify-between items-center text-[11px] font-bold uppercase text-truffle-text2"
            >
              <span className="flex items-center gap-2">
                <span
                  className="flex-none w-3.5 h-3.5"
                  style={{ background: GROUP_SWATCH[group].bg, border: GROUP_SWATCH[group].border, boxSizing: 'border-box' }}
                />
                {r.groups[group]}
                <span className="text-truffle-text2 font-normal">x{inGroup.length}</span>
                <motion.span
                  animate={{ rotate: isCollapsed ? -90 : 0 }}
                  transition={{ duration: 0.18, ease: truffleEase }}
                  className="inline-block text-[9px]"
                >
                  ▼
                </motion.span>
              </span>
              <span>{formatAmount(totals[group])}</span>
            </button>
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: truffleEase }}
                  style={{ overflow: 'hidden' }}
                  className="flex flex-col gap-2"
                >
                  {inGroup.map((item, i) => row(item, i))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )
      })}

      {error && (
        <p role="alert" className="text-[11px] font-bold uppercase text-truffle-negative">
          ■ {error}
        </p>
      )}

      {hidden.length > 0 && (
        <div className="flex flex-col gap-2">
          <Rule soft />
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            aria-expanded={showHidden}
            className="self-start text-[11px] font-bold uppercase text-truffle-text2"
          >
            {r.hiddenCount(hidden.length)} · {showHidden ? r.hide : r.show}
          </button>
          <AnimatePresence>
            {showHidden && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: truffleEase }}
                style={{ overflow: 'hidden' }}
                className="flex flex-col gap-2"
              >
                {hidden.map((item) => (
                  <LeaderRow
                    key={item.key}
                    className="text-truffle-text2"
                    left={item.displayName}
                    right={
                      <button
                        type="button"
                        onClick={() => choose(item, null)}
                        className="text-[11px] font-bold uppercase underline underline-offset-2"
                      >
                        {r.restore}
                      </button>
                    }
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
