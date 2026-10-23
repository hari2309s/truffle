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

export function AuthPage({ error: initialError = null }: { error?: string | null }) {
  const { t } = useLanguage()
  const { formatAmount } = useCurrency()
  const posthog = usePostHog()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  // When no site key is configured (CI / local dev), bypass captcha requirement
  const [captchaToken, setCaptchaToken] = useState<string | null>(SITE_KEY ? null : 'bypass')
  const turnstileRef = useRef<TurnstileInstance>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t.auth.invalidEmail)
      return
    }
    if (!captchaToken) return
    setIsLoading(true)
    setError(null)

    posthog.capture('auth_magic_link_requested')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // The email templates append ?token_hash=…&type=email to this.
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        captchaToken,
      },
    })

    turnstileRef.current?.reset()
    setCaptchaToken(null)

    if (error) {
      posthog.capture('auth_magic_link_failed', { error: error.message })
      setError(error.message)
    } else {
      posthog.capture('auth_magic_link_sent')
      setSent(true)
    }
    setIsLoading(false)
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
          {sent ? (
            <div role="status" className="paper print-in border-t-[6px] border-truffle-accent p-4 flex flex-col gap-2">
              <h2 className="text-xs font-bold uppercase">✓ {t.auth.checkEmail}</h2>
              <p className="font-grotesk text-[15px] leading-[1.45]">{t.auth.magicLinkSent(email)}</p>
            </div>
          ) : (
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
                {isLoading ? t.auth.sending : t.auth.continueWithEmail}
              </button>
            </form>
          )}

          {!sent && demoEnabled && (
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
