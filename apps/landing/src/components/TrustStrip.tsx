'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { staggerContainer, staggerItem, viewportOnce } from '@/lib/motion'

/** The trust badges as one perforated receipt line of ✓ items. */
export default function TrustStrip() {
  const { t } = useLanguage()

  return (
    <div className="bg-truffle-surface border-y-2 border-dashed border-truffle-border py-5 px-[clamp(16px,5.5cqi,80px)]">
      <motion.ul
        className="max-w-[1280px] mx-auto grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-x-8 gap-y-3 text-xs font-bold tracking-[.08em] uppercase"
        variants={staggerContainer(0.05, 0.05)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
      >
        {t.trustStrip.badges.map((badge) => (
          <motion.li key={badge} variants={staggerItem} className="flex gap-2 min-h-7 items-center">
            <span>{badge}</span>
            <span aria-hidden className="leader !mb-0 mt-1.5 self-center" />
            <span className="text-truffle-positive" aria-label="yes">
              ✓
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}
