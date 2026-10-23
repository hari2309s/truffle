'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Meter } from './Tally'

export type VoiceButtonStatus = 'idle' | 'recording' | 'transcribing' | 'speaking'

interface VoiceButtonProps {
  status: VoiceButtonStatus
  onStart: () => void
  onStop: () => void
  /** Tap while Truffle is talking — cancels speech. Omit where Truffle never speaks. */
  onStopSpeaking?: () => void
  /** Replaces "Hold · Speak" on the idle key. */
  idleLabel?: string
  /** Plain (not apricot) when idle — for a secondary voice key. */
  quiet?: boolean
  className?: string
}

/**
 * The print key: hold to speak, release to print. Four states — idle,
 * listening (pressed in, with a timer), thinking and speaking.
 */
export function VoiceButton({
  status,
  onStart,
  onStop,
  onStopSpeaking,
  idleLabel,
  quiet = false,
  className = 'h-[72px]',
}: VoiceButtonProps) {
  const { t } = useLanguage()
  const isRecording = status === 'recording'
  const isTranscribing = status === 'transcribing'
  const isSpeaking = status === 'speaking'
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!isRecording) return
    setSeconds(0)
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isRecording])

  const start = useCallback(() => {
    if (!isRecording && !isTranscribing && !isSpeaking) {
      onStart()
    }
  }, [isRecording, isTranscribing, isSpeaking, onStart])

  const stop = useCallback(() => {
    if (isRecording) {
      onStop()
    }
  }, [isRecording, onStop])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      e.preventDefault()
      if (e.repeat) return
      if (isSpeaking) onStopSpeaking?.()
      else start()
    },
    [start, isSpeaking, onStopSpeaking]
  )

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      e.preventDefault()
      stop()
    },
    [stop]
  )

  const variant = isSpeaking
    ? 'key-ink'
    : isTranscribing
      ? 'key-surface'
      : quiet && !isRecording
        ? 'key-plain'
        : 'key-accent'
  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  const label = isRecording
    ? `${t.voice.listening} ${timer}`
    : isTranscribing
      ? t.voice.thinking
      : isSpeaking
        ? t.voice.tapToStop
        : (idleLabel ?? t.voice.holdSpeak)

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onClick={isSpeaking ? onStopSpeaking : undefined}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={(e) => e.preventDefault()}
      data-pressed={isRecording}
      aria-label={label}
      disabled={isTranscribing}
      className={`key ${variant} w-full gap-2.5 text-sm uppercase touch-none select-none disabled:!opacity-100 disabled:cursor-wait ${className}`}
    >
      {isRecording && <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-truffle-on-accent blink" />}
      {/* Truffle talking: the level meter plays inside the key itself. */}
      {isSpeaking && (
        <span aria-hidden className="flex w-16 shrink-0">
          <Meter bars={9} barClassName="bg-current" />
        </span>
      )}
      {isSpeaking && <span aria-hidden>■</span>}
      <span>{label}</span>
    </button>
  )
}
