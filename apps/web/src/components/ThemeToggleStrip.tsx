'use client'

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
            className={`h-11 flex flex-col items-center justify-center gap-px rounded-lg text-[10px] font-bold tracking-[.06em] cursor-pointer transition-colors ${
              active
                ? 'bg-truffle-accent text-[#1b1a18] border border-truffle-accent-edge shadow-[0_4px_0_var(--t-accent-edge)]'
                : 'bg-truffle-card text-truffle-text border border-truffle-border shadow-[0_4px_0_var(--t-border)]'
            } active:translate-y-1 active:shadow-none`}
          >
            <span className="text-[13px] leading-none">{glyph}</span>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
