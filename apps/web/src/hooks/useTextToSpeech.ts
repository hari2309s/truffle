'use client'

import { useState, useCallback, useRef } from 'react'

interface UseTextToSpeechReturn {
  speak: (text: string) => void
  isSpeaking: boolean
  cancel: () => void
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const getBestVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return null

    // Priority: English natural/neural voices
    const preferred = voices.find((v) =>
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Samantha') || v.name.includes('Karen'))
    )
    if (preferred) return preferred

    // Fall back to any English voice
    return voices.find((v) => v.lang.startsWith('en')) ?? voices[0] ?? null
  }

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utteranceRef.current = utterance

    // Try to assign voice — voices may not be loaded yet
    const setVoice = () => {
      const voice = getBestVoice()
      if (voice) utterance.voice = voice
    }

    setVoice()
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoice
    }

    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return { speak, isSpeaking, cancel }
}
