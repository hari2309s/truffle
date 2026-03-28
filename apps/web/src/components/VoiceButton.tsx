'use client'

import { useCallback } from 'react'

interface VoiceButtonProps {
  isRecording: boolean
  isTranscribing: boolean
  isSpeaking: boolean
  onStart: () => void
  onStop: () => void
}

export function VoiceButton({ isRecording, isTranscribing, isSpeaking, onStart, onStop }: VoiceButtonProps) {
  const handlePointerDown = useCallback(() => {
    if (!isRecording && !isTranscribing) {
      onStart()
    }
  }, [isRecording, isTranscribing, onStart])

  const handlePointerUp = useCallback(() => {
    if (isRecording) {
      onStop()
    }
  }, [isRecording, onStop])

  const getState = () => {
    if (isRecording) return 'recording'
    if (isTranscribing) return 'transcribing'
    if (isSpeaking) return 'speaking'
    return 'idle'
  }

  const state = getState()

  const buttonClasses = {
    idle: 'bg-truffle-amber hover:bg-truffle-amber-light shadow-lg shadow-truffle-amber/20',
    recording: 'bg-red-500 shadow-lg shadow-red-500/40 scale-110 animate-pulse',
    transcribing: 'bg-truffle-muted shadow-none cursor-wait',
    speaking: 'bg-truffle-green shadow-lg shadow-truffle-green/30 animate-pulse-slow',
  }[state]

  const label = {
    idle: 'Hold to speak',
    recording: 'Listening...',
    transcribing: 'Thinking...',
    speaking: 'Speaking...',
  }[state]

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-20 h-20 rounded-full transition-all duration-200 flex items-center justify-center touch-none ${buttonClasses}`}
        aria-label={label}
        disabled={isTranscribing}
      >
        <MicIcon isRecording={isRecording} />
      </button>
      <span className="text-sm text-truffle-text-secondary">{label}</span>
    </div>
  )
}

function MicIcon({ isRecording }: { isRecording: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`w-8 h-8 text-truffle-bg transition-transform duration-200 ${isRecording ? 'scale-90' : ''}`}
    >
      <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 0 1 2 0z" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
