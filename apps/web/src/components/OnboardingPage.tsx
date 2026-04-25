'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageEnter } from './PageMotion'
import { supabase } from '@/lib/supabase'

interface OnboardingPageProps {
  onComplete: () => void
}

const TOUR_STEPS = [
  {
    emoji: '💬',
    title: 'Chat naturally',
    body: "Just talk to Truffle like you'd text a friend. Ask how you're doing, log an expense, or get advice — voice or text.",
  },
  {
    emoji: '💶',
    title: 'Track every euro',
    body: 'Every transaction is automatically categorised. Add by chat, CSV import, or snap a receipt.',
  },
  {
    emoji: '🔔',
    title: 'Get smart nudges',
    body: 'Truffle watches for budget overruns, unusual spends, and saving streaks — and tells you before things go sideways.',
  },
]

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<'EUR' | 'GBP' | 'USD'>('EUR')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tourStep, setTourStep] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim(), currency },
      })
      if (error) throw error
      setTourStep(0)
    } catch {
      setError('Failed to save your details — please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (tourStep !== null) {
    const step = TOUR_STEPS[tourStep]!
    const isLast = tourStep === TOUR_STEPS.length - 1

    return (
      <div className="min-h-screen bg-truffle-bg flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tourStep}
              className="text-center space-y-4"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
            >
              <span className="text-5xl block">{step.emoji}</span>
              <h2 className="text-2xl font-bold text-truffle-text">{step.title}</h2>
              <p className="text-truffle-muted text-sm leading-relaxed">{step.body}</p>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex justify-center gap-2">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === tourStep ? 'bg-truffle-amber w-4' : 'bg-truffle-border'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => (isLast ? onComplete() : setTourStep((s) => (s ?? 0) + 1))}
            className="btn-primary w-full"
          >
            {isLast ? "Let's go →" : 'Next'}
          </button>

          <button
            onClick={onComplete}
            className="block w-full text-center text-xs text-truffle-muted hover:text-truffle-text transition-colors"
          >
            Skip tour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-truffle-bg flex flex-col items-center justify-center px-6">
      <PageEnter className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Image
            src="/icons/truffle.png"
            alt="Truffle"
            width={64}
            height={64}
            priority
            className="mx-auto"
          />
          <h1 className="text-2xl font-bold text-truffle-text">Welcome to Truffle</h1>
          <p className="text-truffle-muted text-sm">Let&apos;s get you set up in 30 seconds.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-truffle-muted uppercase tracking-wide">
              What should we call you?
            </label>
            <input
              type="text"
              placeholder="Your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              className="w-full bg-truffle-surface border border-truffle-border rounded-xl px-4 py-3 text-truffle-text placeholder-truffle-muted focus:outline-none focus:border-truffle-amber"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-truffle-muted uppercase tracking-wide">
              Your currency
            </label>
            <div className="flex gap-2">
              {(['EUR', 'GBP', 'USD'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    currency === c
                      ? 'bg-truffle-amber text-truffle-bg'
                      : 'bg-truffle-surface text-truffle-muted border border-truffle-border'
                  }`}
                >
                  {c === 'EUR' ? '€ EUR' : c === 'GBP' ? '£ GBP' : '$ USD'}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-truffle-red text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Saving...' : 'Continue →'}
          </button>
        </form>
      </PageEnter>
    </div>
  )
}
