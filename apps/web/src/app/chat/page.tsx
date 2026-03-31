'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
        <header className="flex items-center gap-3 px-4 py-4 border-b border-truffle-border">
          <div className="w-5 h-5" />
          <div className="flex items-center gap-2">
            <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} priority />
            <div>
              <p className="font-semibold text-truffle-text text-sm">Truffle</p>
              <p className="text-xs text-truffle-muted">Ask me anything</p>
            </div>
          </div>
        </header>
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
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg border-t border-truffle-border bg-truffle-bg/95 backdrop-blur-sm">
          <div className="flex">
            <Link
              href="/"
              className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-muted hover:text-truffle-text transition-colors"
            >
              <HomeIcon />
              <span className="text-[10px]">Home</span>
            </Link>
            <Link
              href="/chat"
              className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-amber"
            >
              <ChatIcon />
              <span className="text-[10px]">Chat</span>
            </Link>
            <Link
              href="/insights"
              className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-muted hover:text-truffle-text transition-colors"
            >
              <InsightsIcon />
              <span className="text-[10px]">Insights</span>
            </Link>
          </div>
        </nav>
      </div>
    )

  return <ChatPage userId={userId} name={name} initialMessages={initialMessages} />
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223 15.522 15.522 0 003-.152z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function InsightsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  )
}
