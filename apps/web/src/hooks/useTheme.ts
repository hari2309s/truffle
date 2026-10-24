import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light' | 'system'

const THEMES: Theme[] = ['dark', 'light', 'system']
const STORAGE_KEY = 'truffle-theme'
// The top of every screen renders `bg-truffle-bg` (--t-bg) — read that same CSS
// custom property for the tab/PWA chrome color instead of a hand-maintained
// hex table, so the two can never drift apart. Works for 'system' too: with
// no .dark/.light class set, --t-bg already resolves via the
// `@media (prefers-color-scheme)` block in globals.css, so getComputedStyle
// gives the right answer without any JS-side OS-preference logic.
const COLOR_VAR = '--t-bg'

function syncThemeColorMeta() {
  if (typeof document === 'undefined') return
  const color = getComputedStyle(document.documentElement).getPropertyValue(COLOR_VAR).trim()
  if (!color) return
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', color)
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (theme !== 'system') root.classList.add(theme)
  syncThemeColorMeta()
  // Mirror to a cookie (readable server-side, unlike localStorage) so
  // manifest.json's route handler can color the installed PWA's status bar
  // to match instead of always shipping the dark-theme default.
  document.cookie = `${STORAGE_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark'
    setTheme(stored)
    applyTheme(stored)
  }, [])

  // When following the OS ("system"), keep the tab color live as the OS
  // scheme flips while the app is open — CSS re-resolves --t-bg on its
  // own, but the theme-color meta tag needs an explicit re-read to catch up.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => syncThemeColorMeta()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  /** Apply a specific theme with a zigzag-paper View Transition wipe
   *  (receipt paper "prints" the new theme top-to-bottom). Falls back to
   *  an instant swap when the API is unavailable or motion is reduced. */
  const switchTo = (next: Theme, _e?: React.MouseEvent) => {
    if (next === theme) return
    const commit = () => {
      setTheme(next)
      applyTheme(next)
      localStorage.setItem(STORAGE_KEY, next)
    }
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (
      !reduce &&
      typeof document !== 'undefined' &&
      'startViewTransition' in document
    ) {
      // Build a polygon with zigzag teeth along the bottom edge, like
      // the torn receipt paper used throughout the design system.
      const TEETH = 40
      const TOOTH_W = 100 / TEETH      // % of viewport width per tooth
      const TOOTH_H = 1.2              // % of viewport height for tooth depth
      const zigzag = (yPct: number) => {
        const pts = [`0% 0%`, `100% 0%`, `100% ${yPct}%`]
        for (let i = TEETH; i >= 0; i--) {
          pts.push(`${i * TOOTH_W}% ${yPct + (i % 2 === 0 ? 0 : TOOTH_H)}%`)
        }
        return `polygon(${pts.join(', ')})`
      }
      const vt = (document as any).startViewTransition(() => commit())
      vt.ready
        .then(() =>
          document.documentElement.animate(
            { clipPath: [zigzag(-TOOTH_H), zigzag(100 + TOOTH_H)] },
            { duration: 500, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' }
          )
        )
        .catch(() => {})
      return
    }
    commit()
  }

  const cycleTheme = (e?: React.MouseEvent) => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? 'dark'
    switchTo(next, e)
  }

  return { theme, cycleTheme, switchTo }
}
