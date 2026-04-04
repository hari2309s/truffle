'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { staggerItemVariants, staggerListVariants, truffleEase } from '@/lib/motion'
import type { Message } from 'ai/react'
import { useFinancialChat } from '@/hooks/useFinancialChat'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { ChatBubble } from './ChatBubble'
import { GoalProposalCard } from './GoalProposalCard'
import { VoiceButton } from './VoiceButton'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { PageEnter, ThinkingIndicator } from './PageMotion'

interface ChatPageProps {
  userId: string
  name: string
  initialMessages: Message[]
}

export function ChatPage({ userId, name, initialMessages }: ChatPageProps) {
  const chat = useFinancialChat(userId, initialMessages)
  const voice = useVoiceRecorder(userId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processedTranscriptRef = useRef<string | null>(null)

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
    <PageEnter className="h-dvh bg-truffle-bg flex flex-col max-w-lg mx-auto overflow-hidden">
      <TopBar>
        {chat.isSpeaking && (
          <button
            onClick={chat.cancelSpeech}
            className="ml-auto text-xs text-truffle-amber hover:text-truffle-amber-light"
          >
            Stop
          </button>
        )}
      </TopBar>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-72">
        {chat.messages.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <motion.p
              className="text-truffle-muted text-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: truffleEase }}
            >
              Hold the button and ask anything.
            </motion.p>
            <motion.div
              className="flex flex-wrap gap-2 justify-center mt-6"
              initial="hidden"
              animate="show"
              variants={staggerListVariants}
            >
              {[
                'How am I doing this month?',
                'What did I spend on food?',
                'Can I afford a weekend trip?',
              ].map((suggestion) => (
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
                          chat.addToolResult({ toolCallId: inv.toolCallId, result: { confirmed } })
                        }
                      />
                    )
                  }
                  if (inv.state === 'result' && (inv.result as { confirmed: boolean })?.confirmed) {
                    return (
                      <div key={inv.toolCallId} className="flex justify-start mb-3">
                        <div className="max-w-[85%] bg-truffle-card border border-truffle-border rounded-2xl rounded-bl-sm px-4 py-3">
                          <p className="text-sm text-truffle-text">
                            {args.emoji} <span className="font-medium">{args.name}</span> added to
                            your goals — find it in Insights.
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
                return clean ? (
                  <ChatBubble
                    role={message.role as 'user' | 'assistant'}
                    content={clean}
                    name={name}
                    timestamp={message.createdAt?.toISOString()}
                  />
                ) : null
              })()}
              {/* Inline error + resend on the last user message */}
              {showError && (
                <div className="flex justify-end items-center gap-2 mb-3 pr-1">
                  <span className="text-xs text-truffle-red">Failed to send</span>
                  <button
                    onClick={() => chat.reload()}
                    className="text-xs text-truffle-amber hover:text-truffle-amber-light transition-colors"
                  >
                    Resend
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {chat.isLoading && (
          <motion.div
            className="flex justify-start mb-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: truffleEase }}
          >
            <div className="bg-truffle-card border border-truffle-border rounded-2xl rounded-bl-sm px-4 py-3">
              <ThinkingIndicator />
            </div>
          </motion.div>
        )}

        {voice.error && (
          <div className="text-center text-xs text-truffle-red py-2">{voice.error}</div>
        )}

        {chat.error && (
          <div className="text-center text-xs text-truffle-red py-2">
            {chat.error.message || 'An error occurred.'}
            {process.env.NODE_ENV === 'development' && (
              <pre className="text-left text-[10px] mt-1 opacity-70 whitespace-pre-wrap">
                {String(chat.error.cause ?? chat.error)}
              </pre>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-lg bg-truffle-bg/95 backdrop-blur-sm border-t border-truffle-border px-4 py-4">
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
              placeholder="Or type your question..."
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
