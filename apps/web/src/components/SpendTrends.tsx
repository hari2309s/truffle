'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { SpendTrend } from '@truffle/types'
import { CATEGORY_EMOJI } from '@/lib/categories'
import { truffleEase, transitionSnappy } from '@/lib/motion'
import { LeaderRow } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { setChatHandoff } from '@/lib/chatHandoff'

/* ── Compact card for the Home 2×2 grid ── */

export function HomeSpendTrends({ trends }: { trends: SpendTrend[] }) {
  const router = useRouter()
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()

  if (trends.length === 0) return null

  return (
    <div className="slip border border-truffle-border px-5 pt-4 pb-[30px] flex flex-col gap-1">
      <div className="flex justify-between items-baseline pb-1.5">
        <span className="text-[11px] font-bold tracking-[.1em]">
          {t.insights.trends.title.toUpperCase()} · {trends.length}
        </span>
        <button
          type="button"
          onClick={() => router.push('/insights')}
          className="text-[11px] font-bold tracking-[.1em] text-truffle-accent-ink"
        >
          SEE ALL →
        </button>
      </div>
      {trends.slice(0, 3).map((trend, i) => (
        <TrendRowCompact key={trend.category} trend={trend} index={i} />
      ))}
    </div>
  )
}

function TrendRowCompact({ trend, index }: { trend: SpendTrend; index: number }) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const emoji = CATEGORY_EMOJI[trend.category] ?? '📦'
  const catName = t.categories[trend.category] ?? trend.category

  // Visual: proportional bar comparing current vs average
  const maxVal = Math.max(trend.currentSpend, trend.averageSpend)
  const currentPct = maxVal > 0 ? (trend.currentSpend / maxVal) * 100 : 0
  const avgPct = maxVal > 0 ? (trend.averageSpend / maxVal) * 100 : 0

  return (
    <motion.div
      className="flex flex-col gap-1.5 border-t border-dashed border-truffle-border pt-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSnappy, delay: index * 0.06 }}
    >
      <LeaderRow
        left={
          <span>
            {emoji} {catName}
          </span>
        }
        right={
          <span className="text-truffle-warning font-bold">
            {t.insights.trends.aboveUsual(Math.round(trend.changePct).toString())}
          </span>
        }
      />
      {/* Dual bar: current (warning) vs average (muted) */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="h-2 bg-truffle-warning border border-truffle-warning"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: truffleEase, delay: index * 0.06 + 0.1 }}
            style={{ width: `${currentPct}%`, transformOrigin: 'left', minWidth: '4px' }}
          />
          <span className="text-[10px] font-bold whitespace-nowrap">{formatAmount(trend.currentSpend)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 border border-dashed border-truffle-text2"
            style={{ width: `${avgPct}%`, minWidth: '4px' }}
          />
          <span className="text-[10px] text-truffle-text2 whitespace-nowrap">{formatAmount(trend.averageSpend)}</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Full card for the Insights "01 Review" section ── */

export function InsightsSpendTrends({ trends }: { trends: SpendTrend[] }) {
  const router = useRouter()
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()

  if (trends.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[10px] font-bold tracking-[.1em] text-truffle-text2 uppercase">
        {t.insights.trends.title}
      </span>
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {trends.slice(0, 4).map((trend, i) => (
          <TrendCardFull key={trend.category} trend={trend} index={i} />
        ))}
      </div>
    </div>
  )
}

function TrendCardFull({ trend, index }: { trend: SpendTrend; index: number }) {
  const router = useRouter()
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const emoji = CATEGORY_EMOJI[trend.category] ?? '📦'
  const catName = t.categories[trend.category] ?? trend.category

  const maxVal = Math.max(trend.currentSpend, trend.averageSpend)
  const currentPct = maxVal > 0 ? (trend.currentSpend / maxVal) * 100 : 0
  const avgPct = maxVal > 0 ? (trend.averageSpend / maxVal) * 100 : 0

  const askTruffle = () => {
    setChatHandoff(
      `I've been spending a lot more on ${catName.toLowerCase()} than usual this month. What's going on and what should I do?`
    )
    router.push('/chat')
  }

  return (
    <motion.div
      className="bg-truffle-card border border-truffle-border border-l-[6px] border-l-truffle-warning px-3 py-3.5 flex flex-col gap-2.5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSnappy, delay: index * 0.06 }}
    >
      {/* Header */}
      <div className="flex justify-between items-baseline">
        <span className="font-bold text-[15px]">
          {emoji} {catName}
        </span>
        <span className="text-[11px] font-bold text-truffle-warning">
          ▲ {t.insights.trends.aboveUsual(Math.round(trend.changePct).toString())}
        </span>
      </div>

      {/* Dual bar comparison */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-truffle-text2 w-14 shrink-0">
            {t.insights.trends.thisMonth}
          </span>
          <motion.div
            className="h-3 bg-truffle-warning border border-truffle-warning"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: truffleEase, delay: index * 0.06 + 0.1 }}
            style={{ width: `${currentPct}%`, transformOrigin: 'left', minWidth: '4px' }}
          />
          <span className="text-[13px] font-bold whitespace-nowrap">{formatAmount(trend.currentSpend)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-truffle-text2 w-14 shrink-0">
            {t.insights.trends.usual}
          </span>
          <div
            className="h-3 border border-dashed border-truffle-text2"
            style={{ width: `${avgPct}%`, minWidth: '4px' }}
          />
          <span className="text-[13px] text-truffle-text2 whitespace-nowrap">{formatAmount(trend.averageSpend)}</span>
        </div>
      </div>

      {/* Extra: +€ delta */}
      <span className="text-[11px] font-bold text-truffle-text2">
        +{formatAmount(trend.absoluteDelta)} {t.insights.trends.vsAverage}
      </span>

      {/* CTA */}
      <button
        type="button"
        onClick={askTruffle}
        className="key key-line key-3 h-10 text-xs uppercase w-full"
      >
        {t.insights.trends.askTruffle}
      </button>
    </motion.div>
  )
}
