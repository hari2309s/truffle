'use client'

import { LanguageProvider } from '@/contexts/LanguageContext'
import CookieBanner from './CookieBanner'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {children}
      <CookieBanner />
    </LanguageProvider>
  )
}
