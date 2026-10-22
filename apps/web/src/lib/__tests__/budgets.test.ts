import { describe, it, expect } from 'vitest'
import { budgetStatus, budgetView, effectiveLimit, previousMonth } from '../budgets'

describe('effectiveLimit', () => {
  it('is the base amount without rollover', () => {
    expect(effectiveLimit({ amount: 200 }, 50)).toBe(200)
  })
  it('adds last month’s unused part with rollover, never less than base', () => {
    expect(effectiveLimit({ amount: 200, rollover: true }, 150)).toBe(250)
    expect(effectiveLimit({ amount: 200, rollover: true }, 260)).toBe(200)
  })
  it('rolls nothing over for a budget created this month', () => {
    const now = new Date(2026, 9, 21)
    expect(
      effectiveLimit({ amount: 200, rollover: true, createdAt: '2026-10-05T10:00:00Z' }, 0, now)
    ).toBe(200)
    expect(
      effectiveLimit({ amount: 200, rollover: true, createdAt: '2026-08-05T10:00:00Z' }, 0, now)
    ).toBe(400)
  })
})

describe('budgetStatus', () => {
  it('uses the default 80% threshold', () => {
    expect(budgetStatus(79, 100, undefined)).toBe('onTrack')
    expect(budgetStatus(80, 100, undefined)).toBe('headsUp')
    expect(budgetStatus(101, 100, undefined)).toBe('over')
  })
  it('respects a custom threshold and an off switch', () => {
    expect(budgetStatus(55, 100, 50)).toBe('headsUp')
    expect(budgetStatus(95, 100, null)).toBe('onTrack')
    expect(budgetStatus(120, 100, null)).toBe('over')
  })
})

describe('previousMonth', () => {
  it('wraps the year', () => {
    expect(previousMonth('2026-01')).toBe('2025-12')
    expect(previousMonth('2026-10')).toBe('2026-09')
  })
})

describe('budgetView', () => {
  const now = new Date(2026, 9, 21)
  const tx = (amount: number, date: string, category = 'food_groceries') => ({ amount, date, category })
  it('rolls last month’s unused amount into this month', () => {
    const v = budgetView(
      { amount: 400, category: 'food_groceries', rollover: true, alertPct: 80 },
      [tx(-300, '2026-09-10'), tx(-320, '2026-10-10')],
      now
    )
    expect(v).toMatchObject({ spent: 320, limit: 500, rolledOver: 100, status: 'onTrack' })
  })
  it('flags heads-up against the base limit without rollover', () => {
    const v = budgetView({ amount: 400, category: 'food_groceries' }, [tx(-330, '2026-10-02')], now)
    expect(v.status).toBe('headsUp')
  })
})
