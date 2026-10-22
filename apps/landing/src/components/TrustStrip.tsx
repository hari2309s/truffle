'use client'

import { useLanguage } from '@/contexts/LanguageContext'

/** The trust badges as one perforated receipt line of ✓ items. */
export default function TrustStrip() {
  const { t } = useLanguage()

  return (
    <div className="bg-truffle-surface border-y-2 border-dashed border-truffle-border py-5 px-[clamp(16px,5.5cqi,80px)]">
      <ul className="max-w-[1280px] mx-auto grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-x-8 gap-y-3 text-xs font-bold tracking-[.08em] uppercase">
        {t.trustStrip.badges.map((badge) => (
          <li key={badge} className="flex gap-2 min-h-7 items-center">
            <span>{badge}</span>
            <span aria-hidden className="leader !mb-0 mt-1.5 self-center" />
            <span className="text-truffle-positive" aria-label="yes">
              ✓
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
