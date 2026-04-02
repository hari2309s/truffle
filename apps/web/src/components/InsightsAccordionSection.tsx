'use client'

import { motion } from 'framer-motion'
import { useEffect, useId, useRef, useState } from 'react'

const panelTransition = {
  duration: 0.32,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
}

interface InsightsAccordionSectionProps {
  title: string
  /** Incremented by parent when the user scrolls up enough — forces all sections closed. */
  collapsibleKey: number
  children: React.ReactNode
  defaultOpen?: boolean
  headerRight?: React.ReactNode
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-truffle-muted flex-shrink-0"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function InsightsAccordionSection({
  title,
  collapsibleKey,
  children,
  defaultOpen = true,
  headerRight,
}: InsightsAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  const skipFirstCollapseKey = useRef(true)

  useEffect(() => {
    if (skipFirstCollapseKey.current) {
      skipFirstCollapseKey.current = false
      return
    }
    setOpen(false)
  }, [collapsibleKey])

  return (
    <section>
      <div className="flex items-center gap-2 mb-3 min-w-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left min-w-0 rounded-lg -ml-1 pl-1 py-0.5 hover:bg-truffle-surface/60 transition-colors"
          aria-expanded={open}
          aria-controls={panelId}
        >
          <motion.span
            className="inline-flex"
            animate={{ rotate: open ? 180 : 0 }}
            transition={panelTransition}
          >
            <ChevronIcon />
          </motion.span>
          <h2 className="text-sm font-medium text-truffle-text-secondary uppercase tracking-wide truncate">
            {title}
          </h2>
        </button>
        {headerRight ? <div className="flex-shrink-0">{headerRight}</div> : null}
      </div>
      <motion.div
        id={panelId}
        initial={false}
        animate={{
          height: open ? 'auto' : 0,
          opacity: open ? 1 : 0,
        }}
        transition={panelTransition}
        style={{ overflow: 'hidden' }}
        aria-hidden={!open}
      >
        <div className="pb-1">{children}</div>
      </motion.div>
    </section>
  )
}
