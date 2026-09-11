'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DEFAULT_VOICE_ID, normalizeVoiceId, type VoiceId } from '@/lib/voices'

const STORAGE_KEY = 'truffle-voice'

interface VoiceContextValue {
  voiceId: VoiceId
  setVoiceId: (v: VoiceId) => void
}

const VoiceContext = createContext<VoiceContextValue>({
  voiceId: DEFAULT_VOICE_ID,
  setVoiceId: () => {},
})

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [voiceId, setVoiceIdState] = useState<VoiceId>(DEFAULT_VOICE_ID)

  useEffect(() => {
    try {
      const stored = normalizeVoiceId(localStorage.getItem(STORAGE_KEY))
      if (stored) setVoiceIdState(stored)
    } catch {
      // localStorage unavailable — fall back to the default
    }
    // user_metadata.voice wins if the account has a saved preference.
    supabase.auth.getSession().then(({ data }) => {
      const raw = data.session?.user?.user_metadata?.voice
      const normalized = normalizeVoiceId(raw)
      if (normalized) {
        setVoiceIdState(normalized)
        try {
          localStorage.setItem(STORAGE_KEY, normalized)
        } catch {
          /* ignore */
        }
        // Self-heal a retired persona id (e.g. a voice that was later
        // removed) so future sessions don't need to remap it again.
        if (normalized !== raw) {
          supabase.auth.updateUser({ data: { voice: normalized } }).catch(() => {})
        }
      }
    })
  }, [])

  const setVoiceId = (next: VoiceId) => {
    setVoiceIdState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }

  return <VoiceContext.Provider value={{ voiceId, setVoiceId }}>{children}</VoiceContext.Provider>
}

export function useVoicePreference() {
  return useContext(VoiceContext)
}
