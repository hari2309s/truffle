'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('truffle-theme') as 'dark' | 'light' | null
    const initial =
      saved ?? (document.documentElement.classList.contains('light') ? 'light' : 'dark')
    setTheme(initial)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(next)
    localStorage.setItem('truffle-theme', next)
    setTheme(next)
  }

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.85, rotate: 20 }}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-truffle-text-secondary hover:text-truffle-text hover:bg-truffle-surface transition-all"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </motion.button>
  )
}

function SunIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
