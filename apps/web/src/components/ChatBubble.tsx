'use client'

import Image from 'next/image'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-truffle-amber text-truffle-bg rounded-br-sm'
            : 'bg-truffle-card border border-truffle-border text-truffle-text rounded-bl-sm'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
              <Image src="/icons/truffle.png" alt="Truffle" width={16} height={16} />
            </div>
            <span className="text-xs font-medium text-truffle-amber">Truffle</span>
          </div>
        )}
        <p className={`text-sm leading-relaxed ${isUser ? 'font-medium' : ''}`}>{content}</p>
        {timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-truffle-bg/60' : 'text-truffle-muted'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}
