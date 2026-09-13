'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import ThemeToggle from './ThemeToggle'
import LanguageDropdown from './LanguageDropdown'
import { useLanguage } from '@/contexts/LanguageContext'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truffle-ivory.vercel.app'

export default function Nav() {
  const { t } = useLanguage()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-truffle-bg/80 backdrop-blur-xl border-b border-truffle-border/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/icons/truffle.png"
            alt="Truffle"
            width={28}
            height={28}
            className="group-hover:scale-110 transition-transform duration-200"
          />
          <span className="font-black text-lg text-truffle-text tracking-tight">truffle</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-truffle-text-secondary">
          <a href="#features" className="hover:text-truffle-text transition-colors">
            {t.nav.features}
          </a>
          <a href="#how-it-works" className="hover:text-truffle-text transition-colors">
            {t.nav.howItWorks}
          </a>
          <a href="#pricing" className="hover:text-truffle-text transition-colors">
            {t.nav.pricing}
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageDropdown />
          <a
            href={APP_URL}
            className="hidden sm:block text-sm font-medium text-truffle-text-secondary hover:text-truffle-text transition-colors px-3 py-2"
          >
            {t.nav.signIn}
          </a>
          <a
            href={APP_URL}
            className="text-sm font-bold bg-truffle-amber text-truffle-bg px-4 py-2 rounded-xl hover:bg-truffle-amber-light active:scale-95 transition-all duration-150"
          >
            {t.nav.getStarted}
          </a>
        </div>
      </div>
    </motion.nav>
  )
}
