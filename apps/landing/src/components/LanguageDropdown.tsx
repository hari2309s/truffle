'use client'

import { useEffect, useRef, useState } from 'react'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'

interface LanguageDropdownProps {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export default function LanguageDropdown({ locale, setLocale }: LanguageDropdownProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-truffle-text-secondary hover:text-truffle-text hover:bg-truffle-surface transition-all"
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{LOCALE_LABELS[locale].flag}</span>
        <span className="hidden sm:inline">{LOCALE_LABELS[locale].label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="opacity-50">
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute right-0 top-full mt-1 z-20 bg-truffle-bg border border-truffle-border rounded-xl shadow-lg overflow-hidden min-w-[120px]"
          >
            {(Object.entries(LOCALE_LABELS) as [Locale, { flag: string; label: string }][]).map(
              ([loc, { flag, label }]) => (
                <button
                  key={loc}
                  role="option"
                  aria-selected={locale === loc}
                  onClick={() => {
                    setLocale(loc)
                    setOpen(false)
                    triggerRef.current?.focus()
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    locale === loc
                      ? 'text-truffle-amber bg-truffle-amber/10'
                      : 'text-truffle-text-secondary hover:text-truffle-text hover:bg-truffle-surface'
                  }`}
                >
                  <span>{flag}</span>
                  <span>{label}</span>
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}
