'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Message } from 'ai/react'
import { supabase } from '@/lib/supabase'
import { ChatPage } from '@/components/ChatPage'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'

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
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const rows = (data ?? []).reverse()
        setInitialMessages(
          rows.length > 0
            ? rows.map((row) => ({
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
      <div className="h-dvh bg-truffle-bg flex flex-col max-w-lg mx-auto overflow-hidden">
        <TopBar />
        <main className="flex-1 flex items-center justify-center pb-14">
          <svg
            className="w-8 h-8 text-truffle-amber animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </main>
        <BottomNav active="chat" />
      </div>
    )

  return <ChatPage userId={userId} name={name} initialMessages={initialMessages} />
}
