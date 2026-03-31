'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Message } from 'ai/react'
import { useFinancialChat } from '@/hooks/useFinancialChat'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { ChatBubble } from './ChatBubble'
import { GoalProposalCard } from './GoalProposalCard'
import { VoiceButton } from './VoiceButton'

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
    <div className="h-dvh bg-truffle-bg flex flex-col max-w-lg mx-auto overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-truffle-border">
        <div className="flex items-center gap-2">
          <Image src="/icons/truffle.png" alt="Truffle" width={24} height={24} priority />
          <div>
            <p className="font-semibold text-truffle-text text-sm">Truffle</p>
            <p className="text-xs text-truffle-muted">Ask me anything</p>
          </div>
        </div>
        {chat.isSpeaking && (
          <button
            onClick={chat.cancelSpeech}
            className="ml-auto text-xs text-truffle-amber hover:text-truffle-amber-light"
          >
            Stop
          </button>
        )}
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-48">
        {chat.messages.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <p className="text-truffle-muted text-sm">Hold the button and ask anything.</p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {[
                'How am I doing this month?',
                'What did I spend on food?',
                'Can I afford a weekend trip?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    chat.setInput(suggestion)
                    const form = document.getElementById('chat-form') as HTMLFormElement | null
                    form?.requestSubmit()
                  }}
                  className="text-xs bg-truffle-surface border border-truffle-border rounded-full px-3 py-1.5 text-truffle-text-secondary hover:border-truffle-amber hover:text-truffle-text transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
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
              {/* Only render bubble if there is text content */}
              {message.content && (
                <ChatBubble
                  role={message.role as 'user' | 'assistant'}
                  content={message.content}
                  name={name}
                />
              )}
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
          <div className="flex justify-start mb-3">
            <div className="bg-truffle-card border border-truffle-border rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-truffle-amber animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {voice.error && (
          <div className="text-center text-xs text-truffle-red py-2">{voice.error}</div>
        )}

        {chat.error && (
          <div className="text-center text-xs text-truffle-red py-2">{chat.error.message}</div>
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

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg border-t border-truffle-border bg-truffle-bg/95 backdrop-blur-sm">
        <div className="flex">
          <Link
            href="/"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-muted hover:text-truffle-text transition-colors"
          >
            <HomeIcon />
            <span className="text-[10px]">Home</span>
          </Link>
          <Link
            href="/chat"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-amber"
          >
            <ChatIcon />
            <span className="text-[10px]">Chat</span>
          </Link>
          <Link
            href="/insights"
            className="flex-1 flex flex-col items-center py-3 gap-1 text-truffle-muted hover:text-truffle-text transition-colors"
          >
            <InsightsIcon />
            <span className="text-[10px]">Insights</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

function HomeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223 15.522 15.522 0 003-.152z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function InsightsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
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
