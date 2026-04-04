'use client'

import { useChat } from 'ai/react'
import { useRef, useEffect } from 'react'
import type { Message } from 'ai/react'
import { useTextToSpeech, type SpeechTone } from './useTextToSpeech'
import { supabase } from '@/lib/supabase'

type StreamAnnotation = { type: string; tone?: SpeechTone }

export function useFinancialChat(userId: string, initialMessages: Message[]) {
  const { speak, isSpeaking, cancel } = useTextToSpeech()
  const lastAssistantMessageRef = useRef<string>('')
  const latestDataRef = useRef<StreamAnnotation[]>([])

  const chat = useChat({
    api: '/api/chat',
    body: { userId },
    initialMessages,
    onResponse: () => {
      // Reset data ref at the start of each new response
      latestDataRef.current = []
    },
    onError: (error) => {
      console.error('[useFinancialChat] stream error:', error, error?.message, error?.cause)
    },
    onFinish: async (message, { finishReason }) => {
      // Speak the response, using the server-emitted tone if available
      if (message.role === 'assistant' && message.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = message.content
        const toneAnnotation = latestDataRef.current.find((d) => d.type === 'speech_tone')
        speak(message.content, { tone: toneAnnotation?.tone })
      }

      // Save assistant message; the preceding user message was saved in startVoice / handleSubmit wrapper
      if (finishReason === 'stop' || finishReason === 'length') {
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

  // Keep the ref in sync so onFinish always reads the latest stream data
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
  }
}
