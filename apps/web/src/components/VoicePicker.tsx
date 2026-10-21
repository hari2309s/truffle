'use client'

import { useEffect, useState } from 'react'
import { VOICE_PERSONAS, previewVoice, stopVoicePreview, type VoiceId } from '@/lib/voices'
import { useLanguage } from '@/contexts/LanguageContext'
import { Meter } from './Tally'

interface VoicePickerProps {
  value: VoiceId
  onChange: (id: VoiceId) => void
  /** `row` for the settings sheet; `card` for onboarding (with a now-playing strip). */
  variant?: 'row' | 'card'
}

export function VoicePicker({ value, onChange, variant = 'row' }: VoicePickerProps) {
  const { t } = useLanguage()
  const [previewing, setPreviewing] = useState<VoiceId | null>(null)

  // Prompt Chrome to start loading its voice list now, so the first preview
  // click doesn't get deferred past the user gesture (and silently dropped).
  useEffect(() => {
    try {
      window.speechSynthesis?.getVoices()
    } catch {
      /* speechSynthesis unavailable */
    }
    return () => stopVoicePreview()
  }, [])

  const handlePreview = (id: VoiceId) => {
    if (previewing === id) {
      stopVoicePreview()
      setPreviewing(null)
      return
    }
    previewVoice(id, {
      onStart: () => setPreviewing(id),
      onEnd: () => setPreviewing((current) => (current === id ? null : current)),
    })
  }

  const previewingPersona = VOICE_PERSONAS.find((p) => p.id === previewing)

  return (
    <div className={`flex flex-col ${variant === 'card' ? 'gap-2.5' : 'gap-2'}`}>
      <div role="radiogroup" aria-label={t.settings.voice} className="contents">
        {VOICE_PERSONAS.map((persona) => {
          const selected = value === persona.id
          const isPreviewing = previewing === persona.id
          const select = () => onChange(persona.id)
          const playKey = (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handlePreview(persona.id)
              }}
              aria-label={
                isPreviewing ? `Stop ${persona.name} preview` : `Preview ${persona.name}'s voice`
              }
              className={
                variant === 'card'
                  ? `key ${selected ? 'key-accent' : 'key-ink'} w-[52px] h-[52px] text-sm`
                  : 'w-11 h-11 rounded-lg bg-truffle-text text-truffle-bg grid place-items-center text-xs'
              }
            >
              {isPreviewing ? '■' : '▶'}
            </button>
          )

          return (
            <div
              key={persona.id}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={select}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  select()
                }
              }}
              className={
                variant === 'card'
                  ? `paper cursor-pointer grid grid-cols-[1fr_52px] gap-3 items-center py-3.5 pr-3.5 pl-[18px] border-2 ${
                      selected ? 'border-truffle-text' : 'border-transparent'
                    }`
                  : `cursor-pointer grid grid-cols-[1fr_44px] gap-2.5 items-center py-2 pr-2 pl-3 rounded-lg ${
                      selected
                        ? 'border-2 border-truffle-accent bg-truffle-accent-soft'
                        : 'border border-truffle-border'
                    }`
              }
            >
              {variant === 'card' ? (
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex gap-1.5 text-base">
                    <span className="font-bold">{persona.name}</span>
                    <span aria-hidden className="leader" />
                    <span className="text-xs font-bold text-truffle-accent-ink uppercase whitespace-nowrap">
                      {persona.flag} {persona.accent}
                    </span>
                  </div>
                  <span className="font-grotesk text-sm text-truffle-text2">
                    {persona.description}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold">
                    {persona.name}
                    {selected && ' ✓'}
                  </span>
                  <span className="font-grotesk text-[13px] text-truffle-text2 truncate">
                    {persona.flag} {persona.description}
                  </span>
                </div>
              )}
              {playKey}
            </div>
          )
        })}
      </div>

      {variant === 'card' && (
        <div className="paper mt-2 px-3.5 py-2.5 flex items-center gap-2.5 min-h-[38px]" aria-live="polite">
          <span className="text-[11px] font-bold uppercase whitespace-nowrap">
            {previewingPersona
              ? t.onboarding.nowPlaying(previewingPersona.name)
              : t.onboarding.tapToHear}
          </span>
          <Meter active={!!previewingPersona} />
        </div>
      )}
    </div>
  )
}
