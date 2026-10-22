'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

type Theme = 'light' | 'system' | 'dark'

const STORAGE_KEY = 'truffle-theme'
// Several toggles can be mounted at once (desktop nav + mobile menu); this
// event keeps every instance showing the active choice.
const CHANGE_EVENT = 'truffle-theme-change'
const OPTIONS: { id: Theme; glyph: string }[] = [
  { id: 'light', glyph: '☀' },
  { id: 'system', glyph: '◐' },
  { id: 'dark', glyph: '☾' },
]

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (theme !== 'system') root.classList.add(theme)
}

/** Three-way segmented switch: light · system · dark. */
export default function ThemeToggle() {
  const { t } = useLanguage()
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      // storage blocked — fall back to the default
    }
    if (saved === 'light' || saved === 'dark' || saved === 'system') setTheme(saved)

    const onChange = (e: Event) => setTheme((e as CustomEvent<Theme>).detail)
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [])

  const choose = (next: Theme) => {
    applyTheme(next)
    setTheme(next)
    window.dispatchEvent(new CustomEvent<Theme>(CHANGE_EVENT, { detail: next }))
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage blocked — the choice still applies for this visit
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={t.nav.theme.label}
      className="flex p-[3px] border border-truffle-border rounded-lg bg-truffle-card"
    >
      {OPTIONS.map(({ id, glyph }) => {
        const selected = theme === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t.nav.theme[id]}
            title={t.nav.theme[id]}
            onClick={() => choose(id)}
            className={`w-9 h-9 rounded-md grid place-items-center text-sm ${
              selected ? 'bg-truffle-text text-truffle-bg' : 'text-truffle-text2'
            }`}
          >
            <span aria-hidden>{glyph}</span>
          </button>
        )
      })}
    </div>
  )
}
