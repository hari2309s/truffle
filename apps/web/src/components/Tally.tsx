'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** The padded truffle mark the Tally Receipt design uses everywhere in-app. */
export const TRUFFLE_ICON = '/web-app-manifest-512x512.png'

/** Typographic minus — lines up with "+" in Space Mono. */
export const MINUS = '−'

/** "Name ........ value" — the receipt line every number in Truffle sits on. */
export function LeaderRow({
  left,
  right,
  className = '',
  strong = false,
  baseline = false,
}: {
  left: React.ReactNode
  right: React.ReactNode
  className?: string
  /** Darker dots, used on the statement and sign-in slips. */
  strong?: boolean
  /** Align on the text baseline (item rows) instead of stretching. */
  baseline?: boolean
}) {
  // A <span> root (display: flex) so rows can sit inside buttons and labels.
  return (
    <span className={`flex gap-1.5 ${baseline ? 'items-baseline' : ''} ${className}`}>
      <span className="min-w-0">{left}</span>
      <span
        aria-hidden
        className={`leader ${strong ? 'leader-strong' : ''} ${baseline ? '!mb-1' : ''}`}
      />
      <span className="whitespace-nowrap">{right}</span>
    </span>
  )
}

export function Rule({ soft = false, className = '' }: { soft?: boolean; className?: string }) {
  return <div aria-hidden className={`${soft ? 'rule-soft' : 'rule'} ${className}`} />
}

/** Animated level meter — Truffle speaking / a voice preview playing. */
export function Meter({ bars = 18, active = true }: { bars?: number; active?: boolean }) {
  return (
    <div aria-hidden className="flex-1 flex gap-0.5 items-center h-[18px]">
      {Array.from({ length: bars }, (_, i) => (
        <div
          key={i}
          className="flex-1 h-full bg-truffle-text"
          style={
            active
              ? {
                  animation: `tr-bar ${(0.7 + ((i * 7) % 5) * 0.12).toFixed(2)}s ease-in-out ${((i * 0.137) % 0.9).toFixed(2)}s infinite`,
                }
              : { transform: 'scaleY(.3)' }
          }
        />
      ))}
    </div>
  )
}

const NOTICE_TONE = {
  warning: { glyph: '▲', color: 'text-truffle-warning', border: 'border-t-[6px] border-truffle-warning' },
  negative: { glyph: '■', color: 'text-truffle-negative', border: 'border-t-[6px] border-truffle-negative' },
  muted: { glyph: '◌', color: 'text-truffle-text2', border: 'border-t-[6px] border-dashed border-truffle-text2' },
} as const

/**
 * A status slip: colour + glyph + word, never colour alone.
 * ▲ warning, ■ error, ◌ unavailable.
 */
export function NoticeSlip({
  tone,
  title,
  children,
  actions,
  className = '',
}: {
  tone: keyof typeof NOTICE_TONE
  title: string
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  const t = NOTICE_TONE[tone]
  return (
    <div
      role={tone === 'muted' ? 'status' : 'alert'}
      className={`slip print-in px-[18px] pt-4 pb-7 flex flex-col gap-2 text-[13px] ${t.border} ${className}`}
    >
      <span className={`text-xs font-bold uppercase ${t.color}`}>
        {t.glyph} {title}
      </span>
      {children && <div className="font-grotesk text-[15px] leading-[1.45]">{children}</div>}
      {actions}
    </div>
  )
}

/** "Tallying..." — Truffle is thinking. */
export function Tallying({ label = 'TALLYING' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <span className="blink">.</span>
      <span className="blink" style={{ animationDelay: '.2s' }}>
        .
      </span>
      <span className="blink" style={{ animationDelay: '.4s' }}>
        .
      </span>
    </span>
  )
}

/**
 * Full-screen sheet for focused flows (new entry, scan, import). Slides up
 * over the current page, closes on Escape, and keeps focus inside.
 */
export function Sheet({
  title,
  onClose,
  closeLabel,
  closeGlyph = '✕',
  right,
  footer,
  children,
  dark = false,
}: {
  title: string
  onClose: () => void
  closeLabel: string
  closeGlyph?: string
  right?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  /** Always-dark chrome (the camera viewfinder), whatever the theme. */
  dark?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  // Callers often pass a fresh onClose each render; read it through a ref so
  // the listener (and the focus move below) only ever happen once.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Focus the close key on open only — not on every re-render, or typing in
  // the sheet would lose focus whenever the parent re-renders.


  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Portal to <body>: sheets open from inside animated (transformed)
  // containers, which would otherwise trap `position: fixed`.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // Focus the close key once, when the portal content first exists — not
  // on later re-renders, or typing in the sheet would lose focus.
  useEffect(() => {
    if (mounted && !ref.current?.contains(document.activeElement)) closeRef.current?.focus()
  }, [mounted])
  if (!mounted) return null

  return createPortal(
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`fixed inset-0 z-50 mx-auto w-full max-w-lg flex flex-col ${dark ? 'bg-[#121211] text-[#efe9de]' : 'bg-truffle-bg'}`}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
    >
      <div className="flex justify-between items-center pt-[max(8px,env(safe-area-inset-top))] pr-4 pl-5 flex-shrink-0">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="w-11 h-11 grid place-items-center text-lg"
        >
          {closeGlyph}
        </button>
        <span className="text-sm font-bold tracking-[.1em] uppercase">{title}</span>
        <div className="w-11 h-11 grid place-items-center text-xs font-bold">{right}</div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">{children}</div>
      {footer && (
        <div className="flex-shrink-0 px-4 pt-3 pb-[max(28px,env(safe-area-inset-bottom))]">
          {footer}
        </div>
      )}
    </motion.div>,
    document.body
  )
}
