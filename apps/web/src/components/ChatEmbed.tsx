'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useFinancialChat, messageText, type TruffleUIMessage } from '@/hooks/useFinancialChat'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { isToolUIPart, getToolName } from 'ai'
import { TransactionProposalCard } from './TransactionProposalCard'
import { GoalProposalCard } from './GoalProposalCard'
import { HabitProposalCard } from './HabitProposalCard'
import { LeaderRow, MINUS, Tallying } from './Tally'
import { VoiceButton, type VoiceButtonStatus } from './VoiceButton'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { supabase } from '@/lib/supabase'
import { transitionSnappy } from '@/lib/motion'

/* ── Chat embed for Home — lightweight rail / drawer ─────────────────── */

interface ChatEmbedProps {
  userId: string
  /** Control size: 36px on desktop rail, 44px on tablet drawer */
  controlSize?: number
}

/** Confirmed-proposal slip (compact for the rail). */
function MiniPrintedSlip({ label, left, right }: { label: string; left: string; right: string }) {
  return (
    <div className="self-start w-full slip-sm print-in px-3 pt-2.5 pb-[18px] flex flex-col gap-1 text-[12px]">
      <span className="text-[10px] font-bold uppercase text-truffle-positive">{label} ✓</span>
      <LeaderRow left={left} right={<b>{right}</b>} className="text-[12px]" />
    </div>
  )
}

export function ChatEmbed({ userId, controlSize = 36 }: ChatEmbedProps) {
  const [initialMessages, setInitialMessages] = useState<TruffleUIMessage[] | null>(null)

  // Load last few messages
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at, is_proactive, read_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
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
        // Mark unread as read
        void supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('is_proactive', true)
          .is('read_at', null)
      })
  }, [userId])

  if (!initialMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Tallying />
      </div>
    )
  }

  return <ChatEmbedInner userId={userId} initialMessages={initialMessages} controlSize={controlSize} />
}

function ChatEmbedInner({
  userId,
  initialMessages,
  controlSize,
}: {
  userId: string
  initialMessages: TruffleUIMessage[]
  controlSize: number
}) {
  const { t, locale } = useLanguage()
  const { formatAmount, currency } = useCurrency()
  const chat = useFinancialChat(userId, initialMessages, currency, locale)
  const voice = useVoiceRecorder(userId)
  const endRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const processedTranscriptRef = useRef<string | null>(null)
  const sendText = chat.sendText

  const voiceStatus: VoiceButtonStatus = voice.isRecording
    ? 'recording'
    : voice.isTranscribing
      ? 'transcribing'
      : chat.isSpeaking
        ? 'speaking'
        : 'idle'

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages, chat.isLoading])

  // Voice transcript → send
  useEffect(() => {
    if (voice.transcript && voice.transcript !== processedTranscriptRef.current) {
      processedTranscriptRef.current = voice.transcript
      sendText(voice.transcript)
    }
  }, [voice.transcript, sendText])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text) return
    sendText(text)
    setInput('')
  }

  const ctlPx = `${controlSize}px`

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-dashed border-truffle-border flex-none">
        <span className="flex-1 font-grotesk text-2xl font-medium tracking-[-.01em]">Chat</span>
        <button
          type="button"
          onClick={chat.toggleMute}
          aria-label={chat.isMuted ? t.chat.unmute : t.chat.mute}
          style={{ width: ctlPx, height: ctlPx }}
          className="flex-none rounded-lg bg-truffle-card border border-truffle-border shadow-[0_3px_0_var(--t-border)] grid place-items-center text-[11px] font-bold active:translate-y-[3px] active:shadow-none"
        >
          {chat.isMuted ? '♪̸' : '♪'}
        </button>
      </div>

      {/* Messages feed */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1.5">
        <div className="mt-auto" />
        {chat.messages.map((msg) => {
          const text = messageText(msg)
          const isProactive = msg.role === 'assistant' && msg.metadata?.proactive

          // Check for tool UI parts (proposals)
          const toolParts = msg.parts.filter(isToolUIPart)
          if (toolParts.length > 0) {
            return toolParts.map((part) => {
              const toolName = getToolName(part)
              const args = 'args' in part ? (part as any).args : {}
              const result = 'result' in part ? (part as any).result : undefined
              const confirmed = result?.confirmed
              const toolCallId = 'toolCallId' in part ? (part as any).toolCallId : msg.id

              if (confirmed) {
                if (toolName === 'proposeTransaction') {
                  return (
                    <MiniPrintedSlip
                      key={toolCallId}
                      label={t.proposals.transaction.logged}
                      left={args.description}
                      right={`${args.amount < 0 ? MINUS : '+'}${formatAmount(args.amount)}`}
                    />
                  )
                }
                if (toolName === 'proposeGoal') {
                  return (
                    <MiniPrintedSlip
                      key={toolCallId}
                      label={t.proposals.goal.created}
                      left={args.name}
                      right={formatAmount(Number(args.targetAmount))}
                    />
                  )
                }
                return null
              }

              // Pending proposal cards
              if (toolName === 'proposeTransaction') {
                return (
                  <TransactionProposalCard
                    key={toolCallId}
                    proposal={args}
                    userId={userId}
                    onResult={(ok) => {
                      if (ok) chat.say(t.proposals.transaction.spoken(args.description, formatAmount(args.amount), args.amount > 0))
                    }}
                  />
                )
              }
              if (toolName === 'proposeGoal') {
                return (
                  <GoalProposalCard
                    key={toolCallId}
                    proposal={args}
                    userId={userId}
                    onResult={(ok) => {
                      if (ok) chat.say(t.proposals.goal.spoken(args.name, formatAmount(Number(args.targetAmount))))
                    }}
                  />
                )
              }
              if (toolName === 'proposeHabit') {
                return (
                  <HabitProposalCard
                    key={toolCallId}
                    proposal={args}
                    userId={userId}
                    onResult={(ok) => {
                      if (ok) {
                        const period = args.frequency === 'weekly' ? t.savingsHabits.periodWeek : t.savingsHabits.periodMonth
                        chat.say(t.proposals.habit.spoken(args.name, formatAmount(Number(args.amount)), period))
                      }
                    }}
                  />
                )
              }
              return null
            })
          }

          if (!text) return null

          if (isProactive) {
            return (
              <motion.div
                key={msg.id}
                className="bg-truffle-accent-soft px-3.5 py-2.5 flex flex-col gap-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitionSnappy}
              >
                <span className="text-[10px] font-bold tracking-[.1em] text-truffle-warning">
                  ▲ HEADS-UP
                </span>
                <span className="font-grotesk text-[15px] leading-[1.4]">{text}</span>
              </motion.div>
            )
          }

          if (msg.role === 'user') {
            return (
              <motion.div
                key={msg.id}
                className="self-end max-w-[72%] bg-truffle-text text-truffle-bg rounded-lg px-3.5 py-2.5 font-grotesk text-[15px] leading-[1.4]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transitionSnappy}
              >
                {text}
              </motion.div>
            )
          }

          // Assistant message
          return (
            <motion.div
              key={msg.id}
              className="self-start max-w-[88%] bg-truffle-surface border border-truffle-border slip-sm px-3.5 pt-2.5 pb-[18px] font-grotesk text-[15px] leading-[1.45]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitionSnappy}
            >
              {text}
            </motion.div>
          )
        })}
        {chat.isLoading && (
          <div className="self-start">
            <Tallying />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Bottom composer: link + text input + voice */}
      <div className="flex-none flex flex-col gap-2 pb-1">
        <Link
          href="/chat"
          className="text-[11px] font-bold text-truffle-accent-ink self-end"
        >
          Open full chat →
        </Link>

        {/* Text input row */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chat.typePlaceholder}
            className="field flex-1 h-11 text-[13px]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="key key-plain key-3 w-11 h-11 text-base disabled:opacity-30"
          >
            →
          </button>
        </form>

        {/* Voice hold button */}
        <VoiceButton
          status={voiceStatus}
          onStart={voice.startRecording}
          onStop={voice.stopRecording}
          onStopSpeaking={chat.cancelSpeech}
          className="h-14"
        />
      </div>
    </div>
  )
}
