'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { setChatHandoff } from '@/lib/chatHandoff'
import type { Anomaly, HabitWithStats, SavingsGoal, Transaction } from '@truffle/types'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { computeStatement } from '@/lib/forecast'
import { truffleEase, transitionSnappy } from '@/lib/motion'
import { RecurringSection } from './RecurringSection'
import { PageEnter, SkeletonPulse } from './PageMotion'
import { SavingsGoalsEmbedded } from './SavingsGoals'
import { SavingsHabits } from './SavingsHabits'
import { SpendingHeatmap } from './SpendingHeatmap'
import { MonthlyBudgets } from './MonthlyBudgets'
import { AppShell } from './AppShell'
import { ErrorBoundary } from './ErrorBoundary'
import { LeaderRow, MINUS, Rule } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { SectionAddFormProvider, useSectionAddForm } from '@/contexts/SectionAddFormContext'
import { toDateLocale } from '@/lib/date'
import { goalPlan } from '@/lib/goalPlan'
import { useGoalsQuery } from '@/hooks/useGoalsQuery'
import { useHabitsQuery } from '@/hooks/useHabitsQuery'

interface InsightsPageProps {
  userId: string
}

/* ── Chapter keys: four numbered sections ── */

const CHAPTERS = ['review', 'spending', 'building', 'recurring'] as const
type Chapter = (typeof CHAPTERS)[number]

const chapterId = (ch: Chapter) => `insights-${ch}`

/** The route returns raw rows (snake_case); the UI works with `Anomaly`. */
function mapAnomaly(row: Record<string, unknown>): Anomaly {
  return {
    id: row.id as string,
    transactionId: (row.transaction_id ?? row.transactionId) as string,
    type: row.type as Anomaly['type'],
    severity: row.severity as Anomaly['severity'],
    description: row.description as string,
    detectedAt: (row.detected_at ?? row.detectedAt) as string,
  }
}

/**
 * Insights — redesigned as four numbered chapters:
 *   01 Review, 02 Spending (calendar + budgets), 03 Building (goals + habits),
 *   04 Recurring.  A hero KPI slip opens the page.
 */
export function InsightsPage({ userId }: InsightsPageProps) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const mainRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState<Chapter>('review')
  const [scrollPct, setScrollPct] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  const now = useMemo(() => new Date(), [])
  const viewDate = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    return d
  }, [now, monthOffset])
  const viewYM = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`
  const isCurrentMonth = monthOffset === 0

  const { data: txData, isLoading } = useTransactionsQuery(userId)
  const { data: goalsData } = useGoalsQuery(userId)
  const { data: habitsData } = useHabitsQuery(userId)

  const { data: anomalyData, isLoading: anomalyLoading } = useQuery({
    queryKey: ['anomalies', userId, viewYM],
    queryFn: async () => {
      const res = await fetch(`/api/insights?month=${viewYM}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch anomalies')
      const json = await res.json()
      return ((json.anomalies ?? []) as Record<string, unknown>[]).map(mapAnomaly)
    },
  })

  const transactions = useMemo(() => txData?.transactions ?? [], [txData])
  const anomalies = anomalyData ?? []
  const goals = goalsData ?? []
  const habits = habitsData ?? []

  const statement = useMemo(
    () => computeStatement(transactions, isCurrentMonth ? new Date() : new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)),
    [transactions, viewDate, isCurrentMonth]
  )

  // Scroll-spy: track which chapter's heading has scrolled past the sticky nav.
  useEffect(() => {
    const root = mainRef.current
    if (!root) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rootTop = root.getBoundingClientRect().top
        let current: Chapter = CHAPTERS[0]
        for (const ch of CHAPTERS) {
          const el = document.getElementById(chapterId(ch))
          if (el && el.getBoundingClientRect().top - rootTop <= 160) current = ch
        }
        if (root.scrollTop + root.clientHeight >= root.scrollHeight - 2) {
          current = 'recurring'
        }
        setActive(current)
        const pct =
          root.scrollHeight > root.clientHeight
            ? root.scrollTop / (root.scrollHeight - root.clientHeight)
            : 0
        setScrollPct(pct)
      })
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const jumpTo = useCallback((ch: Chapter) => {
    document.getElementById(chapterId(ch))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const dateLocale = toDateLocale(locale)
  const { monthLabel, dayOfMonth, daysInMonth, lastMonthName } = useMemo(() => {
    const target = isCurrentMonth ? new Date() : viewDate
    return {
      monthLabel: target.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' }),
      dayOfMonth: isCurrentMonth
        ? new Date().getDate()
        : new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate(),
      daysInMonth: new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate(),
      lastMonthName: new Date(target.getFullYear(), target.getMonth() - 1, 1).toLocaleDateString(
        dateLocale,
        { month: 'long' }
      ),
    }
  }, [dateLocale, viewDate, isCurrentMonth])

  const unreviewed = anomalies.length

  return (
    <AppShell active="insights" userId={userId}>

      <PageEnter className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto min-h-0 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+28px)] md:pb-7"
        >
          <div className="max-w-[1000px] w-full mx-auto md:px-8 xl:px-10 md:pt-7 xl:pt-8 md:flex md:flex-col md:gap-7">
          {/* ── Sticky header + chapter nav ── */}
          <div className="sticky top-0 md:top-[72px] xl:top-0 z-10 md:z-[4] bg-truffle-bg md:flex md:flex-col md:gap-3 md:pt-1">
            <header className="flex items-center md:items-end justify-between px-4 md:px-0 pt-1 md:pt-0 pb-2 md:gap-3">
              <div className="flex flex-col gap-0.5 md:gap-1">
                <span className="text-[11px] font-bold tracking-[.12em] text-truffle-text2 uppercase">
                  {t.insights.title}
                </span>
                <span className="font-grotesk text-2xl md:text-[36px] xl:text-[44px] font-medium tracking-[-.025em] leading-tight md:leading-none">
                  {monthLabel}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label={t.insights.previousMonth}
                  disabled={monthOffset <= -11}
                  onClick={() => setMonthOffset((o) => o - 1)}
                  className="key key-line w-11 h-11 text-base disabled:opacity-30 md:bg-truffle-card md:border-truffle-border md:shadow-[0_1px_2px_rgba(0,0,0,.06)]"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label={t.insights.nextMonth}
                  disabled={isCurrentMonth}
                  onClick={() => setMonthOffset((o) => o + 1)}
                  className="key key-line w-11 h-11 text-base text-truffle-text2 disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </header>

            {/* Four-chapter nav — mobile: pill buttons with layoutId; md+: flat tab strip */}
            {/* Mobile pill tabs */}
            <nav
              aria-label={t.insights.sectionsLabel}
              className="grid grid-cols-4 gap-1 px-4 pt-1 md:hidden"
            >
              {CHAPTERS.map((ch) => {
                const c = t.insights.chapters[ch]
                const isActive = active === ch
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => jumpTo(ch)}
                    aria-current={isActive ? 'location' : undefined}
                    className={`relative h-12 rounded-lg flex flex-col items-center justify-center gap-px ${
                      isActive
                        ? 'text-truffle-bg'
                        : 'bg-truffle-card border border-truffle-border text-truffle-text'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="chapter-active"
                        className="absolute inset-0 rounded-lg bg-truffle-text"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative text-[10px] font-bold opacity-70">{c.num}</span>
                    <span className="relative font-grotesk text-[13px] font-medium">{c.label}</span>
                    {ch === 'review' && unreviewed > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1 min-w-5 h-5 px-1 rounded-full bg-truffle-accent text-[#302e2b] border-2 border-truffle-bg text-[11px] font-bold grid place-items-center"
                      >
                        {unreviewed}
                      </motion.span>
                    )}
                  </button>
                )
              })}
            </nav>
            {/* md+ flat tab strip */}
            <nav
              aria-label={t.insights.sectionsLabel}
              className="hidden md:grid grid-cols-4 border-b border-dashed border-truffle-border"
            >
              {CHAPTERS.map((ch) => {
                const c = t.insights.chapters[ch]
                const isActive = active === ch
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => jumpTo(ch)}
                    aria-current={isActive ? 'location' : undefined}
                    className={`flex items-center gap-2 min-h-[48px] border-b-[3px] border-solid box-border text-[13px] font-bold tracking-[.06em] cursor-pointer ${
                      isActive
                        ? 'text-truffle-text border-truffle-text'
                        : 'text-truffle-text2 border-transparent'
                    }`}
                  >
                    <span className="text-[11px] opacity-70">{c.num}</span>
                    <span className="font-grotesk text-[15px] font-medium tracking-normal">{c.label}</span>
                    {ch === 'review' && unreviewed > 0 && (
                      <span className="min-w-[18px] h-[18px] rounded-full bg-truffle-accent text-[#302e2b] text-[10px] font-bold grid place-items-center">
                        {unreviewed}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Scroll progress rail */}
            <div className="mx-4 md:mx-0 mt-2 h-0.5 bg-truffle-border">
              <div
                className="h-0.5 bg-truffle-text transition-[width] duration-100"
                style={{ width: `${Math.round(scrollPct * 100)}%` }}
              />
            </div>
            <div className="h-2 border-b border-dashed border-truffle-border" />
          </div>

          <ErrorBoundary>
            {/* ── Hero: month-so-far KPI slip ── */}
            <AnimatePresence mode="wait">
            {isLoading ? (
              <div key="hero-skeleton" className="px-4 md:px-0 pt-5 pb-2">
                <SkeletonPulse className="slip px-[18px] pt-[18px] pb-8 flex flex-col gap-4 border-t-[6px] border-truffle-accent">
                  <div className="flex justify-between">
                    <div className="h-3 bg-truffle-border w-24" />
                    <div className="h-3 bg-truffle-border w-16" />
                  </div>
                  <div className="h-5 bg-truffle-border" />
                  <div className="h-px border-t border-dashed border-truffle-border" />
                  <div className="flex flex-col gap-2.5">
                    <div className="h-3.5 bg-truffle-border" />
                    <div className="h-3.5 bg-truffle-border" />
                    <div className="h-3.5 bg-truffle-border" />
                    <div className="h-3 bg-truffle-border w-2/3" />
                  </div>
                  <div className="h-px border-t border-dashed border-truffle-border" />
                  <div className="flex justify-between items-baseline">
                    <div className="h-4 bg-truffle-border w-28" />
                    <div className="h-8 bg-truffle-border w-32" />
                  </div>
                </SkeletonPulse>
              </div>
            ) : statement ? (
              <motion.div
                key={viewYM}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: truffleEase }}
                className="px-4 md:px-0 pt-5 pb-2"
              >
                <div className="slip md:border md:border-truffle-border px-[18px] pt-[18px] pb-8 md:px-6 md:pt-[22px] md:pb-9 grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 md:gap-x-10 items-center border-t-[6px] border-truffle-accent">
                  {/* Left column: label + summary + proportional bar + legend */}
                  <div className="flex flex-col gap-3.5">
                    <div className="flex justify-between text-[11px] font-bold tracking-[.1em] text-truffle-text2 uppercase">
                      <span>{t.insights.hero.monthSoFar}</span>
                      <span>{t.insights.hero.dayOf(dayOfMonth, daysInMonth)}</span>
                    </div>

                    {/* Hero summary sentence (md+ only) */}
                    {statement.incomeThisMonth > 0 && (
                      <span className="hidden md:block font-grotesk text-[30px] font-medium leading-[1.1] tracking-[-.02em]" style={{ textWrap: 'pretty' } as React.CSSProperties}>
                        {statement.pace === 'ahead'
                          ? t.insights.hero.aheadOf(formatAmount(statement.paceDelta), lastMonthName)
                          : statement.pace === 'behind'
                            ? t.insights.hero.behindVs(formatAmount(statement.paceDelta), lastMonthName)
                            : t.insights.hero.projectedClose}{'. '}
                        <span className="bg-truffle-accent-soft text-truffle-accent-ink" style={{ boxShadow: '-.08em 0 0 var(--t-accent-soft), .08em 0 0 var(--t-accent-soft)' }}>
                          {statement.projectedClose >= 0 ? '+' : MINUS}{formatAmount(statement.projectedClose)}{' '}{statement.pace === 'ahead' ? '↑' : statement.pace === 'behind' ? '↓' : ''}
                        </span>
                      </span>
                    )}

                    {/* Proportional bar */}
                    {statement.incomeThisMonth > 0 && (
                      <>
                        <motion.div
                          className="flex gap-[3px] h-[22px]"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, ease: truffleEase, delay: 0.15 }}
                          style={{ transformOrigin: 'left' }}
                        >
                          <div
                            className="bg-truffle-text"
                            style={{ flex: statement.spentThisMonth }}
                          />
                          <div
                            className="bg-truffle-accent border-2 border-truffle-accent-edge box-border"
                            style={{ flex: Math.max(statement.savedThisMonth, 0) }}
                          />
                          {statement.incomeThisMonth - statement.spentThisMonth - Math.max(statement.savedThisMonth, 0) > 0 && (
                            <div
                              className="border-2 border-dashed border-truffle-text2 box-border"
                              style={{
                                flex: statement.incomeThisMonth -
                                  statement.spentThisMonth -
                                  Math.max(statement.savedThisMonth, 0),
                              }}
                            />
                          )}
                        </motion.div>
                        <div className="flex justify-between text-[10px] font-bold tracking-[.06em] text-truffle-text2 uppercase">
                          <span>
                            {t.insights.hero.barSpent(
                              Math.round(
                                (statement.spentThisMonth / statement.incomeThisMonth) * 100
                              ) + '%'
                            )}
                          </span>
                          <span className="text-truffle-accent-ink">
                            {t.insights.hero.barSaved(
                              Math.round(
                                (Math.max(statement.savedThisMonth, 0) /
                                  statement.incomeThisMonth) *
                                  100
                              ) + '%'
                            )}
                          </span>
                          <span>
                            {t.insights.hero.barLeft(
                              Math.round(
                                (Math.max(
                                  statement.incomeThisMonth -
                                    statement.spentThisMonth -
                                    Math.max(statement.savedThisMonth, 0),
                                  0
                                ) /
                                  statement.incomeThisMonth) *
                                  100
                              ) + '%'
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right column: KPI rows + projected close */}
                  <div className="flex flex-col gap-[9px] text-sm">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.08 }}>
                      <LeaderRow
                        left={t.insights.hero.income}
                        right={
                          <b className="text-truffle-positive">
                            ↑ {formatAmount(statement.incomeThisMonth)}
                          </b>
                        }
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.12 }}>
                      <LeaderRow
                        left={t.insights.hero.spent}
                        right={<b>↓ {formatAmount(statement.spentThisMonth)}</b>}
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.16 }}>
                      <LeaderRow
                        left={t.insights.hero.saved}
                        right={
                          <b className="text-truffle-accent-ink">
                            → {formatAmount(Math.max(statement.savedThisMonth, 0))}
                          </b>
                        }
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.20 }}>
                      <LeaderRow
                        className="text-xs text-truffle-text2"
                        left={t.insights.hero.dailyRate}
                        right={`${formatAmount(statement.dailyRate)}/day`}
                      />
                    </motion.div>

                    <div className="border-t border-dashed border-truffle-text2" />

                    {/* Projected close */}
                    <motion.div
                      className="flex justify-between items-baseline"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: truffleEase, delay: 0.26 }}
                    >
                      <span className="text-[12px] font-bold tracking-[.1em] uppercase">
                        {t.insights.hero.projectedClose}
                      </span>
                      <span className="text-[34px] font-bold tracking-[-.02em]">
                        {statement.projectedClose >= 0 ? '+' : ''}
                        {formatAmount(statement.projectedClose)}
                      </span>
                    </motion.div>

                    {statement.pace && statement.pace !== 'even' && (
                      <span
                        className={`text-[11px] font-bold tracking-wide uppercase ${
                          statement.pace === 'ahead'
                            ? 'text-truffle-positive'
                            : 'text-truffle-warning'
                        }`}
                      >
                        {statement.pace === 'ahead'
                          ? t.insights.hero.aheadOf(
                              formatAmount(statement.paceDelta),
                              lastMonthName
                            )
                          : t.insights.hero.behindVs(
                              formatAmount(statement.paceDelta),
                              lastMonthName
                            )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
            </AnimatePresence>

            {/* ── 01 Review ── */}
            <ChapterSection id="review" num="01" title={t.insights.sections.rev.heading(anomalies.length)} right={unreviewed ? t.insights.reviewToCheck(unreviewed) : t.insights.reviewAllClear}>
              {anomalyLoading ? (
                <SkeletonPulse className="flex flex-col gap-2">
                  <div className="h-3.5 bg-truffle-border" />
                  <div className="h-3 bg-truffle-border w-2/3" />
                </SkeletonPulse>
              ) : anomalies.length ? (
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
                  {anomalies.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...transitionSnappy, delay: i * 0.06 }}
                    >
                      <AnomalyRow
                        anomaly={a}
                        transactions={transactions}
                        userId={userId}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="font-grotesk text-sm text-truffle-text2">
                  {t.insights.noUnusualActivity}
                </p>
              )}
            </ChapterSection>

            {/* ── 02 Spending (calendar + budgets) ── */}
            <ChapterSection
              id="spending"
              num="02"
              title={t.insights.spendingTitle}
              right={isLoading ? '' : formatAmount(statement?.spentThisMonth ?? 0)}
            >
              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] md:gap-x-10 md:gap-y-6 gap-3.5 md:items-start">
                {/* Left: heatmap */}
                <div className="flex flex-col gap-3">
                  <span className="font-grotesk text-[15px] leading-[1.45] text-truffle-text2">
                    {t.insights.spendingIntro}
                  </span>
                  {isLoading ? (
                    <SkeletonPulse className="h-48 bg-truffle-surface" />
                  ) : (
                    <SpendingHeatmap transactions={transactions} month={{ year: viewDate.getFullYear(), month: viewDate.getMonth() + 1 }} />
                  )}
                </div>

                {/* Right: budgets */}
                <div className="flex flex-col gap-0 mt-2 md:mt-0">
                  <div className="flex justify-between items-baseline pb-2">
                    <span className="text-xs font-bold tracking-[.12em] uppercase">{t.insights.budgetsTitle}</span>
                  </div>
                  <SectionAddFormProvider>
                    <BudgetsInline userId={userId} transactions={transactions} viewDate={viewDate} />
                  </SectionAddFormProvider>
                </div>
              </div>
            </ChapterSection>

            {/* ── 03 Building toward (goals + habits) ── */}
            <ChapterSection
              id="building"
              num="03"
              title={t.insights.buildingHeading}
              right={t.insights.goalsAndHabits(goals.length, habits.length)}
            >
              {/* Mobile: existing inline layout */}
              <div className="md:hidden flex flex-col gap-3.5">
                <SectionAddFormProvider>
                  <BuildingAddButton />
                  <SavingsGoalsEmbedded userId={userId} />
                </SectionAddFormProvider>
                <div className="bg-truffle-surface border border-dashed border-truffle-border px-4 py-3.5 flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold tracking-[.1em] text-truffle-text2 uppercase">
                    {t.insights.standaloneHabit}
                  </span>
                  <SectionAddFormProvider>
                    <SavingsHabits userId={userId} />
                  </SectionAddFormProvider>
                </div>
              </div>

              {/* Desktop/tablet: goal cards + habit cards in responsive grid */}
              <div className="hidden md:block">
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 items-start">
                  {goals.map((goal, i) => (
                    <InsightsGoalCard key={goal.id} goal={goal} index={i} />
                  ))}
                  {habits.map((habit, i) => (
                    <InsightsStandaloneHabit key={habit.id} habit={habit} index={goals.length + i} />
                  ))}
                </div>
                <SectionAddFormProvider>
                  <BuildingAddButton />
                  <SavingsGoalsEmbedded userId={userId} />
                </SectionAddFormProvider>
              </div>
            </ChapterSection>

            {/* ── 04 Recurring ── */}
            <ChapterSection id="recurring" num="04" title={t.insights.recurringTitle}>
              <RecurringSection userId={userId} transactions={transactions} viewDate={viewDate} />
            </ChapterSection>

            {/* End marker */}
            <motion.div
              className="flex items-center gap-2.5 text-truffle-text2 text-xs px-4 md:px-0 py-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.5, ease: truffleEase }}
            >
              <span>✂</span>
              <motion.span
                className="flex-1 border-t-2 border-dashed border-truffle-border"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: truffleEase, delay: 0.1 }}
                style={{ transformOrigin: 'left' }}
              />
              <span className="font-bold tracking-[.1em] uppercase">{t.insights.endOfInsights}</span>
            </motion.div>
          </ErrorBoundary>
          </div>
        </main>
      </PageEnter>

    </AppShell>
  )
}

/* ── Chapter section wrapper ── */

function ChapterSection({
  id,
  num,
  title,
  right,
  children,
}: {
  id: Chapter
  num: string
  title: string
  right?: string
  children: React.ReactNode
}) {
  const headingId = `${chapterId(id)}-heading`
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })
  return (
    <section
      ref={ref}
      id={chapterId(id)}
      aria-labelledby={headingId}
      className="px-4 md:px-0 pt-7 pb-2 flex flex-col gap-3.5 scroll-mt-[140px]"
    >
      <motion.div
        className="flex items-baseline gap-2.5 border-b border-dashed border-truffle-text2 pb-2.5"
        initial={{ opacity: 0, x: -16 }}
        animate={inView ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.35, ease: truffleEase }}
      >
        <span className="text-[13px] font-bold text-truffle-text2">{num}</span>
        <h2
          id={headingId}
          className="font-grotesk text-[26px] font-medium tracking-[-.02em]"
        >
          {title}
        </h2>
        <span className="flex-1" />
        {right && (
          <span className="text-xs font-bold text-truffle-text2 uppercase">{right}</span>
        )}
      </motion.div>
      <motion.div
        className="flex flex-col gap-3.5"
        initial={{ opacity: 0, y: 14 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.38, ease: truffleEase, delay: 0.08 }}
      >
        {children}
      </motion.div>
    </section>
  )
}

/* ── Building section: + New button from context ── */

function BuildingAddButton() {
  const { t } = useLanguage()
  const { open, setOpen } = useSectionAddForm()
  return (
    <div className="flex justify-end -mt-1 mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="min-h-8 text-xs font-bold uppercase underline underline-offset-2"
      >
        {open ? t.savingsGoals.cancel : t.insights.newItem}
      </button>
    </div>
  )
}

/* ── Budgets inline with add toggle ── */

function BudgetsInline({ userId, transactions, viewDate }: { userId: string; transactions: Transaction[]; viewDate?: Date }) {
  const { t } = useLanguage()
  const { open, setOpen } = useSectionAddForm()
  return (
    <>
      <div className="flex justify-end -mt-1 mb-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="min-h-8 text-xs font-bold uppercase underline underline-offset-2"
        >
          {open ? t.savingsGoals.cancel : t.insights.newItem}
        </button>
      </div>
      <MonthlyBudgets userId={userId} transactions={transactions} viewDate={viewDate} />
    </>
  )
}

/* ── Anomaly row ── */

const SEVERITY = {
  high: { glyph: '■', color: 'text-truffle-negative', edge: 'border-truffle-negative' },
  medium: { glyph: '▲', color: 'text-truffle-warning', edge: 'border-truffle-warning' },
  low: { glyph: '●', color: 'text-truffle-text2', edge: 'border-truffle-text2' },
} as const

function AnomalyRow({
  anomaly,
  transactions,
  userId,
}: {
  anomaly: Anomaly
  transactions: Transaction[]
  userId: string
}) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const tx = transactions.find((x) => x.id === anomaly.transactionId)
  const severity = SEVERITY[anomaly.severity]
  const label = tx ? tx.description : t.insights.anomalyTypes[anomaly.type]

  const itsMine = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalyId: anomaly.id }),
      })
      if (res.ok) await queryClient.invalidateQueries({ queryKey: ['anomalies', userId] })
    } finally {
      setBusy(false)
    }
  }

  const notMe = () => {
    setChatHandoff(
      t.insights.notMePrompt(label, tx ? formatAmount(tx.amount) : '')
    )
    router.push('/chat')
  }

  return (
    <div className={`bg-truffle-card border border-truffle-border border-l-[6px] ${severity.edge} px-3 py-3.5 flex flex-col gap-2`}>
      <LeaderRow
        className="text-[15px] font-bold"
        left={<span className={severity.color}>{severity.glyph}</span>}
        right={tx ? formatAmount(tx.amount) : null}
      />
      <span className="font-bold text-[15px]">{label}</span>
      <span className={`text-[10px] font-bold tracking-wide uppercase ${severity.color}`}>
        {t.insights.anomalyTypes[anomaly.type]}
      </span>
      <p className="font-grotesk text-[15px] leading-[1.45]">{anomaly.description}</p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={itsMine}
          disabled={busy}
          className="key key-ink key-3 h-11 text-xs uppercase"
        >
          {t.insights.itsMine}
        </button>
        <button
          type="button"
          onClick={notMe}
          className="key key-line key-3 h-11 text-xs uppercase"
        >
          {t.insights.notMe}
        </button>
      </div>
    </div>
  )
}

/* ── Goal card for desktop Insights ── */

const GOAL_SEGS = 20

function InsightsGoalCard({
  goal,
  index,
}: {
  goal: SavingsGoal
  index: number
}) {
  const { formatAmount } = useCurrency()
  const { t } = useLanguage()
  const plan = goalPlan(goal)
  const progress = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0
  const filledSegs = Math.round((progress / 100) * GOAL_SEGS)
  const done = plan.status === 'reached'

  const deadlineLabel = goal.deadline
    ? new Date(goal.deadline).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase()
    : t.insights.noDeadline.toUpperCase()

  return (
    <motion.div
      className="slip border border-truffle-border px-[18px] pt-4 pb-[30px] flex flex-col gap-2.5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSnappy, delay: index * 0.06 }}
    >
      {/* Header */}
      <div className="flex justify-between text-[10px] font-bold tracking-[.1em] text-truffle-text2">
        <span>GOAL · {deadlineLabel}</span>
        <span>{Math.round(progress)}%</span>
      </div>

      {/* Name + saved / target */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex-1 min-w-0 font-grotesk text-[22px] font-medium truncate">
          {goal.emoji} {goal.name}
        </span>
        <span className="text-sm whitespace-nowrap">
          <b>{formatAmount(goal.savedAmount)}</b>
          <span className="text-truffle-text2"> / {formatAmount(goal.targetAmount)}</span>
        </span>
      </div>

      {/* Progress bar — 20 segments */}
      <div className="grid grid-cols-[repeat(20,1fr)] gap-0.5">
        {Array.from({ length: GOAL_SEGS }, (_, i) => (
          <motion.div
            key={i}
            initial={i < filledSegs ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.25, ease: truffleEase, delay: i < filledSegs ? i * 0.025 : 0 }}
            style={{ transformOrigin: 'left' }}
            className={`h-3.5 border ${
              i < filledSegs
                ? done
                  ? 'bg-truffle-positive border-truffle-positive'
                  : 'bg-truffle-accent border-truffle-accent-edge'
                : 'border-truffle-border'
            }`}
          />
        ))}
      </div>

      {/* Leader rows */}
      <LeaderRow
        className="text-[13px]"
        left={plan.perMonth != null ? t.insights.perMonthLabel : t.savingsGoals.statusOnTrack}
        right={plan.perMonth != null ? <b>{formatAmount(plan.perMonth)}{t.insights.perMonthUnit}</b> : null}
      />

    </motion.div>
  )
}

function InsightsStandaloneHabit({ habit, index }: { habit: HabitWithStats; index: number }) {
  const { t } = useLanguage()

  return (
    <motion.div
      className="bg-truffle-surface border border-dashed border-truffle-border px-4 py-3.5 flex items-center gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSnappy, delay: index * 0.06 }}
    >
      <div className="flex-none w-11 h-11 rounded-lg bg-truffle-card border-2 border-truffle-text shadow-[0_4px_0_var(--t-border)] grid place-items-center text-lg font-bold">
        {habit.emoji}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[10px] font-bold tracking-[.1em] text-truffle-text2 uppercase">
          {t.insights.standaloneHabit}
        </span>
        <span className="font-grotesk text-[15px] font-medium truncate">{habit.name}</span>
      </div>
      <span className="text-[11px] font-bold text-truffle-accent-ink whitespace-nowrap">
        ✦ {habit.streak} {habit.frequency === 'weekly' ? t.savingsHabits.periodWeek.toUpperCase() : t.savingsHabits.periodMonth.toUpperCase()}
      </span>
    </motion.div>
  )
}
