'use client'

import { Fragment } from 'react'
import { motion } from 'framer-motion'
import { Eyebrow, Line } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  sectionVariants,
  slipVariants,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/motion'

export default function HowItWorks() {
  const { t } = useLanguage()
  const h = t.howItWorks

  return (
    <section
      id="how-it-works"
      className="pt-[clamp(64px,8cqi,128px)] px-[clamp(16px,5.5cqi,80px)]"
    >
      <div className="max-w-[1280px] mx-auto grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-[clamp(28px,4cqi,64px)] items-start">
        {/* Left column — headline */}
        <motion.div
          className="flex flex-col gap-3.5"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <Eyebrow>{h.sectionLabel}</Eyebrow>
          <h2 className="m-0 font-grotesk font-medium text-[clamp(34px,4.4cqi,64px)] leading-[1.02] tracking-[-.025em] [text-wrap:balance]">
            {h.headline}
          </h2>
          <p className="m-0 font-grotesk text-[clamp(16px,1.3cqi,19px)] leading-normal text-truffle-text2 max-w-[440px]">
            {h.subheadline}
          </p>
        </motion.div>

        {/* Right column — steps slip */}
        <motion.div
          className="slip-drop"
          variants={slipVariants}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <motion.div
            className="slip pt-[clamp(20px,2.6cqi,36px)] px-[clamp(18px,2.6cqi,36px)] pb-[clamp(40px,4cqi,52px)] flex flex-col gap-6"
            variants={staggerContainer(0.1, 0.15)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            {h.steps.map((step, i) => (
              <Fragment key={step.title}>
                {i > 0 && <div aria-hidden className="rule" />}
                <motion.div variants={staggerItem} className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold tracking-[.12em] uppercase text-truffle-accent-ink">
                    {h.stepLabel(i + 1, h.steps.length)}
                  </span>
                  <h3 className="m-0 font-grotesk text-[clamp(24px,2.2cqi,32px)] font-medium tracking-[-.015em]">
                    {step.title}
                  </h3>
                  <p className="m-0 font-grotesk text-[17px] leading-normal text-truffle-text2">
                    {step.desc}
                  </p>
                  <Line
                    label={step.meta.label}
                    value={step.meta.value}
                    className="text-xs text-truffle-text2 uppercase [&>.leader]:!mb-1"
                  />
                </motion.div>
              </Fragment>
            ))}
            <div aria-hidden className="rule" />
            <motion.div
              variants={staggerItem}
              className="flex justify-between text-[15px] font-bold tracking-[.06em] uppercase"
            >
              <span>{h.total.label}</span>
              <span>{h.total.value}</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
