'use client'

import Image from 'next/image'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'

export default function LegalNav() {
  const { t, locale, setLocale } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)

  return (
    <header className="border-b border-truffle-border/60">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} />
          <span className="font-black text-lg tracking-tight">truffle</span>
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-truffle-text-secondary hover:text-truffle-text hover:bg-truffle-surface transition-all"
              aria-label="Select language"
            >
              <span>{LOCALE_LABELS[locale].flag}</span>
              <span className="hidden sm:inline">{LOCALE_LABELS[locale].label}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
                className="opacity-50"
              >
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
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-truffle-bg border border-truffle-border rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                  {(
                    Object.entries(LOCALE_LABELS) as [Locale, { flag: string; label: string }][]
                  ).map(([loc, { flag, label }]) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocale(loc)
                        setLangOpen(false)
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
                  ))}
                </div>
              </>
            )}
          </div>
          <a
            href="/"
            className="text-sm text-truffle-text-secondary hover:text-truffle-text transition-colors"
          >
            {t.legal.back}
          </a>
        </div>
      </div>
    </header>
  )
}
