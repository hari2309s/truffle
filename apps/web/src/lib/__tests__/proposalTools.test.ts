import { describe, it, expect } from 'vitest'
import { asSchema } from 'ai'
import { proposalTools } from '../proposalTools'
import { parseLocalDay, toCategory, toEmoji, toFrequency, toTransactionDate } from '../toolArgs'

const TODAY = '2026-10-22'
const tools = proposalTools(TODAY)

// What the SDK does with a tool call: validate the model's JSON against the schema.
const parse = (name: keyof typeof tools, input: unknown) =>
  (tools[name].inputSchema as unknown as { safeParse: (v: unknown) => { success: boolean; data?: any } }).safeParse(input)

describe('proposeTransaction', () => {
  it('accepts nulls, string amounts and near-miss categories', () => {
    const r = parse('proposeTransaction', {
      description: 'Lunch',
      amount: '€12.00',
      category: 'Food delivery',
      merchant: null,
      date: null,
    })
    expect(r.success).toBe(true)
    expect(r.data).toEqual({
      description: 'Lunch',
      amount: -12,
      category: 'food_delivery',
      merchant: undefined,
      date: TODAY,
    })
  })

  it('makes spending negative and income positive whatever sign the model sent', () => {
    expect(parse('proposeTransaction', { description: 'Shoes', amount: 80, category: 'shopping' }).data.amount).toBe(-80)
    expect(parse('proposeTransaction', { description: 'Salary', amount: -2800, category: 'income' }).data.amount).toBe(2800)
    // 'other' can go either way — the model's sign stands.
    expect(parse('proposeTransaction', { description: 'From Tom', amount: 50, category: 'other' }).data.amount).toBe(50)
    // Money back in a spending category stays money in.
    expect(parse('proposeTransaction', { description: 'Refund from Zara', amount: 30, category: 'shopping' }).data.amount).toBe(30)
  })

  it('rejects zero or unreadable amounts', () => {
    expect(parse('proposeTransaction', { description: 'x', amount: 0, category: 'other' }).success).toBe(false)
    expect(parse('proposeTransaction', { description: 'x', amount: 'twelve', category: 'other' }).success).toBe(false)
  })

  it('falls back to the merchant when there is no description', () => {
    const r = parse('proposeTransaction', { description: ' ', amount: -4.5, category: 'food_delivery', merchant: 'Costa' })
    expect(r.data.description).toBe('Costa')
  })
})

describe('proposeGoal', () => {
  it('keeps future deadlines and drops past or malformed ones', () => {
    const goal = (deadline: unknown) =>
      parse('proposeGoal', { name: 'Laptop', targetAmount: '1,500', deadline, emoji: null, pitch: null }).data
    expect(goal('2027-06-30')).toMatchObject({ deadline: '2027-06-30', targetAmount: 1500, emoji: '🎯', pitch: '' })
    expect(goal('2026-04-30').deadline).toBeUndefined()
    expect(goal('30/06/2027').deadline).toBeUndefined()
    expect(goal(null).deadline).toBeUndefined()
  })

  it('rejects amounts the goals API would refuse', () => {
    expect(parse('proposeGoal', { name: 'x', targetAmount: 0 }).success).toBe(false)
    expect(parse('proposeGoal', { name: 'x', targetAmount: 2e9 }).success).toBe(false)
  })
})

describe('proposeHabit', () => {
  it('reads "€100.00" and "Weekly" (the call that failed in production)', () => {
    const r = parse('proposeHabit', {
      amount: '€100.00',
      emoji: '💰',
      frequency: 'Weekly',
      name: 'Weekly savings',
      pitch: '€100.00/week = ~€400.00/month',
    })
    expect(r.success).toBe(true)
    expect(r.data).toMatchObject({ amount: 100, frequency: 'weekly' })
  })

  it('names an unnamed habit and rejects a missing frequency', () => {
    expect(parse('proposeHabit', { amount: 20, frequency: 'monthly' }).data.name).toBe('Monthly savings')
    expect(parse('proposeHabit', { amount: 20, frequency: 'sometimes' }).success).toBe(false)
  })
})

describe('tool schemas the model sees', () => {
  it('still describe every field despite the cleaning transforms', async () => {
    for (const [name, fields] of [
      ['proposeTransaction', ['description', 'amount', 'category', 'merchant', 'date']],
      ['proposeGoal', ['name', 'targetAmount', 'deadline', 'emoji', 'pitch']],
      ['proposeHabit', ['name', 'amount', 'frequency', 'emoji', 'pitch']],
    ] as const) {
      const schema = (await asSchema(tools[name].inputSchema as Parameters<typeof asSchema>[0]).jsonSchema) as { properties?: Record<string, unknown> }
      expect(Object.keys(schema.properties ?? {}).sort(), name).toEqual([...fields].sort())
    }
  })
})

describe('toolArgs', () => {
  it('maps categories and frequencies', () => {
    expect(toCategory('Groceries')).toBe('food_groceries')
    expect(toCategory('food-groceries')).toBe('food_groceries')
    expect(toCategory('banana')).toBe('other')
    expect(toFrequency('every month')).toBe('monthly')
  })

  it('keeps one emoji or falls back', () => {
    expect(toEmoji('🎯✈️', '💰')).toBe('✈️')
    expect(toEmoji(':dart:', '🎯')).toBe('🎯')
  })

  it('never dates an entry in the future or on an impossible day', () => {
    expect(toTransactionDate('yesterday', '2026-11-01')).toBe('2026-10-31')
    expect(toTransactionDate('2026-10-23', TODAY)).toBe(TODAY)
    expect(toTransactionDate('2026-02-30', TODAY)).toBe(TODAY)
    expect(toTransactionDate('2026-10-20T09:00:00Z', TODAY)).toBe('2026-10-20')
  })

  it('reads a day as local, not UTC', () => {
    const d = parseLocalDay('2026-10-22')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 22])
    expect(isNaN(parseLocalDay('2027-06-30T00:00:00Z').getTime())).toBe(false)
  })
})
