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

// Web Speech API pitch-shifting applies DSP that sounds robotic on high-quality
// voices. Keep pitch fixed at 1.0 and rate constant — tone metadata is preserved
// for future use with a real TTS API (ElevenLabs, etc.) where it actually helps.
function getProsody(_tone: SpeechTone): { rate: number; pitch: number } {
  return { rate: 0.95, pitch: 1.0 }
}

// Known female English voice name fragments, ordered by quality preference
const FEMALE_VOICE_NAMES = [
  'Samantha', // macOS/iOS — best quality
  'Karen', // macOS Australian
  'Moira', // macOS Irish
  'Fiona', // macOS Scottish
  'Tessa', // macOS South African
  'Victoria', // macOS
  'Ava', // macOS
  'Allison', // macOS
  'Susan', // macOS
  'Zoe', // macOS
  'Google UK English Female', // Chrome desktop
  'Microsoft Zira', // Windows
  'Microsoft Eva', // Windows
  'Microsoft Jenny', // Windows
]

function getBestVoice(): SpeechSynthesisVoice | null {
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

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    utteranceRef.current = null
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speak = useCallback(async (text: string, options?: SpeakOptions) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    // On Chrome, getVoices() returns [] until onvoiceschanged fires.
    // Wait for voices before creating the utterance so we can assign the
    // correct voice before speak() is called — not after.
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null
          resolve()
        }
      })
    }

    const clean = preprocessText(text)
    const { rate, pitch } = getProsody(options?.tone ?? 'neutral')

    const utterance = new SpeechSynthesisUtterance(clean)
    utteranceRef.current = utterance

    const voice = getBestVoice()
    if (voice) utterance.voice = voice

    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = 1.0

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
