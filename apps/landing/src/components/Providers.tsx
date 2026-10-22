'use client'

import { LanguageProvider } from '@/contexts/LanguageContext'
import CookieBanner from './CookieBanner'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      {/* Above the page, in flow — it never covers the nav or a call to action. */}
      <CookieBanner />
      {children}
    </LanguageProvider>
  )
}
