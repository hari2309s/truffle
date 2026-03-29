'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Message } from 'ai/react'
import { supabase } from '@/lib/supabase'
import { ChatPage } from '@/components/ChatPage'

export default function Chat() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [name, setName] = useState<string>('')
  const [initialMessages, setInitialMessages] = useState<Message[] | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/')
      } else {
        setUserId(session.user.id)
        setName((session.user.user_metadata?.name as string) ?? '')
      }
    })
  }, [router])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        setInitialMessages(
          data && data.length > 0
            ? data.map((row) => ({
                id: row.id as string,
                role: row.role as 'user' | 'assistant',
                content: row.content as string,
              }))
            : []
        )
      })
  }, [userId])

  // Wait for both auth and history before mounting ChatPage so useChat
  // receives a stable initialMessages and never resets mid-conversation.
  if (!userId || initialMessages === undefined)
    return (
      <div className="min-h-dvh bg-truffle-bg flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-truffle-amber animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )

  return <ChatPage userId={userId} name={name} initialMessages={initialMessages} />
}
