'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useVoicePreference } from '@/contexts/VoiceContext'
import type { Currency } from '@/contexts/CurrencyContext'
import { getPersona } from '@/lib/voices'
import { LanguagePicker } from './LanguagePicker'
import { VoicePicker } from './VoicePicker'
import { CurrencyPicker } from './CurrencyPicker'
import { LeaderRow, MINUS, Rule } from './Tally'

interface OnboardingPageProps {
  onComplete: () => void
}

// Steps 1–2 collect details; the rest are the tour.
const SETUP_STEPS = 2

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { t, locale, setLocale } = useLanguage()
  const { voiceId, setVoiceId } = useVoicePreference()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)

  // Tour samples print in the currency picked in step 1, not the saved one.
  const formatAmount = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Math.abs(n))

  const tourSteps = t.tour.steps
  const totalSteps = SETUP_STEPS + tourSteps.length
  const isTour = step >= SETUP_STEPS
  const isLast = step === totalSteps - 1

  const handleSave = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim(), currency, language: locale, voice: voiceId },
      })
      if (error) throw error
      setStep(SETUP_STEPS)
    } catch {
      setError(t.onboarding.errorSave)
    } finally {
      setIsLoading(false)
    }
  }

  const next = () => {
    if (step === 0) {
      if (name.trim()) setStep(1)
      return
    }
    if (step === 1) {
      void handleSave()
      return
    }
    if (isLast) onComplete()
    else setStep((s) => s + 1)
  }

  // Details are saved once step 2 completes — the tour can't go back past it.
  const canGoBack = step > 0 && step !== SETUP_STEPS
  const tourStep = isTour ? tourSteps[step - SETUP_STEPS]! : null

  const title = step === 0 ? t.onboarding.heading : step === 1 ? t.onboarding.voiceHeading : tourStep!.title
  const body = step === 0 ? t.onboarding.subtitle : step === 1 ? null : tourStep!.body

  const primaryLabel =
    step === 0
      ? t.onboarding.continue
      : step === 1
        ? isLoading
          ? t.onboarding.saving
          : t.onboarding.chooseVoice(getPersona(voiceId).name)
        : isLast
          ? t.tour.letsGo
          : t.tour.next
  const primaryAccent = step === 1 || isLast

  return (
    <div className="min-h-dvh w-full max-w-lg mx-auto bg-truffle-bg flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center pt-[max(12px,env(safe-area-inset-top))] pr-5 pl-6">
        <span className="text-[13px] font-bold uppercase">{t.onboarding.stepOf(step + 1, totalSteps)}</span>
        {isTour ? (
          <button
            type="button"
            onClick={onComplete}
            className="h-11 px-2 text-[13px] text-truffle-text2 uppercase"
          >
            {t.tour.skip}
          </button>
        ) : (
          <span className="h-11" />
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="flex flex-col"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
        >
          <div className="px-6 pt-6 flex flex-col gap-3">
            <h1 className="font-grotesk text-[42px] font-medium leading-[1.02] tracking-[-.02em] whitespace-pre-line">
              {title}
            </h1>
            {body && (
              <p className="font-grotesk text-[17px] leading-normal text-truffle-text2">{body}</p>
            )}
          </div>

          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                next()
              }}
              className="slip mx-4 mt-7 px-[18px] pt-4 pb-[30px] flex flex-col gap-3 text-sm"
            >
              <div className="flex gap-1.5 items-center min-h-11">
                <label htmlFor="onboarding-name" className="text-truffle-text2 whitespace-nowrap">
                  {t.onboarding.nameLabel}
                </label>
                <span aria-hidden className="leader !-mb-1 !flex-[0_1_40px]" />
                <input
                  id="onboarding-name"
                  type="text"
                  placeholder={t.onboarding.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  autoComplete="given-name"
                  className="field-inline flex-1 text-base"
                />
              </div>
              <Rule />
              <span className="text-xs text-truffle-text2 uppercase">{t.onboarding.currencyLabel}</span>
              <CurrencyPicker value={currency} onChange={setCurrency} label={t.onboarding.currencyLabel} />
              <LanguagePicker onChange={setLocale} label={t.onboarding.languageLabel} />
            </form>
          )}

          {step === 1 && (
            <div className="px-5 pt-7 flex flex-col gap-2">
              <VoicePicker value={voiceId} onChange={setVoiceId} variant="card" />
              <p className="px-1 pt-1 text-xs text-truffle-text2">{t.onboarding.voiceHint}</p>
            </div>
          )}

          {step === SETUP_STEPS && (
            <div className="slip mx-6 mt-7 px-[18px] pt-4 pb-[26px] flex flex-col gap-2 text-sm">
              <span className="text-xs text-truffle-text2 uppercase">{t.tour.sample.youSaid}</span>
              <span>“{t.tour.sample.quote}”</span>
              <Rule />
              <LeaderRow
                left={t.tour.sample.line}
                right={<b>{MINUS}{formatAmount(45)}</b>}
              />
              <div className="flex justify-between text-truffle-text2">
                <span>{t.tour.sample.today}</span>
                <span>{currency}</span>
              </div>
            </div>
          )}

          {step === SETUP_STEPS + 1 && (
            <div className="slip mx-6 mt-7 px-4 pt-4 pb-7 flex flex-col text-sm">
              <span className="text-[15px] font-bold tracking-[.08em] uppercase pb-1.5">
                {t.dashboard.recent}
              </span>
              {t.tour.sample.items.map((item) => (
                <div key={item.name} className="rule-soft py-2.5 flex flex-col">
                  <LeaderRow
                    baseline
                    left={<b>{item.name}</b>}
                    right={
                      <b className={item.amount > 0 ? 'text-truffle-positive' : ''}>
                        {item.amount > 0 ? '+' : MINUS}
                        {formatAmount(item.amount)}
                      </b>
                    }
                  />
                  <span className="text-[11px] text-truffle-text2 pt-0.5">{item.meta}</span>
                </div>
              ))}
            </div>
          )}

          {step === SETUP_STEPS + 2 && (
            <div className="slip mx-6 mt-7 px-4 pt-3.5 pb-6 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase">{t.tour.sample.notices}</span>
              {t.tour.sample.nudges.map((n) => (
                <div key={n.title} className="grid grid-cols-[20px_1fr] gap-2 rule-soft pt-2">
                  <span
                    className={`text-[13px] ${n.tone === 'warning' ? 'text-truffle-warning' : 'text-truffle-accent-ink'}`}
                  >
                    {n.tone === 'warning' ? '▲' : '✦'}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold">{n.title}</span>
                    <span className="font-grotesk text-sm leading-[1.4] text-truffle-text2">
                      {n.body}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p role="alert" className="mx-6 mt-4 text-xs font-bold uppercase text-truffle-negative">
          ■ {error}
        </p>
      )}

      <div className="mt-auto pt-8 px-6 pb-[max(28px,env(safe-area-inset-bottom))] flex gap-2.5">
        {canGoBack && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            aria-label={t.onboarding.back}
            className="key key-line w-14 h-14 text-base flex-none"
          >
            ←
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={isLoading || (step === 0 && !name.trim())}
          className={`key ${primaryAccent ? 'key-accent' : 'key-ink'} flex-1 h-14 text-[15px]`}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  )
}
