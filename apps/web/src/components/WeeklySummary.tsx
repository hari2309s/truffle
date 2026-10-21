'use client'

import { useEffect, useState } from 'react'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { toDateLocale } from '@/lib/date'
import type { Translations } from '@/lib/i18n'

interface WeeklySummaryProps {
  userId: string
}

// Waveform silhouette for the recap key (static until it plays).
const WAVE = [8, 14, 22, 12, 28, 18, 32, 20, 14, 26, 34, 22, 16, 28, 12, 20, 30, 18, 10, 22, 14, 8, 16, 10]

function getISOWeek(date: Date): { key: string; week: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { key: `${d.getFullYear()}-W${week}`, week }
}

function buildSummary(
  transactions: { amount: number | string; category: string; date: string }[],
  ws: Translations['weeklySummary'],
  formatAmount: (n: number) => string = (n) => `€${Math.abs(n).toFixed(0)}`
): string | null {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  const weekTxs = transactions.filter((t) => new Date(t.date) >= weekAgo)
  if (weekTxs.length === 0) return null

  const income = weekTxs
    .filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0)
  const expenses = weekTxs
    .filter((t) => Number(t.amount) < 0)
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  const catTotals: Record<string, number> = {}
  for (const tx of weekTxs) {
    if (Number(tx.amount) < 0) {
      catTotals[tx.category] = (catTotals[tx.category] ?? 0) + Math.abs(Number(tx.amount))
    }
  }
  const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  const topLabel = topCategory.replace(/_/g, ' ')

  let text = ws.spent(formatAmount(expenses))
  if (income > 0) text += ws.earned(formatAmount(income))
  if (topLabel) text += ws.topCategory(topLabel)

  return text
}

/** "13–19 Oct", or "28 Sep–4 Oct" across a month boundary. */
function formatRange(from: Date, to: Date, dateLocale: string): string {
  const month = (d: Date) => d.toLocaleDateString(dateLocale, { month: 'short' })
  return from.getMonth() === to.getMonth()
    ? `${from.getDate()}–${to.getDate()} ${month(to)}`
    : `${from.getDate()} ${month(from)}–${to.getDate()} ${month(to)}`
}

export function WeeklySummary({ userId }: WeeklySummaryProps) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const [visible, setVisible] = useState(false)
  const [summaryText, setSummaryText] = useState<string | null>(null)
  const { speak, isSpeaking, cancel } = useTextToSpeech()

  const { data } = useTransactionsQuery(userId)

  useEffect(() => {
    if (!data?.transactions) return
    const currentWeek = getISOWeek(new Date()).key
    const lastSeen = localStorage.getItem('truffle_weekly_summary')
    if (lastSeen === currentWeek) return

    const text = buildSummary(data.transactions, t.weeklySummary, formatAmount)
    if (!text) return

    setSummaryText(text)
    setVisible(true)
    localStorage.setItem('truffle_weekly_summary', currentWeek)
  }, [data, t.weeklySummary])

  const handlePlay = () => {
    if (!summaryText) return
    if (isSpeaking) cancel()
    else speak(summaryText)
  }

  if (!visible || !summaryText) return null

  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  return (
    <section
      aria-label={t.weeklySummary.title}
      className="paper print-in mx-4 mt-4 px-[18px] py-4 flex flex-col gap-3 border-t-[6px] border-truffle-accent"
    >
      <div className="flex justify-between items-center text-xs text-truffle-text2 uppercase">
        <span>{t.weeklySummary.weekRecap(getISOWeek(today).week)}</span>
        <span className="flex items-center gap-2">
          {formatRange(weekAgo, today, toDateLocale(locale))}
          <button
            type="button"
            onClick={() => {
              cancel()
              setVisible(false)
            }}
            aria-label={t.weeklySummary.dismiss}
            className="-my-3 -mr-2 w-8 h-8 grid place-items-center hover:text-truffle-text"
          >
            ✕
          </button>
        </span>
      </div>
      <p className="font-grotesk text-lg leading-[1.35]">{summaryText}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlay}
          aria-pressed={isSpeaking}
          className="key key-ink key-3 h-12 px-4 text-[13px] uppercase flex-none"
        >
          {isSpeaking ? `■ ${t.weeklySummary.stop}` : `▶ ${t.weeklySummary.readAloud}`}
        </button>
        <div aria-hidden className="flex-1 flex items-center gap-0.5 h-7">
          {WAVE.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-truffle-text2"
              style={{
                height: h,
                maxHeight: 28,
                animation: isSpeaking
                  ? `tr-bar ${(0.7 + ((i * 7) % 5) * 0.12).toFixed(2)}s ease-in-out ${((i * 0.137) % 0.9).toFixed(2)}s infinite`
                  : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
