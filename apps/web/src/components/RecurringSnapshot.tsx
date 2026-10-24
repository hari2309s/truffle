'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { detectRecurring, recurringTotals, type RecurringGroup } from '@/lib/recurring'
import { useQuery } from '@tanstack/react-query'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { transitionSnappy } from '@/lib/motion'
import type { RecurringOverrides } from '@/lib/recurring'

const GROUP_SWATCH: Record<RecurringGroup, { bg: string; border: string }> = {
  fixed:         { bg: 'var(--t-text)',        border: 'none' },
  investing:     { bg: 'var(--t-accent)',      border: 'none' },
  subscriptions: { bg: 'var(--t-accent-edge)', border: 'none' },
  other:         { bg: 'transparent',          border: '1px dashed var(--t-text2)' },
}

const ACTIVE_GROUPS: RecurringGroup[] = ['fixed', 'investing', 'subscriptions', 'other']

interface Tx {
  amount: number
  description: string
  merchant?: string | null
  date: string
  category: string
}

/** Compact recurring monthly snapshot card for the Home page 2x2 grid. */
export function RecurringSnapshot({ userId, transactions }: { userId: string; transactions: Tx[] }) {
  const { formatAmount } = useCurrency()
  const { t } = useLanguage()
  const r = t.insights.recurring

  const { data: overrides = {} } = useQuery({
    queryKey: ['recurringOverrides', userId],
    queryFn: async (): Promise<RecurringOverrides> => {
      const res = await fetch('/api/recurring', { cache: 'no-store' })
      if (!res.ok) return {}
      return ((await res.json()).overrides ?? {}) as RecurringOverrides
    },
  })

  const items = useMemo(
    () => detectRecurring(transactions, new Date(), overrides),
    [transactions, overrides]
  )
  const totals = recurringTotals(items)

  const activeGroups = ACTIVE_GROUPS.filter((g) => totals[g] > 0)

  if (totals.total === 0) return null

  return (
    <motion.div
      className="bg-truffle-card border border-truffle-border px-[18px] pt-4 pb-[18px] flex flex-col gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSnappy, delay: 0.2 }}
    >
      <span className="text-[11px] font-bold tracking-[.1em]">
        {r.groups.fixed ? 'RECURRING · MONTHLY' : 'RECURRING · MONTHLY'}
      </span>

      <span className="font-grotesk text-[28px] font-bold tracking-[-.02em] leading-none tabular-nums">
        {formatAmount(totals.total)}
      </span>

      {/* Proportional bar */}
      <div className="flex gap-0.5 h-2.5">
        {activeGroups.map((group, i) => (
          <motion.div
            key={group}
            style={{
              flex: totals[group],
              minWidth: 4,
              background: GROUP_SWATCH[group].bg,
              border: GROUP_SWATCH[group].border,
              boxSizing: 'border-box',
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3, delay: 0.26 + i * 0.025, ease: 'easeOut' }}
            className="origin-left"
          />
        ))}
      </div>

      {/* 2x2 legend */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-bold tracking-[.04em]">
        {activeGroups.map((group) => (
          <span key={group} className="flex items-center gap-[5px]">
            <i
              className="flex-none w-[9px] h-[9px]"
              style={{
                background: GROUP_SWATCH[group].bg,
                border: GROUP_SWATCH[group].border,
                boxSizing: 'border-box',
              }}
            />
            {r.groups[group].split(' ')[0]?.toUpperCase() ?? r.groups[group].toUpperCase()}{' '}
            {formatAmount(totals[group])}
          </span>
        ))}
      </div>

      <Link
        href="/insights#recurring"
        className="text-[11px] font-bold text-truffle-accent-ink"
      >
        See details →
      </Link>
    </motion.div>
  )
}
