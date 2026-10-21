'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
  name?: string
  timestamp?: string
  /** Truffle reached out unprompted (a nudge) — prints as a notice. */
  proactive?: boolean
  traceId?: string
  reaction?: 1 | -1 | null
  onReact?: (traceId: string, score: 1 | -1) => void
}

/** You speak in ink; Truffle replies on a torn slip. */
export const ChatBubble = memo(function ChatBubble({
  role,
  content,
  name,
  timestamp,
  proactive = false,
  traceId,
  reaction,
  onReact,
}: ChatBubbleProps) {
  const { t } = useLanguage()
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  if (role === 'user') {
    return (
      <motion.div
        className="self-end max-w-[80%] bg-truffle-text text-truffle-bg rounded-lg px-3.5 py-3 font-grotesk text-base leading-[1.4]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        aria-label={name ? `${name}: ${content}` : undefined}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {time && <p className="font-mono text-[11px] opacity-70 pt-1 text-right">{time}</p>}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`self-start w-[84%] slip-sm px-3.5 pt-3 pb-[22px] flex flex-col gap-1.5 text-[13px] ${
        proactive ? 'border-t-[6px] border-truffle-accent' : ''
      }`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {proactive && (
        <span className="text-xs font-bold uppercase text-truffle-accent-ink">✦ {t.chat.notice}</span>
      )}
      <p className="font-grotesk text-[15px] leading-[1.4] whitespace-pre-wrap break-words">
        {content}
      </p>
      {(time || (traceId && onReact)) && (
        <div className="flex items-center justify-between text-[11px] text-truffle-text2 pt-0.5">
          <span>{time}</span>
          {traceId && onReact && (
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => !reaction && onReact(traceId, 1)}
                disabled={!!reaction}
                aria-label="Helpful"
                aria-pressed={reaction === 1}
                className={`w-8 h-8 grid place-items-center rounded-md disabled:cursor-default ${
                  reaction === 1 ? 'text-truffle-positive' : 'hover:text-truffle-text'
                }`}
              >
                <ThumbUpIcon />
              </button>
              <button
                type="button"
                onClick={() => !reaction && onReact(traceId, -1)}
                disabled={!!reaction}
                aria-label="Not helpful"
                aria-pressed={reaction === -1}
                className={`w-8 h-8 grid place-items-center rounded-md disabled:cursor-default ${
                  reaction === -1 ? 'text-truffle-negative' : 'hover:text-truffle-text'
                }`}
              >
                <ThumbDownIcon />
              </button>
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
})

function ThumbUpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3.5 h-3.5"
    >
      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zm-5.17 0a.75.75 0 00-.75-.75h-1.5a.75.75 0 000 1.5h1.5a.75.75 0 00.75-.75zM2.323 8.25H.75a.75.75 0 000 1.5h1.573a.75.75 0 000-1.5z" />
    </svg>
  )
}

function ThumbDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-3.5 h-3.5"
    >
      <path d="M15.73 5.25h1.035A7.465 7.465 0 0118 9.375a7.465 7.465 0 01-1.235 4.125h-.148c-.806 0-1.534.446-2.031 1.08a9.04 9.04 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H3.622c-1.026 0-1.945-.694-2.054-1.715A12.134 12.134 0 011.5 12c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.77a4.5 4.5 0 011.423.23l3.114 1.04a4.5 4.5 0 001.423.23zM21.669 13.773c.536-1.362.831-2.845.831-4.398 0-1.22-.182-2.398-.52-3.507-.26-.85-1.084-1.368-1.973-1.368H19.1c.445.246.696.744.62 1.25-.767 4.836-3.698 8.293-7.394 9.742a.75.75 0 00.184 1.463h3.113c.842 0 1.605-.479 1.97-1.229l.051-.103a.75.75 0 011.346.656l-.052.104c-.58 1.158-1.754 1.822-3.033 1.822h-.975a.75.75 0 000 1.5h1.5c.675 0 1.199-.37 1.5-.916z" />
    </svg>
  )
}
