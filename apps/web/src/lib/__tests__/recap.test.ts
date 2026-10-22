import { describe, it, expect } from 'vitest'
import { buildRecap, isoWeek } from '../recap'

// Wed 21 Oct 2026, local time.
const today = new Date(2026, 9, 21)
const tx = (amount: number, date: string, category = 'food_groceries') => ({
  amount,
  date,
  category,
})

describe('buildRecap', () => {
  it('returns null with nothing in the last 7 days', () => {
    expect(buildRecap([tx(-20, '2026-10-01')], today)).toBeNull()
  })

  it('totals spend and income for the 7 days ending today', () => {
    const r = buildRecap(
      [tx(-30, '2026-10-21'), tx(-12, '2026-10-15'), tx(500, '2026-10-20', 'income'), tx(-99, '2026-10-14')],
      today
    )!
    expect(r.spent).toBe(42)
    expect(r.income).toBe(500)
    expect(r.transactionCount).toBe(3)
    expect(r.week).toBe(43)
  })

  it('averages the previous 4 weeks as the usual week', () => {
    const r = buildRecap(
      [tx(-50, '2026-10-20'), tx(-200, '2026-10-10'), tx(-200, '2026-09-25')],
      today
    )!
    expect(r.usual).toBe(100)
  })

  it('has no usual week without earlier spend', () => {
    expect(buildRecap([tx(-50, '2026-10-20')], today)!.usual).toBeNull()
  })

  it('picks the busiest category and its busiest weekday', () => {
    const r = buildRecap(
      [
        tx(-30, '2026-10-16', 'food_delivery'), // Friday
        tx(-40, '2026-10-16', 'food_delivery'),
        tx(-20, '2026-10-18', 'food_delivery'), // Sunday
        tx(-60, '2026-10-19', 'transport'),
      ],
      today
    )!
    expect(r.top).toEqual({ category: 'food_delivery', amount: 90, count: 3, weekday: 5 })
  })
})

describe('isoWeek', () => {
  it('handles year boundaries', () => {
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1)
    expect(isoWeek(new Date(2027, 0, 1))).toBe(53)
  })
})
