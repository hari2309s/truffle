'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useFinancialChat } from '@/hooks/useFinancialChat'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { ChatBubble } from './ChatBubble'
import { VoiceButton } from './VoiceButton'

interface ChatPageProps {
  userId: string
}

export function ChatPage({ userId }: ChatPageProps) {
  const chat = useFinancialChat(userId)
  const voice = useVoiceRecorder(userId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  // Submit voice transcript once available
  useEffect(() => {
    if (voice.transcript) {
      chat.startVoice(voice.transcript)
    }
  }, [voice.transcript, chat])

  return (
    <div className="min-h-dvh bg-truffle-bg flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-truffle-border">
        <Link href="/" className="text-truffle-muted hover:text-truffle-text transition-colors">
          <BackIcon />
        </Link>
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

        {chat.messages.map((message) => (
          <ChatBubble
            key={message.id}
            role={message.role as 'user' | 'assistant'}
            content={message.content}
          />
        ))}

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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-truffle-bg/95 backdrop-blur-sm border-t border-truffle-border px-4 py-4">
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
    </div>
  )
}

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
        clipRule="evenodd"
      />
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
