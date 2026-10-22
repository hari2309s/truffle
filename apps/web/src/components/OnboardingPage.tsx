'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TransactionCategory } from '@truffle/types'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { useVoicePreference } from '@/contexts/VoiceContext'
import type { Currency } from '@/contexts/CurrencyContext'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { getPersona } from '@/lib/voices'
import { LanguagePicker } from './LanguagePicker'
import { VoicePicker } from './VoicePicker'
import { CurrencyPicker } from './CurrencyPicker'
import { LeaderRow, MINUS, Rule } from './Tally'

const CSVImport = dynamic(() => import('./CSVImport').then((m) => m.CSVImport))
const ReceiptUpload = dynamic(() => import('./ReceiptUpload').then((m) => m.ReceiptUpload))

interface OnboardingPageProps {
  userId: string
  onComplete: () => void
}

type Step = 'details' | 'sayIt' | 'voice' | 'receipts' | 'budgets'
const STEPS: Step[] = ['details', 'sayIt', 'voice', 'receipts', 'budgets']

// Starting limits when there's no spending history to suggest from.
const DEFAULT_LIMITS: [TransactionCategory, number][] = [
  ['food_groceries', 400],
  ['food_delivery', 180],
  ['transport', 120],
  ['shopping', 200],
]
const STEP_AMOUNT = 10
const round10 = (n: number) => Math.max(STEP_AMOUNT, Math.round(n / STEP_AMOUNT) * STEP_AMOUNT)

export function OnboardingPage({ userId, onComplete }: OnboardingPageProps) {
  const { t, locale, setLocale } = useLanguage()
  const { voiceId, setVoiceId } = useVoicePreference()
  const { data: txData } = useTransactionsQuery(userId)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [importer, setImporter] = useState<'scan' | 'csv' | null>(null)
  const [limits, setLimits] = useState<Record<string, number> | null>(null)

  const o = t.onboarding
  const step = STEPS[stepIndex]!
  const isLast = stepIndex === STEPS.length - 1
  const transactions = useMemo(() => txData?.transactions ?? [], [txData])

  // Tour samples print in the currency picked in step 1, not the saved one.
  const formatAmount = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Math.abs(n))
  const formatWhole = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      Math.abs(n)
    )

  // Budget suggestions: the four biggest spending categories of the most
  // recent month with data (e.g. an imported statement), else defaults.
  const suggestions = useMemo(() => {
    const spend = transactions.filter((tx) => tx.amount < 0 && tx.category !== 'savings')
    const latest = spend.map((tx) => tx.date.slice(0, 7)).sort().at(-1)
    if (!latest) return DEFAULT_LIMITS.map(([c, v]) => ({ category: c, value: v, last: null as number | null }))
    const byCat = new Map<TransactionCategory, number>()
    for (const tx of spend) {
      if (tx.date.startsWith(latest)) byCat.set(tx.category, (byCat.get(tx.category) ?? 0) - tx.amount)
    }
    return [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, last]) => ({ category, value: round10(last), last: last as number | null }))
  }, [transactions])

  const limitFor = (category: string, fallback: number) => limits?.[category] ?? fallback
  const totalLimit = suggestions.reduce((s, x) => s + limitFor(x.category, x.value), 0)

  const finish = async (withBudgets: boolean) => {
    if (!name.trim()) {
      setStepIndex(0)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      if (withBudgets) {
        const results = await Promise.all(
          suggestions.map((s) =>
            fetch('/api/budgets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, category: s.category, amount: limitFor(s.category, s.value) }),
            })
          )
        )
        if (results.some((r) => !r.ok)) throw new Error('budgets')
      }
      // Saved last: updating the user fires an auth event that takes the app
      // to Home, so nothing may come after it.
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim(), currency, language: locale, voice: voiceId },
      })
      if (error) throw error
      onComplete()
    } catch {
      setError(o.errorSave)
      setIsLoading(false)
    }
  }

  const next = () => {
    if (step === 'details' && !name.trim()) return
    if (isLast) void finish(true)
    else setStepIndex((i) => i + 1)
  }

  const titles: Record<Step, string> = {
    details: o.heading,
    sayIt: o.sayItTitle,
    voice: o.voiceHeading,
    receipts: o.receiptsTitle,
    budgets: o.budgetsTitle,
  }
  const bodies: Record<Step, string | null> = {
    details: o.subtitle,
    sayIt: o.sayItBody,
    voice: null,
    receipts: o.receiptsBody,
    budgets: transactions.length ? o.budgetsBodyFromData : o.budgetsBody,
  }

  const primaryLabel =
    step === 'details'
      ? o.continue
      : step === 'voice'
        ? o.chooseVoice(getPersona(voiceId).name)
        : isLast
          ? isLoading
            ? o.saving
            : o.printFirst
          : o.next
  const primaryAccent = step === 'voice' || isLast

  return (
    <div className="min-h-dvh w-full max-w-lg mx-auto bg-truffle-bg flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center pt-[max(12px,env(safe-area-inset-top))] pr-5 pl-6">
        <span className="text-[13px] font-bold uppercase">{o.stepOf(stepIndex + 1, STEPS.length)}</span>
        {step === 'budgets' ? (
          <button
            type="button"
            onClick={() => void finish(false)}
            disabled={isLoading}
            className="h-11 px-2 text-[13px] text-truffle-text2 uppercase"
          >
            {o.later}
          </button>
        ) : step === 'sayIt' || step === 'receipts' ? (
          <button
            type="button"
            onClick={() => setStepIndex((i) => i + 1)}
            className="h-11 px-2 text-[13px] text-truffle-text2 uppercase"
          >
            {o.skip}
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
            <h1 className="m-0 font-grotesk text-[42px] font-medium leading-[1.02] tracking-[-.02em] whitespace-pre-line">
              {titles[step]}
            </h1>
            {bodies[step] && (
              <p className="m-0 font-grotesk text-[17px] leading-normal text-truffle-text2">{bodies[step]}</p>
            )}
          </div>

          {step === 'details' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                next()
              }}
              className="slip mx-4 mt-7 px-[18px] pt-4 pb-[30px] flex flex-col gap-3 text-sm"
            >
              <div className="flex gap-1.5 items-center min-h-11">
                <label htmlFor="onboarding-name" className="text-truffle-text2 whitespace-nowrap">
                  {o.nameLabel}
                </label>
                <span aria-hidden className="leader !-mb-1 !flex-[0_1_40px]" />
                <input
                  id="onboarding-name"
                  type="text"
                  placeholder={o.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  autoComplete="given-name"
                  className="field-inline flex-1 text-base"
                />
              </div>
              <Rule />
              <span className="text-xs text-truffle-text2 uppercase">{o.currencyLabel}</span>
              <CurrencyPicker value={currency} onChange={setCurrency} label={o.currencyLabel} />
              <LanguagePicker onChange={setLocale} label={o.languageLabel} />
            </form>
          )}

          {step === 'sayIt' && (
            <div className="slip mx-6 mt-7 px-[18px] pt-4 pb-[26px] flex flex-col gap-2 text-sm">
              {[
                <span key="a" className="text-xs text-truffle-text2 uppercase">{o.sample.youSaid}</span>,
                <span key="b">“{o.sample.quote}”</span>,
                <Rule key="c" />,
                <LeaderRow
                  key="d"
                  left={o.sample.line}
                  right={
                    <b>
                      {MINUS}
                      {formatAmount(45)}
                    </b>
                  }
                />,
                <div key="e" className="flex justify-between text-truffle-text2">
                  <span>{o.sample.today}</span>
                  <span>{currency}</span>
                </div>,
              ].map((line, i) => (
                // Printed line by line, 40ms apart.
                <div key={i} className="print-in" style={{ animationDelay: `${200 + i * 40}ms` }}>
                  {line}
                </div>
              ))}
            </div>
          )}

          {step === 'voice' && (
            <div className="px-5 pt-7 flex flex-col gap-2">
              <VoicePicker value={voiceId} onChange={setVoiceId} variant="card" />
              <p className="px-1 pt-1 text-xs text-truffle-text2">{o.voiceHint}</p>
            </div>
          )}

          {step === 'receipts' && (
            <div className="flex flex-col gap-3 px-5 pt-7">
              {(
                [
                  { id: 'scan' as const, title: o.receiptsScan, desc: o.receiptsScanDesc, accent: true },
                  { id: 'csv' as const, title: o.receiptsCsv, desc: o.receiptsCsvDesc, accent: false },
                  { id: 'fresh' as const, title: o.receiptsFresh, desc: o.receiptsFreshDesc, accent: false },
                ]
              ).map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => (card.id === 'fresh' ? setStepIndex((i) => i + 1) : setImporter(card.id))}
                  className={`paper text-left py-4 px-[18px] grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 items-center ${
                    card.accent ? 'border-t-[6px] border-truffle-accent' : ''
                  }`}
                >
                  <span className="text-[15px] font-bold">{card.title}</span>
                  <span aria-hidden className="row-span-2 text-xl">
                    →
                  </span>
                  <span className="font-grotesk text-sm text-truffle-text2">{card.desc}</span>
                </button>
              ))}
              {transactions.length > 0 && (
                <p className="m-0 px-1 text-xs font-bold uppercase text-truffle-positive">
                  ● {o.receiptsDone(transactions.length)}
                </p>
              )}
              <div className="mt-3 px-1">
                <LeaderRow
                  className="text-xs text-truffle-text2 uppercase"
                  left={o.private}
                  right={o.privateNote}
                />
              </div>
            </div>
          )}

          {step === 'budgets' && (
            <>
              <div className="slip mx-4 mt-6 px-[18px] pt-4 pb-[30px] flex flex-col gap-1 text-sm">
                <span className="text-xs font-bold uppercase pb-1.5">{o.limitsLabel}</span>
                {suggestions.map((s) => {
                  const value = limitFor(s.category, s.value)
                  const set = (v: number) =>
                    setLimits((prev) => ({
                      ...Object.fromEntries(suggestions.map((x) => [x.category, limitFor(x.category, x.value)])),
                      ...prev,
                      [s.category]: Math.max(STEP_AMOUNT, v),
                    }))
                  const label = t.categories[s.category] ?? s.category
                  return (
                    <div
                      key={s.category}
                      className="grid grid-cols-[1fr_auto] gap-2.5 items-center min-h-14 rule-soft"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{label}</span>
                        <span className="text-[11px] text-truffle-text2 uppercase">
                          {s.last === null ? o.suggested : o.lastMonth(formatWhole(s.last))}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => set(value - STEP_AMOUNT)}
                          aria-label={o.lower(label)}
                          className="key key-line key-3 w-10 h-10"
                        >
                          −
                        </button>
                        <span className="min-w-[62px] text-center font-bold" aria-live="polite">
                          {formatWhole(value)}
                        </span>
                        <button
                          type="button"
                          onClick={() => set(value + STEP_AMOUNT)}
                          aria-label={o.raise(label)}
                          className="key key-line key-3 w-10 h-10"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
                <Rule className="mt-1.5" />
                <div className="flex justify-between text-base font-bold uppercase pt-1.5">
                  <span>{o.total}</span>
                  <span>{o.perMonth(formatWhole(totalLimit))}</span>
                </div>
              </div>
              <p className="mx-4 mt-3.5 px-1 flex gap-2.5 items-center font-grotesk text-sm leading-[1.4]">
                <span aria-hidden className="text-truffle-positive font-mono font-bold">
                  ●
                </span>
                {o.headsUpNote}
              </p>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <p role="alert" className="mx-6 mt-4 text-xs font-bold uppercase text-truffle-negative">
          ■ {error}
        </p>
      )}

      <div className="mt-auto pt-8 px-6 pb-[max(28px,env(safe-area-inset-bottom))] flex gap-2.5">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={() => setStepIndex((i) => i - 1)}
            aria-label={o.back}
            className="key key-line w-14 h-14 text-base flex-none"
          >
            ←
          </button>
        )}
        <button
          type="button"
          onClick={next}
          disabled={isLoading || (step === 'details' && !name.trim())}
          className={`key ${primaryAccent ? 'key-accent' : 'key-ink'} flex-1 h-14 text-[15px] ${isLast ? 'uppercase' : ''}`}
        >
          {primaryLabel}
        </button>
      </div>

      <AnimatePresence>
        {importer === 'scan' && (
          <ReceiptUpload key="scan" userId={userId} onClose={() => setImporter(null)} />
        )}
        {importer === 'csv' && <CSVImport key="csv" userId={userId} onClose={() => setImporter(null)} />}
      </AnimatePresence>
    </div>
  )
}
