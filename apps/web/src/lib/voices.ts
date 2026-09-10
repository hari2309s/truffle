// Selectable TTS "voices" for Truffle's spoken replies.
//
// The browser Web Speech API exposes a wildly different voice list per
// OS/browser, so we don't let the user pick a raw SpeechSynthesisVoice.
// Instead each option is a *persona* — an ordered list of platform voice
// names we'd like for that character, plus rate/pitch — and we resolve it
// to whatever the current device actually has.
//
// Ordering rule (learned the hard way, see git history): list Google/
// Microsoft voices first. Chrome exposes macOS system voices (Samantha,
// Daniel…) in getVoices() but often can't synthesise with them and fails
// silently. Safari has no Google voices and falls through to the macOS
// names naturally.

export type VoiceId = 'sophie' | 'niamh' | 'isla' | 'oliver'

export type VoiceGender = 'female' | 'male'

export interface VoicePersona {
  id: VoiceId
  /** Human name shown in the picker. */
  name: string
  /** Accent / region label, e.g. "British English". */
  accent: string
  /** Flag emoji for the accent. */
  flag: string
  gender: VoiceGender
  description: string
  /**
   * Preferred platform voice names, best first, matched with String.includes.
   * Google/Microsoft names lead — Chrome lists macOS system voices but often
   * can't synthesise with them. `langHints` narrows the fallback search.
   */
  voiceNames: string[]
  /** BCP-47 prefixes to prefer when no named voice matches (e.g. "en-GB"). */
  langHints: string[]
  rate: number
  pitch: number
}

export const VOICE_PERSONAS: VoicePersona[] = [
  {
    id: 'sophie',
    name: 'Sophie',
    accent: 'British English',
    flag: '🇬🇧',
    gender: 'female',
    description: 'Warm and clear — the default Truffle voice',
    voiceNames: [
      'Google UK English Female',
      'Microsoft Sonia',
      'Microsoft Libby',
      'Microsoft Hazel',
      'Kate',
      'Serena',
      'Stephanie',
      'Martha',
    ],
    langHints: ['en-GB'],
    rate: 0.96,
    pitch: 1.0,
  },
  {
    id: 'niamh',
    name: 'Niamh',
    accent: 'Irish English',
    flag: '🇮🇪',
    gender: 'female',
    description: 'Lively and lilting',
    // Chrome desktop has no en-IE voice — falls back to the British female,
    // set apart here by a quicker, higher delivery. Real Irish accent renders
    // on Safari (Moira) and Edge (Microsoft Emily).
    voiceNames: ['Microsoft Emily', 'Moira', 'Google UK English Female', 'Microsoft Sonia'],
    langHints: ['en-IE', 'en-GB'],
    rate: 1.0,
    pitch: 1.04,
  },
  {
    id: 'isla',
    name: 'Isla',
    accent: 'Scottish English',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    gender: 'female',
    description: 'Soft and measured, with a Scottish lilt',
    // Fiona is the only Scottish voice, and only on older macOS. Elsewhere she
    // resolves to the British female, distinguished by a slower, lower delivery.
    voiceNames: ['Fiona', 'Google UK English Female', 'Microsoft Sonia', 'Microsoft Libby', 'Kate'],
    langHints: ['en-GB'],
    rate: 0.93,
    pitch: 0.98,
  },
  {
    id: 'oliver',
    name: 'Oliver',
    accent: 'British English',
    flag: '🇬🇧',
    gender: 'male',
    description: 'Low and unhurried, easy to listen to',
    voiceNames: [
      'Google UK English Male',
      'Microsoft Ryan',
      'Microsoft George',
      'Daniel',
      'Arthur',
      'Oliver',
    ],
    langHints: ['en-GB'],
    rate: 0.92,
    pitch: 0.97,
  },
]

export const DEFAULT_VOICE_ID: VoiceId = 'sophie'

// Identical for every persona so the user compares voices on the same words.
export const VOICE_SAMPLE_TEXT =
  "Hi, I'm Truffle. You're doing well this month — you've spent a little under half of what came in, so there's room to breathe."

export function isVoiceId(value: unknown): value is VoiceId {
  return typeof value === 'string' && VOICE_PERSONAS.some((p) => p.id === value)
}

export function getPersona(id: VoiceId): VoicePersona {
  return VOICE_PERSONAS.find((p) => p.id === id) ?? VOICE_PERSONAS[0]!
}

function englishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
}

export interface ResolvedVoice {
  voice: SpeechSynthesisVoice | null
  rate: number
  pitch: number
}

// Name hints for guessing a voice's gender when the API doesn't tell us.
const MALE_NAME_HINTS = [
  'male',
  ' man',
  'daniel',
  'arthur',
  'oliver',
  'george',
  'ryan',
  'guy',
  'william',
  'james',
  'thomas',
  'rishi',
  'aaron',
  'fred',
  'rocko',
  'reed',
  'eddy',
]
const FEMALE_NAME_HINTS = [
  'female',
  'woman',
  'sonia',
  'libby',
  'hazel',
  'kate',
  'serena',
  'stephanie',
  'martha',
  'fiona',
  'moira',
  'emily',
  'samantha',
  'aria',
  'jenny',
  'zira',
  'eva',
]

function guessGender(voice: SpeechSynthesisVoice): VoiceGender | null {
  const n = voice.name.toLowerCase()
  if (MALE_NAME_HINTS.some((h) => n.includes(h))) return 'male'
  if (FEMALE_NAME_HINTS.some((h) => n.includes(h))) return 'female'
  return null
}

export function resolveVoice(id: VoiceId): ResolvedVoice {
  const persona = getPersona(id)
  const voices = englishVoices()

  let match: SpeechSynthesisVoice | null = null
  for (const name of persona.voiceNames) {
    const found = voices.find((v) => v.name.includes(name))
    if (found) {
      match = found
      break
    }
  }

  // Fall back to a voice in the persona's accent region, preferring one whose
  // name hints at the right gender.
  if (!match) {
    for (const hint of persona.langHints) {
      const regional = voices.filter((v) => v.lang.startsWith(hint))
      match =
        regional.find((v) => guessGender(v) === persona.gender) ?? regional[0] ?? null
      if (match) break
    }
  }

  // Last resort: any English voice matching the gender, then any English voice.
  if (!match) {
    match =
      voices.find((v) => guessGender(v) === persona.gender) ??
      voices.find((v) => v.localService) ??
      voices[0] ??
      null
  }

  return { voice: match, rate: persona.rate, pitch: persona.pitch }
}

// Chrome returns [] from getVoices() until `voiceschanged` fires. Run `cb`
// once voices are available (immediately if they already are). Returns a
// disposer that detaches the pending listener if the caller unmounts first.
export function onVoicesReady(cb: () => void): () => void {
  const noop = () => {}
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return noop
  if (window.speechSynthesis.getVoices().length > 0) {
    cb()
    return noop
  }
  const handler = () => {
    window.speechSynthesis.removeEventListener('voiceschanged', handler)
    cb()
  }
  window.speechSynthesis.addEventListener('voiceschanged', handler)
  return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
}

let previewUtterance: SpeechSynthesisUtterance | null = null

export function stopVoicePreview(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  previewUtterance = null
  window.speechSynthesis.cancel()
}

interface PreviewCallbacks {
  onStart?: () => void
  onEnd?: () => void
}

/** Speak the shared sample sentence in the given persona's voice. */
export function previewVoice(id: VoiceId, cb?: PreviewCallbacks): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    cb?.onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  onVoicesReady(() => {
    const { voice, rate, pitch } = resolveVoice(id)
    const utterance = new SpeechSynthesisUtterance(VOICE_SAMPLE_TEXT)
    if (voice) utterance.voice = voice
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = 1.0
    const done = () => {
      if (previewUtterance === utterance) previewUtterance = null
      cb?.onEnd?.()
    }
    utterance.onstart = () => cb?.onStart?.()
    utterance.onend = done
    utterance.onerror = done
    previewUtterance = utterance
    window.speechSynthesis.speak(utterance)
  })
}
