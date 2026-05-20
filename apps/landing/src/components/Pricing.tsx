'use client'

import { motion } from 'framer-motion'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truffle-ivory.vercel.app'

const free = {
  name: 'Free',
  price: '€0',
  period: 'forever',
  description: 'Everything you need to get started. No card required.',
  features: [
    'Manual transaction entry',
    'AI chat — 50 messages/month',
    'Spending insights & heatmap',
    '3 savings goals',
    '2 savings habits',
    'CSV export — last 30 days',
  ],
  cta: 'Get Started Free',
  href: APP_URL,
  highlight: false,
}

const pro = {
  name: 'Pro',
  price: '€9',
  period: '/month',
  description: 'For people serious about taking control of their money.',
  badge: 'Coming Soon',
  features: [
    'Everything in Free',
    'Unlimited AI chat',
    'Receipt & PDF scanner',
    'Voice transcription',
    'Unlimited goals & habits',
    'Full history CSV export',
    'Monthly AI finance report',
  ],
  cta: 'Join Waitlist',
  href: '#',
  highlight: true,
}

export default function Pricing() {
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
          <p className="section-label mb-4">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-truffle-text mb-5">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-truffle-text-secondary max-w-md mx-auto">
            Start free. Upgrade when Truffle earns it.
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
            <PricingCardContent tier={free} />
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
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl bg-truffle-amber/[0.04]" />
            <div className="relative">
              <PricingCardContent tier={pro} />
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
          Pro tier in active development. Join the waitlist to be notified at launch and lock in
          early pricing.
        </motion.p>
      </div>
    </section>
  )
}

function PricingCardContent({ tier }: { tier: typeof free | typeof pro }) {
  const isPro = tier.highlight

  return (
    <>
      {/* Name + badge */}
      <div className="flex items-center gap-3 mb-2">
        <span className="font-black text-lg text-truffle-text">{tier.name}</span>
        {isPro && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-truffle-bg bg-truffle-amber px-2.5 py-0.5 rounded-full">
            {(tier as typeof pro).badge}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-truffle-text-secondary mb-6 leading-relaxed">{tier.description}</p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-8">
        <span
          className={`text-5xl font-black ${isPro ? 'text-truffle-amber' : 'text-truffle-text'}`}
        >
          {tier.price}
        </span>
        <span className="text-truffle-muted text-sm">{tier.period}</span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-truffle-text-secondary">
            <CheckIcon amber={isPro} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={tier.href}
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
