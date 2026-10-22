'use client'

import type { GoalPlan } from '@/lib/goalPlan'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'

/**
 * A goal's status in the budgets' vocabulary (● on track, ▲ behind,
 * ■ deadline passed) followed by the monthly amount still needed.
 * Nothing for a goal with no deadline or one already reached.
 */
export function GoalStatus({ plan, className = '' }: { plan: GoalPlan; className?: string }) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const s = t.savingsGoals

  const state =
    plan.status === 'onTrack'
      ? { glyph: '●', word: s.statusOnTrack, color: 'text-truffle-positive' }
      : plan.status === 'behind'
        ? { glyph: '▲', word: s.statusBehind(formatAmount(plan.shortBy)), color: 'text-truffle-warning' }
        : plan.status === 'overdue'
          ? { glyph: '■', word: s.statusOverdue, color: 'text-truffle-negative' }
          : null
  if (!state) return null

  return (
    <span className={`text-[11px] uppercase ${className}`}>
      <b className={state.color}>
        {state.glyph} {state.word}
      </b>
      {plan.perMonth !== null && (
        <span className="text-truffle-text2"> · {s.perMonth(formatAmount(plan.perMonth))}</span>
      )}
    </span>
  )
}
