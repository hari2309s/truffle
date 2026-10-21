'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'
import { SettingsSheet } from './SettingsSheet'
import { TRUFFLE_ICON } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'

interface TopBarProps {
  /** Right-hand keys — compose `<TopBar.ThemeToggle />` and `<TopBar.Settings userId={...} />`. */
  children?: React.ReactNode
}

/**
 * Brand bar: the truffle mark + wordmark, with optional keys on the right.
 * Pages render it outside their scroll container so it stays put on scroll.
 */
export function TopBar({ children }: TopBarProps) {
  return (
    <header className="flex justify-between items-center pt-[max(8px,env(safe-area-inset-top))] pr-4 pl-5 flex-shrink-0 min-h-[52px] bg-truffle-bg">
      <div className="flex items-center gap-2">
        <Image src={TRUFFLE_ICON} alt="" width={28} height={28} priority />
        <span className="text-[15px] font-bold tracking-[.16em] uppercase">Truffle</span>
      </div>
      {children && <div className="flex gap-1.5">{children}</div>}
    </header>
  )
}

TopBar.ThemeToggle = function TopBarThemeToggle() {
  return <ThemeToggle />
}

TopBar.Settings = function TopBarSettings({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        aria-label={t.topBar.settingsLabel}
        aria-haspopup="dialog"
        className="key-icon text-[13px]"
      >
        ···
      </button>
      <AnimatePresence>
        {showSettings && <SettingsSheet userId={userId} onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </>
  )
}
