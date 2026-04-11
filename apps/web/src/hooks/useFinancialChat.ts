'use client'

import { useChat } from 'ai/react'
import { useRef, useEffect, useCallback } from 'react'
import type { Message } from 'ai/react'
import { useTextToSpeech, type SpeechTone } from './useTextToSpeech'
import { supabase } from '@/lib/supabase'
import { offlineDb } from '@/lib/offline-db'
import { generateOfflineFallback } from '@/lib/offline-chat'
import { useIsOnline } from './useIsOnline'

type StreamAnnotation = { type: string; tone?: SpeechTone }

export function useFinancialChat(userId: string, initialMessages: Message[]) {
  const { speak, isSpeaking, cancel } = useTextToSpeech()
  const lastAssistantMessageRef = useRef<string>('')
  const latestDataRef = useRef<StreamAnnotation[]>([])
  const isFlushingRef = useRef(false)

  const chat = useChat({
    api: '/api/chat',
    body: { userId },
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
        speak(message.content, { tone: toneAnnotation?.tone })
      }

      if (finishReason === 'stop' || finishReason === 'length') {
        // Mark "answered just now" if this response came from flushing the offline queue
        if (isFlushingRef.current) {
          chat.setMessages((prev) =>
            prev.map((m) =>
              m.id === message.id
                ? { ...m, annotations: [...(m.annotations ?? []), { type: 'answered_just_now' }] }
                : m
            )
          )
        }

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

  // ----- Offline queue flush -----

  const flushPendingMessages = useCallback(async () => {
    const pending = await offlineDb.pendingChatMessages
      .where('userId')
      .equals(userId)
      .sortBy('createdAt')
    if (pending.length === 0) return

    isFlushingRef.current = true
    for (const msg of pending) {
      // Re-send each queued message to the real AI
      await chat.append({ role: 'user', content: msg.content })
      await offlineDb.pendingChatMessages.delete(msg.id!)
    }
    isFlushingRef.current = false
  }, [userId, chat])

  const isOnline = useIsOnline(flushPendingMessages)

  // ----- Offline message handling -----

  const handleOfflineMessage = useCallback(
    async (content: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        createdAt: new Date(),
      }
      const fallbackContent = await generateOfflineFallback(userId, content)
      const fallbackMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fallbackContent,
        createdAt: new Date(),
        annotations: [{ type: 'offline_fallback' }],
      }

      chat.setMessages((prev) => [...prev, userMsg, fallbackMsg])

      // Queue for when we reconnect
      await offlineDb.pendingChatMessages.add({ userId, content, createdAt: Date.now() })

      // Speak the fallback using the existing TTS
      speak(fallbackContent)
    },
    [userId, chat, speak]
  )

  // ----- Public API -----

  const saveUserMessage = async (content: string) => {
    try {
      await supabase.from('chat_messages').insert({ user_id: userId, role: 'user', content })
    } catch (e) {
      console.warn('Failed to save user message:', e)
    }
  }

  const startVoice = async (transcript: string) => {
    if (!transcript.trim()) return
    if (!isOnline) {
      await handleOfflineMessage(transcript)
      return
    }
    await saveUserMessage(transcript)
    await chat.append({ role: 'user', content: transcript })
  }

  const handleSubmit: typeof chat.handleSubmit = (e, options) => {
    if (!isOnline && chat.input.trim()) {
      e?.preventDefault?.()
      handleOfflineMessage(chat.input.trim())
      chat.setInput('')
      return
    }
    if (chat.input.trim()) saveUserMessage(chat.input.trim())
    return chat.handleSubmit(e, options)
  }

  return {
    ...chat,
    handleSubmit,
    isSpeaking,
    cancelSpeech: cancel,
    startVoice,
    isOnline,
  }
}
