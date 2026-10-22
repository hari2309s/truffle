'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { translations, type Locale, type LandingTranslations } from '@/lib/i18n'

const STORAGE_KEY = 'truffle-locale'

/** The visitor's saved choice, else German for a German browser, else English. */
function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    // storage blocked — fall through to the browser language
  }
  if (stored && Object.hasOwn(translations, stored)) return stored as Locale
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  return preferred.some((l) => l?.toLowerCase().startsWith('de')) ? 'de' : 'en'
}

interface LanguageContextValue {
  locale: Locale
  t: LandingTranslations
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
    const detected = detectLocale()
    setLocaleState(detected)
    document.documentElement.lang = detected
  }, [])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage blocked — the choice still applies for this visit
    }
    document.documentElement.lang = next
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
