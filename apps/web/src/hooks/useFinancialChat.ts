'use client'

import { useChat } from 'ai/react'
import { useEffect, useRef } from 'react'
import { useTextToSpeech } from './useTextToSpeech'
import { supabase } from '@/lib/supabase'

export function useFinancialChat(userId: string) {
  const { speak, isSpeaking, cancel } = useTextToSpeech()
  const lastAssistantMessageRef = useRef<string>('')

  const chat = useChat({
    api: '/api/chat',
    body: { userId },
    onFinish: async (message) => {
      // Speak the response
      if (message.role === 'assistant' && message.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = message.content
        speak(message.content)
      }

      // Save to Supabase
      try {
        await supabase.from('chat_messages').insert({
          user_id: userId,
          role: message.role,
          content: message.content,
        })
      } catch (e) {
        console.warn('Failed to save chat message:', e)
      }
    },
  })

  const startVoice = async (transcript: string) => {
    if (!transcript.trim()) return
    await chat.append({ role: 'user', content: transcript })
  }

  return {
    ...chat,
    isSpeaking,
    cancelSpeech: cancel,
    startVoice,
  }
}
