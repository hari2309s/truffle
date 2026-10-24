'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { CategoryBudget, Transaction, SavingsGoal, HabitWithStats } from '@truffle/types'
import { truffleEase, transitionSnappy } from '@/lib/motion'
import { budgetView } from '@/lib/budgets'
import { recentPeriods } from '@/lib/habits'
import { LeaderRow } from './Tally'
import { SkeletonPulse } from './PageMotion'
import { useBudgetsQuery } from '@/hooks/useBudgetsQuery'
import { useGoalsQuery } from '@/hooks/useGoalsQuery'
import { useHabitsQuery } from '@/hooks/useHabitsQuery'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'

/* ── Budgets · Top 4 ── */

function BudgetRowCompact({
  budget,
  view,
  index,
}: {
  budget: CategoryBudget
  view: ReturnType<typeof budgetView>
  index: number
}) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const { spent, limit, pct: rawPct, status: state } = view

  const status =
    state === 'over'
      ? { glyph: '■', color: 'text-truffle-negative', fill: 'bg-truffle-negative border-truffle-negative' }
      : state === 'headsUp'
        ? { glyph: '▲', color: 'text-truffle-warning', fill: 'bg-truffle-warning border-truffle-warning' }
        : { glyph: '●', color: 'text-truffle-positive', fill: 'bg-truffle-positive border-truffle-positive' }
  const filled = Math.min(10, Math.round(rawPct / 10))
  const statusText =
    state === 'over'
      ? `${status.glyph} ${t.monthlyBudgets.statusOver} · ${t.monthlyBudgets.over(formatAmount(spent - limit))}`
      : `${status.glyph} ${Math.round(rawPct)}% · ${t.monthlyBudgets.left(formatAmount(Math.max(0, limit - spent)))}`

  return (
    <motion.div
      className="flex flex-col gap-1.5 border-t border-dashed border-truffle-border pt-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSnappy, delay: index * 0.06 }}
    >
      <LeaderRow
        left={t.categories[budget.category] ?? budget.category}
        right={
          <span>
            <b>{formatAmount(spent)}</b>
            <span className="text-truffle-text2">/{formatAmount(limit)}</span>
          </span>
        }
      />
      <div className="grid grid-cols-10 gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={i}
            initial={i < filled ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.25, ease: truffleEase, delay: i < filled ? i * 0.04 : 0 }}
            style={{ transformOrigin: 'left' }}
            className={`h-2 border ${i < filled ? status.fill : 'border-truffle-border'}`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-bold uppercase ${status.color}`}>{statusText}</span>
    </motion.div>
  )
}

export function HomeBudgets({ userId, transactions }: { userId: string; transactions: Transaction[] }) {
  const router = useRouter()
  const { t } = useLanguage()
  const { data: budgets = [], isLoading } = useBudgetsQuery(userId)

  const top4 = useMemo(() => {
    if (budgets.length === 0) return []
    return budgets
      .map((b) => ({ budget: b, view: budgetView(b, transactions) }))
      .sort((a, b) => b.view.pct - a.view.pct)
      .slice(0, 4)
  }, [budgets, transactions])

  if (isLoading) {
    return (
      <SkeletonPulse className="slip border border-truffle-border px-5 pt-4 pb-[30px] flex flex-col gap-3">
        <div className="h-3 bg-truffle-border w-1/3" />
        <div className="h-3 bg-truffle-border" />
        <div className="h-3 bg-truffle-border" />
      </SkeletonPulse>
    )
  }

  if (budgets.length === 0) return null

  return (
    <div className="slip border border-truffle-border px-5 pt-4 pb-[30px] flex flex-col gap-1">
      <div className="flex justify-between items-baseline pb-1.5">
        <span className="text-[11px] font-bold tracking-[.1em]">
          {t.insights.budgetsTitle.toUpperCase()} · TOP {Math.min(4, budgets.length)}
        </span>
        <button
          type="button"
          onClick={() => router.push('/insights')}
          className="text-[11px] font-bold tracking-[.1em] text-truffle-accent-ink"
        >
          SEE ALL →
        </button>
      </div>
      {top4.map(({ budget, view }, i) => (
        <BudgetRowCompact key={budget.id} budget={budget} view={view} index={i} />
      ))}
    </div>
  )
}

/* ── Savings Goals ── */

const GOAL_SEGMENTS = 20

function GoalRowCompact({ goal, index }: { goal: SavingsGoal; index: number }) {
  const { formatAmount } = useCurrency()
  const { t } = useLanguage()
  const progress = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
  const filledSegs = Math.round((progress / 100) * GOAL_SEGMENTS)
  const done = goal.savedAmount >= goal.targetAmount

  return (
    <motion.div
      className="flex flex-col gap-2 border-t border-dashed border-truffle-border pt-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSnappy, delay: index * 0.06 }}
    >
      <div className="flex justify-between items-baseline gap-2">
        <span className="font-grotesk text-[19px] font-medium">
          {goal.emoji} {goal.name}
        </span>
        <span className="text-xs font-bold text-truffle-accent-ink">{Math.round(progress)}%</span>
      </div>
      <div className="grid grid-cols-[repeat(20,1fr)] gap-0.5">
        {Array.from({ length: GOAL_SEGMENTS }, (_, i) => (
          <motion.div
            key={i}
            initial={i < filledSegs ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.25, ease: truffleEase, delay: i < filledSegs ? i * 0.03 : 0 }}
            style={{ transformOrigin: 'left' }}
            className={`h-3 border ${
              i < filledSegs
                ? done
                  ? 'bg-truffle-positive border-truffle-positive'
                  : 'bg-truffle-accent border-truffle-accent-edge'
                : 'border-truffle-border'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <LeaderRow
          className="flex-1 min-w-[220px] text-[13px]"
          left={goal.deadline
            ? new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
            : 'No deadline'}
          right={
            <span>
              <b>{formatAmount(goal.savedAmount)}</b>
              <span className="text-truffle-text2">/{formatAmount(goal.targetAmount)}</span>
            </span>
          }
        />
      </div>
    </motion.div>
  )
}

export function HomeSavingsGoals({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const { data: goals = [], isLoading } = useGoalsQuery(userId)

  if (isLoading) {
    return (
      <SkeletonPulse className="slip border border-truffle-border px-5 pt-4 pb-[30px] flex flex-col gap-3">
        <div className="h-3 bg-truffle-border w-1/3" />
        <div className="h-4 bg-truffle-border w-2/3" />
        <div className="h-3 bg-truffle-border" />
      </SkeletonPulse>
    )
  }

  if (goals.length === 0) return null

  return (
    <div className="slip border border-truffle-border px-5 pt-4 pb-[30px] flex flex-col gap-3.5">
      <span className="text-[11px] font-bold tracking-[.1em]">
        {t.savingsGoals.title.toUpperCase()}
      </span>
      {goals.map((goal, i) => (
        <GoalRowCompact key={goal.id} goal={goal} index={i} />
      ))}
    </div>
  )
}

/* ── Saving Habits ── */

const HABIT_DOTS = 8

function HabitRowCompact({ habit, index }: { habit: HabitWithStats; index: number }) {
  const { t } = useLanguage()
  const logged = new Set((habit.history ?? []).map((c) => c.period))
  const periods = recentPeriods(habit.frequency, HABIT_DOTS)
  const isDone = habit.currentPeriodLogged

  return (
    <motion.div
      className="flex items-center gap-3 border-t border-dashed border-truffle-border pt-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSnappy, delay: index * 0.06 }}
    >
      <div
        className={`flex-none w-11 h-11 rounded-lg grid place-items-center text-lg font-bold ${
          isDone
            ? 'bg-truffle-accent border-2 border-truffle-accent-edge shadow-[0_4px_0_var(--t-accent-edge)] text-[#302e2b]'
            : 'bg-truffle-card border-2 border-truffle-text shadow-[0_4px_0_var(--t-border)]'
        }`}
      >
        {isDone ? '✓' : habit.emoji}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
        <span className="font-grotesk text-[15px] font-medium truncate">{habit.name}</span>
        <div className="flex items-center gap-2">
          <span className="flex gap-[3px]">
            {periods.map((p) => (
              <span
                key={p}
                className={`w-[11px] h-[11px] border-2 ${
                  logged.has(p) ? 'bg-truffle-accent border-truffle-accent-edge' : 'border-truffle-border'
                }`}
              />
            ))}
          </span>
          <span className="text-[10px] font-bold text-truffle-accent-ink whitespace-nowrap">
            ✦ {habit.streak} {habit.frequency === 'weekly' ? t.savingsHabits.periodWeek : t.savingsHabits.periodMonth}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function HomeSavingsHabits({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const { data: habits = [], isLoading } = useHabitsQuery(userId)

  if (isLoading) {
    return (
      <SkeletonPulse className="slip border border-truffle-border px-5 pt-4 pb-[30px] flex flex-col gap-3">
        <div className="h-3 bg-truffle-border w-1/3" />
        <div className="flex gap-3">
          <div className="w-11 h-11 bg-truffle-border rounded-lg" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-4 bg-truffle-border w-2/3" />
            <div className="h-3 bg-truffle-border w-1/2" />
          </div>
        </div>
      </SkeletonPulse>
    )
  }

  if (habits.length === 0) return null

  return (
    <div className="slip border border-truffle-border px-5 pt-4 pb-[30px] flex flex-col gap-3">
      <span className="text-[11px] font-bold tracking-[.1em]">
        {t.insights.savingHabits.toUpperCase()}
      </span>
      {habits.map((habit, i) => (
        <HabitRowCompact key={habit.id} habit={habit} index={i} />
      ))}
    </div>
  )
}
