'use client'

import Image from 'next/image'
import { useState } from 'react'
import { PageEnter } from './PageMotion'
import { supabase } from '@/lib/supabase'

interface OnboardingPageProps {
  onComplete: () => void
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<'EUR' | 'GBP' | 'USD'>('EUR')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      onComplete()
    } catch {
      setError('Failed to save your details — please try again.')
    } finally {
      setIsLoading(false)
    }
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
            {isLoading ? 'Saving...' : "Let's go →"}
          </button>
        </form>
      </PageEnter>
    </div>
  )
}
