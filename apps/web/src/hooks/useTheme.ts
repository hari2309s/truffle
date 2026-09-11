import { useEffect, useState } from 'react'
import { THEME_COLORS } from '@/lib/themeColors'

export type Theme = 'dark' | 'light' | 'system'

const THEMES: Theme[] = ['dark', 'light', 'system']
const STORAGE_KEY = 'truffle-theme'

function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme !== 'system') return theme
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (theme !== 'system') root.classList.add(theme)

  // The `<meta name="theme-color">` tag drives the browser tab/address-bar
  // and PWA title-bar color — it doesn't follow our CSS classes on its own,
  // so it needs updating explicitly whenever the resolved theme changes.
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute('content', THEME_COLORS[resolveTheme(theme)])
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark'
    setTheme(stored)
    applyTheme(stored)
  }, [])

  // When following the OS ("system"), keep the tab color live as the OS
  // scheme flips while the app is open — CSS handles the page itself via
  // `prefers-color-scheme`, but the theme-color meta tag needs a nudge.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? 'dark'
    setTheme(next)
    applyTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return { theme, cycleTheme }
}
