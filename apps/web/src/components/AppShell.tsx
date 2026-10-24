'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { VoiceButton, type VoiceButtonStatus } from './VoiceButton'
import { SettingsSheet } from './SettingsSheet'
import { ThemeToggle } from './ThemeToggle'
import { ThemeToggleStrip } from './ThemeToggleStrip'
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

const SIDEBAR_NAV: { id: NavTab; num: string; href: string }[] = [
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
          <div className="slip border border-truffle-border px-4 pt-5 pb-[30px] flex flex-col gap-3.5">
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
              {SIDEBAR_NAV.map((item) => {
                const tab = tabs.find((t) => t.id === item.id)!
                const isActive = item.id === active
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 h-10 px-2.5 text-[12px] font-bold tracking-[.1em] ${
                      isActive
                        ? 'bg-truffle-text text-truffle-bg'
                        : 'hover:bg-truffle-surface'
                    }`}
                  >
                    <span className="text-truffle-text2">{item.num}</span>
                    <span className="uppercase">{tab.label}</span>
                    <span className="flex-1 min-w-2 border-b-2 border-dotted border-current opacity-35 mt-1.5" />
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
              className="flex items-center gap-2 h-10 px-2.5 text-[12px] font-bold tracking-[.1em] hover:bg-truffle-surface"
            >
              <span>SETTINGS</span>
              <span className="flex-1 min-w-2 border-b-2 border-dotted border-current opacity-35 mt-1.5" />
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
          <div className="flex items-center gap-1.5 text-truffle-text2 text-[13px]">
            <span>✂</span>
            <span className="flex-1 border-t border-dashed border-truffle-text2" />
          </div>

          {/* Theme toggle strip */}
          <ThemeToggleStrip />
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Tablet top bar (md–xl) */}
        <header className="hidden md:flex xl:hidden sticky top-0 z-[5] bg-truffle-bg border-b border-dashed border-truffle-border items-center justify-between gap-4 px-8 h-[72px]">
          <div className="flex items-center gap-2.5">
            <Image src={TRUFFLE_ICON} alt="" width={28} height={28} />
            <span className="text-sm font-bold tracking-[.16em] uppercase">Truffle</span>
          </div>

          <nav className="flex h-full">
            {NAV_ITEMS.map((item) => {
              const tab = tabs.find((t) => t.id === item.id)!
              const isActive = item.id === active
              const badgeText = tab.badge && tab.badge > 0 ? ` · ${tab.badge}` : ''
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center px-4 text-[12px] font-bold tracking-[.12em] uppercase box-border ${
                    isActive
                      ? 'text-truffle-text'
                      : 'text-truffle-text2'
                  }`}
                >
                  <span className={`py-1.5 ${
                    !isActive ? 'pb-2 border-b border-dashed border-truffle-text2' : ''
                  }`}>
                    {tab.label}{badgeText}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="shell-tab-active"
                      className="absolute bottom-0 left-4 right-4 h-[3px] bg-truffle-text"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex gap-2.5 pb-1">
            <ThemeToggle className="w-11 h-11 rounded-lg bg-truffle-card border border-truffle-border shadow-[0_4px_0_var(--t-border)] grid place-items-center text-[17px] cursor-pointer active:translate-y-1 active:shadow-none" />
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label={t.topBar.settingsLabel}
              className="w-11 h-11 rounded-lg bg-truffle-card border border-truffle-border shadow-[0_4px_0_var(--t-border)] grid place-items-center text-lg active:translate-y-1 active:shadow-none"
            >
              ⚙︎
            </button>
          </div>
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

        {/* Tablet bottom voice key (md–xl, not on chat or home — home has the chat drawer) */}
        {showVoice && active !== 'home' && userId && (
          <div className="hidden md:flex xl:hidden sticky bottom-0 z-[5] bg-truffle-bg border-t border-dashed border-truffle-border justify-center px-8 py-3 pb-5">
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
