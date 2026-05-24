'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { useLanguage } from '@/contexts/LanguageContext'

const CONSENT_KEY = 'truffle-cookie-consent'

export function CookieBanner() {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
  }, [])

  if (!visible) return null

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    posthog.opt_in_capturing()
    setVisible(false)
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, 'rejected')
    posthog.opt_out_capturing()
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 flex justify-center pointer-events-none">
      <div className="w-full max-w-lg bg-truffle-surface border border-truffle-border rounded-2xl shadow-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 pointer-events-auto">
        <p className="flex-1 text-xs text-truffle-muted leading-relaxed">
          {t.cookieBanner.message}{' '}
          <a
            href="https://truffle-landing-two.vercel.app/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-truffle-amber hover:underline"
          >
            {t.cookieBanner.privacyLabel}
          </a>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className="px-3 py-1.5 rounded-lg text-xs text-truffle-muted border border-truffle-border hover:text-truffle-text transition-colors"
          >
            {t.cookieBanner.reject}
          </button>
          <button
            onClick={accept}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-truffle-amber text-truffle-bg hover:bg-truffle-amber-light transition-colors"
          >
            {t.cookieBanner.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
