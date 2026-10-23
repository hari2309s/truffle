'use client'

import { motion } from 'framer-motion'
import { Eyebrow, Line } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'
import type { LandingTranslations } from '@/lib/i18n'
import {
  sectionVariants,
  staggerContainer,
  staggerItem,
  slipVariants,
  viewportOnce,
} from '@/lib/motion'

type Demo = LandingTranslations['features']['demo']

// Heat levels for the two-week strip in the REV fragment (0 = no spend).
const HEAT = [2, 1, 0, 3, 1, 2, 1, 0, 3, 2, 1, 2, 1, 4] as const
const HEAT_BG = ['bg-truffle-h0', 'bg-truffle-h1', 'bg-truffle-h2', 'bg-truffle-h3', 'bg-truffle-h4']
// Level-meter timings for the CHAT fragment: [duration, delay] in seconds.
const BARS = [
  [0.8, 0],
  [0.9, 0.1],
  [0.7, 0.2],
  [1, 0.05],
  [0.8, 0.3],
  [0.9, 0.15],
  [0.75, 0.25],
  [0.85, 0.35],
  [0.95, 0.12],
  [0.8, 0.22],
]

/** The small, real UI fragment printed under each feature. */
function Fragment({ index, demo }: { index: number; demo: Demo }) {
  switch (index) {
    case 0:
      return (
        <div
          aria-hidden
          className="h-[52px] rounded-lg bg-truffle-accent text-truffle-on-accent flex items-center gap-2.5 px-3.5 max-w-[340px]"
        >
          <span
            className="w-2 h-2 rounded-full bg-truffle-on-accent flex-none"
            style={{ animation: 'tl-dot 1s infinite' }}
          />
          <div className="flex-1 flex gap-[3px] items-center h-[26px]">
            {BARS.map(([d, delay], i) => (
              <div
                key={i}
                className="flex-1 h-full bg-truffle-on-accent"
                style={{ animation: `tl-bar ${d}s ease-in-out ${delay}s infinite` }}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold uppercase">{demo.listening}</span>
        </div>
      )
    case 1:
      return (
        <div className="max-w-[340px] bg-truffle-surface py-2.5 px-3.5 flex flex-col gap-1 text-[13px]">
          <Line
            label={demo.scanLine.label}
            value={demo.scanLine.value}
            valueClassName="font-bold"
            className="[&>.leader]:!mb-1 !gap-1.5"
          />
          <span className="text-[11px] font-bold uppercase text-truffle-positive">
            {demo.scanStatus}
          </span>
        </div>
      )
    case 2:
      return (
        <div className="max-w-[340px] flex flex-col gap-1.5">
          <div aria-hidden className="grid grid-cols-[repeat(14,1fr)] gap-0.5">
            {HEAT.map((level, i) => (
              <div
                key={i}
                className={`h-5 ${HEAT_BG[level]} ${level === 0 ? 'border border-truffle-border' : ''}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold uppercase text-truffle-warning">
            {demo.revStatus}
          </span>
        </div>
      )
    case 3:
      return (
        <div className="max-w-[340px] bg-truffle-surface border-t-[6px] border-truffle-accent pt-2.5 px-3.5 pb-3.5 flex flex-col gap-2 text-[13px]">
          <span className="text-[11px] font-bold uppercase text-truffle-accent-ink">
            {demo.goal.label}
          </span>
          <Line
            label={demo.goal.line.label}
            value={demo.goal.line.value}
            valueClassName="font-bold"
            className="[&>.leader]:!mb-1 !gap-1.5"
          />
          <div aria-hidden className="grid grid-cols-2 gap-2">
            <span className="key key-ink key-3 h-11 text-xs cursor-default">{demo.goal.create}</span>
            <span className="key key-plain key-3 h-11 text-xs cursor-default">{demo.goal.notNow}</span>
          </div>
        </div>
      )
    case 4:
      return (
        <div className="flex items-center gap-3.5 flex-wrap">
          <div aria-hidden className="flex gap-1">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className={`w-5 h-5 border-2 ${i < 6 ? 'bg-truffle-accent border-truffle-accent-edge' : 'border-truffle-border'}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold uppercase">{demo.habitStreak}</span>
        </div>
      )
    case 5:
      return (
        <div className="max-w-[340px] bg-truffle-surface py-2.5 px-3.5 flex flex-col gap-1 text-[13px]">
          {demo.privacy.map((row) => (
            <Line
              key={row.label}
              label={row.label}
              value={row.value}
              valueClassName="font-bold"
              className="[&>.leader]:!mb-1 !gap-1.5"
            />
          ))}
        </div>
      )
    case 6:
      return (
        <div className="max-w-[340px] bg-truffle-surface py-2.5 px-3.5 flex flex-col gap-1 text-[13px]">
          {demo.subscriptions.map((row) => (
            <Line
              key={row.label}
              label={row.label}
              value={row.value}
              className="[&>.leader]:!mb-1 !gap-1.5"
            />
          ))}
          <div className="rule my-0.5" />
          <div className="flex justify-between font-bold uppercase">
            <span>{demo.subscriptionsTotal.label}</span>
            <span>{demo.subscriptionsTotal.value}</span>
          </div>
        </div>
      )
    default:
      return (
        <div className="max-w-[340px] flex flex-col gap-1.5">
          <Line
            label={demo.budget.line.label}
            value={demo.budget.line.value}
            className="text-[13px] [&>.leader]:!mb-1 !gap-1.5"
          />
          <div aria-hidden className="grid grid-cols-10 gap-0.5">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`h-3.5 ${i < 8 ? 'bg-truffle-warning' : 'border border-truffle-border'}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold uppercase text-truffle-warning">
            {demo.budget.status}
          </span>
        </div>
      )
  }
}

export default function Features() {
  const { t } = useLanguage()
  const f = t.features

  return (
    <section id="features" className="pt-[clamp(64px,8cqi,128px)] px-[clamp(16px,5.5cqi,80px)]">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-[clamp(28px,3cqi,48px)]">
        {/* Section header */}
        <motion.div
          className="flex flex-col gap-3.5 max-w-[760px]"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <Eyebrow>{f.sectionLabel}</Eyebrow>
          <h2 className="m-0 font-grotesk font-medium text-[clamp(34px,4.4cqi,64px)] leading-[1.02] tracking-[-.025em] [text-wrap:balance]">
            {f.headline}
          </h2>
          <p className="m-0 font-grotesk text-[clamp(16px,1.3cqi,19px)] leading-normal text-truffle-text2">
            {f.subheadline}
          </p>
        </motion.div>

        {/* Features slip */}
        <motion.div
          className="slip-drop"
          variants={slipVariants}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <div className="slip pt-[clamp(18px,2.6cqi,40px)] px-[clamp(18px,3cqi,48px)] pb-[clamp(40px,4cqi,56px)]">
            <Line
              label={f.statementLabel}
              value={f.itemsCount}
              className="text-[13px] font-bold tracking-[.1em] uppercase pb-4"
            />
            <motion.ul
              className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,480px),1fr))] gap-x-14"
              variants={staggerContainer(0.07, 0.1)}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
            >
              {f.items.map((item, i) => (
                <motion.li
                  key={item.code}
                  variants={staggerItem}
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 py-6 border-t border-dashed border-truffle-text2"
                >
                  <span className="self-start py-[5px] text-center bg-truffle-surface text-xs font-bold tracking-[.06em] uppercase">
                    {item.code}
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="m-0 font-grotesk text-[clamp(20px,1.7cqi,24px)] font-medium">
                      {item.title}
                    </h3>
                    <p className="m-0 font-grotesk text-base leading-normal text-truffle-text2">
                      {item.desc}
                    </p>
                    <div className="mt-1.5">
                      <Fragment index={i} demo={f.demo} />
                    </div>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
            <div className="rule mt-2 pt-4 flex flex-wrap justify-between gap-2 text-[15px] font-bold tracking-[.06em] uppercase">
              <span>{f.total.label}</span>
              <span>{f.total.value}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
