'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { toDateLocale } from '@/lib/date'
import { formatRange, RecapSheet, useRecap } from './RecapSheet'

interface WeeklySummaryProps {
  userId: string
  name?: string
}

// Waveform silhouette for the recap key.
const WAVE = [8, 14, 22, 12, 28, 18, 32, 20, 14, 26, 34, 22, 16, 28, 12, 20, 30, 18, 10, 22, 14, 8, 16, 10]
const SEEN_KEY = 'truffle_weekly_summary'

/** The week's recap card on Home. Shows once per ISO week; swipe to tear it off. */
export function WeeklySummary({ userId, name }: WeeklySummaryProps) {
  const { t, locale } = useLanguage()
  const recap = useRecap(userId, name)
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!recap) return
    const key = `${recap.facts.to.getFullYear()}-W${recap.facts.week}`
    let seen: string | null = null
    try {
      seen = localStorage.getItem(SEEN_KEY)
    } catch {
      // storage blocked — show it this time
    }
    if (seen === key) return
    setVisible(true)
    try {
      localStorage.setItem(SEEN_KEY, key)
    } catch {
      // storage blocked — fine
    }
  }, [recap])

  if (!recap) return null

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.section
            key="recap"
            aria-label={t.recap.title(recap.facts.week)}
            className="paper mx-4 mt-4 px-[18px] py-4 flex flex-col gap-3 border-t-[6px] border-truffle-accent touch-pan-y"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 110) setVisible(false)
            }}
            exit={{ x: 380, rotate: 4, opacity: 0, transition: { duration: 0.25 } }}
          >
            <div className="flex justify-between items-center text-xs text-truffle-text2 uppercase">
              <span>{t.recap.title(recap.facts.week)}</span>
              <span className="flex items-center gap-2">
                {formatRange(recap.facts.from, recap.facts.to, toDateLocale(locale))}
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  aria-label={t.weeklySummary.dismiss}
                  className="-my-3 -mr-2 w-8 h-8 grid place-items-center hover:text-truffle-text"
                >
                  ✕
                </button>
              </span>
            </div>
            <p className="m-0 font-grotesk text-lg leading-[1.35]">{recap.cardLine}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="key key-ink key-3 h-12 px-4 text-[13px] uppercase flex-none"
              >
                ▶ {t.weeklySummary.readAloud}
              </button>
              <div aria-hidden className="flex-1 flex items-center gap-0.5 h-7">
                {WAVE.map((h, i) => (
                  <div key={i} className="flex-1 bg-truffle-text2" style={{ height: h, maxHeight: 28 }} />
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && <RecapSheet userId={userId} recap={recap} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
