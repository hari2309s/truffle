'use client'

import { motion } from 'framer-motion'

const badges = [
  { icon: <NoBankIcon />, label: 'No bank linking required' },
  { icon: <MicIcon />, label: 'Voice-first input' },
  { icon: <LockIcon />, label: 'Your data stays yours' },
  { icon: <NoSheetIcon />, label: 'Zero spreadsheets' },
  { icon: <AiIcon />, label: 'Powered by AI' },
]

export default function TrustStrip() {
  return (
    <section className="border-y border-truffle-border/60 bg-truffle-surface/40">
      <div className="max-w-6xl mx-auto px-6 py-5 overflow-x-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-start md:justify-center gap-6 min-w-max md:min-w-0"
        >
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-center gap-2 text-sm text-truffle-text-secondary whitespace-nowrap"
            >
              <span className="text-truffle-amber">{b.icon}</span>
              {b.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function NoBankIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function NoSheetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

function AiIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}
