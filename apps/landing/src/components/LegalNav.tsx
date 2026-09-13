import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import LanguageDropdown from './LanguageDropdown'
import { translations } from '@/lib/i18n'

// Server Component: ThemeToggle and LanguageDropdown are each already their
// own self-contained 'use client' islands (no props needed from here), so
// this shell — otherwise pure static markup — doesn't need to be a client
// component itself. Reads the translation table directly since there's only
// one supported locale today; if a second locale is added, this should read
// the resolved locale server-side (cookie/header) instead of hardcoding `en`.
const t = translations.en

export default function LegalNav() {
  return (
    <header className="border-b border-truffle-border/60">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} />
          <span className="font-black text-lg tracking-tight">truffle</span>
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageDropdown />
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
