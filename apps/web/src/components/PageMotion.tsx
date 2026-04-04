'use client'

import type { HTMLMotionProps } from 'framer-motion'
import { motion } from 'framer-motion'
import { pageEnterVariants, truffleEase } from '@/lib/motion'

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

/** App shell loading (Home auth check, chat history load, etc.) */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={className ?? 'flex gap-1.5'}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-truffle-amber"
          animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            delay: i * 0.12,
            ease: truffleEase,
          }}
        />
      ))}
    </div>
  )
}

/** Centered route loading (chat/insights while auth resolves). */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <motion.div
      role="status"
      aria-label="Loading"
      className={
        className ?? 'w-8 h-8 rounded-full border-2 border-truffle-amber border-t-transparent'
      }
      animate={{ rotate: 360 }}
      transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
    />
  )
}

/** Inline typing indicator (chat). */
const THINKING_PHRASES = [
  'Looking at your finances…',
  'Crunching the numbers…',
  'On it…',
  'Let me check…',
  'Thinking…',
]

export function ThinkingIndicator({ className }: { className?: string }) {
  const phrase = THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]
  return (
    <motion.span
      className={className ?? 'text-sm text-truffle-muted italic'}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      {phrase}
    </motion.span>
  )
}
