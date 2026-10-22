'use client'

import { useId, useState } from 'react'
import { lastEmoji } from '@/lib/emoji'
import { useLanguage } from '@/contexts/LanguageContext'

export const DEFAULT_GOAL_EMOJI = '🎯'
export const DEFAULT_HABIT_EMOJI = '💰'

/**
 * Pick any emoji: type or paste one (the phone's emoji keyboard, or the OS
 * picker on desktop). Empty means `fallback` — the preview shows it, and
 * callers save `value || fallback`.
 */
export function EmojiField({
  value,
  onChange,
  label,
  fallback,
}: {
  /** The chosen emoji, or '' for none. */
  value: string
  onChange: (emoji: string) => void
  label: string
  fallback: string
}) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)
  const inputId = useId()
  const hintId = useId()

  const accept = (text: string) => {
    if (!text.trim()) {
      setDraft('')
      setInvalid(false)
      onChange('')
      return
    }
    const emoji = lastEmoji(text)
    if (emoji) {
      setDraft(emoji)
      setInvalid(false)
      onChange(emoji)
    } else {
      setDraft(text)
      setInvalid(true)
    }
  }

  const shown = value || fallback

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span
          aria-label={t.emoji.current(shown)}
          className={`flex-none w-[52px] h-[52px] grid place-items-center text-[28px] bg-truffle-surface border border-truffle-border rounded-lg ${value ? '' : 'opacity-60'}`}
        >
          {shown}
        </span>
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <label htmlFor={inputId} className="text-[11px] font-bold uppercase text-truffle-text2">
            {label}
          </label>
          <input
            id={inputId}
            value={draft}
            onChange={(e) => accept(e.target.value)}
            // Enter here only confirms the emoji; it must not submit the form.
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            placeholder={t.emoji.placeholder}
            aria-describedby={hintId}
            aria-invalid={invalid}
            autoComplete="off"
            enterKeyHint="done"
            className="field h-11"
          />
        </div>
      </div>
      <p id={hintId} className={`m-0 text-[11px] ${invalid ? 'font-bold uppercase text-truffle-warning' : 'text-truffle-text2'}`}>
        {invalid ? `▲ ${t.emoji.notEmoji}` : t.emoji.hint(fallback)}
      </p>
    </div>
  )
}
