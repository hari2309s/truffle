'use client'

import { useState, useCallback, useRef } from 'react'

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

// Heuristic tone detection from response text
function detectTone(text: string): SpeechTone {
  const lower = text.toLowerCase()

  const celebratoryMarkers = [
    'great job',
    'well done',
    'amazing',
    'excellent',
    'congratulations',
    "you're crushing",
    'killing it',
    'keep it up',
    'fantastic',
    'awesome',
    "you've saved",
    'you saved',
    'ahead of',
  ]
  const reassuringMarkers = [
    "don't worry",
    "it's okay",
    "that's okay",
    'wiggle room',
    'small step',
    "you've got this",
    'one step',
    'tight month',
    "it'll be okay",
    "you're doing",
    'not alone',
    'we can',
    'breathe',
  ]
  const concernedMarkers = [
    'careful',
    'overspending',
    'over budget',
    'going negative',
    'shortfall',
    'watch out',
    'running low',
    'projected to',
    'might want to',
  ]

  if (celebratoryMarkers.some((m) => lower.includes(m))) return 'celebratory'
  if (reassuringMarkers.some((m) => lower.includes(m))) return 'reassuring'
  if (concernedMarkers.some((m) => lower.includes(m))) return 'concerned'
  return 'neutral'
}

function getProsody(tone: SpeechTone): { rate: number; pitch: number } {
  switch (tone) {
    case 'celebratory':
      return { rate: 1.05, pitch: 1.08 }
    case 'reassuring':
      return { rate: 0.92, pitch: 0.97 }
    case 'concerned':
      return { rate: 0.93, pitch: 0.95 }
    default:
      return { rate: 0.95, pitch: 1.0 }
  }
}

function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  // Ordered preference list — natural/neural quality first
  const preferred = [
    'Samantha', // macOS/iOS — best quality
    'Karen', // macOS Australian
    'Moira', // macOS Irish
    'Google UK English Female',
    'Google US English',
    'Natural', // any OS with Neural/Natural voices
    'Neural',
  ]

  for (const name of preferred) {
    const match = voices.find((v) => v.lang.startsWith('en') && v.name.includes(name))
    if (match) return match
  }

  return voices.find((v) => v.lang.startsWith('en')) ?? voices[0] ?? null
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

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
    const tone = options?.tone ?? detectTone(text)
    const { rate, pitch } = getProsody(tone)

    const utterance = new SpeechSynthesisUtterance(clean)
    utteranceRef.current = utterance

    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = 1.0

    // Assign voice — voices may not be loaded on first call
    const setVoice = () => {
      const voice = getBestVoice()
      if (voice) utterance.voice = voice
    }

    setVoice()
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoice()
        window.speechSynthesis.onvoiceschanged = null
      }
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.warn('[TTS error]', e.error)
      }
      setIsSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }, [])

  return { speak, isSpeaking, cancel }
}
