'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { usePostHog } from 'posthog-js/react'
import { PageEnter } from './PageMotion'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { LeaderRow, Rule, TRUFFLE_ICON } from './Tally'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

type AuthMode = 'sign-in' | 'sign-up'

export function AuthPage({ error: initialError = null }: { error?: string | null }) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const posthog = usePostHog()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [signUpDone, setSignUpDone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [captchaToken, setCaptchaToken] = useState<string | null>(SITE_KEY ? null : 'bypass')
  const turnstileRef = useRef<TurnstileInstance>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t.auth.invalidEmail)
      return
    }
    if (password.length < 6) {
      setError(t.auth.invalidPassword)
      return
    }
    if (mode === 'sign-up' && password !== confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }
    if (!captchaToken) return
    setIsLoading(true)
    setError(null)

    if (mode === 'sign-up') {
      posthog.capture('auth_signup_requested')
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          captchaToken,
        },
      })

      turnstileRef.current?.reset()
      setCaptchaToken(SITE_KEY ? null : 'bypass')

      if (error) {
        posthog.capture('auth_signup_failed', { error: error.message })
        setError(error.message)
      } else {
        posthog.capture('auth_signup_sent')
        setSignUpDone(true)
      }
    } else {
      posthog.capture('auth_signin_requested')
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      })

      turnstileRef.current?.reset()
      setCaptchaToken(SITE_KEY ? null : 'bypass')

      if (error) {
        posthog.capture('auth_signin_failed', { error: error.message })
        setError(error.message)
      } else {
        posthog.capture('auth_signin_success')
        // Leave isLoading true — onAuthStateChange will unmount this page
        return
      }
    }
    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    posthog.capture('auth_google_requested')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      posthog.capture('auth_google_failed', { error: error.message })
      setError(error.message)
    }
  }

  const demoEnabled = process.env.NEXT_PUBLIC_DEMO_ENABLED === '1'

  return (
    <div className="min-h-dvh w-full max-w-lg md:max-w-2xl mx-auto flex flex-col bg-truffle-bg overflow-y-auto md:px-8">
      <PageEnter className="flex-1 flex flex-col">
        <div className="slip mx-8 mt-[max(36px,env(safe-area-inset-top))] px-6 pt-7 pb-9 flex flex-col items-center gap-3.5">
          <Image src={TRUFFLE_ICON} alt="" width={88} height={88} priority />
          <h1 className="text-[26px] font-bold tracking-[.2em] uppercase">Truffle</h1>
          <p className="text-xs text-truffle-text2 tracking-[.06em] uppercase">{t.auth.tagline}</p>
          <Rule className="w-full mt-1.5" />
          <div className="w-full flex flex-col gap-1.5 text-sm print-lines">
            <LeaderRow strong left={t.auth.receiptTalk} right="✓" />
            <LeaderRow strong left={t.auth.receiptSee} right="✓" />
            <LeaderRow strong left={t.auth.receiptDread} right={formatAmount(0)} />
          </div>
          <Rule className="w-full" />
          <div className="w-full flex justify-between text-base font-bold uppercase">
            <span>{t.auth.receiptTotal}</span>
            <span>{t.auth.receiptCalm}</span>
          </div>
        </div>

        <div className="mt-auto pt-8 px-6 pb-[max(28px,env(safe-area-inset-bottom))] flex flex-col gap-3">
          {signUpDone ? (
            <div role="status" className="paper print-in border-t-[6px] border-truffle-accent p-4 flex flex-col gap-2">
              <h2 className="text-xs font-bold uppercase">✓ {t.auth.signUpSuccess}</h2>
              <p className="font-grotesk text-[15px] leading-[1.45]">{t.auth.confirmEmail(email)}</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="key h-14 text-[15px] flex items-center justify-center gap-3 border-2 border-truffle-border"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
                </svg>
                {t.auth.continueWithGoogle}
              </button>

              <div aria-hidden className="flex items-center gap-3 text-xs text-truffle-text2 uppercase">
                <span className="flex-1 rule" />
                <span>{t.auth.orDivider}</span>
                <span className="flex-1 rule" />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label htmlFor="auth-email" className="sr-only">
                  {t.auth.emailPlaceholder}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(null)
                  }}
                  autoComplete="email"
                  spellCheck={false}
                  className="field h-14 text-[15px] text-center"
                  required
                />

                <label htmlFor="auth-password" className="sr-only">
                  {t.auth.passwordPlaceholder}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError(null)
                  }}
                  autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  className="field h-14 text-[15px] text-center"
                  required
                  minLength={6}
                />

                {mode === 'sign-up' && (
                  <>
                    <label htmlFor="auth-confirm-password" className="sr-only">
                      {t.auth.confirmPasswordPlaceholder}
                    </label>
                    <input
                      id="auth-confirm-password"
                      type="password"
                      placeholder={t.auth.confirmPasswordPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (error) setError(null)
                      }}
                      autoComplete="new-password"
                      className="field h-14 text-[15px] text-center"
                      required
                      minLength={6}
                    />
                  </>
                )}

                {SITE_KEY && (
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={SITE_KEY}
                    onSuccess={setCaptchaToken}
                    onExpire={() => setCaptchaToken(null)}
                    options={{ theme: 'dark', size: 'invisible' }}
                  />
                )}

                {error && (
                  <p role="alert" className="text-xs font-bold text-truffle-negative text-center">
                    ■ {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !captchaToken}
                  className="key key-ink h-14 text-[15px]"
                >
                  {isLoading
                    ? mode === 'sign-up'
                      ? t.auth.signingUp
                      : t.auth.signingIn
                    : mode === 'sign-up'
                      ? t.auth.signUp
                      : t.auth.signIn}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
                  setConfirmPassword('')
                  setError(null)
                }}
                className="text-xs text-truffle-text2 text-center underline underline-offset-2"
              >
                {mode === 'sign-in' ? t.auth.switchToSignUp : t.auth.switchToSignIn}
              </button>
            </>
          )}

          {!signUpDone && demoEnabled && (
            <>
              <div aria-hidden className="flex items-center gap-2 text-xs text-truffle-text2">
                <span>✂</span>
                <span className="flex-1 rule" />
              </div>
              <form action="/api/auth/demo" method="post">
                <button
                  type="submit"
                  className="key key-accent w-full h-14 text-[15px]"
                  onClick={() =>
                    posthog.capture('demo_link_clicked', undefined, { transport: 'sendBeacon' })
                  }
                >
                  {t.auth.demoButton}
                </button>
              </form>
              <p className="text-xs text-truffle-text2 text-center">{t.auth.demoHint}</p>
            </>
          )}

          <p className="text-[11px] text-truffle-text2 text-center uppercase">{t.auth.footer}</p>
        </div>
      </PageEnter>
    </div>
  )
}
