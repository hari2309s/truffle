'use client'

import { APP_URL, Eyebrow, Line } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Pricing() {
  const { t } = useLanguage()
  const p = t.pricing

  return (
    <section id="pricing" className="pt-[clamp(64px,8cqi,128px)] px-[clamp(16px,5.5cqi,80px)]">
      <div className="max-w-[960px] mx-auto flex flex-col gap-[clamp(28px,3cqi,48px)]">
        <div className="flex flex-col gap-3.5 items-center text-center">
          <Eyebrow>{p.sectionLabel}</Eyebrow>
          <h2 className="m-0 font-grotesk font-medium text-[clamp(34px,4.4cqi,64px)] leading-[1.02] tracking-[-.025em]">
            {p.headline}
          </h2>
          <p className="m-0 font-grotesk text-[clamp(16px,1.3cqi,19px)] leading-normal text-truffle-text2">
            {p.subheadline}
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-[clamp(20px,3cqi,40px)] items-start">
          {/* FREE */}
          <div className="slip-drop">
            <div className="slip pt-7 px-6 pb-11 flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-baseline">
                <h3 className="m-0 text-lg font-bold tracking-[.2em] uppercase">{p.free.name}</h3>
                <span className="font-grotesk text-[15px] text-truffle-text2">{p.free.period}</span>
              </div>
              <span className="text-[52px] font-bold leading-none">{p.free.price}</span>
              <div aria-hidden className="rule my-1" />
              <ul className="flex flex-col gap-3">
                {p.free.features.map((f) => (
                  <li key={f}>
                    <Line
                      label={f}
                      value={<span aria-label="included">✓</span>}
                      valueClassName="text-truffle-positive font-bold"
                    />
                  </li>
                ))}
              </ul>
              <div aria-hidden className="rule my-1" />
              <div className="flex justify-between text-base font-bold tracking-[.06em] uppercase">
                <span>{p.free.total.label}</span>
                <span>{p.free.total.value}</span>
              </div>
              <a href={APP_URL} className="key key-accent mt-2 h-14 text-[15px]">
                {p.free.cta}
              </a>
            </div>
          </div>

          {/* PRO */}
          <div className="slip-drop">
            <div className="slip relative border-t-[6px] border-truffle-accent pt-[22px] px-6 pb-11 flex flex-col gap-3 text-sm">
              <div
                aria-hidden
                className="absolute right-[18px] top-[58px] -rotate-[9deg] border-2 border-truffle-accent-ink text-truffle-accent-ink py-1 px-2.5 text-[13px] font-bold tracking-[.16em] uppercase opacity-90"
              >
                {p.pro.badge}
              </div>
              <div className="flex justify-between items-baseline">
                <h3 className="m-0 text-lg font-bold tracking-[.2em] uppercase">
                  {p.pro.name}
                  <span className="sr-only"> ({p.pro.badge})</span>
                </h3>
                <span className="font-grotesk text-[15px] text-truffle-text2">{p.pro.period}</span>
              </div>
              <span className="text-[52px] font-bold leading-none text-truffle-text2">
                {p.pro.price}
              </span>
              <div aria-hidden className="rule my-1" />
              <ul className="flex flex-col gap-3">
                {p.pro.features.map((f, i) => (
                  <li key={f}>
                    <Line
                      label={f}
                      value={<span aria-label={i === 0 ? 'included' : 'added'}>{i === 0 ? '✓' : '+'}</span>}
                      valueClassName="font-bold"
                    />
                  </li>
                ))}
              </ul>
              <div aria-hidden className="rule my-1" />
              <div className="flex justify-between text-base font-bold tracking-[.06em] uppercase">
                <span>{p.pro.total.label}</span>
                <span>{p.pro.total.value}</span>
              </div>
              <a href="#" className="key key-ink mt-2 h-14 text-[15px]">
                {p.pro.cta}
              </a>
            </div>
          </div>
        </div>

        <p className="m-0 text-center text-xs leading-[1.7] tracking-[.04em] uppercase text-truffle-text2">
          {p.finePrint}
        </p>
      </div>
    </section>
  )
}
