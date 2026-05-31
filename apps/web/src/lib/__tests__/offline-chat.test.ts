import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock offlineDb before importing the module under test
vi.mock('../offline-db', () => ({
  offlineDb: {
    transactions: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    },
  },
}))

import { generateOfflineFallback } from '../offline-chat'
import { offlineDb } from '../offline-db'

const mockToArray = offlineDb.transactions.toArray as ReturnType<typeof vi.fn>

function makeTx(amount: number, category = 'food_groceries') {
  return { amount, category, userId: 'u1', currency: 'EUR' as const }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateOfflineFallback', () => {
  it('returns generic fallback when no cached transactions exist', async () => {
    mockToArray.mockResolvedValue([])
    const reply = await generateOfflineFallback('u1', 'what is the meaning of life?')
    expect(reply.length).toBeGreaterThan(0)
  })

  it('returns spending-focused reply for spending queries', async () => {
    mockToArray.mockResolvedValue([makeTx(-200, 'food_groceries'), makeTx(-50, 'transport')])
    const reply = await generateOfflineFallback('u1', 'how much did I spend on food?')
    expect(reply).toContain('offline')
    expect(reply).toContain('Food Groceries') // top category formatted
  })

  it('returns balance-focused reply for balance queries', async () => {
    mockToArray.mockResolvedValue([makeTx(2000), makeTx(-800, 'housing')])
    const reply = await generateOfflineFallback('u1', 'what is my balance?')
    expect(reply).toMatch(/income|outgoing|balance/i)
  })

  it('returns goal-focused reply for goal queries', async () => {
    mockToArray.mockResolvedValue([])
    const reply = await generateOfflineFallback('u1', 'how is my savings goal going?')
    expect(reply).toContain('goal')
  })

  it('returns generic fallback with expense summary when no intent matches', async () => {
    mockToArray.mockResolvedValue([makeTx(-150, 'entertainment')])
    const reply = await generateOfflineFallback('u1', 'tell me a joke')
    expect(reply.length).toBeGreaterThan(0)
  })

  it('handles offlineDb errors gracefully and still returns a string', async () => {
    mockToArray.mockRejectedValue(new Error('IndexedDB unavailable'))
    const reply = await generateOfflineFallback('u1', 'what did I spend?')
    expect(typeof reply).toBe('string')
    expect(reply.length).toBeGreaterThan(0)
  })

  it('spending branch picks the highest-spend category', async () => {
    mockToArray.mockResolvedValue([
      makeTx(-50, 'transport'),
      makeTx(-400, 'housing'),
      makeTx(-100, 'entertainment'),
    ])
    const reply = await generateOfflineFallback('u1', 'how much did I spend?')
    expect(reply).toContain('Housing')
  })
})
