'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { buildRecap, type RecapFacts } from '@/lib/recap'
import { setChatHandoff } from '@/lib/chatHandoff'
import { toDateLocale } from '@/lib/date'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { useGoalsQuery } from '@/hooks/useGoalsQuery'
import { useHabitsQuery } from '@/hooks/useHabitsQuery'
import { useSentencePlayer, speakingSeconds } from '@/hooks/useSentencePlayer'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useVoicePreference } from '@/contexts/VoiceContext'
import { getPersona } from '@/lib/voices'
import { LeaderRow, Rule, Sheet } from './Tally'
import { VoiceButton, type VoiceButtonStatus } from './VoiceButton'

const WAVE = [8, 14, 22, 12, 28, 18, 32, 20, 14, 26, 34, 22, 16, 28, 12, 20, 30, 18, 10, 22, 14, 8, 16, 10]

/** "13–19 Oct", or "28 Sep–4 Oct" across a month boundary. */
export function formatRange(from: Date, to: Date, dateLocale: string): string {
  const month = (d: Date) => d.toLocaleDateString(dateLocale, { month: 'short' })
  return from.getMonth() === to.getMonth()
    ? `${from.getDate()}–${to.getDate()} ${month(to)}`
    : `${from.getDate()} ${month(from)}–${to.getDate()} ${month(to)}`
}

export interface Recap {
  facts: RecapFacts
  /** Spoken lines, in order. */
  sentences: string[]
  /** The line to emphasise when nothing is playing (the busy line). */
  highlight: number
  /** One-line summary for the Home card. */
  cardLine: string
}

/** Builds the week's recap from cached data (shared by the card and the sheet). */
export function useRecap(userId: string, name?: string): Recap | null {
  const { t, locale } = useLanguage()
  const { currency } = useCurrency()
  const { data: txData } = useTransactionsQuery(userId)
  const { data: goals } = useGoalsQuery(userId)
  const { data: habits } = useHabitsQuery(userId)

  return useMemo(() => {
    if (!txData?.transactions) return null
    const facts = buildRecap(txData.transactions)
    if (!facts) return null

    const whole = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    })
    const money = (n: number) => whole.format(Math.abs(n))
    const r = t.recap
    const category = (key: string) => t.categories[key] ?? key.replace(/_/g, ' ')
    const weekday = (d: number) =>
      new Date(2026, 9, 18 + d).toLocaleDateString(toDateLocale(locale), { weekday: 'long' })

    const sentences: string[] = [r.hi(name ?? '')]
    const diff = facts.usual === null ? null : facts.spent - facts.usual
    sentences.push(
      diff === null || Math.abs(diff) < 1
        ? r.spent(money(facts.spent))
        : r.spentVsUsual(money(facts.spent), money(diff), diff < 0)
    )
    let highlight = 1
    if (facts.top) {
      highlight = sentences.length
      sentences.push(
        r.busyLine(category(facts.top.category), money(facts.top.amount), facts.top.count, weekday(facts.top.weekday))
      )
    }
    if (facts.income > 0) sentences.push(r.income(money(facts.income)))

    const goal = [...(goals ?? [])]
      .filter((g) => g.targetAmount > 0 && g.savedAmount < g.targetAmount)
      .sort((a, b) => b.savedAmount / b.targetAmount - a.savedAmount / a.targetAmount)[0]
    if (goal) sentences.push(r.goal(goal.name, Math.round((goal.savedAmount / goal.targetAmount) * 100)))
    const habit = [...(habits ?? [])].sort((a, b) => b.streak - a.streak)[0]
    if (habit && habit.streak > 1) sentences.push(r.habit(habit.name, habit.streak))
    sentences.push(r.closing)

    const cardLine = [
      diff === null || Math.abs(diff) < 1
        ? r.cardSpent(money(facts.spent))
        : r.cardSpentVsUsual(money(facts.spent), money(diff), diff < 0),
      facts.top ? r.cardBusy(category(facts.top.category)) : '',
    ]
      .filter(Boolean)
      .join(' ')

    return { facts, sentences, highlight, cardLine }
  }, [txData, goals, habits, t, locale, currency, name])
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

/** Full-screen recap: Truffle reads the week aloud, line by line. */
export function RecapSheet({
  userId,
  recap,
  onClose,
}: {
  userId: string
  recap: Recap
  onClose: () => void
}) {
  const { t, locale } = useLanguage()
  const { formatAmount } = useCurrency()
  const { voiceId } = useVoicePreference()
  const router = useRouter()
  const player = useSentencePlayer(recap.sentences)
  const voice = useVoiceRecorder(userId)
  const { facts, sentences } = recap

  // Start reading as the sheet opens (the opening tap is the user gesture).
  useEffect(() => {
    player.play(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handedOffRef = useRef(false)
  const stopPlayer = player.stop
  useEffect(() => {
    if (!voice.transcript || handedOffRef.current) return
    handedOffRef.current = true
    stopPlayer()
    setChatHandoff(t.recap.askPrefix(voice.transcript))
    router.push('/chat')
  }, [voice.transcript, router, t, stopPlayer])

  const current = player.playing ? player.index : recap.highlight
  const seconds = sentences.map((s) => speakingSeconds(s, player.rate))
  const total = seconds.reduce((a, b) => a + b, 0)
  const elapsed = player.index < 0 ? 0 : seconds.slice(0, player.index).reduce((a, b) => a + b, 0)
  const progress = player.index < 0 ? 0 : (player.index + 1) / sentences.length
  const diff = facts.usual === null ? null : facts.spent - facts.usual

  const voiceStatus: VoiceButtonStatus = voice.isRecording
    ? 'recording'
    : voice.isTranscribing
      ? 'transcribing'
      : 'idle'

  return (
    <Sheet
      title={t.recap.title(facts.week)}
      onClose={() => {
        player.stop()
        onClose()
      }}
      closeLabel={t.common.close}
      closeGlyph="⌄"
      right={
        <button type="button" onClick={player.cycleRate} aria-label={t.recap.speed}>
          {player.rate}×
        </button>
      }
      footer={
        <div className="flex flex-col gap-3.5">
          <div aria-hidden className="flex items-center gap-0.5 h-9">
            {WAVE.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${i / WAVE.length < progress ? 'bg-truffle-text' : 'bg-truffle-border'}`}
                style={{
                  height: h,
                  ...(player.playing && !player.paused
                    ? { animation: `tr-bar 1.2s ease-in-out ${(i * 0.05).toFixed(2)}s infinite` }
                    : {}),
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-truffle-text2">
            <span>{clock(elapsed)}</span>
            <span>{clock(total)}</span>
          </div>
          <div className="grid grid-cols-[56px_1fr_56px] gap-2.5 items-center">
            <button
              type="button"
              onClick={() => player.skip(-1)}
              aria-label={t.recap.previousLine}
              className="key key-line h-14 text-xs"
            >
              ◀◀
            </button>
            <button
              type="button"
              onClick={player.togglePause}
              disabled={!player.supported}
              className="key key-ink h-16 text-[15px] uppercase"
            >
              {player.playing && !player.paused ? `❚❚ ${t.recap.pause}` : `▶ ${t.recap.play}`}
            </button>
            <button
              type="button"
              onClick={() => player.skip(1)}
              aria-label={t.recap.nextLine}
              className="key key-line h-14 text-xs"
            >
              ▶▶
            </button>
          </div>
          <VoiceButton
            status={voiceStatus}
            onStart={() => {
              player.stop()
              void voice.startRecording()
            }}
            onStop={voice.stopRecording}
            idleLabel={t.recap.holdToAsk}
            className="h-[52px] !text-[13px]"
          />
        </div>
      }
    >
      <div className="slip mx-4 mt-4 px-5 pt-[18px] pb-[34px] flex flex-col gap-3.5">
        <span className="text-[11px] text-truffle-text2 uppercase">
          {formatRange(facts.from, facts.to, toDateLocale(locale))} ·{' '}
          {t.recap.readBy(getPersona(voiceId).name)}
        </span>
        {sentences.map((line, i) => (
          <p
            key={i}
            className={`m-0 font-grotesk transition-all duration-300 ${
              i === current
                ? 'text-[22px] font-medium leading-[1.4] text-truffle-text bg-truffle-accent-soft shadow-[-6px_0_0_var(--t-accent-soft),6px_0_0_var(--t-accent-soft)]'
                : `text-[17px] leading-normal text-truffle-text2 ${player.playing && i > current ? 'opacity-55' : ''}`
            }`}
          >
            {line}
          </p>
        ))}
        <Rule />
        <LeaderRow className="text-[13px]" left={t.recap.spentLabel} right={<b>{formatAmount(facts.spent)}</b>} />
        {diff !== null && Math.abs(diff) >= 1 && (
          <LeaderRow
            className="text-[13px]"
            left={t.recap.vsUsual}
            right={
              <b className={diff < 0 ? 'text-truffle-positive' : 'text-truffle-warning'}>
                {diff < 0 ? '▼' : '▲'} {formatAmount(diff)}
              </b>
            }
          />
        )}
      </div>
      {voice.error && (
        <p role="alert" className="mx-4 mt-3 text-[11px] font-bold uppercase text-truffle-warning">
          ▲ {voice.error}
        </p>
      )}
    </Sheet>
  )
}
