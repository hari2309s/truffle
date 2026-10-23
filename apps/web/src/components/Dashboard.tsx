'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { FinancialBrief } from './FinancialBrief'
import { TransactionList } from './TransactionList'
import { AddTransactionForm } from './AddTransactionForm'
import { WeeklySummary } from './WeeklySummary'
import { AppShell } from './AppShell'
import { ErrorBoundary } from './ErrorBoundary'
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

  const now = new Date()
  const dayStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  return (
    <AppShell active="home" userId={userId} name={name}>
      <OfflineBar userId={userId} />

      <PageEnter className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col pb-[calc(var(--nav-h)+env(safe-area-inset-bottom))] md:pb-0">
          <div className="max-w-[960px] w-full mx-auto md:px-8 xl:px-10">

            {/* Header row: greeting + action buttons */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between md:gap-4 md:flex-wrap px-6 md:px-0 pt-5 md:pt-8 xl:pt-8">
              <div className="flex flex-col gap-1.5">
                <span className="hidden md:block text-[11px] font-bold tracking-[.12em] text-truffle-text2">
                  {dayStr} · {t.insights.hero.dayOf(dayOfMonth, daysInMonth)}
                </span>
                <h1 className="font-grotesk text-[32px] md:text-[36px] xl:text-[44px] font-medium tracking-[-.025em] leading-tight">
                  {greeting}
                </h1>
              </div>

              {!isEmpty && (
                <div className="hidden md:flex gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setActivePanel('add')}
                    className="key key-line h-11 px-3.5 text-xs font-bold"
                  >
                    + {t.dashboard.add}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePanel('receipt')}
                    className="key key-line h-11 px-3.5 text-xs font-bold"
                  >
                    {t.dashboard.scan}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePanel('csv')}
                    className="key key-line h-11 px-3.5 text-xs font-bold"
                  >
                    {t.dashboard.csv}
                  </button>
                </div>
              )}
            </div>

            {/* 2-column grid on md+, single column on mobile */}
            <div className="md:grid md:grid-cols-2 md:gap-4 xl:gap-6 md:items-start md:mt-7">
              {/* Left column */}
              <div className="flex flex-col md:gap-4 xl:gap-6">
                <ErrorBoundary>
                  <FinancialBrief userId={userId} />
                </ErrorBoundary>

                {isEmpty ? (
                  <>
                    <div className="mx-4 md:mx-0 mt-5 md:mt-0 flex flex-col gap-2">
                      <span className="px-1 text-xs font-bold uppercase">{t.dashboard.trySaying}</span>
                      {t.dashboard.trySuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => openChatWith(router, s)}
                          className="bg-truffle-surface px-3.5 py-3 font-grotesk text-[15px] text-left"
                        >
                          &ldquo;{s}&rdquo;
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mx-4 md:mx-0 mt-4 md:mt-0">
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
                    {/* Mobile-only action buttons */}
                    <div className="grid grid-cols-3 gap-2 mx-4 mt-5 md:hidden">
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
                        className="slip mx-4 md:mx-0 mt-6 md:mt-0 px-4 pt-4 pb-7 flex flex-col"
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
              </div>

              {/* Right column (md+) */}
              <div className="flex flex-col md:gap-4 xl:gap-6">
                <ErrorBoundary>
                  <WeeklySummary userId={userId} name={name} />
                </ErrorBoundary>
              </div>
            </div>
          </div>

          {/* Mobile voice button */}
          <div className="sticky bottom-0 mt-auto bg-truffle-bg px-4 pt-6 pb-2.5 flex flex-col gap-2 md:hidden">
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
              className="h-16"
            />
          </div>
        </main>
      </PageEnter>

      <AnimatePresence>
        {activePanel === 'add' && <AddTransactionForm key="add" userId={userId} onClose={close} />}
        {activePanel === 'csv' && <CSVImport key="csv" userId={userId} onClose={close} />}
        {activePanel === 'receipt' && <ReceiptUpload key="receipt" userId={userId} onClose={close} />}
      </AnimatePresence>
    </AppShell>
  )
}
