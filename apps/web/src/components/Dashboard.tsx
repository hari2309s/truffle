'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { FinancialBrief } from './FinancialBrief'
import { TransactionList } from './TransactionList'
import { AddTransactionForm } from './AddTransactionForm'
import { WeeklySummary } from './WeeklySummary'
import { BottomNav } from './BottomNav'
import { ErrorBoundary } from './ErrorBoundary'
import { TopBar } from './TopBar'
import { VoiceButton, type VoiceButtonStatus } from './VoiceButton'
import { NoticeSlip } from './Tally'
import { OfflineBar } from './OfflineBar'
import { PageEnter } from './PageMotion'
import { useTransactionsQuery } from '@/hooks/useTransactionsQuery'
import { MIC_UNAVAILABLE_ERROR, useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { useLanguage } from '@/contexts/LanguageContext'
import { setChatHandoff } from '@/lib/chatHandoff'

const CSVImport = dynamic(() => import('./CSVImport').then((m) => m.CSVImport))
const ReceiptUpload = dynamic(() => import('./ReceiptUpload').then((m) => m.ReceiptUpload))

interface DashboardProps {
  userId: string
  name: string
}

type ActivePanel = 'add' | 'csv' | 'receipt' | null

function openChatWith(router: ReturnType<typeof useRouter>, prompt: string) {
  setChatHandoff(prompt)
  router.push('/chat')
}

export function Dashboard({ userId, name }: DashboardProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const { data, isLoading } = useTransactionsQuery(userId)
  const isEmpty = !isLoading && (data?.transactions.length ?? 0) === 0
  const voice = useVoiceRecorder(userId)

  useEffect(() => {
    if (voice.transcript) openChatWith(router, voice.transcript)
  }, [voice.transcript, router])

  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12
      ? t.dashboard.goodMorning
      : hour < 17
        ? t.dashboard.goodAfternoon
        : t.dashboard.goodEvening
  const greeting = isEmpty
    ? t.dashboard.welcome(name)
    : name
      ? `${timeGreeting}, ${name}.`
      : `${timeGreeting}.`

  const voiceStatus: VoiceButtonStatus = voice.isRecording
    ? 'recording'
    : voice.isTranscribing
      ? 'transcribing'
      : 'idle'

  const close = () => setActivePanel(null)

  return (
    <div className="flex-1 w-full bg-truffle-bg flex flex-col max-w-lg mx-auto min-h-0">
      <TopBar>
        <TopBar.ThemeToggle />
        <TopBar.Settings userId={userId} />
      </TopBar>
      <OfflineBar userId={userId} />

      <PageEnter className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col pb-[calc(var(--nav-h)+env(safe-area-inset-bottom))]">

          <h1 className="px-6 pt-5 font-grotesk text-[32px] font-medium tracking-[-.01em] leading-tight">
            {greeting}
          </h1>

          <ErrorBoundary>
            <FinancialBrief userId={userId} />
          </ErrorBoundary>
          <ErrorBoundary>
            <WeeklySummary userId={userId} name={name} />
          </ErrorBoundary>

          {isEmpty ? (
            <>
              <div className="mx-4 mt-5 flex flex-col gap-2">
                <span className="px-1 text-xs font-bold uppercase">{t.dashboard.trySaying}</span>
                {t.dashboard.trySuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => openChatWith(router, s)}
                    className="bg-truffle-surface px-3.5 py-3 font-grotesk text-[15px] text-left"
                  >
                    “{s}”
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mx-4 mt-4">
                <button
                  type="button"
                  onClick={() => setActivePanel('receipt')}
                  className="key key-plain h-[52px] text-xs uppercase"
                >
                  {t.dashboard.scanStatement}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel('csv')}
                  className="key key-plain h-[52px] text-xs uppercase"
                >
                  {t.dashboard.csv}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mx-4 mt-5">
                <button
                  type="button"
                  onClick={() => setActivePanel('add')}
                  className="key key-accent h-[60px] flex-col !gap-0 text-xs uppercase"
                >
                  <span aria-hidden className="text-lg leading-none">
                    +
                  </span>
                  {t.dashboard.add}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel('receipt')}
                  className="key key-plain h-[60px] flex-col !gap-0 text-xs uppercase"
                >
                  <span aria-hidden className="text-base leading-[1.1]">
                    ▤
                  </span>
                  {t.dashboard.scan}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel('csv')}
                  className="key key-plain h-[60px] flex-col !gap-0 text-xs uppercase"
                >
                  <span aria-hidden className="text-base leading-[1.1]">
                    ⇣
                  </span>
                  {t.dashboard.csv}
                </button>
              </div>

              <ErrorBoundary>
                <section
                  aria-labelledby="itemised-heading"
                  className="slip mx-4 mt-6 px-4 pt-4 pb-7 flex flex-col"
                >
                  <h2
                    id="itemised-heading"
                    className="text-[15px] font-bold tracking-[.08em] uppercase pb-2"
                  >
                    {t.dashboard.recent}
                  </h2>
                  <TransactionList userId={userId} />
                </section>
              </ErrorBoundary>
            </>
          )}

          <div className="sticky bottom-0 mt-auto bg-truffle-bg px-4 pt-6 pb-2.5 flex flex-col gap-2">
            {voice.error && (
              <NoticeSlip
                tone={voice.error === MIC_UNAVAILABLE_ERROR ? 'muted' : 'warning'}
                title={voice.error === MIC_UNAVAILABLE_ERROR ? t.voice.micOff : t.voice.didntCatch}
              >
                {voice.error === MIC_UNAVAILABLE_ERROR ? t.voice.micOffBody : voice.error}
              </NoticeSlip>
            )}
            <VoiceButton
              status={voiceStatus}
              onStart={voice.startRecording}
              onStop={voice.stopRecording}
              withIcon
              className="h-16"
            />
          </div>
        </main>
      </PageEnter>

      <BottomNav active="home" />

      <AnimatePresence>
        {activePanel === 'add' && <AddTransactionForm key="add" userId={userId} onClose={close} />}
        {activePanel === 'csv' && <CSVImport key="csv" userId={userId} onClose={close} />}
        {activePanel === 'receipt' && <ReceiptUpload key="receipt" userId={userId} onClose={close} />}
      </AnimatePresence>
    </div>
  )
}
