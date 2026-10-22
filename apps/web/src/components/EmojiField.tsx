'use client'

import { useId, useState } from 'react'
import { lastEmoji } from '@/lib/emoji'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * Pick any emoji: type or paste one (the phone's emoji keyboard, or the OS
 * picker on desktop), or tap a quick pick. Shows the current choice large.
 */
export function EmojiField({
  value,
  onChange,
  label,
  suggestions,
}: {
  value: string
  onChange: (emoji: string) => void
  label: string
  /** A few one-tap starting points. */
  suggestions: string[]
}) {
  const { t } = useLanguage()
  const [draft, setDraft] = useState('')
  const [invalid, setInvalid] = useState(false)
  const inputId = useId()
  const hintId = useId()

  const accept = (text: string) => {
    const emoji = lastEmoji(text)
    if (emoji) {
      onChange(emoji)
      setDraft('')
      setInvalid(false)
    } else {
      setDraft(text)
      setInvalid(text.trim().length > 0)
    }
  }

  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span
          aria-label={t.emoji.current(value)}
          className="flex-none w-[52px] h-[52px] grid place-items-center text-[28px] bg-truffle-surface border border-truffle-border rounded-lg"
        >
          {value}
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
        {invalid ? `▲ ${t.emoji.notEmoji}` : t.emoji.hint}
      </p>
      <div className="flex gap-1 flex-wrap">
        {suggestions.map((e) => (
          <button
            key={e}
            type="button"
            aria-pressed={value === e}
            aria-label={t.emoji.pick(e)}
            onClick={() => onChange(e)}
            className={`w-9 h-9 grid place-items-center text-lg rounded-md border ${value === e ? 'border-truffle-text bg-truffle-accent-soft' : 'border-transparent'}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

export const GOAL_SUGGESTIONS = ['🎯', '✈️', '🏠', '🚗', '💻', '🎓', '💍', '🏖️', '🎸', '📱', '🏋️', '🌍']
export const HABIT_SUGGESTIONS = ['💰', '🐷', '☕', '🍱', '🚲', '📚', '🧾', '🌱']
