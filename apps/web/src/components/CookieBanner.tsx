'use client'

import posthog from 'posthog-js'
import { CookieBanner as SharedCookieBanner } from '@truffle/ui'
import { useLanguage } from '@/contexts/LanguageContext'

export function CookieBanner() {
  const { t } = useLanguage()

  return (
    <SharedCookieBanner
      message={t.cookieBanner.message}
      privacyLabel={t.cookieBanner.privacyLabel}
      privacyHref="https://truffle-landing-two.vercel.app/privacy"
      privacyExternal
      acceptLabel={t.cookieBanner.accept}
      rejectLabel={t.cookieBanner.reject}
      onAccept={() => posthog.opt_in_capturing()}
      onReject={() => posthog.opt_out_capturing()}
      // Top of the screen: the bottom is primary controls throughout the app
      // (sign-in, the voice key, nav, sheet footers) and must never be covered.
      classes={{
        root: 'fixed top-0 inset-x-0 z-50 p-4 pt-[max(16px,env(safe-area-inset-top))] flex justify-center pointer-events-none',
        panel:
          'w-full max-w-lg paper border-t-[6px] border-truffle-accent px-4 py-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3 pointer-events-auto',
        message: 'font-grotesk text-[13px] leading-[1.45] text-truffle-text2',
        link: 'text-truffle-text underline underline-offset-2',
        reject: 'key key-line key-3 h-10 px-4 text-xs uppercase',
        accept: 'key key-accent key-3 h-10 px-4 text-xs uppercase',
      }}
    />
  )
}
