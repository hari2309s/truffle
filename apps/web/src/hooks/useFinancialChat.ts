'use client'

import { useChat } from 'ai/react'
import { useRef, useEffect, useCallback, useState } from 'react'
import type { Message } from 'ai/react'
import { useTextToSpeech, type SpeechTone } from './useTextToSpeech'
import { supabase } from '@/lib/supabase'

type StreamAnnotation = { type: string; tone?: SpeechTone }

export function useFinancialChat(
  userId: string,
  initialMessages: Message[],
  currency: string = 'EUR',
  locale: string = 'en'
) {
  const { speak, isSpeaking, cancel } = useTextToSpeech()
  const lastAssistantMessageRef = useRef<string>('')
  const latestDataRef = useRef<StreamAnnotation[]>([])

  const isMutedRef = useRef(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('truffle_voice_muted') === 'true'
    isMutedRef.current = stored
    setIsMuted(stored)
  }, [])

  const toggleMute = useCallback(() => {
    const next = !isMutedRef.current
    isMutedRef.current = next
    setIsMuted(next)
    if (next) cancel()
    localStorage.setItem('truffle_voice_muted', String(next))
  }, [cancel])

  const chat = useChat({
    api: '/api/chat',
    body: { userId, currency, locale },
    initialMessages,
    onResponse: () => {
      latestDataRef.current = []
    },
    onError: (error) => {
      console.error('[useFinancialChat] stream error:', error, error?.message, error?.cause)
    },
    onFinish: async (message, { finishReason }) => {
      if (message.role === 'assistant' && message.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = message.content
        const toneAnnotation = latestDataRef.current.find((d) => d.type === 'speech_tone')
        if (!isMutedRef.current) speak(message.content, { tone: toneAnnotation?.tone })
      }

      if (finishReason === 'stop' || finishReason === 'length') {
        // Skip saving empty assistant messages (tool-only responses with no text).
        // The card components persist their own acknowledgement messages to Supabase.
        if (!message.content?.trim()) return

        try {
          await supabase.from('chat_messages').insert({
            user_id: userId,
            role: message.role,
            content: message.content,
          })
        } catch (e) {
          console.warn('Failed to save chat message:', e)
        }
      }
    },
  })

  useEffect(() => {
    if (chat.data) {
      latestDataRef.current = chat.data as StreamAnnotation[]
    }
  }, [chat.data])

  const saveUserMessage = async (content: string) => {
    try {
      await supabase.from('chat_messages').insert({ user_id: userId, role: 'user', content })
    } catch (e) {
      console.warn('Failed to save user message:', e)
    }
  }

  const startVoice = async (transcript: string) => {
    if (!transcript.trim()) return
    await saveUserMessage(transcript)
    await chat.append({ role: 'user', content: transcript })
  }

  const handleSubmit: typeof chat.handleSubmit = (e, options) => {
    if (chat.input.trim()) saveUserMessage(chat.input.trim())
    return chat.handleSubmit(e, options)
  }

  return {
    ...chat,
    handleSubmit,
    isSpeaking,
    cancelSpeech: cancel,
    startVoice,
    isMuted,
    toggleMute,
  }
}
