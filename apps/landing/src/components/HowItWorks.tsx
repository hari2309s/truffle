'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HowItWorks() {
  const { t } = useLanguage()

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
          <p className="section-label mb-4">{t.howItWorks.sectionLabel}</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-truffle-text mb-5">
            {t.howItWorks.headline}
          </h2>
          <p className="text-lg text-truffle-text-secondary max-w-lg mx-auto">
            {t.howItWorks.subheadline}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
          {/* Connecting line — desktop */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hidden md:block absolute top-[27px] left-[calc(16.66%+28px)] right-[calc(16.66%+28px)] h-px bg-gradient-to-r from-truffle-amber/30 via-truffle-amber/70 to-truffle-amber/30 origin-left"
          />

          {t.howItWorks.steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.18, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="group relative flex flex-col items-center text-center md:items-start md:text-left"
            >
              <div className="relative mb-6 w-14 h-14 rounded-2xl bg-truffle-card border border-truffle-border group-hover:border-truffle-amber/40 flex items-center justify-center z-10 transition-colors duration-300 shadow-[0_0_0_0_rgba(232,168,78,0)] group-hover:shadow-[0_0_20px_-4px_rgba(232,168,78,0.3)]">
                <span className="font-black text-xl text-truffle-amber">{step.number}</span>
              </div>

              <h3 className="font-bold text-xl text-truffle-text mb-3 group-hover:text-truffle-amber/90 transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-truffle-text-secondary text-sm leading-relaxed mb-4">
                {step.desc}
              </p>

              <span className="inline-block text-xs text-truffle-amber/80 bg-truffle-amber/10 border border-truffle-amber/20 px-3 py-1 rounded-full font-medium group-hover:bg-truffle-amber/15 transition-colors duration-300">
                {step.detail}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
