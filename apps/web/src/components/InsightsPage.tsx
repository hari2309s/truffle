'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { setChatHandoff } from '@/lib/chatHandoff'
import type { Anomaly, Transaction } from '@truffle/types'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { computeStatement } from '@/lib/forecast'
import { RecurringSection } from './RecurringSection'
import { PageEnter, SkeletonPulse } from './PageMotion'
import { SavingsGoalsEmbedded } from './SavingsGoals'
import { SavingsHabits } from './SavingsHabits'
import { SpendingHeatmap } from './SpendingHeatmap'
import { MonthlyBudgets } from './MonthlyBudgets'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { ErrorBoundary } from './ErrorBoundary'
import { LeaderRow, MINUS, Rule } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { SectionAddFormProvider, useSectionAddForm } from '@/contexts/SectionAddFormContext'
import { toDateLocale } from '@/lib/date'
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
          if (el && el.getBoundingClientRect().top - rootTop <= 140) current = ch
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
    <div className="flex-1 w-full bg-truffle-bg flex flex-col max-w-lg mx-auto min-h-0">
      <TopBar>
        <TopBar.ThemeToggle />
        <TopBar.Settings userId={userId} />
      </TopBar>

      <PageEnter className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto min-h-0 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+28px)]"
        >
          {/* ── Sticky header + chapter nav ── */}
          <div className="sticky top-0 z-10 bg-truffle-bg">
            <header className="flex items-center justify-between px-4 pt-1 pb-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold tracking-[.14em] text-truffle-text2 uppercase">
                  {t.insights.title}
                </span>
                <span className="font-grotesk text-2xl font-medium tracking-tight leading-tight">
                  {monthLabel}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label={t.insights.previousMonth}
                  disabled={monthOffset <= -11}
                  onClick={() => setMonthOffset((o) => o - 1)}
                  className="key key-line w-11 h-11 text-base disabled:opacity-30"
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

            {/* Four-chapter nav */}
            <nav
              aria-label={t.insights.sectionsLabel}
              className="grid grid-cols-4 gap-1 px-4 pt-1"
            >
              {CHAPTERS.map((ch) => {
                const c = t.insights.chapters[ch]
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => jumpTo(ch)}
                    aria-current={active === ch ? 'location' : undefined}
                    className={`relative h-12 rounded-lg flex flex-col items-center justify-center gap-px transition-colors ${
                      active === ch
                        ? 'bg-truffle-text text-truffle-bg'
                        : 'bg-truffle-card border border-truffle-border text-truffle-text'
                    }`}
                  >
                    <span className="text-[10px] font-bold opacity-70">{c.num}</span>
                    <span className="font-grotesk text-[13px] font-medium">{c.label}</span>
                    {ch === 'review' && unreviewed > 0 && (
                      <span className="absolute -top-1.5 -right-1 min-w-5 h-5 px-1 rounded-full bg-truffle-accent text-[#302e2b] border-2 border-truffle-bg text-[11px] font-bold grid place-items-center">
                        {unreviewed}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Scroll progress rail */}
            <div className="mx-4 mt-2 h-0.5 bg-truffle-border">
              <div
                className="h-0.5 bg-truffle-text transition-[width] duration-100"
                style={{ width: `${Math.round(scrollPct * 100)}%` }}
              />
            </div>
            <div className="h-2 border-b border-dashed border-truffle-border" />
          </div>

          <ErrorBoundary>
            {/* ── Hero: month-so-far KPI slip ── */}
            {statement && (
              <div className="px-4 pt-5 pb-2">
                <div className="slip px-[18px] pt-[18px] pb-8 flex flex-col gap-3.5 border-t-[6px] border-truffle-accent">
                  <div className="flex justify-between text-[11px] font-bold tracking-[.1em] text-truffle-text2 uppercase">
                    <span>{t.insights.hero.monthSoFar}</span>
                    <span>{t.insights.hero.dayOf(dayOfMonth, daysInMonth)}</span>
                  </div>

                  {/* Proportional bar */}
                  {statement.incomeThisMonth > 0 && (
                    <>
                      <div className="flex gap-[3px] h-5">
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
                      </div>
                      <div className="flex justify-between text-[10px] font-bold tracking-wide text-truffle-text2 uppercase">
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

                  <div className="border-t border-dashed border-truffle-text2" />

                  {/* Leader-dot KPI rows */}
                  <div className="flex flex-col gap-2 text-sm">
                    <LeaderRow
                      left={t.insights.hero.income}
                      right={
                        <b className="text-truffle-positive">
                          ↑ {formatAmount(statement.incomeThisMonth)}
                        </b>
                      }
                    />
                    <LeaderRow
                      left={t.insights.hero.spent}
                      right={<b>↓ {formatAmount(statement.spentThisMonth)}</b>}
                    />
                    <LeaderRow
                      left={t.insights.hero.saved}
                      right={
                        <b className="text-truffle-accent-ink">
                          → {formatAmount(Math.max(statement.savedThisMonth, 0))}
                        </b>
                      }
                    />
                    <LeaderRow
                      className="text-xs text-truffle-text2"
                      left={t.insights.hero.dailyRate}
                      right={`${formatAmount(statement.dailyRate)}/day`}
                    />
                  </div>

                  <div className="border-t border-dashed border-truffle-text2" />

                  {/* Projected close */}
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px] font-bold tracking-[.1em] uppercase">
                      {t.insights.hero.projectedClose}
                    </span>
                    <span className="text-[32px] font-bold tracking-tight">
                      {statement.projectedClose >= 0 ? '+' : ''}
                      {formatAmount(statement.projectedClose)}
                    </span>
                  </div>

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
            )}

            {/* ── 01 Review ── */}
            <ChapterSection id="review" num="01" title={t.insights.sections.rev.heading(anomalies.length)} right={unreviewed ? t.insights.reviewToCheck(unreviewed) : t.insights.reviewAllClear}>
              {anomalyLoading ? (
                <SkeletonPulse className="flex flex-col gap-2">
                  <div className="h-3.5 bg-truffle-border" />
                  <div className="h-3 bg-truffle-border w-2/3" />
                </SkeletonPulse>
              ) : anomalies.length ? (
                anomalies.map((a) => (
                  <AnomalyRow
                    key={a.id}
                    anomaly={a}
                    transactions={transactions}
                    userId={userId}
                  />
                ))
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
              <span className="font-grotesk text-[15px] leading-[1.45] text-truffle-text2">
                {t.insights.spendingIntro}
              </span>
              {isLoading ? (
                <SkeletonPulse className="h-48 bg-truffle-surface" />
              ) : (
                <SpendingHeatmap transactions={transactions} month={{ year: viewDate.getFullYear(), month: viewDate.getMonth() + 1 }} />
              )}

              {/* Budgets — inline under spending */}
              <div className="flex flex-col gap-0 mt-2">
                <div className="flex justify-between items-baseline pb-2">
                  <span className="text-xs font-bold tracking-[.12em] uppercase">{t.insights.budgetsTitle}</span>
                </div>
                <SectionAddFormProvider>
                  <BudgetsInline userId={userId} transactions={transactions} viewDate={viewDate} />
                </SectionAddFormProvider>
              </div>
            </ChapterSection>

            {/* ── 03 Building toward (goals + habits) ── */}
            <ChapterSection
              id="building"
              num="03"
              title={t.insights.buildingHeading}
              right={t.insights.goalsAndHabits(goals.length, habits.length)}
            >
              <SectionAddFormProvider>
                <BuildingAddButton />
                <SavingsGoalsEmbedded userId={userId} />
              </SectionAddFormProvider>

              {/* Standalone habits (not linked to a goal) */}
              <div className="bg-truffle-surface border border-dashed border-truffle-border px-4 py-3.5 flex flex-col gap-2.5">
                <span className="text-[10px] font-bold tracking-[.1em] text-truffle-text2 uppercase">
                  {t.insights.standaloneHabit}
                </span>
                <SectionAddFormProvider>
                  <SavingsHabits userId={userId} />
                </SectionAddFormProvider>
              </div>
            </ChapterSection>

            {/* ── 04 Recurring ── */}
            <ChapterSection id="recurring" num="04" title={t.insights.recurringTitle}>
              <RecurringSection userId={userId} transactions={transactions} viewDate={viewDate} />
            </ChapterSection>

            {/* End marker */}
            <div className="flex items-center gap-2.5 text-truffle-text2 text-xs px-4 py-6">
              <span>✂</span>
              <span className="flex-1 border-t-2 border-dashed border-truffle-border" />
              <span className="font-bold tracking-[.1em] uppercase">{t.insights.endOfInsights}</span>
            </div>
          </ErrorBoundary>
        </main>
      </PageEnter>

      <BottomNav active="insights" />
    </div>
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
  return (
    <section
      id={chapterId(id)}
      aria-labelledby={headingId}
      className="px-4 pt-7 pb-2 flex flex-col gap-3.5 scroll-mt-[140px]"
    >
      <div className="flex items-baseline gap-2.5 border-b border-dashed border-truffle-text2 pb-2.5">
        <span className="text-[13px] font-bold text-truffle-text2">{num}</span>
        <h2
          id={headingId}
          className="font-grotesk text-2xl font-medium tracking-tight"
        >
          {title}
        </h2>
        <span className="flex-1" />
        {right && (
          <span className="text-xs font-bold text-truffle-text2 uppercase">{right}</span>
        )}
      </div>
      {children}
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
