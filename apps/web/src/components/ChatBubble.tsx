'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { truffleEase } from '@/lib/motion'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  name?: string
  timestamp?: string
  isOfflineFallback?: boolean
  isAnsweredJustNow?: boolean
}

export function ChatBubble({
  role,
  content,
  name,
  timestamp,
  isOfflineFallback,
  isAnsweredJustNow,
}: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: truffleEase }}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-truffle-amber text-truffle-bg rounded-br-sm'
            : isOfflineFallback
              ? 'bg-truffle-surface border border-truffle-border/50 text-truffle-text rounded-bl-sm opacity-80'
              : 'bg-truffle-card border border-truffle-border text-truffle-text rounded-bl-sm'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center">
              <Image src="/icons/truffle.png" alt="Truffle" width={16} height={16} />
            </div>
            <span className="text-xs font-medium text-truffle-amber">Truffle</span>
            {isOfflineFallback && (
              <span className="text-xs text-truffle-muted ml-1">· offline</span>
            )}
            {isAnsweredJustNow && (
              <span className="text-xs text-truffle-green ml-1">· answered just now</span>
            )}
          </div>
        )}
        {isUser && name && (
          <div className="flex items-center justify-end mb-1.5">
            <span className="text-xs font-medium text-truffle-bg/70">{name}</span>
          </div>
        )}
        <p
          className={`text-sm leading-relaxed ${isUser ? 'font-medium' : ''} ${isOfflineFallback ? 'italic' : ''}`}
        >
          {content}
        </p>
        {timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-truffle-bg/60' : 'text-truffle-muted'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </motion.div>
  )
}
