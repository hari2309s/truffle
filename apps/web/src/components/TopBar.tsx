'use client'

import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'
import { supabase } from '@/lib/supabase'

interface TopBarProps {
  subtitle?: string
  title?: string
  showControls?: boolean
  children?: React.ReactNode
}

export function TopBar({
  subtitle = 'Ask me anything',
  title = 'Truffle',
  showControls = false,
  children,
}: TopBarProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
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
          <button onClick={handleSignOut} className="btn-ghost text-xs">
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
