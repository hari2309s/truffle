'use client'

import { useChat } from 'ai/react'
import { useEffect, useRef, useState } from 'react'
import type { Message } from 'ai/react'
import { useTextToSpeech } from './useTextToSpeech'
import { supabase } from '@/lib/supabase'

export function useFinancialChat(userId: string) {
  const { speak, isSpeaking, cancel } = useTextToSpeech()
  const lastAssistantMessageRef = useRef<string>('')
  const [initialMessages, setInitialMessages] = useState<Message[] | undefined>(undefined)

  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setInitialMessages(
            data.map((row) => ({
              id: row.id as string,
              role: row.role as 'user' | 'assistant',
              content: row.content as string,
            }))
          )
        } else {
          setInitialMessages([])
        }
      })
  }, [userId])

  const chat = useChat({
    api: '/api/chat',
    body: { userId },
    initialMessages,
    onFinish: async (message, { finishReason }) => {
      // Speak the response
      if (message.role === 'assistant' && message.content !== lastAssistantMessageRef.current) {
        lastAssistantMessageRef.current = message.content
        speak(message.content)
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
