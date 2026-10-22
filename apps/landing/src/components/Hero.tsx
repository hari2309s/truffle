'use client'

import { useState } from 'react'
import { APP_URL, Line } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'

/** Print-in with the hero's stretched stagger (90ms a line). */
const at = (ms: number, duration = 300) => ({
  animation: `tl-print ${duration}ms ease-out ${ms}ms both`,
})

export default function Hero() {
  const { t } = useLanguage()
  const m = t.hero.mockup
  // Bumping the key remounts the slip, replaying the print sequence.
  const [printRun, setPrintRun] = useState(0)

  return (
    <section className="pt-[clamp(32px,6cqi,96px)] px-[clamp(16px,5.5cqi,80px)] pb-[clamp(56px,8cqi,120px)]">
      <div className="max-w-[1280px] mx-auto grid grid-cols-[repeat(auto-fit,minmax(min(100%,520px),1fr))] gap-[clamp(40px,5cqi,80px)] items-center">
        <div className="flex flex-col gap-6">
          <div className="self-start flex items-center gap-2.5 py-2 px-3 bg-truffle-card border border-truffle-border text-xs font-bold tracking-[.14em] uppercase">
            <span
              aria-hidden
              className="w-2 h-2 bg-truffle-accent border border-truffle-accent-edge"
            />
            {t.hero.badge}
          </div>
          <h1 className="m-0 font-grotesk font-medium text-[clamp(44px,7cqi,100px)] leading-none tracking-[-.03em] [text-wrap:balance]">
            {t.hero.headlineWords.map((w, i) => (
              <span key={i}>
                {i > 0 && ' '}
                {w.amber ? <span className="mark">{w.text}</span> : w.text}
              </span>
            ))}
          </h1>
          <p className="m-0 font-grotesk text-[clamp(17px,1.45cqi,21px)] leading-normal text-truffle-text2 max-w-[540px] [text-wrap:pretty]">
            {t.hero.subheadline}
          </p>
          <div className="flex flex-wrap gap-x-3.5 gap-y-3 pt-1">
            <a
              href={APP_URL}
              className="key key-accent flex-[1_1_200px] max-w-[280px] h-[60px] px-6 text-[15px]"
            >
              {t.hero.getStartedFree}
            </a>
            <a
              href="#how-it-works"
              className="key key-plain flex-[1_1_200px] max-w-[280px] h-[60px] px-6 text-[15px]"
            >
              {t.hero.seeHowItWorks}
            </a>
          </div>
          <div className="text-xs tracking-[.08em] uppercase text-truffle-text2">
            {t.hero.socialProof}
          </div>
        </div>

        <div className="justify-self-center w-full max-w-[460px] flex flex-col gap-4 p-[clamp(16px,2cqi,28px)] bg-truffle-surface border border-truffle-border">
          <div className="flex justify-between items-center text-[11px] font-bold tracking-[.1em] uppercase text-truffle-text2">
            <span>{m.label}</span>
            <button
              type="button"
              onClick={() => setPrintRun((n) => n + 1)}
              className="min-h-8 flex items-center gap-1.5 uppercase hover:text-truffle-text"
            >
              {m.reprint}
            </button>
          </div>

          <div key={printRun} className="flex flex-col gap-4" aria-live="off">
            <div
              className="self-end max-w-[88%] bg-truffle-text text-truffle-bg rounded-lg py-3 px-3.5 font-grotesk text-base leading-[1.4]"
              style={at(0, 320)}
            >
              {m.question}
            </div>

            <div className="relative pt-2.5">
              {/* Last week's slip, tucked behind at an angle. */}
              <div
                aria-hidden
                className="absolute left-[22px] -right-1.5 top-0 bottom-10 origin-top-left rotate-[2.4deg] slip-drop"
                style={at(500, 320)}
              >
                <div className="slip h-full py-3.5 px-[18px] flex flex-col gap-1.5 text-xs text-truffle-text2">
                  <span className="uppercase">{m.prevSlipLabel}</span>
                  <Line label={m.prevSlipTotal.label} value={m.prevSlipTotal.value} />
                </div>
              </div>

              <div className="relative slip-drop">
                <div className="slip pt-[18px] px-5 pb-8 flex flex-col gap-2.5 text-sm">
                  <div
                    className="flex justify-between text-[11px] text-truffle-text2 uppercase"
                    style={at(700)}
                  >
                    <span>{m.forLine}</span>
                    <span>{m.stamp}</span>
                  </div>
                  <div className="rule" style={at(790)} />
                  <span
                    className="text-xs font-bold tracking-[.12em] uppercase"
                    style={at(880)}
                  >
                    {m.heading}
                  </span>
                  {m.lines.map((line, i) => (
                    <div key={line.label} style={at(970 + i * 90)}>
                      <Line
                        label={line.label}
                        value={line.value}
                        valueClassName="font-bold"
                        className="!gap-2"
                      />
                    </div>
                  ))}
                  <div className="rule" style={at(1150)} />
                  <div
                    className="flex justify-between items-baseline"
                    style={at(1240)}
                  >
                    <span className="text-base font-bold tracking-[.08em] uppercase">
                      {m.total.label}
                    </span>
                    <span className="text-[clamp(24px,2.4cqi,30px)] font-bold">
                      {m.total.value}
                    </span>
                  </div>
                  <span className="font-grotesk text-[15px] leading-[1.45]" style={at(1450)}>
                    <b className="font-mono text-xs text-truffle-warning">▲</b> {m.note}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <a href={APP_URL} className="key key-accent h-16 text-sm tracking-[.06em] uppercase">
            {t.hero.holdToSpeak}
          </a>
        </div>
      </div>
    </section>
  )
}
