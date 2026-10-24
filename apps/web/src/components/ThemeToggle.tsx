'use client'

import { useTheme, type Theme } from '@/hooks/useTheme'

const LABELS: Record<Theme, string> = { dark: 'Dark', light: 'Light', system: 'System' }

// The key shows where a tap takes you next (dark → light → system → dark),
// like a light switch labelled with the state it flips to.
const NEXT_GLYPH: Record<Theme, string> = { dark: '☀', light: '◐', system: '☾' }

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, cycleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={(e) => cycleTheme(e)}
      title={`Theme: ${LABELS[theme]} — click to cycle`}
      aria-label={`Theme: ${LABELS[theme]} — click to cycle`}
      className={className ?? 'key-icon text-base'}
    >
      <span aria-hidden>{NEXT_GLYPH[theme]}</span>
    </button>
  )
}
