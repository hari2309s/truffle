'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { computeStatement } from '@/lib/forecast'
import { truffleEase } from '@/lib/motion'
import { SkeletonPulse } from './PageMotion'
import { LeaderRow, MINUS, Rule } from './Tally'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'

interface FinancialBriefProps {
  userId: string
}

/**
 * The daily statement: net logged, then this month's income, spend and
 * run-rate, and where the month closes (income − projected spend).
 */
export function FinancialBrief({ userId }: FinancialBriefProps) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const { data, isLoading } = useTransactionsQuery(userId)

  const now = useMemo(() => new Date(), [])
  const statement = useMemo(
    () =>
      data?.transactions
        ? computeStatement(data.transactions, now, data.totals?.balance ?? null)
        : null,
    [data?.transactions, data?.totals, now]
  )

  const dateLocale = toDateLocale(locale)
  const stamp = `${now.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })} · ${now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`
  const monthName = now.toLocaleDateString(dateLocale, { month: 'long' }).toUpperCase()
  const signed = (n: number) => `${n < 0 ? MINUS : ''}${formatAmount(n)}`

  if (isLoading) {
    return (
      <>
        {/* Mobile skeleton */}
        <SkeletonPulse className="slip mx-4 mt-4 md:hidden px-[18px] pt-[18px] pb-[30px] flex flex-col gap-3">
          <div className="h-3 bg-truffle-border w-1/3" />
          <div className="h-10 bg-truffle-border w-2/3" />
          <div className="h-3 bg-truffle-border w-full" />
          <div className="h-3 bg-truffle-border w-full" />
        </SkeletonPulse>
        {/* md+ skeleton */}
        <SkeletonPulse className="slip hidden md:flex border border-truffle-border border-t-[6px] border-t-truffle-accent px-5 pt-[18px] pb-8 flex-col gap-3">
          <div className="flex justify-between">
            <div className="h-3 bg-truffle-border w-32" />
            <div className="h-3 bg-truffle-border w-16" />
          </div>
          <div className="h-4 bg-truffle-border" />
          <div className="h-4 bg-truffle-border" />
          <div className="h-[14px] bg-truffle-border" />
          <div className="h-px border-t border-dashed border-truffle-border" />
          <div className="flex justify-between items-baseline">
            <div className="h-4 bg-truffle-border w-28" />
            <div className="h-8 bg-truffle-border w-32" />
          </div>
        </SkeletonPulse>
      </>
    )
  }

  if (!statement) {
    return (
      <section
        aria-label={t.dashboard.statement}
        className="slip print-lines mx-4 mt-4 md:mx-0 md:mt-0 md:border md:border-truffle-border border-t-[6px] border-truffle-accent px-[18px] pt-[18px] pb-[30px] flex flex-col gap-2 text-sm"
      >
        <div className="flex justify-between text-xs text-truffle-text2 uppercase">
          <span>{t.dashboard.statement} #0001</span>
          <span>{now.toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        <Rule />
        <span className="text-xs text-truffle-text2 uppercase">{t.dashboard.netThisMonth}</span>
        <span className="text-[44px] font-bold leading-none text-truffle-text2">
          {formatAmount(0).replace(/[\d.,]+/, '—.——')}
        </span>
        <Rule className="mt-1.5" />
        <LeaderRow className="text-truffle-text2" left={t.dashboard.spentThisMonth} right="—" />
        <LeaderRow className="text-truffle-text2" left={t.dashboard.projectedSpend} right={t.dashboard.forecastAfter} />
        <Rule />
        <p className="font-grotesk text-[15px] leading-[1.45]">{t.dashboard.emptyStatement}</p>
      </section>
    )
  }

  const lastMonthName = statement.lastMonth.toLocaleDateString(dateLocale, { month: 'long' })
  const paceNote =
    statement.pace === null
      ? t.dashboard.paceFirst
      : statement.pace === 'even'
        ? t.dashboard.paceEven(lastMonthName)
        : (statement.pace === 'ahead' ? t.dashboard.paceAhead : t.dashboard.paceBehind)(
            formatAmount(statement.paceDelta),
            lastMonthName
          )

  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  return (
    <>
      {/* ── Mobile: receipt-style slip (unchanged) ── */}
      <section
        aria-label={t.dashboard.statement}
        className="slip print-lines mx-4 mt-4 md:hidden border-t-[6px] border-truffle-accent px-[18px] pt-[18px] pb-[30px] flex flex-col gap-2 text-sm"
      >
        <div className="flex justify-between text-[11px] font-bold tracking-[.1em] text-truffle-text2 uppercase">
          <span>{t.dashboard.statement} · {monthName}</span>
          <span>{stamp}</span>
        </div>
        <Rule />
        <span className="text-xs text-truffle-text2 uppercase">
          {statement.balanceIsAllTime ? t.dashboard.netLogged : t.dashboard.netThisMonth}
        </span>
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: truffleEase }}
          className="text-[44px] font-bold leading-none break-all"
        >
          {signed(statement.balance)}
        </motion.span>
        <Rule className="mt-1.5" />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.08 }}>
          <LeaderRow strong left={t.dashboard.incomeThisMonth} right={formatAmount(statement.incomeThisMonth)} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.12 }}>
          <LeaderRow strong left={t.dashboard.spentThisMonth} right={formatAmount(statement.spentThisMonth)} />
        </motion.div>
        {statement.savedThisMonth !== 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.16 }}>
            <LeaderRow strong left={t.dashboard.savedThisMonth} right={signed(statement.savedThisMonth)} />
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.20 }}>
          <LeaderRow
            strong
            left={t.dashboard.dailyRate}
            right={`${formatAmount(statement.dailyRate)}${t.dashboard.perDay}`}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.24 }}>
          <LeaderRow
            strong
            left={t.dashboard.projectedSpendOn(
              statement.monthEnd.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
            )}
            right={formatAmount(statement.forecastMonthSpend)}
          />
        </motion.div>
        <Rule />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: truffleEase, delay: 0.3 }}
          className="flex flex-col"
        >
          <div className="flex justify-between font-bold text-[15px] uppercase">
            <span>{t.dashboard.projectedClose}</span>
            <span>{signed(statement.projectedClose)}</span>
          </div>
          <span className="text-[11px] text-truffle-text2 uppercase">
            {statement.savedThisMonth !== 0 ? t.dashboard.projectedCloseHowSaved : t.dashboard.projectedCloseHow}
          </span>
        </motion.div>
        <p className="font-grotesk text-sm text-truffle-text2">{paceNote}</p>
      </section>

      {/* ── md+: design-spec statement card ── */}
      <section
        aria-label={t.dashboard.statement}
        className="slip hidden md:flex border border-truffle-border border-t-[6px] border-t-truffle-accent px-5 pt-[18px] pb-8 flex-col gap-3 text-sm"
      >
        <div className="flex justify-between text-[11px] font-bold tracking-[.1em] text-truffle-text2 uppercase">
          <span>{t.dashboard.statement} · {monthName}</span>
          <span>{stamp}</span>
        </div>

        {/* Income / Spent / Saved rows */}
        <div className="flex flex-col gap-2 text-[14px]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.06 }}>
            <LeaderRow
              left={t.dashboard.incomeThisMonth}
              right={<b className="text-truffle-positive whitespace-nowrap">↑ {formatAmount(statement.incomeThisMonth)}</b>}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.10 }}>
            <LeaderRow
              left={t.dashboard.spentThisMonth}
              right={<b className="whitespace-nowrap">↓ {formatAmount(statement.spentThisMonth)}</b>}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: truffleEase, delay: 0.14 }}>
            <LeaderRow
              left={t.dashboard.savedThisMonth}
              right={<b className="text-truffle-accent-ink whitespace-nowrap">→ {formatAmount(Math.max(statement.savedThisMonth, 0))}</b>}
            />
          </motion.div>
        </div>

        {/* Proportional bar */}
        {statement.incomeThisMonth > 0 && (
          <motion.div
            className="flex gap-[3px] h-[14px]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: truffleEase, delay: 0.18 }}
            style={{ transformOrigin: 'left' }}
          >
            <div className="bg-truffle-text" style={{ flex: statement.spentThisMonth }} />
            <div
              className="bg-truffle-accent border-2 border-truffle-accent-edge box-border"
              style={{ flex: Math.max(statement.savedThisMonth, 0) }}
            />
            {statement.incomeThisMonth - statement.spentThisMonth - Math.max(statement.savedThisMonth, 0) > 0 && (
              <div
                className="border-2 border-dashed border-truffle-text2 box-border"
                style={{
                  flex: statement.incomeThisMonth - statement.spentThisMonth - Math.max(statement.savedThisMonth, 0),
                }}
              />
            )}
          </motion.div>
        )}

        {/* Dashed rule */}
        <div className="border-t border-dashed border-truffle-text2" />

        {/* Projected close — large number */}
        <motion.div
          className="flex justify-between items-baseline gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: truffleEase, delay: 0.26 }}
        >
          <span className="text-[12px] font-bold tracking-[.1em] uppercase">
            {t.dashboard.projectedClose}
          </span>
          <span className="text-[32px] xl:text-[40px] font-bold tracking-[-.02em] whitespace-nowrap">
            {statement.projectedClose >= 0 ? '+' : MINUS}{formatAmount(statement.projectedClose)}
          </span>
        </motion.div>

        {/* Pace text */}
        <motion.span
          className={`text-[11px] font-bold uppercase ${
            statement.pace === 'ahead' ? 'text-truffle-positive'
            : statement.pace === 'behind' ? 'text-truffle-warning'
            : 'text-truffle-text2'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: truffleEase, delay: 0.32 }}
        >
          ● {paceNote} · {formatAmount(statement.dailyRate)}/{t.dashboard.perDay.trim()} · {t.insights.hero.dayOf(dayOfMonth, daysInMonth)}
        </motion.span>
      </section>
    </>
  )
}
