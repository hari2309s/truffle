'use client'

import Image from 'next/image'
import { useState } from 'react'
import { PageEnter } from './PageMotion'
import { supabase } from '@/lib/supabase'

export function AuthPage({ error: initialError = null }: { error?: string | null }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-truffle-bg">
      <PageEnter className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mb-4">
            <Image
              src="/icons/truffle.png"
              alt="Truffle"
              width={96}
              height={96}
              priority
              className="mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-truffle-text">Truffle</h1>
          <p className="text-truffle-text-secondary mt-2">Your finances, unearthed.</p>
        </div>

        {sent ? (
          <div className="card text-center space-y-3">
            <div className="text-4xl">📬</div>
            <h2 className="font-semibold text-truffle-text">Check your email</h2>
            <p className="text-sm text-truffle-text-secondary">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password
              needed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-truffle-surface border border-truffle-border rounded-xl px-4 py-4 text-truffle-text placeholder-truffle-muted focus:outline-none focus:border-truffle-amber text-center"
                required
              />
            </div>

            {error && <p className="text-sm text-truffle-red text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Continue with email'}
            </button>
          </form>
        )}

        <p className="text-xs text-truffle-muted text-center">
          Sign in with a magic link · No password needed
        </p>
      </PageEnter>
    </div>
  )
}
