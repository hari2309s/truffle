'use client'

import { motion } from 'framer-motion'
import { useTheme, type Theme } from '@/hooks/useTheme'

const ITEMS: { key: Theme; glyph: string; label: string }[] = [
  { key: 'dark', glyph: '☉', label: 'DARK' },
  { key: 'light', glyph: '◐', label: 'LIGHT' },
  { key: 'system', glyph: '☾', label: 'AUTO' },
]

/** Three key-style buttons for the desktop sidebar — active one gets accent. */
export function ThemeToggleStrip() {
  const { theme, switchTo } = useTheme()

  return (
    <div className="grid grid-cols-3 gap-1.5 pb-1">
      {ITEMS.map(({ key, glyph, label }) => {
        const active = theme === key
        return (
          <button
            key={key}
            type="button"
            onClick={(e) => switchTo(key, e)}
            aria-pressed={active}
            className={`relative h-11 flex flex-col items-center justify-center gap-px rounded-lg text-[10px] font-bold tracking-[.06em] cursor-pointer ${
              active
                ? 'text-[#1b1a18]'
                : 'bg-truffle-card text-truffle-text border border-truffle-border shadow-[0_4px_0_var(--t-border)]'
            } active:translate-y-1 active:shadow-none`}
          >
            {active && (
              <motion.span
                layoutId="theme-strip-active"
                className="absolute inset-0 rounded-lg bg-truffle-accent border border-truffle-accent-edge shadow-[0_4px_0_var(--t-accent-edge)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative text-[13px] leading-none">{glyph}</span>
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
