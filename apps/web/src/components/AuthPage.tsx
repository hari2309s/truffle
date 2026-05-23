'use client'

import Image from 'next/image'
import { useState } from 'react'
import { PageEnter } from './PageMotion'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { LOCALE_LABELS, type Locale } from '@/lib/i18n'

export function AuthPage({ error: initialError = null }: { error?: string | null }) {
  const { t, locale, setLocale } = useLanguage()
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

  const otherLocale = (locale === 'en' ? 'de' : 'en') as Locale
  const other = LOCALE_LABELS[otherLocale]

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-truffle-bg">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setLocale(otherLocale)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-truffle-muted hover:text-truffle-text bg-truffle-surface border border-truffle-border transition-colors"
        >
          <span>{other.flag}</span>
          <span>{other.label}</span>
        </button>
      </div>

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
          <p className="text-truffle-text-secondary mt-2">{t.auth.tagline}</p>
        </div>

        {sent ? (
          <div className="card text-center space-y-3">
            <div className="text-4xl">📬</div>
            <h2 className="font-semibold text-truffle-text">{t.auth.checkEmail}</h2>
            <p className="text-sm text-truffle-text-secondary">{t.auth.magicLinkSent(email)}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder={t.auth.emailPlaceholder}
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
              {isLoading ? t.auth.sending : t.auth.continueWithEmail}
            </button>
          </form>
        )}

        <p className="text-xs text-truffle-muted text-center">{t.auth.footer}</p>
      </PageEnter>
    </div>
  )
}
