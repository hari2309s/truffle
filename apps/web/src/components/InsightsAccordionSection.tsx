'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface InsightsAccordionSectionProps {
  title: string
  /** Incremented by parent when the user scrolls up — forces all sections closed. */
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
          <span
            className={`inline-flex transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <ChevronIcon />
          </span>
          <h2 className="text-sm font-medium text-truffle-text-secondary uppercase tracking-wide truncate">
            {title}
          </h2>
        </button>
        {headerRight ? <div className="flex-shrink-0">{headerRight}</div> : null}
      </div>
      <div id={panelId} hidden={!open}>
        {children}
      </div>
    </section>
  )
}
