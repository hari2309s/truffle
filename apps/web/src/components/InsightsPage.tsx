'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { setChatHandoff } from '@/lib/chatHandoff'
import type { Anomaly, Transaction } from '@truffle/types'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { detectSubscriptions } from '@/lib/subscriptions'
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

interface InsightsPageProps {
  userId: string
}

const SECTIONS = ['rev', 'cal', 'bud', 'goal', 'hab', 'sub'] as const
type SectionCode = (typeof SECTIONS)[number]

const sectionId = (code: SectionCode) => `insights-${code}`

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
 * Insights as one itemised statement. Section codes stick to the top and
 * jump between sections; the active code follows the scroll position.
 */
export function InsightsPage({ userId }: InsightsPageProps) {
  const { t } = useLanguage()
  const mainRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState<SectionCode>('rev')

  const { data: txData, isLoading } = useTransactionsQuery(userId)

  const { data: anomalyData, isLoading: anomalyLoading } = useQuery({
    queryKey: ['anomalies', userId],
    queryFn: async () => {
      // no-store: the route sets a short private cache, and a dismissed
      // flag must disappear straight away.
      const res = await fetch(`/api/insights?userId=${userId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch anomalies')
      const json = await res.json()
      return ((json.anomalies ?? []) as Record<string, unknown>[]).map(mapAnomaly)
    },
  })

  const transactions = txData?.transactions ?? []
  const anomalies = anomalyData ?? []
  const subscriptions = txData?.transactions ? detectSubscriptions(txData.transactions) : []

  // Scroll-spy: the active code is the last section whose top has passed
  // just below the sticky code bar.
  useEffect(() => {
    const root = mainRef.current
    if (!root) return
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rootTop = root.getBoundingClientRect().top
        let current: SectionCode = SECTIONS[0]
        for (const code of SECTIONS) {
          const el = document.getElementById(sectionId(code))
          if (el && el.getBoundingClientRect().top - rootTop <= 96) current = code
        }
        // At the very bottom, the last short sections can never reach the
        // threshold — light up the final one so every code is reachable.
        if (root.scrollTop + root.clientHeight >= root.scrollHeight - 2) {
          current = 'sub'
        }
        setActive(current)
      })
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  const jumpTo = useCallback((code: SectionCode) => {
    document.getElementById(sectionId(code))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

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
          <header className="pt-3 px-6 flex justify-between items-baseline">
            <h1 className="font-grotesk text-4xl font-medium">{t.insights.title}</h1>
            <span className="text-xs text-truffle-text2 uppercase">{monthLabel}</span>
          </header>

          <nav
            aria-label={t.insights.sectionsLabel}
            className="sticky top-0 z-10 bg-truffle-bg px-4 pt-3.5 pb-2 grid grid-cols-6 gap-1"
          >
            {SECTIONS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => jumpTo(code)}
                aria-current={active === code ? 'location' : undefined}
                aria-label={t.insights.sections[code].title}
                className={`h-11 rounded-md grid place-items-center text-[11px] font-bold uppercase ${
                  active === code
                    ? 'bg-truffle-text text-truffle-bg'
                    : 'border border-truffle-border'
                }`}
              >
                {t.insights.sections[code].code}
              </button>
            ))}
          </nav>

          <ErrorBoundary>
            <div className="slip mx-4 mt-2 px-[18px] pt-[18px] pb-9 flex flex-col gap-3 text-[13px]">
              <Section
                code="rev"
                title={t.insights.sections.rev.heading(anomalies.length)}
              >
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
              </Section>

              <Rule className="mt-2" />
              <Section code="cal" title={t.insights.sections.cal.heading}>
                {isLoading ? (
                  <SkeletonPulse className="h-48 bg-truffle-surface" />
                ) : (
                  <SpendingHeatmap transactions={transactions} />
                )}
              </Section>

              <Rule className="mt-2" />
              <SectionAddFormProvider>
                <AddableSection code="bud" title={t.insights.sections.bud.heading}>
                  <MonthlyBudgets userId={userId} transactions={transactions} />
                </AddableSection>
              </SectionAddFormProvider>

              <Rule className="mt-2" />
              <SectionAddFormProvider>
                <AddableSection code="goal" title={t.insights.sections.goal.heading}>
                  <SavingsGoalsEmbedded userId={userId} />
                </AddableSection>
              </SectionAddFormProvider>

              <Rule className="mt-2" />
              <Section code="hab" title={t.insights.sections.hab.heading}>
                <SavingsHabits userId={userId} />
              </Section>

              <Rule className="mt-2" />
              <Section code="sub" title={t.insights.sections.sub.heading}>
                {subscriptions.length > 0 ? (
                  <>
                    {subscriptions.map((sub) => (
                      <LeaderRow
                        key={sub.key}
                        left={
                          <span>
                            {sub.displayName}
                            <span className="block text-[11px] text-truffle-text2">
                              {t.insights.detected(sub.monthsDetected)}
                            </span>
                          </span>
                        }
                        right={<SubscriptionAmount amount={sub.monthlyAmount} />}
                      />
                    ))}
                    <Rule />
                    <div className="flex justify-between font-bold text-[15px] uppercase">
                      <span>{t.insights.monthly}</span>
                      <SubscriptionAmount
                        amount={subscriptions.reduce((s, sub) => s + sub.monthlyAmount, 0)}
                      />
                    </div>
                  </>
                ) : (
                  <p className="font-grotesk text-sm text-truffle-text2">{t.insights.subsEmpty}</p>
                )}
              </Section>
            </div>
          </ErrorBoundary>
        </main>
      </PageEnter>

      <BottomNav active="insights" />
    </div>
  )
}

function SubscriptionAmount({ amount }: { amount: number }) {
  const { formatAmount } = useCurrency()
  return <span>{formatAmount(amount)}</span>
}

function Section({
  code,
  title,
  right,
  children,
}: {
  code: SectionCode
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  const { t } = useLanguage()
  const headingId = `${sectionId(code)}-heading`
  return (
    <section
      id={sectionId(code)}
      aria-labelledby={headingId}
      className="flex flex-col gap-3 scroll-mt-[72px]"
    >
      <div className="flex justify-between items-center min-h-6">
        <h2 id={headingId} className="font-bold tracking-[.08em] uppercase">
          {t.insights.sections[code].code} · {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  )
}

/** A section whose header toggles an inline "+ New" form (budgets, goals). */
function AddableSection({
  code,
  title,
  children,
}: {
  code: SectionCode
  title: string
  children: React.ReactNode
}) {
  const { t } = useLanguage()
  const { open, setOpen } = useSectionAddForm()
  return (
    <Section
      code={code}
      title={title}
      right={
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="-my-2 min-h-8 text-xs font-bold uppercase underline underline-offset-2"
        >
          {open ? t.savingsGoals.cancel : t.insights.newItem}
        </button>
      }
    >
      {children}
    </Section>
  )
}

const SEVERITY = {
  high: { glyph: '■', color: 'text-truffle-negative' },
  medium: { glyph: '▲', color: 'text-truffle-warning' },
  low: { glyph: '●', color: 'text-truffle-text2' },
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
    <div className="flex flex-col gap-1.5">
      <LeaderRow
        className="text-sm"
        left={<span className="block truncate">?? {label}</span>}
        right={
          tx ? (
            <b>
              {tx.amount < 0 ? MINUS : '+'}
              {formatAmount(tx.amount)}
            </b>
          ) : null
        }
      />
      <p className="font-grotesk text-sm leading-[1.45] text-truffle-text2">{anomaly.description}</p>
      <span className={`text-[11px] font-bold uppercase ${severity.color}`}>
        {severity.glyph} {t.insights.severity[anomaly.severity]}
        {tx ? ` · ${t.insights.anomalyTypes[anomaly.type]}` : ''}
      </span>
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
