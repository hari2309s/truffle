'use client'

import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import LanguageDropdown from './LanguageDropdown'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LegalNav() {
  const { t, locale, setLocale } = useLanguage()

  return (
    <header className="border-b border-truffle-border/60">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} />
          <span className="font-black text-lg tracking-tight">truffle</span>
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageDropdown locale={locale} setLocale={setLocale} />
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
