'use client'

import { useEffect, useRef, useState } from 'react'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * Self-contained (reads locale/setLocale from context itself) so it can be
 * dropped into a Server Component parent — Server Components can't pass
 * closures like `setLocale` down as props to a child.
 */
export default function LanguageDropdown({
  variant = 'code',
  align = 'right',
}: {
  /** `code` shows "EN" (nav); `name` shows "English" (footer). */
  variant?: 'code' | 'name'
  align?: 'left' | 'right'
}) {
  const { t, locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const handlePointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointer)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointer)
    }
  }, [open])

  const locales = Object.entries(LOCALE_LABELS) as [Locale, { flag: string; label: string }][]

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="key key-plain h-11 px-3 text-[13px] gap-2"
        aria-label={t.nav.language}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {variant === 'code' ? locale.toUpperCase() : LOCALE_LABELS[locale].label}
        <span aria-hidden className="text-[10px]">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} ${variant === 'name' ? 'bottom-[56px]' : 'top-14'} w-[220px] z-30 slip-drop`}
        >
          <div className="slip-sm pt-2 px-3.5 pb-5 flex flex-col">
            <span className="text-[11px] font-bold tracking-[.12em] uppercase text-truffle-text2 py-1.5">
              {t.nav.language}
            </span>
            <div role="listbox" aria-label={t.nav.language} className="flex flex-col">
              {locales.map(([loc, { label }]) => {
                const selected = locale === loc
                return (
                  <button
                    key={loc}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setLocale(loc)
                      setOpen(false)
                      triggerRef.current?.focus()
                    }}
                    className="flex gap-2 min-h-11 items-center text-[13px] border-t border-dashed border-truffle-border -mx-3.5 px-3.5 hover:bg-truffle-surface text-left"
                  >
                    <span className={selected ? 'font-bold' : ''}>{label}</span>
                    <span aria-hidden className="leader !mb-0 mt-1.5 self-center" />
                    <span className="font-bold">
                      {selected ? '✓ ' : ''}
                      {loc.toUpperCase()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
