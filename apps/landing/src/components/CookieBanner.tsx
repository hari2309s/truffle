'use client'

import { CookieBanner as SharedCookieBanner } from '@truffle/ui'
import { useLanguage } from '@/contexts/LanguageContext'

/** Printed in flow above the nav, as a torn slip with an apricot top edge. */
export default function CookieBanner() {
  const { t } = useLanguage()

  return (
    <SharedCookieBanner
      title={t.cookieBanner.title}
      message={t.cookieBanner.message}
      privacyLabel={t.cookieBanner.privacyLabel}
      privacyHref="/privacy"
      acceptLabel={t.cookieBanner.accept}
      rejectLabel={t.cookieBanner.reject}
      classes={{
        root: 'pt-3 px-[clamp(12px,3vw,24px)] flex justify-center [filter:drop-shadow(0_4px_10px_var(--t-slip-shadow))]',
        panel:
          'w-full max-w-[760px] slip-sm border-t-[6px] border-truffle-accent pt-3.5 px-4 pb-[22px] flex flex-wrap items-center gap-x-5 gap-y-3',
        body: 'flex-[1_1_320px] flex flex-col gap-1',
        title: 'text-xs font-bold tracking-[.12em] uppercase',
        message: 'm-0 font-grotesk text-[15px] leading-[1.45]',
        link: 'underline underline-offset-2',
        reject: 'key key-plain h-11 px-[18px] text-[13px]',
        accept: 'key key-accent h-11 px-[18px] text-[13px]',
      }}
    />
  )
}
