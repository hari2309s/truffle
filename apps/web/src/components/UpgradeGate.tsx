'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PRO_FEATURES = [
  'Unlimited AI chat',
  'Voice transcription',
  'Receipt & PDF scanner',
  'AI spending insights',
  'Unlimited goals & habits',
  'Monthly AI finance report',
]

interface UpgradeGateProps {
  /** Short description of what the user tried to access, e.g. "Voice transcription" */
  feature: string
  onClose: () => void
}

export function UpgradeGate({ feature, onClose }: UpgradeGateProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not start checkout')
      window.location.href = json.url
    } catch (e) {
      setError('Could not open checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center max-w-lg mx-auto"
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative bg-truffle-bg rounded-t-2xl border-t border-truffle-border px-6 pt-6 pb-10 w-full space-y-5"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center space-y-2">
            <span className="text-3xl">✨</span>
            <h2 className="text-lg font-bold text-truffle-text">Upgrade to Pro</h2>
            <p className="text-sm text-truffle-text-secondary">
              {feature} requires a Pro plan — €9/month.
            </p>
          </div>

          <ul className="space-y-2 text-sm text-truffle-text-secondary">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-truffle-amber font-bold">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {error && <p className="text-sm text-truffle-red text-center">{error}</p>}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-truffle-amber text-truffle-bg font-bold text-sm disabled:opacity-50 active:scale-95 transition-all duration-150"
          >
            {loading ? 'Opening checkout…' : 'Upgrade to Pro — €9/month'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-truffle-muted hover:text-truffle-text transition-colors"
          >
            Maybe later
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
