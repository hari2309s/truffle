'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { VoiceButton, type VoiceButtonStatus } from './VoiceButton'
import { SettingsSheet } from './SettingsSheet'
import { ThemeToggle } from './ThemeToggle'
import { TRUFFLE_ICON } from './Tally'
import { useVoiceRecorder, MIC_UNAVAILABLE_ERROR } from '@/hooks/useVoiceRecorder'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { setChatHandoff } from '@/lib/chatHandoff'

export type NavTab = 'home' | 'chat' | 'insights'

interface AppShellProps {
  active: NavTab
  userId?: string
  name?: string
  children: React.ReactNode
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

const NAV_ITEMS: { id: NavTab; num: string; href: string }[] = [
  { id: 'home', num: '01', href: '/' },
  { id: 'chat', num: '02', href: '/chat' },
  { id: 'insights', num: '03', href: '/insights' },
]

/**
 * Responsive app shell — renders the right navigation chrome per breakpoint:
 *   • xl (≥1280): 248px paper sidebar with nav, settings, voice key
 *   • md (≥768): 72px sticky top tab strip + bottom voice key
 *   • mobile: existing TopBar + BottomNav
 *
 * Pages render as `children` inside the shell's content area and no longer
 * manage their own TopBar/BottomNav.
 */
export function AppShell({ active, userId, name, children }: AppShellProps) {
  const { t } = useLanguage()
  const { currency } = useCurrency()
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)
  const showVoice = active !== 'chat'

  const voice = useVoiceRecorder(userId ?? '')

  // Navigate to chat with transcript (non-chat pages only)
  useEffect(() => {
    if (showVoice && voice.transcript) {
      setChatHandoff(voice.transcript)
      router.push('/chat')
    }
  }, [voice.transcript, router, showVoice])

  const voiceStatus: VoiceButtonStatus = voice.isRecording
    ? 'recording'
    : voice.isTranscribing
      ? 'transcribing'
      : 'idle'

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: fetchUnreadCount,
  })

  const today = new Date()
  const dateStr = today
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()

  const currencyLabel = currency.toUpperCase()

  const tabs: { id: NavTab; label: string; badge?: number }[] = [
    { id: 'home', label: t.nav.home },
    { id: 'chat', label: t.nav.chat, badge: active === 'chat' ? 0 : unreadCount },
    { id: 'insights', label: t.nav.insights },
  ]

  return (
    <div className="h-dvh flex flex-col xl:flex-row overflow-hidden bg-truffle-bg">
      {/* ── Desktop Sidebar (xl+) ── */}
      <aside className="hidden xl:block flex-none w-[248px] py-6 pl-6 box-border">
        <div className="sticky top-6 flex flex-col gap-2.5">
          {/* Paper strip */}
          <div className="slip px-4 pt-5 pb-[30px] flex flex-col gap-3.5">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <Image src={TRUFFLE_ICON} alt="" width={30} height={30} />
              <span className="text-[15px] font-bold tracking-[.16em] uppercase">Truffle</span>
            </div>

            {/* User + date */}
            <div className="flex justify-between text-[10px] font-bold tracking-[.1em] text-truffle-text2">
              {name ? <span>FOR {name.toUpperCase()}</span> : <span />}
              <span>{dateStr}</span>
            </div>

            <div className="border-t border-dashed border-truffle-text2" />

            {/* Nav items */}
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const tab = tabs.find((t) => t.id === item.id)!
                const isActive = item.id === active
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 min-h-[48px] px-2.5 rounded-lg text-[13px] font-bold tracking-[.06em] ${
                      isActive
                        ? 'bg-truffle-text text-truffle-bg'
                        : 'hover:bg-truffle-surface'
                    }`}
                  >
                    <span className="opacity-70 text-[11px]">{item.num}</span>
                    <span className="uppercase">{tab.label}</span>
                    <span className="flex-1 border-b-2 border-dotted border-current mt-1.5 opacity-30" />
                    {!!tab.badge && tab.badge > 0 && (
                      <span className="min-w-5 h-5 rounded-full bg-truffle-accent text-[#302e2b] text-[11px] font-bold grid place-items-center">
                        {tab.badge}
                      </span>
                    )}
                    {isActive && <span>◂</span>}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-dashed border-truffle-text2" />

            {/* Settings row */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 min-h-[44px] px-2.5 text-[13px] font-bold tracking-[.06em] hover:bg-truffle-surface rounded-lg"
            >
              <span className="opacity-70 text-[11px]">⚙</span>
              <span>{t.topBar.settingsLabel}</span>
              <span className="flex-1 border-b-2 border-dotted border-truffle-border mt-1.5" />
              <span className="text-[11px] text-truffle-text2">{currencyLabel}</span>
            </button>

            {/* Voice button (not on chat) */}
            {showVoice && userId && (
              <>
                <VoiceButton
                  status={voiceStatus}
                  onStart={voice.startRecording}
                  onStop={voice.stopRecording}
                  className="h-16 mt-1.5"
                />
                <span className="text-center text-[10px] tracking-[.08em] text-truffle-text2">
                  OR PRESS SPACE
                </span>
              </>
            )}
          </div>

          {/* Scissor line */}
          <div className="flex items-center gap-2 text-truffle-text2 text-[11px]">
            <span>✂</span>
            <span className="flex-1 border-t-2 border-dashed border-truffle-border" />
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Tablet top bar (md–xl) */}
        <header className="hidden md:flex xl:hidden sticky top-0 z-20 bg-truffle-bg border-b border-dashed border-truffle-border items-center justify-between gap-4 px-8 h-[72px]">
          <div className="flex items-center gap-2.5">
            <Image src={TRUFFLE_ICON} alt="" width={28} height={28} />
            <span className="text-sm font-bold tracking-[.16em] uppercase">Truffle</span>
          </div>

          <nav className="flex gap-1 h-full">
            {NAV_ITEMS.map((item) => {
              const tab = tabs.find((t) => t.id === item.id)!
              const isActive = item.id === active
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-4 text-[13px] font-bold tracking-[.08em] uppercase border-b-[3px] box-border ${
                    isActive
                      ? 'text-truffle-text border-truffle-text border-dashed'
                      : 'text-truffle-text2 border-transparent'
                  }`}
                >
                  {tab.label}
                  {!!tab.badge && tab.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] rounded-full bg-truffle-accent text-[#302e2b] text-[10px] font-bold grid place-items-center">
                      {tab.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label={t.topBar.settingsLabel}
            className="w-11 h-11 rounded-lg bg-truffle-card border border-truffle-border shadow-[0_4px_0_var(--t-border)] grid place-items-center text-base active:translate-y-1 active:shadow-none"
          >
            ⚙
          </button>
        </header>

        {/* Mobile top bar (below md) */}
        <div className="md:hidden">
          <TopBar>
            <ThemeToggle />
            {userId && (
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                aria-label={t.topBar.settingsLabel}
                aria-haspopup="dialog"
                className="key-icon text-[13px]"
              >
                ···
              </button>
            )}
          </TopBar>
        </div>

        {/* Page content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Mobile bottom nav (below md) */}
        <div className="md:hidden">
          <BottomNav active={active} />
        </div>

        {/* Tablet bottom voice key (md–xl, not on chat) */}
        {showVoice && userId && (
          <div className="hidden md:flex xl:hidden sticky bottom-0 z-20 bg-truffle-bg border-t border-dashed border-truffle-border justify-center px-8 py-3 pb-5">
            <VoiceButton
              status={voiceStatus}
              onStart={voice.startRecording}
              onStop={voice.stopRecording}
              className="h-[72px] max-w-[560px] w-full"
            />
          </div>
        )}
      </div>

      {/* Settings sheet overlay */}
      <AnimatePresence>
        {showSettings && userId && (
          <SettingsSheet userId={userId} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
