'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import type { LandingTranslations } from '@/lib/i18n'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truffle-ivory.vercel.app'

export default function Pricing() {
  const { t } = useLanguage()

  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="section-label mb-4">{t.pricing.sectionLabel}</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-truffle-text mb-5">
            {t.pricing.headline}
          </h2>
          <p className="text-lg text-truffle-text-secondary max-w-md mx-auto">
            {t.pricing.subheadline}
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-truffle-card border border-truffle-border rounded-2xl p-8 flex flex-col"
          >
            <PricingCardContent tier={t.pricing.free} isPro={false} href={APP_URL} />
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="relative bg-truffle-card border border-truffle-amber/50 rounded-2xl p-8 flex flex-col shadow-[0_0_40px_-12px_rgba(232,168,78,0.25)]"
          >
            <div className="absolute inset-0 rounded-2xl bg-truffle-amber/[0.04]" />
            <div className="relative">
              <PricingCardContent tier={t.pricing.pro} isPro href="#" />
            </div>
          </motion.div>
        </div>

        {/* Fine print */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-10 text-sm text-truffle-muted"
        >
          {t.pricing.finePrint}
        </motion.p>
      </div>
    </section>
  )
}

type FreeTier = LandingTranslations['pricing']['free']
type ProTier = LandingTranslations['pricing']['pro']

function PricingCardContent({
  tier,
  isPro,
  href,
}: {
  tier: FreeTier | ProTier
  isPro: boolean
  href: string
}) {
  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <span className="font-black text-lg text-truffle-text">{tier.name}</span>
        {isPro && 'badge' in tier && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-truffle-bg bg-truffle-amber px-2.5 py-0.5 rounded-full">
            {tier.badge}
          </span>
        )}
      </div>

      <p className="text-sm text-truffle-text-secondary mb-6 leading-relaxed">{tier.description}</p>

      <div className="flex items-baseline gap-1 mb-8">
        <span
          className={`text-5xl font-black ${isPro ? 'text-truffle-amber' : 'text-truffle-text'}`}
        >
          €{isPro ? '9' : '0'}
        </span>
        <span className="text-truffle-muted text-sm">{tier.period}</span>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-truffle-text-secondary">
            <CheckIcon amber={isPro} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <a
        href={href}
        className={`block text-center font-bold py-3.5 rounded-xl transition-all duration-150 active:scale-95 text-sm ${
          isPro
            ? 'bg-truffle-amber text-truffle-bg hover:bg-truffle-amber-light'
            : 'border border-truffle-border text-truffle-text hover:border-truffle-muted hover:bg-truffle-surface'
        }`}
      >
        {tier.cta}
      </a>
    </>
  )
}

function CheckIcon({ amber }: { amber: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={amber ? 'var(--t-amber)' : 'var(--t-muted)'}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0 mt-0.5"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
