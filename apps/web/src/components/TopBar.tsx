'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'
import { SettingsSheet } from './SettingsSheet'
import { signOut } from '@/lib/auth'

interface TopBarProps {
  subtitle?: string
  title?: string
  showControls?: boolean
  userId?: string
  children?: React.ReactNode
}

export function TopBar({
  subtitle = 'Ask me anything',
  title = 'Truffle',
  showControls = false,
  userId,
  children,
}: TopBarProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-4 border-b border-truffle-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Image src="/icons/truffle.png" alt="Truffle" width={28} height={28} priority />
          <div>
            <p className="font-semibold text-truffle-text text-sm">{title}</p>
            {subtitle && <p className="text-xs text-truffle-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="flex flex-1 items-center min-w-0">{children}</div>
        {showControls && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <ThemeToggle />
            {userId && (
              <button
                onClick={() => setShowSettings(true)}
                aria-label="Settings"
                className="p-2 text-truffle-muted hover:text-truffle-text transition-colors rounded-lg hover:bg-truffle-surface"
              >
                <GearIcon />
              </button>
            )}
            <button onClick={signOut} className="btn-ghost text-xs">
              Sign out
            </button>
          </div>
        )}
      </header>

      <AnimatePresence>
        {showSettings && userId && (
          <SettingsSheet userId={userId} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

function GearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
