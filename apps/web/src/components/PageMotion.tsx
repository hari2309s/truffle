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

/** App shell loading (Home auth check, chat history load, etc.) */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={className ?? 'flex items-center gap-[3px]'} style={{ height: 20 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="rounded-full bg-truffle-amber"
          style={{ width: 4, height: 18, transformOrigin: 'center' }}
          animate={{
            scaleY: [0.25, 1, 0.25],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      ))}
    </div>
  )
}

/** Centered route loading (chat/insights while auth resolves). */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      <motion.div
        role="status"
        aria-label="Loading"
        className={
          className ?? 'w-8 h-8 rounded-full border-2 border-truffle-amber border-t-transparent'
        }
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(232,168,78,0)',
            '0 0 10px 3px rgba(232,168,78,0.28)',
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
