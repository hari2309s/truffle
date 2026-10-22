'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoicePreference } from '@/contexts/VoiceContext'
import { onVoicesReady, resolveVoice, type ResolvedVoice } from '@/lib/voices'

export const PLAYER_RATES = [1, 1.25, 1.5] as const

/**
 * Reads a list of sentences aloud one at a time, so the UI can highlight the
 * line being spoken (the Web Speech API has no reliable word timings across
 * browsers). Each run gets an id so a cancelled utterance's late `end` event
 * can't advance a newer run.
 */
export function useSentencePlayer(sentences: string[]) {
  const { voiceId } = useVoicePreference()
  const [index, setIndex] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [rate, setRate] = useState<(typeof PLAYER_RATES)[number]>(1)
  const runRef = useRef(0)
  const resolvedRef = useRef<ResolvedVoice>({ voice: null, rate: 1, pitch: 1 })
  const sentencesRef = useRef(sentences)
  sentencesRef.current = sentences
  const rateRef = useRef(rate)
  rateRef.current = rate

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (!supported) return
    const load = () => {
      resolvedRef.current = resolveVoice(voiceId)
    }
    load()
    return onVoicesReady(load)
  }, [voiceId, supported])

  const speakFrom = useCallback(
    (start: number) => {
      if (!supported) return
      const run = ++runRef.current
      window.speechSynthesis.cancel()
      const say = (i: number) => {
        if (run !== runRef.current) return
        const text = sentencesRef.current[i]
        if (text === undefined) {
          setPlaying(false)
          setPaused(false)
          setIndex(-1)
          return
        }
        const u = new SpeechSynthesisUtterance(text)
        const resolved = resolvedRef.current.voice ? resolvedRef.current : resolveVoice(voiceId)
        if (resolved.voice) u.voice = resolved.voice
        u.rate = resolved.rate * rateRef.current
        u.pitch = resolved.pitch
        u.onstart = () => run === runRef.current && setIndex(i)
        u.onend = () => say(i + 1)
        u.onerror = (e) => {
          if (e.error === 'interrupted' || e.error === 'canceled') return
          say(i + 1)
        }
        setIndex(i)
        window.speechSynthesis.speak(u)
      }
      setPlaying(true)
      setPaused(false)
      say(Math.max(0, Math.min(start, sentencesRef.current.length - 1)))
    },
    [supported, voiceId]
  )

  const stop = useCallback(() => {
    runRef.current++
    if (supported) window.speechSynthesis.cancel()
    setPlaying(false)
    setPaused(false)
  }, [supported])

  const togglePause = useCallback(() => {
    if (!supported) return
    if (!playing) return speakFrom(index < 0 ? 0 : index)
    if (paused) {
      window.speechSynthesis.resume()
      setPaused(false)
    } else {
      window.speechSynthesis.pause()
      setPaused(true)
    }
  }, [supported, playing, paused, index, speakFrom])

  const skip = useCallback(
    (delta: number) => speakFrom((index < 0 ? 0 : index) + delta),
    [index, speakFrom]
  )

  const cycleRate = useCallback(() => {
    const next = PLAYER_RATES[(PLAYER_RATES.indexOf(rateRef.current) + 1) % PLAYER_RATES.length]!
    setRate(next)
    rateRef.current = next
    // Restart the current sentence so the new speed applies immediately.
    if (playing) speakFrom(index < 0 ? 0 : index)
  }, [playing, index, speakFrom])

  useEffect(() => stop, [stop])

  return { supported, index, playing, paused, rate, play: speakFrom, stop, togglePause, skip, cycleRate }
}

/** Rough speaking time in seconds (~2.6 words a second at 1×). */
export function speakingSeconds(text: string, rate = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.round(words / 2.6 / rate)
}
