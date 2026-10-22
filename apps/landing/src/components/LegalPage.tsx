'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { TRUFFLE_ICON } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'

export interface LegalSection {
  /** Short section code, e.g. "COL" — the jump link label. */
  code: string
  heading: string
  body: React.ReactNode
}

interface LegalPageProps {
  eyebrow: string
  headline: string
  meta: string
  summary: string
  sections: LegalSection[]
  contactEmail: string
}

const sectionId = (code: string) => `sec-${code.toLowerCase()}`

/** Privacy / Terms template: one tall slip with a section-code index. */
export default function LegalPage({
  eyebrow,
  headline,
  meta,
  summary,
  sections,
  contactEmail,
}: LegalPageProps) {
  const { t } = useLanguage()
  const [active, setActive] = useState(sections[0]?.code ?? '')

  // The active code is the last section whose top has passed the upper third.
  useEffect(() => {
    const onScroll = () => {
      let current = sections[0]?.code ?? ''
      for (const s of sections) {
        const el = document.getElementById(sectionId(s.code))
        if (el && el.getBoundingClientRect().top <= window.innerHeight / 3) current = s.code
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  return (
    <div className="[container-type:inline-size] min-h-screen bg-truffle-bg text-truffle-text pb-16">
      <header className="flex items-center justify-between max-w-[1280px] mx-auto py-4 px-[clamp(16px,5.5cqi,80px)] border-b border-dashed border-truffle-border">
        <a href="/" className="flex items-center gap-2.5 min-h-11">
          <Image src={TRUFFLE_ICON} alt="" width={32} height={32} priority />
          <span className="text-[15px] font-bold tracking-[.16em] uppercase">Truffle</span>
        </a>
        <a href="/" className="key key-plain h-11 px-3.5 text-[13px]">
          {t.legal.home}
        </a>
      </header>

      <main className="max-w-[1120px] mx-auto pt-[clamp(32px,5cqi,72px)] px-[clamp(16px,5.5cqi,80px)] flex flex-col gap-[clamp(20px,3cqi,40px)]">
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold tracking-[.14em] uppercase text-truffle-accent-ink">
            {eyebrow}
          </span>
          <h1 className="m-0 font-grotesk font-medium text-[clamp(36px,5cqi,72px)] leading-[1.02] tracking-[-.025em]">
            {headline}
          </h1>
          <span className="text-xs tracking-[.06em] uppercase text-truffle-text2">{meta}</span>
        </div>

        {/* Narrow screens: the codes as a scrolling row of chips. */}
        <nav
          aria-label={t.legal.sectionsLabel}
          className="lg:hidden flex gap-1.5 overflow-x-auto pb-1"
        >
          {sections.map((s) => (
            <a
              key={s.code}
              href={`#${sectionId(s.code)}`}
              aria-current={active === s.code ? 'location' : undefined}
              className={`flex-none h-11 px-3 rounded-lg border border-truffle-border flex items-center text-xs font-bold uppercase ${
                active === s.code ? 'bg-truffle-text text-truffle-bg' : ''
              }`}
            >
              {s.code}
            </a>
          ))}
        </nav>

        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-10 items-start">
          <nav
            aria-label={t.legal.sectionsLabel}
            className="hidden lg:flex sticky top-6 flex-col gap-0.5 text-[13px]"
          >
            <span className="text-[11px] font-bold tracking-[.14em] uppercase text-truffle-text2 pb-2">
              {t.legal.sectionsLabel}
            </span>
            {sections.map((s, i) => {
              const isActive = active === s.code
              return (
                <a
                  key={s.code}
                  href={`#${sectionId(s.code)}`}
                  aria-current={isActive ? 'location' : undefined}
                  className={`flex gap-2 min-h-11 items-center px-2.5 font-bold uppercase ${
                    isActive ? 'bg-truffle-text text-truffle-bg' : ''
                  }`}
                >
                  <span>{s.code}</span>
                  <span
                    aria-hidden
                    className={`leader !mb-0 mt-1.5 self-center ${isActive ? '!border-truffle-text2' : ''}`}
                  />
                  <span>{String(i + 1).padStart(2, '0')}</span>
                </a>
              )
            })}
          </nav>

          <div className="slip-drop">
            <article className="slip pt-[clamp(22px,4cqi,56px)] px-[clamp(18px,4cqi,64px)] pb-[clamp(48px,5cqi,72px)] flex flex-col gap-7">
              <p className="m-0 font-grotesk text-[clamp(18px,1.5cqi,21px)] leading-[1.55] [text-wrap:pretty]">
                {summary}
              </p>
              {sections.map((s) => (
                <section
                  key={s.code}
                  id={sectionId(s.code)}
                  aria-labelledby={`${sectionId(s.code)}-h`}
                  className="rule pt-6 flex flex-col gap-3 scroll-mt-6"
                >
                  <div className="flex gap-2.5 items-baseline">
                    <span className="text-xs font-bold tracking-[.1em] uppercase py-[3px] px-2 bg-truffle-surface">
                      {s.code}
                    </span>
                    <h2
                      id={`${sectionId(s.code)}-h`}
                      className="m-0 font-grotesk text-[clamp(22px,2cqi,28px)] font-medium tracking-[-.01em]"
                    >
                      {s.heading}
                    </h2>
                  </div>
                  <div className="legal-body font-grotesk text-[17px] leading-[1.65] max-w-[68ch] flex flex-col gap-3 [text-wrap:pretty]">
                    {s.body}
                  </div>
                </section>
              ))}
              <div className="rule pt-4 flex justify-between flex-wrap gap-2 text-xs uppercase text-truffle-text2">
                <span>
                  {t.legal.questions('')}
                  <a href={`mailto:${contactEmail}`} className="underline underline-offset-2">
                    {contactEmail}
                  </a>
                </span>
                <span>{t.legal.endOfDocument}</span>
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  )
}
