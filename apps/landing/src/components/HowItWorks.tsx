'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Sign up in seconds',
    desc: "Just your email. No credit card, no bank credentials, no form that takes ten minutes. You're in before your coffee gets cold.",
    detail: 'Passwordless magic link — no password to forget',
  },
  {
    number: '02',
    title: 'Log your spending your way',
    desc: "Type it, say it out loud, snap a receipt, or drop in a bank CSV. However you prefer — Truffle handles the rest.",
    detail: 'Text · Voice · Receipt photo · CSV import',
  },
  {
    number: '03',
    title: 'Ask anything, get real answers',
    desc: '"What did I spend last month?" "Can I afford this?" "Where is my money going?" Ask naturally, get clear answers — no dashboard diving.',
    detail: 'Context-aware AI that remembers your history',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 bg-truffle-surface/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <p className="section-label mb-4">How it works</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-truffle-text mb-5">
            Up and running in{' '}
            <span className="text-truffle-amber">three steps</span>
          </h2>
          <p className="text-lg text-truffle-text-secondary max-w-lg mx-auto">
            No onboarding call. No three-week integration. Just sign up and start talking.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
          {/* Connecting line — desktop */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeInOut' }}
            className="hidden md:block absolute top-[52px] left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-gradient-to-r from-truffle-amber/40 via-truffle-amber/70 to-truffle-amber/40 origin-left"
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative flex flex-col items-center text-center md:items-start md:text-left"
            >
              {/* Number badge */}
              <div className="relative mb-6 w-14 h-14 rounded-2xl bg-truffle-card border border-truffle-border flex items-center justify-center z-10">
                <span className="font-black text-xl text-truffle-amber">{step.number}</span>
              </div>

              {/* Content */}
              <h3 className="font-bold text-xl text-truffle-text mb-3">{step.title}</h3>
              <p className="text-truffle-text-secondary text-sm leading-relaxed mb-4">{step.desc}</p>

              {/* Detail chip */}
              <span className="inline-block text-xs text-truffle-amber/80 bg-truffle-amber/10 border border-truffle-amber/20 px-3 py-1 rounded-full font-medium">
                {step.detail}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
