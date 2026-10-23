'use client'

import { useEffect, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Transaction } from '@truffle/types'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { toDateLocale } from '@/lib/date'
import { LeaderRow, MINUS } from './Tally'

interface Props {
  transactions: Transaction[]
  /** When set, the heatmap opens on this month instead of the current one. */
  month?: { year: number; month: number }
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Maps absolute spend to a 0–4 bucket relative to the month's max-spend day
function heatBucket(spend: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (spend === 0 || max === 0) return 0
  const r = spend / max
  if (r < 0.2) return 1
  if (r < 0.45) return 2
  if (r < 0.75) return 3
  return 4
}

// Explicit lookup so the full class strings are statically present for Tailwind
const HEAT_BG: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-truffle-h0',
  1: 'bg-truffle-h1',
  2: 'bg-truffle-h2',
  3: 'bg-truffle-h3',
  4: 'bg-truffle-h4',
}

/** CAL · by day — the month as a grid of spend intensity. */
export function SpendingHeatmap({ transactions, month }: Props) {
  const { formatAmount } = useCurrency()
  const { t, locale } = useLanguage()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const dateLocale = toDateLocale(locale)

  const [viewYear, setViewYear] = useState(month?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(month?.month ?? today.getMonth() + 1) // 1-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Sync with parent month prop when it changes
  useEffect(() => {
    if (month) {
      setViewYear(month.year)
      setViewMonth(month.month)
      setSelectedDate(null)
    }
  }, [month?.year, month?.month])

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  // Convert JS Sun=0 → Mon-first offset (Mon=0 … Sun=6)
  const firstDayJS = new Date(viewYear, viewMonth - 1, 1).getDay()
  const leadingBlanks = (firstDayJS + 6) % 7

  const { dayMap, maxSpend, peakDay } = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`
    const map = new Map<string, { spend: number; txs: Transaction[] }>()

    for (const tx of transactions) {
      if (!tx.date.startsWith(prefix) || tx.amount >= 0) continue
      const eur = Math.abs(tx.amount)
      const entry = map.get(tx.date)
      if (entry) {
        entry.spend += eur
        entry.txs.push(tx)
      } else {
        map.set(tx.date, { spend: eur, txs: [tx] })
      }
    }

    let max = 0
    let peak: string | null = null
    for (const [date, v] of map) {
      if (v.spend > max) {
        max = v.spend
        peak = date
      }
    }

    return { dayMap: map, maxSpend: max, peakDay: peak }
  }, [transactions, viewYear, viewMonth])

  function navigate(delta: number) {
    let m = viewMonth + delta
    let y = viewYear
    if (m > 12) {
      m = 1
      y++
    }
    if (m < 1) {
      m = 12
      y--
    }
    setViewMonth(m)
    setViewYear(y)
    setSelectedDate(null)
  }

  const selectedData = selectedDate ? (dayMap.get(selectedDate) ?? null) : null

  // Build flat cell list: null = blank leading cell, number = day-of-month
  const cells: Array<number | null> = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthLabel = new Date(viewYear, viewMonth - 1).toLocaleString(dateLocale, {
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-truffle-text2 uppercase">
        {month ? (
          <span className="min-w-[72px]">{monthLabel}</span>
        ) : (
          <span className="flex items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t.insights.previousMonth}
              className="w-8 h-8 -ml-2 grid place-items-center text-base hover:text-truffle-text"
            >
              ‹
            </button>
            <span className="min-w-[72px] text-center">{monthLabel}</span>
            <button
              type="button"
              onClick={() => navigate(1)}
              disabled={isCurrentMonth}
              aria-label={t.insights.nextMonth}
              className="w-8 h-8 grid place-items-center text-base hover:text-truffle-text disabled:opacity-25"
            >
              ›
            </button>
          </span>
        )}
        {peakDay && (
          <span>{t.insights.peak(Number(peakDay.slice(8, 10)), formatAmount(maxSpend))}</span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-truffle-text2">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />

          const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const data = dayMap.get(dateStr)
          const bucket = heatBucket(data?.spend ?? 0, maxSpend)
          const isToday = dateStr === todayStr
          const isSelected = selectedDate === dateStr
          const isFuture = dateStr > todayStr

          if (isFuture) {
            return (
              <div
                key={dateStr}
                className="h-[38px] md:h-[46px] xl:h-[52px] grid place-items-center text-[11px] font-bold text-truffle-text2 border border-dashed border-truffle-border"
              >
                {day}
              </div>
            )
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              aria-pressed={isSelected}
              aria-label={`${day}: ${data ? formatAmount(data.spend) : t.insights.noSpending}`}
              className={`h-[38px] md:h-[46px] xl:h-[52px] flex items-center justify-center gap-px text-[11px] font-bold ${HEAT_BG[bucket]} ${
                bucket >= 3 ? 'text-truffle-on-heat' : 'text-truffle-text'
              } ${isToday ? 'border-2 border-truffle-text' : 'border border-transparent'} ${
                isSelected ? 'outline outline-2 outline-offset-1 outline-truffle-accent-ink' : ''
              }`}
            >
              {day}
              {bucket === 4 ? '•' : ''}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1 text-[10px] text-truffle-text2 uppercase">
        {t.insights.low}
        {([0, 1, 2, 3, 4] as const).map((b) => (
          <div key={b} className={`w-[22px] h-2.5 border border-truffle-border ${HEAT_BG[b]}`} />
        ))}
        {t.insights.high} · • {t.insights.busiest}
      </div>

      {dayMap.size === 0 && (
        <p className="font-grotesk text-sm text-truffle-text2">{t.insights.calEmpty}</p>
      )}

      <AnimatePresence initial={false}>
        {selectedDate && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedDate}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="rule-soft pt-2 flex flex-col gap-1.5"
              >
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString(dateLocale, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span>{selectedData ? formatAmount(selectedData.spend) : '—'}</span>
                </div>
                {selectedData ? (
                  [...selectedData.txs]
                    .sort((a, b) => a.amount - b.amount)
                    .map((tx) => (
                      <LeaderRow
                        key={tx.id}
                        className="text-xs"
                        left={<span className="block truncate">{tx.description}</span>}
                        right={`${MINUS}${formatAmount(tx.amount)}`}
                      />
                    ))
                ) : (
                  <p className="font-grotesk text-sm text-truffle-text2">{t.insights.nothingLogged}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
