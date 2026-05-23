'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truffle-ivory.vercel.app'

export default function Nav() {
  const { t, locale, setLocale } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-truffle-bg/80 backdrop-blur-xl border-b border-truffle-border/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/icons/truffle.png"
            alt="Truffle"
            width={28}
            height={28}
            className="group-hover:scale-110 transition-transform duration-200"
          />
          <span className="font-black text-lg text-truffle-text tracking-tight">truffle</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-truffle-text-secondary">
          <a href="#features" className="hover:text-truffle-text transition-colors">
            {t.nav.features}
          </a>
          <a href="#how-it-works" className="hover:text-truffle-text transition-colors">
            {t.nav.howItWorks}
          </a>
          <a href="#pricing" className="hover:text-truffle-text transition-colors">
            {t.nav.pricing}
          </a>
        </div>

        {/* Actions */}
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
            href={APP_URL}
            className="hidden sm:block text-sm font-medium text-truffle-text-secondary hover:text-truffle-text transition-colors px-3 py-2"
          >
            {t.nav.signIn}
          </a>
          <a
            href={APP_URL}
            className="text-sm font-bold bg-truffle-amber text-truffle-bg px-4 py-2 rounded-xl hover:bg-truffle-amber-light active:scale-95 transition-all duration-150"
          >
            {t.nav.getStarted}
          </a>
        </div>
      </div>
    </motion.nav>
  )
}
