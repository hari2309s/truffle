'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isToolUIPart, getToolName } from 'ai'
import { useFinancialChat, type TruffleUIMessage } from '@/hooks/useFinancialChat'
import { MIC_UNAVAILABLE_ERROR, useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { ChatBubble } from './ChatBubble'
import { GoalProposalCard } from './GoalProposalCard'
import { TransactionProposalCard } from './TransactionProposalCard'
import { HabitProposalCard } from './HabitProposalCard'
import { VoiceButton, type VoiceButtonStatus } from './VoiceButton'
import { BottomNav } from './BottomNav'
import { PageEnter } from './PageMotion'
import { ErrorBoundary } from './ErrorBoundary'
import { LeaderRow, MINUS, NoticeSlip, Tallying } from './Tally'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useVoicePreference } from '@/contexts/VoiceContext'
import { getPersona } from '@/lib/voices'

interface ChatPageProps {
  userId: string
  name: string
  initialMessages: TruffleUIMessage[]
  /** Sent once on arrival — e.g. something said into the key on Home. */
  initialPrompt?: string | null
}

interface ProposalRenderCtx {
  t: ReturnType<typeof useLanguage>['t']
  formatAmount: (amount: number) => string
}

interface ProposalToolEntry<Args> {
  PendingCard: React.ComponentType<{
    proposal: Args
    userId: string
    onResult: (confirmed: boolean) => void
  }>
  renderConfirmed: (args: Args, toolCallId: string, ctx: ProposalRenderCtx) => React.ReactNode
}

/** The "printed" slip a confirmed proposal leaves behind in the conversation. */
function PrintedSlip({ label, left, right }: { label: string; left: string; right: string }) {
  return (
    <div className="self-start w-[84%] slip-sm print-in px-3.5 pt-3 pb-[22px] flex flex-col gap-1.5 text-[13px]">
      <span className="text-[11px] font-bold uppercase text-truffle-positive">{label} ✓</span>
      <LeaderRow left={left} right={<b>{right}</b>} />
    </div>
  )
}

/** One entry per `propose*` tool the model can call — keeps adding a new tool
 * to a data-driven lookup instead of another copy-pasted branch below. */
const PROPOSAL_TOOLS: Record<string, ProposalToolEntry<any>> = {
  proposeGoal: {
    PendingCard: GoalProposalCard,
    renderConfirmed: (args, toolCallId, { t, formatAmount }) => (
      <PrintedSlip
        key={toolCallId}
        label={t.proposals.goal.created}
        left={args.name}
        right={formatAmount(Number(args.targetAmount))}
      />
    ),
  },
  proposeTransaction: {
    PendingCard: TransactionProposalCard,
    renderConfirmed: (args, toolCallId, { t, formatAmount }) => (
      <PrintedSlip
        key={toolCallId}
        label={t.proposals.transaction.logged}
        left={args.description}
        right={`${args.amount < 0 ? MINUS : '+'}${formatAmount(args.amount)}`}
      />
    ),
  },
  proposeHabit: {
    PendingCard: HabitProposalCard,
    renderConfirmed: (args, toolCallId, { t, formatAmount }) => {
      const periodLabel =
        args.frequency === 'weekly' ? t.savingsHabits.periodWeek : t.savingsHabits.periodMonth
      return (
        <PrintedSlip
          key={toolCallId}
          label={t.proposals.habit.started}
          left={args.name}
          right={`${formatAmount(Number(args.amount))}/${periodLabel}`}
        />
      )
    },
  },
}

export function ChatPage({ userId, name, initialMessages, initialPrompt }: ChatPageProps) {
  const { t, locale } = useLanguage()
  const { formatAmount, currency } = useCurrency()
  const { voiceId } = useVoicePreference()
  const chat = useFinancialChat(userId, initialMessages, currency, locale)
  const voice = useVoiceRecorder(userId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processedTranscriptRef = useRef<string | null>(null)
  const sentInitialPromptRef = useRef(false)
  const reactedRef = useRef<Set<string>>(new Set())
  const [reactions, setReactions] = useState<Record<string, 1 | -1>>({})
  // Kept local (not in useFinancialChat's return) so typing doesn't re-render
  // anything that depends on the hook's messages/status.
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const sendText = chat.sendText

  const voiceButtonStatus: VoiceButtonStatus = voice.isRecording
    ? 'recording'
    : voice.isTranscribing
      ? 'transcribing'
      : chat.isSpeaking
        ? 'speaking'
        : 'idle'

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
  }, [chat.messages, chat.isLoading])

  // Submit voice transcript once — depends only on the transcript text and the
  // stable sendText callback, not the whole chat object (which is a new
  // reference every render), so this doesn't re-run on unrelated re-renders.
  useEffect(() => {
    if (voice.transcript && voice.transcript !== processedTranscriptRef.current) {
      processedTranscriptRef.current = voice.transcript
      sendText(voice.transcript)
    }
  }, [voice.transcript, sendText])

  useEffect(() => {
    if (!initialPrompt || sentInitialPromptRef.current) return
    sentInitialPromptRef.current = true
    sendText(initialPrompt)
  }, [initialPrompt, sendText])

  const persona = getPersona(voiceId)

  return (
    <PageEnter className="flex-1 w-full bg-truffle-bg flex flex-col max-w-lg mx-auto overflow-hidden min-h-0 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom))]">
      <header className="flex justify-between items-center pt-[max(8px,env(safe-area-inset-top))] pb-3 pr-4 pl-5 border-b border-dashed border-truffle-border flex-shrink-0">
        <div className="flex flex-col">
          <h1 className="font-grotesk text-2xl font-medium">{t.chat.title}</h1>
          <span className="text-[11px] text-truffle-text2 uppercase">
            {t.chat.voiceLabel(persona.name)}
          </span>
        </div>
        <button
          type="button"
          onClick={chat.toggleMute}
          aria-pressed={!chat.isMuted}
          aria-label={chat.isMuted ? t.chat.unmute : t.chat.mute}
          className="key key-plain key-3 h-11 px-3 text-xs uppercase"
        >
          {chat.isMuted ? t.chat.soundOff : t.chat.soundOn}
          <span
            aria-hidden
            className={`w-2.5 h-2.5 ${chat.isMuted ? 'border-2 border-truffle-text2' : 'bg-truffle-positive'}`}
          />
        </button>
      </header>

      {/* Messages */}
      <ErrorBoundary>
        <main className="flex-1 overflow-y-auto min-h-0 px-4 pt-4 pb-4 flex flex-col gap-3.5">
          {chat.messages.length === 0 && !initialPrompt && (
            <div className="flex flex-col gap-2 pt-4">
              <p className="font-grotesk text-[17px] leading-normal text-truffle-text2 px-1 pb-2">
                {t.chat.holdButton}
              </p>
              <span className="px-1 text-xs font-bold uppercase">{t.dashboard.trySaying}</span>
              {t.chat.suggestions.map((suggestion, i) => (
                <motion.button
                  key={suggestion}
                  type="button"
                  onClick={() => chat.sendText(suggestion)}
                  className="bg-truffle-surface px-3.5 py-3 font-grotesk text-[15px] text-left"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  “{suggestion}”
                </motion.button>
              ))}
            </div>
          )}

          {chat.messages.map((message, idx) => {
            const isLastMessage = idx === chat.messages.length - 1
            const showError = isLastMessage && !!chat.error && message.role === 'user'

            const toolParts = message.parts.filter(isToolUIPart)

            // Resolve a tool call locally without hitting the API again.
            // addToolResult() re-submits to /api/chat — a visible loader flash
            // and a risk of duplicate tool calls.
            const resolveTool = (toolCallId: string, result: { confirmed: boolean }) => {
              chat.setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== message.id) return m
                  return {
                    ...m,
                    parts: m.parts.map((p) =>
                      isToolUIPart(p) && p.toolCallId === toolCallId
                        ? {
                            type: p.type,
                            toolCallId: p.toolCallId,
                            state: 'output-available' as const,
                            input: p.input,
                            output: result,
                          }
                        : p
                    ),
                  } as TruffleUIMessage
                })
              )
            }

            const isPending = (state: string) =>
              state === 'input-available' || state === 'input-streaming'

            return (
              <div key={message.id} className="contents">
                {/* Proposal cards from tool parts */}
                {toolParts.map((part) => {
                  const toolName = getToolName(part) as string
                  const renderer = PROPOSAL_TOOLS[toolName]
                  if (!renderer) return null

                  const confirmed =
                    part.state === 'output-available' &&
                    (part.output as { confirmed?: boolean } | undefined)?.confirmed

                  if (isPending(part.state)) {
                    const PendingCard = renderer.PendingCard
                    return (
                      <PendingCard
                        key={part.toolCallId}
                        proposal={part.input}
                        userId={userId}
                        onResult={(c) => resolveTool(part.toolCallId, { confirmed: c })}
                      />
                    )
                  }
                  if (confirmed) {
                    return renderer.renderConfirmed(part.input, part.toolCallId, {
                      t,
                      formatAmount,
                    })
                  }
                  return null
                })}
                {/* Strip leaked tool-call XML (models occasionally emit
                  <function=...>...</function> as plain text) then render text. */}
                {(() => {
                  // If a tool call is still pending, suppress any text the model
                  // generated alongside it — the card is the intended UI.
                  if (toolParts.some((p) => isPending(p.state))) return null

                  const clean = chat
                    .messageText(message)
                    .replace(/<function=[^>]*>[\s\S]*?<\/function>/g, '')
                    .trim()
                  const traceId = message.metadata?.traceId
                  return clean ? (
                    <ChatBubble
                      role={message.role === 'assistant' ? 'assistant' : 'user'}
                      content={clean}
                      name={name}
                      timestamp={message.metadata?.createdAt}
                      proactive={message.metadata?.proactive}
                      traceId={traceId}
                      reaction={reactions[message.id] ?? null}
                      onReact={(tid, score) => handleReact(tid, score, message.id)}
                    />
                  ) : null
                })()}
                {/* Inline error + resend on the last user message */}
                {showError && (
                  <NoticeSlip
                    tone="warning"
                    title={t.chat.failedToSend}
                    actions={
                      <button
                        type="button"
                        onClick={() => chat.regenerate()}
                        className="key key-ink key-3 h-11 text-xs uppercase"
                      >
                        {t.chat.resend}
                      </button>
                    }
                  >
                    {chat.error?.message || t.chat.anErrorOccurred}
                    {process.env.NODE_ENV === 'development' && (
                      <pre className="font-mono text-left text-[10px] mt-1 opacity-70 whitespace-pre-wrap">
                        {String(chat.error?.cause ?? chat.error)}
                      </pre>
                    )}
                  </NoticeSlip>
                )}
              </div>
            )
          })}

          <AnimatePresence>
            {chat.isLoading && (
              <motion.div
                key="ai-thinking"
                className="self-start slip-sm px-3.5 pt-2.5 pb-5 text-[13px]"
                role="status"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
              >
                <Tallying label={t.chat.tallying} />
              </motion.div>
            )}
          </AnimatePresence>

          {chat.error && !chat.messages.some((m, i) => i === chat.messages.length - 1 && m.role === 'user') && (
            <NoticeSlip tone="warning" title={t.chat.failedToSend}>
              {chat.error.message || t.chat.anErrorOccurred}
            </NoticeSlip>
          )}

          <div ref={messagesEndRef} />
        </main>
      </ErrorBoundary>

      {/* Composer */}
      <div className="flex-shrink-0 px-4 pt-6 pb-2.5 flex flex-col gap-2">
        {voice.error && (
          <NoticeSlip
            tone={voice.error === MIC_UNAVAILABLE_ERROR ? 'muted' : 'warning'}
            title={voice.error === MIC_UNAVAILABLE_ERROR ? t.voice.micOff : t.voice.didntCatch}
            actions={
              voice.error === MIC_UNAVAILABLE_ERROR && !typing ? (
                <button
                  type="button"
                  onClick={() => setTyping(true)}
                  className="key key-line key-3 h-11 text-xs uppercase"
                >
                  {t.voice.typeInstead}
                </button>
              ) : undefined
            }
          >
            {voice.error === MIC_UNAVAILABLE_ERROR ? t.voice.micOffBody : voice.error}
          </NoticeSlip>
        )}

        {voice.isRecording && (
          <div className="paper px-3.5 py-2.5 text-[13px]" aria-hidden>
            {t.voice.releaseToPrint}
            <span className="caret ml-0.5" />
          </div>
        )}

        {typing && (
          <form
            id="chat-form"
            onSubmit={(e) => {
              e.preventDefault()
              const text = input.trim()
              if (!text) return
              setInput('')
              sendText(text)
            }}
            className="grid grid-cols-[1fr_64px] gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.chat.typePlaceholder}
              aria-label={t.chat.typePlaceholder}
              autoFocus
              className="field h-[52px] font-grotesk text-base"
            />
            <button
              type="submit"
              disabled={chat.isLoading || !input.trim()}
              aria-label={t.chat.send}
              className="key key-ink h-[52px] text-lg"
            >
              ↵
            </button>
          </form>
        )}

        <div className="grid grid-cols-[1fr_64px] gap-2">
          <VoiceButton
            status={voiceButtonStatus}
            onStart={voice.startRecording}
            onStop={voice.stopRecording}
            onStopSpeaking={chat.cancelSpeech}
          />
          <button
            type="button"
            onClick={() => setTyping((v) => !v)}
            aria-pressed={typing}
            aria-label={t.voice.typeInstead}
            className={`key h-[72px] text-sm ${typing ? 'key-ink' : 'key-plain'}`}
          >
            Aa
          </button>
        </div>
      </div>

      <BottomNav active="chat" />
    </PageEnter>
  )
}
