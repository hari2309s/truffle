'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { APP_URL, TRUFFLE_ICON } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  slipVariants,
  sectionVariants,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from '@/lib/motion'

export default function FinalCTA() {
  const { t } = useLanguage()
  const c = t.finalCta

  return (
    <section className="pt-[clamp(72px,9cqi,144px)] px-[clamp(16px,5.5cqi,80px)] pb-[clamp(56px,7cqi,112px)]">
      <div className="max-w-[820px] mx-auto flex flex-col gap-[18px]">
        <motion.div
          className="slip-drop"
          variants={slipVariants}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <motion.div
            className="slip pt-[clamp(28px,4cqi,56px)] px-[clamp(20px,4cqi,56px)] pb-[clamp(44px,5cqi,64px)] flex flex-col items-center text-center gap-5"
            variants={staggerContainer(0.08, 0.12)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.div variants={staggerItem}>
              <Image src={TRUFFLE_ICON} alt="" width={56} height={56} />
            </motion.div>
            <motion.h2
              variants={staggerItem}
              className="m-0 font-grotesk font-medium text-[clamp(32px,4.6cqi,64px)] leading-[1.04] tracking-[-.025em] [text-wrap:balance]"
            >
              {c.headline} <span className="mark">{c.headlineAmber}</span>.
            </motion.h2>
            <motion.p
              variants={staggerItem}
              className="m-0 font-grotesk text-[clamp(16px,1.3cqi,19px)] leading-normal text-truffle-text2 max-w-[520px]"
            >
              {c.subheadline}
            </motion.p>
            <motion.a
              variants={staggerItem}
              href={APP_URL}
              className="key key-accent w-full max-w-[400px] h-[68px] text-base"
            >
              {c.cta}
            </motion.a>
            <div aria-hidden className="rule w-full mt-2" />
            <motion.div
              variants={staggerItem}
              className="w-full flex justify-between text-[clamp(16px,1.5cqi,20px)] font-bold tracking-[.1em] uppercase"
            >
              <span>{c.total.label}</span>
              <span>{c.total.value}</span>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.div
          aria-hidden
          className="flex items-center gap-2.5 text-truffle-text2 text-sm"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <span>✂</span>
          <span className="flex-1 border-t-2 border-dashed border-truffle-border" />
        </motion.div>
        <motion.p
          className="m-0 text-center text-xs tracking-[.08em] uppercase text-truffle-text2"
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {c.finePrint}
        </motion.p>
      </div>
    </section>
  )
}
