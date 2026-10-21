'use client'

import { useMemo } from 'react'
import { computeStatement } from '@/lib/forecast'
import { SkeletonPulse } from './PageMotion'
import { LeaderRow, MINUS, Rule } from './Tally'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'

interface FinancialBriefProps {
  userId: string
}

/** The daily statement: balance, this month's run-rate and where it lands. */
export function FinancialBrief({ userId }: FinancialBriefProps) {
  const { t, locale } = useLanguage()
  const { formatAmount, currency } = useCurrency()
  const { data, isLoading } = useTransactionsQuery(userId)

  const now = useMemo(() => new Date(), [])
  const statement = useMemo(
    () => (data?.transactions ? computeStatement(data.transactions, now) : null),
    [data?.transactions, now]
  )
  const formatWhole = useMemo(() => {
    const f = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    })
    return (n: number) => f.format(Math.abs(n))
  }, [currency])

  const dateLocale = toDateLocale(locale)
  const stamp = `${now.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })} · ${now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`
  const signed = (n: number) => `${n < 0 ? MINUS : ''}${formatAmount(n)}`

  if (isLoading) {
    return (
      <SkeletonPulse className="slip mx-4 mt-4 px-[18px] pt-[18px] pb-[30px] flex flex-col gap-3">
        <div className="h-3 bg-truffle-border w-1/3" />
        <div className="h-10 bg-truffle-border w-2/3" />
        <div className="h-3 bg-truffle-border w-full" />
        <div className="h-3 bg-truffle-border w-full" />
      </SkeletonPulse>
    )
  }

  if (!statement) {
    return (
      <section
        aria-label={t.dashboard.statement}
        className="slip print-in mx-4 mt-4 px-[18px] pt-[18px] pb-[30px] flex flex-col gap-2 text-sm"
      >
        <div className="flex justify-between text-xs text-truffle-text2 uppercase">
          <span>{t.dashboard.statement} #0001</span>
          <span>{now.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        <Rule />
        <span className="text-xs text-truffle-text2 uppercase">{t.dashboard.balance}</span>
        <span className="text-[44px] font-bold leading-none text-truffle-text2">
          {formatAmount(0).replace(/[\d.,]+/, '—.——')}
        </span>
        <Rule className="mt-1.5" />
        <LeaderRow className="text-truffle-text2" left={t.dashboard.spentThisMonth} right="—" />
        <LeaderRow className="text-truffle-text2" left={t.dashboard.forecast} right={t.dashboard.forecastAfter} />
        <Rule />
        <p className="font-grotesk text-[15px] leading-[1.45]">{t.dashboard.emptyStatement}</p>
      </section>
    )
  }

  const paceNote =
    statement.pace === null
      ? t.dashboard.paceFirst
      : (statement.pace === 'ahead' ? t.dashboard.paceAhead : t.dashboard.paceBehind)(
          statement.lastMonth.toLocaleDateString(dateLocale, { month: 'long' })
        )

  return (
    <section
      aria-label={t.dashboard.statement}
      className="slip print-in mx-4 mt-4 px-[18px] pt-[18px] pb-[30px] flex flex-col gap-2 text-sm"
    >
      <div className="flex justify-between text-xs text-truffle-text2 uppercase">
        <span>{t.dashboard.statement}</span>
        <span>{stamp}</span>
      </div>
      <Rule />
      <span className="text-xs text-truffle-text2 uppercase">{t.dashboard.balance}</span>
      <span className="text-[44px] font-bold leading-none break-all">{signed(statement.balance)}</span>
      <Rule className="mt-1.5" />
      <LeaderRow strong left={t.dashboard.spentThisMonth} right={formatAmount(statement.spentThisMonth)} />
      <LeaderRow
        strong
        left={t.dashboard.dailyRate}
        right={`${formatAmount(statement.dailyRate)}${t.dashboard.perDay}`}
      />
      <LeaderRow
        strong
        left={t.dashboard.forecastOn(
          statement.monthEnd.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
        )}
        right={formatAmount(statement.forecastMonthSpend)}
      />
      <Rule />
      <div className="flex justify-between font-bold text-[15px] uppercase">
        <span>{t.dashboard.projectedClose}</span>
        <span>
          {statement.projectedClose < 0 ? MINUS : ''}
          {formatWhole(statement.projectedClose)}
        </span>
      </div>
      <p className="font-grotesk text-sm text-truffle-text2">{paceNote}</p>
    </section>
  )
}
