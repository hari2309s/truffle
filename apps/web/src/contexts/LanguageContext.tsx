'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { type Locale, type Translations, translations } from '@/lib/i18n'

const STORAGE_KEY = 'truffle-locale'

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
  if (stored && stored in translations) return stored
  const browser = navigator.language.slice(0, 2).toLowerCase()
  if (browser === 'de') return 'de'
  if (browser === 'ja') return 'ja'
  return 'en'
}

interface LanguageContextValue {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  t: translations.en,
  setLocale: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(detectLocale())
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
  }

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
