'use client'

import type { HTMLMotionProps } from 'framer-motion'
import { motion } from 'framer-motion'
import { pageEnterVariants } from '@/lib/motion'

type PageEnterProps = {
  children: React.ReactNode
  className?: string
}

/** Fade + slight rise for full pages or major sections on first paint. */
export function PageEnter({ children, className }: PageEnterProps) {
  return (
    <motion.div
      className={className}
      initial={pageEnterVariants.initial}
      animate={pageEnterVariants.animate}
      transition={pageEnterVariants.transition}
    >
      {children}
    </motion.div>
  )
}

type SkeletonPulseProps = HTMLMotionProps<'div'>

/** Softer than CSS animate-pulse; use for loading placeholders. */
export function SkeletonPulse({ className, ...props }: SkeletonPulseProps) {
  return (
    <motion.div
      className={className}
      animate={{ opacity: [0.42, 0.78, 0.42] }}
      transition={{ duration: 1.45, repeat: Infinity, ease: 'easeInOut' }}
      {...props}
    />
  )
}

/** App shell loading (Home auth check, chat history load, etc.) — 5-bar waveform. */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={className ?? 'flex items-center gap-1'} style={{ height: 24 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="rounded-full bg-truffle-amber"
          style={{ width: 4, height: 20, transformOrigin: 'center' }}
          animate={{
            scaleY: [0.2, 1, 0.5, 0.85, 0.2],
            opacity: [0.4, 1, 0.65, 1, 0.4],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      ))}
    </div>
  )
}

/** Centered route loading (chat/insights while auth resolves) — pulsing orb, not a spinner. */
export function LoadingSpinner({ className: _className }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading" className="flex items-center justify-center w-16 h-16">
      <motion.div
        className="w-4 h-4 rounded-full bg-truffle-amber"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.7, 1, 0.7],
          boxShadow: [
            '0 0 0 0 rgba(232,168,78,0)',
            '0 0 24px 8px rgba(232,168,78,0.35)',
            '0 0 0 0 rgba(232,168,78,0)',
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/** Inline typing indicator (chat) — audio waveform bars. */
export function TypingDots({ className }: { className?: string }) {
  return (
    <div className={className ?? 'flex items-center gap-[3px]'} style={{ height: 18 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="rounded-full bg-truffle-amber"
          style={{ width: 3, height: 16, transformOrigin: 'center' }}
          animate={{
            scaleY: [0.25, 1, 0.55, 0.9, 0.25],
            opacity: [0.45, 1, 0.7, 1, 0.45],
          }}
          transition={{
            duration: 1.0,
            repeat: Infinity,
            delay: i * 0.1,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      ))}
    </div>
  )
}
