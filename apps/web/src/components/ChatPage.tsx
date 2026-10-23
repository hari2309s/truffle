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
import { AppShell } from './AppShell'
import { OfflineBar } from './OfflineBar'
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
    onResult: (confirmed: boolean, queued?: boolean) => void
  }>
  renderConfirmed: (
    args: Args,
    toolCallId: string,
    ctx: ProposalRenderCtx,
    output?: { queued?: boolean }
  ) => React.ReactNode
  /** What Truffle says when the card is accepted — the model sends no words with a forced card. */
  spoken: (args: Args, ctx: ProposalRenderCtx) => string
}

/** The "printed" slip a confirmed proposal leaves behind in the conversation. */
function PrintedSlip({
  label,
  left,
  right,
  queued = false,
}: {
  label: string
  left: string
  right: string
  queued?: boolean
}) {
  return (
    <div
      className={`self-start w-[84%] slip-sm print-in px-3.5 pt-3 pb-[22px] flex flex-col gap-1.5 text-[13px] ${queued ? 'border-t-[6px] border-dashed border-truffle-text2' : ''}`}
    >
      <span
        className={`text-[11px] font-bold uppercase ${queued ? 'text-truffle-text2' : 'text-truffle-positive'}`}
      >
        {queued ? `◌ ${label}` : `${label} ✓`}
      </span>
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
    spoken: (args, { t, formatAmount }) =>
      t.proposals.goal.spoken(args.name, formatAmount(Number(args.targetAmount))),
  },
  proposeTransaction: {
    PendingCard: TransactionProposalCard,
    renderConfirmed: (args, toolCallId, { t, formatAmount }, output) => (
      <PrintedSlip
        key={toolCallId}
        queued={output?.queued}
        label={output?.queued ? t.offline.queuedTitle : t.proposals.transaction.logged}
        left={args.description}
        right={`${args.amount < 0 ? MINUS : '+'}${formatAmount(args.amount)}`}
      />
    ),
    spoken: (args, { t, formatAmount }) =>
      t.proposals.transaction.spoken(args.description, formatAmount(args.amount), args.amount > 0),
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
    spoken: (args, { t, formatAmount }) =>
      t.proposals.habit.spoken(
        args.name,
        formatAmount(Number(args.amount)),
        args.frequency === 'weekly' ? t.savingsHabits.periodWeek : t.savingsHabits.periodMonth
      ),
  },
}

type ChatItem =
  | { kind: 'message'; message: TruffleUIMessage; idx: number }
  | { kind: 'notices'; messages: TruffleUIMessage[] }

/** Runs of proactive nudges print together as one NOTICES slip. */
function groupNotices(messages: TruffleUIMessage[]): ChatItem[] {
  const items: ChatItem[] = []
  messages.forEach((message, idx) => {
    const isNotice =
      message.role === 'assistant' &&
      message.metadata?.proactive &&
      !message.parts.some(isToolUIPart)
    const last = items[items.length - 1]
    if (isNotice && last?.kind === 'notices') last.messages.push(message)
    else if (isNotice) items.push({ kind: 'notices', messages: [message] })
    else items.push({ kind: 'message', message, idx })
  })
  return items
}

function NoticesSlip({
  messages,
  messageText,
}: {
  messages: TruffleUIMessage[]
  messageText: (m: TruffleUIMessage) => string
}) {
  const { t } = useLanguage()
  const unread = messages.filter((m) => m.metadata?.unread).length
  return (
    <div className="slip print-in px-4 pt-3.5 pb-6 flex flex-col gap-2">
      <div className="flex justify-between text-xs font-bold uppercase">
        <span>{t.chat.notices}</span>
        {unread > 0 && <span>{t.chat.newCount(unread)}</span>}
      </div>
      {messages.map((m, i) => (
        <div
          key={m.id}
          className="grid grid-cols-[20px_1fr] gap-2 rule-soft pt-2 print-in"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span aria-hidden className="text-[13px] text-truffle-accent-ink">
            ✦
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-grotesk text-sm leading-[1.4]">{messageText(m)}</span>
            {m.metadata?.createdAt && (
              <span className="text-[11px] text-truffle-text2">
                {new Date(m.metadata.createdAt).toLocaleString([], {
                  weekday: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
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
    <AppShell active="chat" userId={userId} name={name}>
      <PageEnter className="flex-1 flex flex-col min-h-0 overflow-hidden pb-[calc(var(--nav-h)+env(safe-area-inset-bottom))] md:pb-0">

      <div className="max-w-[1000px] w-full mx-auto flex-1 flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8 xl:items-start min-h-0 md:px-8 xl:px-10 md:pt-7 xl:pt-8">
        {/* ── Chat column ── */}
        <div className="flex-1 flex flex-col md:gap-4 min-h-0 overflow-hidden max-w-[640px] w-full md:mx-auto xl:justify-self-center">
          <header className="flex justify-between items-center pt-2 pb-3 md:pb-[14px] pr-4 pl-5 md:px-0 border-b border-dashed border-truffle-border md:border-truffle-text2 flex-shrink-0 md:gap-3">
            <div className="flex flex-col md:gap-1">
              <span className="hidden md:block text-[11px] font-bold tracking-[.12em] text-truffle-text2 uppercase">
                {t.chat.voiceLabel(persona.name)}
              </span>
              <h1 className="font-grotesk text-2xl md:text-[32px] font-medium md:tracking-[-.02em] md:leading-none">{t.chat.title}</h1>
              <span className="md:hidden text-[11px] text-truffle-text2 uppercase">
                {t.chat.voiceLabel(persona.name)}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="hidden md:flex p-[3px] border border-truffle-border rounded-lg bg-truffle-card">
                <button
                  type="button"
                  onClick={() => setTyping(false)}
                  className={`h-[38px] px-2.5 rounded-md grid place-items-center text-[11px] font-bold ${!typing ? 'bg-truffle-text text-truffle-bg' : 'text-truffle-text2'}`}
                >
                  {t.chat.soundOn.split(' ')[0] ?? 'VOICE'}
                </button>
                <button
                  type="button"
                  onClick={() => setTyping(true)}
                  className={`h-[38px] px-2.5 rounded-md grid place-items-center text-[11px] font-bold ${typing ? 'bg-truffle-text text-truffle-bg' : 'text-truffle-text2'}`}
                >
                  TEXT
                </button>
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
            </div>
          </header>
          <OfflineBar userId={userId} />

          {/* Messages */}
          <ErrorBoundary>
            <main className="flex-1 overflow-y-auto min-h-0 px-4 md:px-0 pt-4 pb-4 flex flex-col gap-3.5">
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
                  &ldquo;{suggestion}&rdquo;
                </motion.button>
              ))}
            </div>
          )}

          {groupNotices(chat.messages).map((item) => {
            if (item.kind === 'notices') {
              return <NoticesSlip key={item.messages[0]!.id} messages={item.messages} messageText={chat.messageText} />
            }
            const { message, idx } = item
            const isLastMessage = idx === chat.messages.length - 1
            const showError = isLastMessage && !!chat.error && message.role === 'user'

            const toolParts = message.parts.filter(isToolUIPart)

            // Resolve a tool call locally without hitting the API again.
            // addToolResult() re-submits to /api/chat — a visible loader flash
            // and a risk of duplicate tool calls.
            const resolveTool = (
              toolCallId: string,
              result: { confirmed: boolean; queued?: boolean }
            ) => {
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

                  // While the call is still streaming its input is partial (or
                  // missing) — the card waits for the complete, validated input.
                  if (part.state === 'input-streaming') return null
                  if (part.state === 'output-error') {
                    return (
                      <NoticeSlip key={part.toolCallId} tone="warning" title={t.proposals.cardFailed} />
                    )
                  }
                  if (part.state === 'input-available') {
                    const PendingCard = renderer.PendingCard
                    return (
                      <PendingCard
                        key={part.toolCallId}
                        proposal={part.input}
                        userId={userId}
                        onResult={(c, queued) => {
                          resolveTool(part.toolCallId, { confirmed: c, queued })
                          chat.say(
                            !c
                              ? t.proposals.declinedSpoken
                              : queued
                                ? t.proposals.queuedSpoken
                                : renderer.spoken(part.input, { t, formatAmount })
                          )
                        }}
                      />
                    )
                  }
                  if (confirmed) {
                    return renderer.renderConfirmed(
                      part.input,
                      part.toolCallId,
                      { t, formatAmount },
                      part.output as { queued?: boolean } | undefined
                    )
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
          <div className="flex-shrink-0 px-4 md:px-0 pt-6 pb-2.5 flex flex-col gap-2">
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

            {/* Mobile: voice + type toggle */}
            <div className="grid grid-cols-[1fr_64px] gap-2 md:hidden">
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

            {/* Tablet: input + send + voice inline */}
            <form
              className="hidden md:flex xl:hidden gap-2 items-center border-t border-dashed border-truffle-border pt-4 mt-2"
              onSubmit={(e) => {
                e.preventDefault()
                const text = input.trim()
                if (!text) return
                setInput('')
                sendText(text)
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.chat.typePlaceholder}
                aria-label={t.chat.typePlaceholder}
                className="field h-14 flex-1 min-w-0 font-grotesk text-base"
              />
              <button
                type="submit"
                className="key key-line h-14 w-14 flex-none text-base font-bold"
                disabled={chat.isLoading || !input.trim()}
              >
                ↵
              </button>
              <VoiceButton
                status={voiceButtonStatus}
                onStart={voice.startRecording}
                onStop={voice.stopRecording}
                onStopSpeaking={chat.cancelSpeech}
                className="h-14 w-[180px] flex-none"
              />
            </form>

            {/* Desktop: text input row */}
            <form
              className="hidden xl:grid grid-cols-[1fr_56px] gap-2 border-t border-dashed border-truffle-border pt-4 mt-2"
              onSubmit={(e) => {
                e.preventDefault()
                const text = input.trim()
                if (!text) return
                setInput('')
                sendText(text)
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.chat.typePlaceholder}
                aria-label={t.chat.typePlaceholder}
                className="field h-14 font-grotesk text-base"
              />
              <button
                type="submit"
                className="key key-line h-14 text-base font-bold"
                disabled={chat.isLoading || !input.trim()}
              >
                ↵
              </button>
            </form>
          </div>
        </div>

        {/* ── Desktop context panel (xl+) ── */}
        <aside className="hidden xl:flex sticky top-6 flex-col gap-4 pt-6">
          {/* Voice key */}
          <VoiceButton
            status={voiceButtonStatus}
            onStart={voice.startRecording}
            onStop={voice.stopRecording}
            onStopSpeaking={chat.cancelSpeech}
            className="h-[120px] flex-col"
          />
          <div className="grid grid-cols-4 gap-1 text-[9px] font-bold tracking-[.06em] text-truffle-text2 text-center">
            <span className={voiceButtonStatus === 'idle' ? 'text-truffle-accent-ink' : ''}>● IDLE</span>
            <span className={voiceButtonStatus === 'recording' ? 'text-truffle-accent-ink' : ''}>● LISTEN</span>
            <span className={voiceButtonStatus === 'transcribing' ? 'text-truffle-accent-ink' : ''}>● THINK</span>
            <span className={voiceButtonStatus === 'speaking' ? 'text-truffle-accent-ink' : ''}>● SPEAK</span>
          </div>
          <span className="text-[10px] tracking-[.06em] text-truffle-text2 text-center">
            HOLD SPACE ANYWHERE · CLICK KEY TO CYCLE STATES
          </span>
        </aside>
      </div>

      </PageEnter>
    </AppShell>
  )
}
