'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { staggerItemVariants, staggerListVariants, truffleEase } from '@/lib/motion'
import type { Message } from 'ai/react'
import { useFinancialChat } from '@/hooks/useFinancialChat'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { ChatBubble } from './ChatBubble'
import { GoalProposalCard } from './GoalProposalCard'
import { TransactionProposalCard } from './TransactionProposalCard'
import { CATEGORY_EMOJI } from '@/lib/categories'
import { HabitProposalCard } from './HabitProposalCard'
import type { TransactionCategory } from '@truffle/types'
import { VoiceButton } from './VoiceButton'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { PageEnter, TypingDots } from './PageMotion'
import { ErrorBoundary } from './ErrorBoundary'
import { useLanguage } from '@/contexts/LanguageContext'

interface ChatPageProps {
  userId: string
  name: string
  initialMessages: Message[]
}

export function ChatPage({ userId, name, initialMessages }: ChatPageProps) {
  const { t } = useLanguage()
  const chat = useFinancialChat(userId, initialMessages)
  const voice = useVoiceRecorder(userId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processedTranscriptRef = useRef<string | null>(null)
  const reactedRef = useRef<Set<string>>(new Set())
  const [reactions, setReactions] = useState<Record<string, 1 | -1>>({})

  const handleReact = useCallback(async (traceId: string, score: 1 | -1, messageId: string) => {
    if (reactedRef.current.has(messageId)) return
    reactedRef.current.add(messageId)
    setReactions((prev) => ({ ...prev, [messageId]: score }))
    fetch('/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traceId, score }),
    }).catch((e) => console.warn('Failed to send feedback:', e))
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  // Submit voice transcript once — guard against re-firing when chat object reference changes
  useEffect(() => {
    if (voice.transcript && voice.transcript !== processedTranscriptRef.current) {
      processedTranscriptRef.current = voice.transcript
      chat.startVoice(voice.transcript)
    }
  }, [voice.transcript, chat])

  return (
    <PageEnter className="flex-1 w-full bg-truffle-bg flex flex-col max-w-lg mx-auto overflow-hidden min-h-0">
      <TopBar showControls userId={userId}>
        <div className="ml-auto flex items-center gap-3">
          {chat.isSpeaking && (
            <button
              onClick={chat.cancelSpeech}
              className="text-xs text-truffle-amber hover:text-truffle-amber-light"
            >
              {t.chat.stop}
            </button>
          )}
          <button
            onClick={chat.toggleMute}
            aria-label={chat.isMuted ? t.chat.unmute : t.chat.mute}
            className="text-truffle-muted hover:text-truffle-text transition-colors"
          >
            {chat.isMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
          </button>
        </div>
      </TopBar>

      {/* Messages */}
      <ErrorBoundary>
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-72">
          {chat.messages.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <motion.p
                className="text-truffle-muted text-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.36, ease: truffleEase }}
              >
                {t.chat.holdButton}
              </motion.p>
              <motion.div
                className="flex flex-wrap gap-2 justify-center mt-6"
                initial="hidden"
                animate="show"
                variants={staggerListVariants}
              >
                {t.chat.suggestions.map((suggestion) => (
                  <motion.button
                    key={suggestion}
                    type="button"
                    variants={staggerItemVariants}
                    onClick={() => {
                      chat.setInput(suggestion)
                      const form = document.getElementById('chat-form') as HTMLFormElement | null
                      form?.requestSubmit()
                    }}
                    className="text-xs bg-truffle-surface border border-truffle-border rounded-full px-3 py-1.5 text-truffle-text-secondary hover:border-truffle-amber hover:text-truffle-text transition-all"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          )}

          {chat.messages.map((message, idx) => {
            const isLastMessage = idx === chat.messages.length - 1
            const showError = isLastMessage && !!chat.error && message.role === 'user'
            return (
              <div key={message.id}>
                {/* Render goal proposal cards from tool invocations */}
                {message.toolInvocations?.map((inv) => {
                  if (inv.toolName === 'proposeGoal') {
                    const args = inv.args as {
                      name: string
                      targetAmount: number
                      deadline?: string
                      emoji: string
                      pitch: string
                    }
                    if (inv.state === 'call') {
                      return (
                        <GoalProposalCard
                          key={inv.toolCallId}
                          proposal={args}
                          userId={userId}
                          onResult={(confirmed) =>
                            chat.addToolResult({
                              toolCallId: inv.toolCallId,
                              result: { confirmed },
                            })
                          }
                        />
                      )
                    }
                    if (
                      inv.state === 'result' &&
                      (inv.result as { confirmed: boolean })?.confirmed
                    ) {
                      return (
                        <div key={inv.toolCallId} className="flex justify-start mb-3">
                          <div className="max-w-[85%] bg-truffle-card border border-truffle-border rounded-2xl rounded-bl-sm px-4 py-3">
                            <p className="text-sm text-truffle-text">
                              {t.proposals.goal.addedToGoals(args.emoji, args.name)}
                            </p>
                          </div>
                        </div>
                      )
                    }
                  }
                  if (inv.toolName === 'proposeTransaction') {
                    const args = inv.args as {
                      description: string
                      amount: number
                      category: TransactionCategory
                      merchant?: string
                      date: string
                    }
                    if (inv.state === 'call') {
                      return (
                        <TransactionProposalCard
                          key={inv.toolCallId}
                          proposal={args}
                          userId={userId}
                          onResult={(confirmed) =>
                            chat.addToolResult({
                              toolCallId: inv.toolCallId,
                              result: { confirmed },
                            })
                          }
                        />
                      )
                    }
                    if (
                      inv.state === 'result' &&
                      (inv.result as { confirmed: boolean })?.confirmed
                    ) {
                      const isExpense = args.amount < 0
                      const formattedAmount = `${isExpense ? '-' : '+'}€${Math.abs(args.amount).toFixed(2)}`
                      return (
                        <div key={inv.toolCallId} className="flex justify-start mb-3">
                          <div className="max-w-[85%] bg-truffle-card border border-truffle-border rounded-2xl rounded-bl-sm px-4 py-3">
                            <p className="text-sm text-truffle-text">
                              {CATEGORY_EMOJI[args.category] ?? '📝'}{' '}
                              <span className="font-medium">{args.description}</span> logged —{' '}
                              <span className={isExpense ? 'text-red-400' : 'text-green-400'}>
                                {formattedAmount}
                              </span>
                            </p>
                          </div>
                        </div>
                      )
                    }
                  }
                  if (inv.toolName === 'proposeHabit') {
                    const args = inv.args as {
                      name: string
                      amount: number
                      frequency: 'weekly' | 'monthly'
                      emoji: string
                      pitch: string
                    }
                    if (inv.state === 'call') {
                      return (
                        <HabitProposalCard
                          key={inv.toolCallId}
                          proposal={args}
                          userId={userId}
                          onResult={(confirmed) =>
                            chat.addToolResult({
                              toolCallId: inv.toolCallId,
                              result: { confirmed },
                            })
                          }
                        />
                      )
                    }
                    if (
                      inv.state === 'result' &&
                      (inv.result as { confirmed: boolean })?.confirmed
                    ) {
                      const periodLabel =
                        args.frequency === 'weekly'
                          ? t.savingsHabits.periodWeek
                          : t.savingsHabits.periodMonth
                      return (
                        <div key={inv.toolCallId} className="flex justify-start mb-3">
                          <div className="max-w-[85%] bg-truffle-card border border-truffle-green/40 rounded-2xl rounded-bl-sm px-4 py-3">
                            <p className="text-sm text-truffle-text">
                              {args.emoji} <span className="font-medium">{args.name}</span>{' '}
                              <span className="text-truffle-green">
                                {t.proposals.habit.startSaving.toLowerCase()}
                              </span>{' '}
                              — €{Number(args.amount).toFixed(0)}/{periodLabel}.{' '}
                              {t.proposals.habit.logEachPeriod(periodLabel)}
                            </p>
                          </div>
                        </div>
                      )
                    }
                  }
                  return null
                })}
                {/* Strip leaked tool-call XML (Groq/LLaMA occasionally emits
                  <function=...>...</function> as plain text instead of a
                  structured tool invocation) then render if content remains */}
                {(() => {
                  const clean = message.content
                    .replace(/<function=[^>]*>[\s\S]*?<\/function>/g, '')
                    .trim()
                  const annotations = message.annotations as
                    | { type: string; traceId?: string }[]
                    | undefined
                  const isOfflineFallback = annotations?.some((a) => a.type === 'offline_fallback')
                  const isAnsweredJustNow = annotations?.some((a) => a.type === 'answered_just_now')
                  const traceId = annotations?.find((a) => a.type === 'trace_id')?.traceId
                  return clean ? (
                    <ChatBubble
                      role={message.role as 'user' | 'assistant'}
                      content={clean}
                      name={name}
                      timestamp={message.createdAt?.toISOString()}
                      isOfflineFallback={isOfflineFallback}
                      isAnsweredJustNow={isAnsweredJustNow}
                      traceId={traceId}
                      reaction={reactions[message.id] ?? null}
                      onReact={(tid, score) => handleReact(tid, score, message.id)}
                    />
                  ) : null
                })()}
                {/* Inline error + resend on the last user message */}
                {showError && (
                  <div className="flex justify-end items-center gap-2 mb-3 pr-1">
                    <span className="text-xs text-truffle-red">{t.chat.failedToSend}</span>
                    <button
                      onClick={() => chat.reload()}
                      className="text-xs text-truffle-amber hover:text-truffle-amber-light transition-colors"
                    >
                      {t.chat.resend}
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          <AnimatePresence>
            {chat.isLoading && (
              <motion.div
                key="ai-thinking"
                className="flex justify-start mb-3 items-end gap-2"
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.94, transition: { duration: 0.18 } }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <motion.div
                  className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} />
                </motion.div>
                <motion.div
                  className="bg-truffle-card border border-truffle-border rounded-2xl rounded-bl-sm px-4 py-3"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(232,168,78,0)',
                      '0 0 14px 3px rgba(232,168,78,0.18)',
                      '0 0 0 0 rgba(232,168,78,0)',
                    ],
                  }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <TypingDots />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {voice.error && (
            <div className="text-center text-xs text-truffle-red py-2">{voice.error}</div>
          )}

          {chat.error && (
            <div className="text-center text-xs text-truffle-red py-2">
              {chat.error.message || t.chat.anErrorOccurred}
              {process.env.NODE_ENV === 'development' && (
                <pre className="text-left text-[10px] mt-1 opacity-70 whitespace-pre-wrap">
                  {String(chat.error.cause ?? chat.error)}
                </pre>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>
      </ErrorBoundary>

      {/* Input area */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-lg bg-truffle-bg/95 backdrop-blur-sm border-t border-truffle-border px-4 py-4">
        {!chat.isOnline && (
          <p className="text-center text-xs text-truffle-muted mb-3">{t.chat.offlineMessage}</p>
        )}
        <div className="flex flex-col items-center gap-4">
          <VoiceButton
            isRecording={voice.isRecording}
            isTranscribing={voice.isTranscribing}
            isSpeaking={chat.isSpeaking}
            onStart={voice.startRecording}
            onStop={voice.stopRecording}
          />

          <form id="chat-form" onSubmit={chat.handleSubmit} className="w-full flex gap-2">
            <input
              value={chat.input}
              onChange={chat.handleInputChange}
              placeholder={t.chat.typePlaceholder}
              className="flex-1 bg-truffle-surface border border-truffle-border rounded-xl px-4 py-3 text-sm text-truffle-text placeholder-truffle-muted focus:outline-none focus:border-truffle-amber"
            />
            <button
              type="submit"
              disabled={chat.isLoading || !chat.input.trim()}
              className="btn-primary px-4 disabled:opacity-40"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>

      <BottomNav active="chat" />
    </PageEnter>
  )
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
      <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.061z" />
    </svg>
  )
}

function SpeakerMutedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06L19.5 13.06l1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06L19.5 10.94l-1.72-1.72z" />
    </svg>
  )
}
