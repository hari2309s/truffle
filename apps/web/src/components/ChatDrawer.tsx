'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ChatEmbed } from './ChatEmbed'
import { TRUFFLE_ICON } from './Tally'

/**
 * Tablet chat drawer — collapsed 56px bar at bottom showing last message,
 * expands to 614px with spring animation on tap.
 */
export function ChatDrawer({ userId }: { userId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [lastMessage, setLastMessage] = useState<string>('')

  // Fetch last assistant message for collapsed preview
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('content')
      .eq('user_id', userId)
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]?.content) setLastMessage(data[0].content as string)
      })
  }, [userId])

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return 0
      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_proactive', true)
        .is('read_at', null)
      return count ?? 0
    },
  })

  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <div
          className="absolute inset-0 z-[5] bg-[var(--t-backdrop,rgba(0,0,0,.6))]"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-truffle-surface border-t border-dashed border-truffle-border rounded-t-[14px] flex flex-col z-[6]"
        style={{
          height: 614,
          transform: expanded ? 'translateY(0)' : 'translateY(558px)',
          transition: 'transform .55s cubic-bezier(.3, 1.22, .5, 1)',
        }}
      >
        {/* Collapsed bar (always visible) */}
        {!expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex-none h-14 flex items-center gap-2.5 px-6 cursor-pointer"
          >
            <Image src={TRUFFLE_ICON} alt="" width={20} height={20} />
            <span className="flex-1 min-w-0 font-grotesk text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">
              {lastMessage || 'Start a conversation...'}
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-[5px] py-px bg-truffle-accent text-[#1b1a18]">
                {unreadCount}
              </span>
            )}
            <span className="text-[13px]">▲</span>
          </button>
        )}

        {/* Drag handle (expanded) */}
        {expanded && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex-none h-7 flex items-center justify-center cursor-grab"
          >
            <span className="w-10 h-1 rounded-sm bg-truffle-text2" />
          </button>
        )}

        {/* Chat content */}
        {expanded && (
          <div className="flex-1 min-h-0 flex flex-col px-6 pb-4">
            <ChatEmbed userId={userId} controlSize={44} />
          </div>
        )}
      </div>
    </>
  )
}
