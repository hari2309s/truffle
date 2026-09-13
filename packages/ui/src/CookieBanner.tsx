'use client'

import { useEffect, useState } from 'react'

const CONSENT_KEY = 'truffle-cookie-consent'

export interface CookieBannerProps {
  message: string
  privacyLabel: string
  privacyHref: string
  /** True for a link that leaves the current app (adds target=_blank + rel). */
  privacyExternal?: boolean
  acceptLabel: string
  rejectLabel: string
  /** Extra side effect beyond the localStorage write — e.g. posthog.opt_in_capturing(). */
  onAccept?: () => void
  /** Extra side effect beyond the localStorage write — e.g. posthog.opt_out_capturing(). */
  onReject?: () => void
}

/**
 * Presentational — deliberately has no dependency on either app's
 * LanguageContext (each app has its own, with its own Translations type) or
 * analytics setup. Callers pass already-translated strings and any
 * consent-specific side effect as props.
 */
export function CookieBanner({
  message,
  privacyLabel,
  privacyHref,
  privacyExternal,
  acceptLabel,
  rejectLabel,
  onAccept,
  onReject,
}: CookieBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
  }, [])

  if (!visible) return null

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    onAccept?.()
    setVisible(false)
  }

  function reject() {
    localStorage.setItem(CONSENT_KEY, 'rejected')
    onReject?.()
    setVisible(false)
  }

  return (
    <div className="safe-bottom fixed bottom-0 inset-x-0 z-50 p-4 flex justify-center pointer-events-none">
      <div className="w-full max-w-lg bg-truffle-surface border border-truffle-border rounded-2xl shadow-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 pointer-events-auto">
        <p className="flex-1 text-xs text-truffle-muted leading-relaxed">
          {message}{' '}
          <a
            href={privacyHref}
            {...(privacyExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="text-truffle-amber hover:underline"
          >
            {privacyLabel}
          </a>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className="px-3 py-1.5 rounded-lg text-xs text-truffle-muted border border-truffle-border hover:text-truffle-text transition-colors"
          >
            {rejectLabel}
          </button>
          <button
            onClick={accept}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-truffle-amber text-truffle-bg hover:bg-truffle-amber-light transition-colors"
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
