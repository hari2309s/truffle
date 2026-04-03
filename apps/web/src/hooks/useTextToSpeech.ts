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

// Strip markdown and normalize punctuation for natural TTS flow
function preprocessText(raw: string): string[] {
  const clean = raw
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/_(.*?)_/g, '$1') // underscore italic
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^[-*•]\s+/gm, '') // list markers
    .replace(/—/g, ', ') // em-dash → natural pause
    .replace(/;/g, ',') // semicolons → lighter pause
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Split on sentence boundaries. Require whitespace or end-of-string after the
  // terminal punctuation to avoid splitting on decimal numbers like €12.50.
  const sentences = clean.match(/[^.!?]+[.!?]+["']?(?=\s|$)/g) ?? [clean]
  return sentences.map((s) => s.trim()).filter(Boolean)
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
      return { rate: 1.08, pitch: 1.1 }
    case 'reassuring':
      return { rate: 0.88, pitch: 0.95 }
    case 'concerned':
      return { rate: 0.9, pitch: 0.92 }
    default:
      return { rate: 1.0, pitch: 1.0 }
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
  const queueRef = useRef<SpeechSynthesisUtterance[]>([])
  const activeRef = useRef<SpeechSynthesisUtterance | null>(null)

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    queueRef.current = []
    activeRef.current = null
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    queueRef.current = []
    activeRef.current = null

    const sentences = preprocessText(text)
    const tone = options?.tone ?? detectTone(text)
    const { rate, pitch } = getProsody(tone)

    // Resolve voice (may need onvoiceschanged if not loaded yet)
    let voice = getBestVoice()
    const voicesLoaded = window.speechSynthesis.getVoices().length > 0

    const speakNext = () => {
      const utterance = queueRef.current.shift()
      if (!utterance) {
        setIsSpeaking(false)
        activeRef.current = null
        return
      }
      activeRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }

    const utterances = sentences.map((sentence, i) => {
      const u = new SpeechSynthesisUtterance(sentence)
      u.rate = rate
      u.pitch = pitch
      u.volume = 0.92

      if (voice) u.voice = voice

      u.onstart = i === 0 ? () => setIsSpeaking(true) : null
      u.onend = () => speakNext()
      u.onerror = (e) => {
        // Ignore 'interrupted' — that's just us calling cancel()
        if (e.error !== 'interrupted') {
          console.warn('[TTS error]', e.error, sentence)
        }
        speakNext()
      }
      return u
    })

    if (!voicesLoaded) {
      window.speechSynthesis.onvoiceschanged = () => {
        voice = getBestVoice()
        utterances.forEach((u) => {
          if (voice) u.voice = voice
        })
        window.speechSynthesis.onvoiceschanged = null
      }
    }

    queueRef.current = utterances.slice(1) // first is spoken immediately
    const first = utterances[0]
    if (!first) return
    activeRef.current = first
    setIsSpeaking(true)
    window.speechSynthesis.speak(first)
  }, [])

  return { speak, isSpeaking, cancel }
}
