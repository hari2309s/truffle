'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import LanguageDropdown from './LanguageDropdown'
import { APP_URL, TRUFFLE_ICON } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'

const SECTIONS = ['features', 'how-it-works', 'pricing'] as const
type SectionId = (typeof SECTIONS)[number]

export default function Nav() {
  const { t } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [current, setCurrent] = useState<SectionId | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8)
      // The current section is the last one whose top has passed under the nav.
      let next: SectionId | null = null
      for (const id of SECTIONS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) next = id
      }
      setCurrent(next)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const links: { id: SectionId; label: string }[] = [
    { id: 'features', label: t.nav.features },
    { id: 'how-it-works', label: t.nav.howItWorks },
    { id: 'pricing', label: t.nav.pricing },
  ]

  return (
    <nav
      className={`sticky top-0 z-20 bg-truffle-bg transition-shadow ${
        scrolled
          ? 'border-b border-dashed border-truffle-border shadow-[0_8px_16px_-12px_var(--t-slip-shadow)]'
          : 'border-b border-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-6 max-w-[1280px] mx-auto py-4 px-[clamp(16px,5.5cqi,80px)]">
        <a href="/" className="flex items-center gap-2.5 min-h-11">
          <Image src={TRUFFLE_ICON} alt="" width={32} height={32} priority />
          <span className="text-[15px] font-bold tracking-[.16em] uppercase">Truffle</span>
        </a>

        <div className="hidden lg:flex items-center gap-8 text-[13px] font-bold tracking-[.1em] uppercase">
          {links.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              aria-current={current === link.id ? 'location' : undefined}
              className={`min-h-11 flex items-center underline-offset-[6px] decoration-2 hover:underline ${
                current === link.id && scrolled ? 'underline' : ''
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2.5">
          <ThemeToggle />
          <LanguageDropdown />
          <a
            href={APP_URL}
            className="text-[13px] font-bold tracking-[.06em] min-h-11 flex items-center px-2 underline-offset-[6px] hover:underline"
          >
            {t.nav.signIn}
          </a>
          <a href={APP_URL} className="key key-accent h-11 px-[18px] text-[13px]">
            {t.nav.getStarted}
          </a>
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <a href={APP_URL} className="key key-accent h-11 px-3.5 text-[13px]">
            {t.nav.getStarted}
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.menu}
            className="key key-plain w-11 h-11 text-base"
          >
            <span aria-hidden>{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden absolute left-0 right-0 top-full px-[clamp(16px,5.5cqi,80px)] slip-drop"
        >
          <div className="slip print-in px-[18px] pt-2 pb-8 flex flex-col">
            {links.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex gap-2 min-h-12 items-center border-b border-dashed border-truffle-border text-[13px] font-bold tracking-[.1em] uppercase"
              >
                <span>{link.label}</span>
                <span aria-hidden className="leader !mb-0 mt-1.5 self-center" />
                <span aria-hidden>→</span>
              </a>
            ))}
            <a
              href={APP_URL}
              className="flex gap-2 min-h-12 items-center border-b border-dashed border-truffle-border text-[13px] font-bold tracking-[.06em]"
            >
              <span>{t.nav.signIn}</span>
              <span aria-hidden className="leader !mb-0 mt-1.5 self-center" />
              <span aria-hidden>→</span>
            </a>
            <div className="flex items-center justify-between gap-3 pt-4">
              <ThemeToggle />
              <LanguageDropdown />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
