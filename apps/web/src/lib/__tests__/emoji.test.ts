import { describe, it, expect } from 'vitest'
import { lastEmoji } from '../emoji'

describe('lastEmoji', () => {
  it('keeps multi-codepoint emoji whole', () => {
    expect(lastEmoji('👩🏽‍💻')).toBe('👩🏽‍💻')
    expect(lastEmoji('🇮🇪')).toBe('🇮🇪')
    expect(lastEmoji('1️⃣')).toBe('1️⃣')
  })
  it('takes the most recent emoji typed', () => {
    expect(lastEmoji('🎯✈️')).toBe('✈️')
    expect(lastEmoji('trip 🗾 to japan')).toBe('🗾')
  })
  it('rejects plain text', () => {
    expect(lastEmoji('abc')).toBeNull()
    expect(lastEmoji('')).toBeNull()
  })
})
