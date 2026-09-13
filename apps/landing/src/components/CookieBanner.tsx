'use client'

import { CookieBanner as SharedCookieBanner } from '@truffle/ui'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CookieBanner() {
  const { t } = useLanguage()

  return (
    <SharedCookieBanner
      message={t.cookieBanner.message}
      privacyLabel={t.cookieBanner.privacyLabel}
      privacyHref="/privacy"
      acceptLabel={t.cookieBanner.accept}
      rejectLabel={t.cookieBanner.reject}
    />
  )
}
