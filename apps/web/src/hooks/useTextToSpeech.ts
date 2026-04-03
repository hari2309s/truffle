'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export type SpeechTone = 'celebratory' | 'reassuring' | 'concerned' | 'neutral'

interface SpeakOptions {
  tone?: SpeechTone
}

interface UseTextToSpeechReturn {
  speak: (text: string, options?: SpeakOptions) => void
  isSpeaking: boolean
  cancel: () => void
}

// Strip markdown and normalize punctuation for natural TTS flow.
// Returns a single clean string — no splitting, so the browser synthesises
// the whole response in one continuous breath (better prosody than chaining).
function preprocessText(raw: string): string {
  return raw
    .replace(/<function=[^>]*>[\s\S]*?<\/function>/g, '') // strip leaked tool-call XML
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/_(.*?)_/g, '$1') // underscore italic
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^[-*•]\s+/gm, '') // list markers
    .replace(/—/g, ', ') // em-dash → natural pause
    .replace(/ - /g, ', ') // spaced hyphen used as em-dash
    .replace(/;/g, ',') // semicolons → lighter pause
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Web Speech API pitch-shifting applies DSP that sounds robotic on high-quality
// voices. Keep pitch fixed at 1.0 and rate constant — tone metadata is preserved
// for future use with a real TTS API (ElevenLabs, etc.) where it actually helps.
function getProsody(_tone: SpeechTone): { rate: number; pitch: number } {
  return { rate: 0.95, pitch: 1.0 }
}

// Google/Microsoft voices come first — macOS system voices (Samantha etc.) appear
// in Chrome's getVoices() list but Chrome cannot synthesise with them and fails
// silently. Safari has no Google voices so it naturally falls through to Samantha.
const FEMALE_VOICE_NAMES = [
  'Google UK English Female', // Chrome desktop
  'Microsoft Zira', // Windows Chrome/Edge
  'Microsoft Eva', // Windows
  'Microsoft Jenny', // Windows
  'Samantha', // macOS Safari / iOS
  'Karen', // macOS Safari Australian
  'Moira', // macOS Safari Irish
  'Fiona', // macOS Safari Scottish
  'Tessa', // macOS Safari South African
  'Victoria', // macOS Safari
  'Ava', // macOS Safari
  'Allison', // macOS Safari
  'Susan', // macOS Safari
  'Zoe', // macOS Safari
]

function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  for (const name of FEMALE_VOICE_NAMES) {
    const match = voices.find((v) => v.lang.startsWith('en') && v.name.includes(name))
    if (match) return match
  }

  // Fallback: any English voice whose name hints at female
  const femaleKeywords = ['female', 'woman', 'zira', 'eva', 'jenny', 'aria']
  return (
    voices.find(
      (v) => v.lang.startsWith('en') && femaleKeywords.some((k) => v.name.toLowerCase().includes(k))
    ) ?? null
  )
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  // Cache the selected voice so speak() can assign it synchronously
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // Pre-load voices on mount. Chrome returns [] from getVoices() until
  // onvoiceschanged fires — doing this here keeps speak() synchronous so
  // Chrome's user-gesture requirement for speechSynthesis.speak() is met.
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const load = () => {
      voiceRef.current = pickFemaleVoice()
    }

    load()
    if (!voiceRef.current) {
      window.speechSynthesis.onvoiceschanged = () => {
        load()
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    utteranceRef.current = null
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const clean = preprocessText(text)
    const { rate, pitch } = getProsody(options?.tone ?? 'neutral')

    const utterance = new SpeechSynthesisUtterance(clean)
    utteranceRef.current = utterance

    // Use pre-loaded voice; fall back to a fresh lookup if the ref is still null
    const voice = voiceRef.current ?? pickFemaleVoice()
    if (voice) utterance.voice = voice

    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') console.warn('[TTS error]', e.error)
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  return { speak, isSpeaking, cancel }
}
