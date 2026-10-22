'use client'

import { useEffect, useState } from 'react'

const CONSENT_KEY = 'truffle-cookie-consent'

export interface CookieBannerProps {
  /** Optional heading printed above the message. */
  title?: string
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
  /** Per-part class overrides, for apps whose design system differs from the default. */
  classes?: Partial<Record<'root' | 'panel' | 'body' | 'title' | 'message' | 'link' | 'reject' | 'accept', string>>
}

const DEFAULT_CLASSES = {
  root: 'safe-bottom fixed bottom-0 inset-x-0 z-50 p-4 flex justify-center pointer-events-none',
  panel:
    'w-full max-w-lg bg-truffle-surface border border-truffle-border rounded-2xl shadow-lg px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 pointer-events-auto',
  body: 'flex-1 flex flex-col gap-1',
  title: 'text-xs font-bold',
  message: 'flex-1 text-xs text-truffle-muted leading-relaxed',
  link: 'text-truffle-amber hover:underline',
  reject:
    'px-3 py-1.5 rounded-lg text-xs text-truffle-muted border border-truffle-border hover:text-truffle-text transition-colors',
  accept:
    'px-3 py-1.5 rounded-lg text-xs font-medium bg-truffle-amber text-truffle-bg hover:bg-truffle-amber-light transition-colors',
}

/**
 * Presentational — deliberately has no dependency on either app's
 * LanguageContext (each app has its own, with its own Translations type) or
 * analytics setup. Callers pass already-translated strings and any
 * consent-specific side effect as props.
 */
export function CookieBanner({
  title,
  message,
  privacyLabel,
  privacyHref,
  privacyExternal,
  acceptLabel,
  rejectLabel,
  onAccept,
  onReject,
  classes,
}: CookieBannerProps) {
  const cls = { ...DEFAULT_CLASSES, ...classes }
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // localStorage can throw (Safari private browsing, "Block all cookies",
    // storage-blocking extensions) — treat that as "no stored consent" so
    // the banner still shows instead of the effect crashing silently.
    let stored: string | null = null
    try {
      stored = localStorage.getItem(CONSENT_KEY)
    } catch {
      // ignore — stored stays null
    }
    if (!stored) setVisible(true)
  }, [])

  if (!visible) return null

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted')
    } catch {
      // storage blocked — still honor the click, just won't persist across reloads
    }
    onAccept?.()
    setVisible(false)
  }

  function reject() {
    try {
      localStorage.setItem(CONSENT_KEY, 'rejected')
    } catch {
      // storage blocked — still honor the click, just won't persist across reloads
    }
    onReject?.()
    setVisible(false)
  }

  const messageEl = (
    <p className={cls.message}>
      {message}{' '}
      <a
        href={privacyHref}
        {...(privacyExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={cls.link}
      >
        {privacyLabel}
      </a>
    </p>
  )

  return (
    <div className={cls.root}>
      <div className={cls.panel}>
        {title ? (
          <div className={cls.body}>
            <span className={cls.title}>{title}</span>
            {messageEl}
          </div>
        ) : (
          messageEl
        )}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className={cls.reject}
          >
            {rejectLabel}
          </button>
          <button
            onClick={accept}
            className={cls.accept}
          >
            {acceptLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
