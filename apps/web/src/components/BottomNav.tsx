'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

type Tab = 'home' | 'chat' | 'insights'

interface BottomNavProps {
  active: Tab
}

async function fetchUnreadCount(): Promise<number> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return 0

  const { count } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .eq('is_proactive', true)
    .is('read_at', null)

  return count ?? 0
}

export function BottomNav({ active }: BottomNavProps) {
  const { t } = useLanguage()
  // Shared TanStack Query cache: BottomNav is mounted independently by
  // Dashboard, ChatPage and InsightsPage, so without a shared cache each
  // mount would refire both the session lookup and the count query on
  // every navigation.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: fetchUnreadCount,
  })

  const tabs: { id: Tab; href: string; label: string; badge?: number }[] = [
    { id: 'home', href: '/', label: t.nav.home },
    { id: 'chat', href: '/chat', label: t.nav.chat, badge: active === 'chat' ? 0 : unreadCount },
    { id: 'insights', href: '/insights', label: t.nav.insights },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 bg-truffle-bg rule-soft px-2 pt-1 pb-[calc(4px+env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-3">
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative h-14 grid place-items-center text-xs font-bold uppercase tracking-[.08em] underline-offset-[6px] decoration-2 ${
                isActive ? 'text-truffle-text underline' : 'text-truffle-text2'
              }`}
            >
              {tab.label}
              {!!tab.badge && tab.badge > 0 && (
                <span
                  aria-label={`${tab.badge} unread`}
                  className="absolute top-1.5 right-[20%] min-w-5 h-5 px-1 bg-truffle-accent text-truffle-on-accent text-[11px] font-bold grid place-items-center no-underline"
                >
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
