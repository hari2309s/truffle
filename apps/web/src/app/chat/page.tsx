'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TruffleUIMessage } from '@/hooks/useFinancialChat'
import { supabase } from '@/lib/supabase'
import { ChatPage } from '@/components/ChatPage'
import { ChatShell } from '@/components/ChatShell'
import { takeChatHandoff } from '@/lib/chatHandoff'

export default function Chat() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [name, setName] = useState<string>('')
  const [initialMessages, setInitialMessages] = useState<TruffleUIMessage[] | undefined>(undefined)
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null)

  // Something spoken or tapped on Home (see lib/chatHandoff).
  useEffect(() => {
    setInitialPrompt(takeChatHandoff())
  }, [])

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

    // Load history, then mark unread nudges read — in that order, so the
    // notices slip still knows which ones are new on this visit.
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at, is_proactive, read_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const rows = (data ?? []).reverse()
        setInitialMessages(
          rows.map((row) => ({
            id: row.id as string,
            role: row.role as 'user' | 'assistant',
            parts: [{ type: 'text' as const, text: (row.content as string) ?? '' }],
            metadata: {
              createdAt: row.created_at as string,
              proactive: Boolean(row.is_proactive),
              unread: Boolean(row.is_proactive) && !row.read_at,
            },
          }))
        )

        void supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('is_proactive', true)
          .is('read_at', null)
          .then(() => {})
      })
  }, [userId])

  // Wait for both auth and history before mounting ChatPage so useChat
  // receives a stable initialMessages and never resets mid-conversation.
  if (!userId || initialMessages === undefined) return <ChatShell />

  return (
    <ChatPage
      userId={userId}
      name={name}
      initialMessages={initialMessages}
      initialPrompt={initialPrompt}
    />
  )
}
