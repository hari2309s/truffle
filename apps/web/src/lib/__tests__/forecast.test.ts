import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { computeForecast, computeStatement } from '../forecast'

// Pin time to 2026-05-20 (day 20 of 31-day month)
const FAKE_NOW = new Date('2026-05-20T12:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FAKE_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

const makeTx = (amount: number, date: string, currency = 'EUR') => ({ amount, date, currency })

describe('computeForecast', () => {
  it('returns null when no transactions exist', () => {
    expect(computeForecast([])).toBeNull()
  })

  it('returns null when no transactions in current month', () => {
    const txs = [makeTx(1000, '2026-04-01'), makeTx(-200, '2026-04-15')]
    expect(computeForecast(txs)).toBeNull()
  })

  it('filters to current month only', () => {
    const txs = [
      makeTx(1000, '2026-05-01'),
      makeTx(-200, '2026-05-10'),
      makeTx(500, '2026-04-01'), // previous month — excluded
    ]
    const result = computeForecast(txs)
    expect(result).not.toBeNull()
    // Only 2 current-month transactions
    expect(result!.assumptions[0]).toContain('2 transactions')
  })

  it('computes currentBalance as sum of raw amounts', () => {
    const txs = [makeTx(1000, '2026-05-01'), makeTx(-300, '2026-05-10')]
    const result = computeForecast(txs)!
    expect(result.currentBalance).toBeCloseTo(700)
  })

  it('uses raw amounts regardless of currency', () => {
    // No conversion — each user has one currency, amounts are used as-is
    const txs = [makeTx(100, '2026-05-01', 'GBP')]
    const result = computeForecast(txs)!
    expect(result.currentBalance).toBeCloseTo(100)
  })

  it('confidence is low for <3 transactions', () => {
    const txs = [makeTx(500, '2026-05-01'), makeTx(-100, '2026-05-10')]
    expect(computeForecast(txs)!.confidence).toBe('low')
  })

  it('confidence is medium for 3-9 transactions', () => {
    const txs = Array.from({ length: 5 }, (_, i) => makeTx(-50, `2026-05-0${i + 1}`))
    expect(computeForecast(txs)!.confidence).toBe('medium')
  })

  it('confidence is high for >=10 transactions', () => {
    const txs = Array.from({ length: 10 }, (_, i) =>
      makeTx(-50, `2026-05-${String(i + 1).padStart(2, '0')}`)
    )
    expect(computeForecast(txs)!.confidence).toBe('high')
  })

  it('projects end-of-month balance based on daily spend rate', () => {
    // 20 days elapsed, 11 remaining in May 2026
    // Expenses: -200 over 20 days → -10/day
    // Balance: 1000 - 200 = 800; projection: 800 + (-10 * 11) = 690
    const txs = [makeTx(1000, '2026-05-01'), makeTx(-200, '2026-05-10')]
    const result = computeForecast(txs)!
    expect(result.projectedEndOfMonth).toBeCloseTo(690)
  })

  it('assumptions include transaction count, daily rate, days remaining, income', () => {
    const txs = [makeTx(1000, '2026-05-01'), makeTx(-200, '2026-05-10')]
    const { assumptions } = computeForecast(txs)!
    expect(assumptions[0]).toMatch(/2 transactions/)
    expect(assumptions[1]).toMatch(/Daily spend rate/)
    expect(assumptions[2]).toMatch(/11 days remaining/)
    expect(assumptions[3]).toMatch(/Income this month/)
  })

  it('handles income-only month with zero daily spend rate', () => {
    const txs = [makeTx(2000, '2026-05-01')]
    const result = computeForecast(txs)!
    expect(result.projectedEndOfMonth).toBeCloseTo(2000) // no spend to project
  })
})

describe('computeStatement', () => {
  // Local-time date so day-of-month maths doesn't drift with the test TZ.
  const today = new Date(2026, 9, 21) // Wed 21 Oct 2026, 10 days remaining

  it('returns null with no transactions', () => {
    expect(computeStatement([], today)).toBeNull()
  })

  it('balance is this month’s net only', () => {
    const s = computeStatement(
      [makeTx(3000, '2026-09-01'), makeTx(-500, '2026-09-10'), makeTx(-210, '2026-10-05')],
      today
    )!
    expect(s.balance).toBe(-210)
  })

  it('uses the server’s all-time balance when given', () => {
    const s = computeStatement([makeTx(-210, '2026-10-05')], today, 3482.16)!
    expect(s.balance).toBe(3482.16)
    expect(s.balanceIsAllTime).toBe(true)
    expect(s.projectedClose).toBeCloseTo(3482.16 - 100) // €10/day × 10 days left
  })

  it('returns null when nothing is logged this month', () => {
    expect(computeStatement([makeTx(-50, '2026-09-04')], today)).toBeNull()
  })

  it('daily rate and forecast use this month’s spend only', () => {
    const s = computeStatement([makeTx(2000, '2026-10-01'), makeTx(-420, '2026-10-02')], today)!
    expect(s.spentThisMonth).toBe(420)
    expect(s.dailyRate).toBe(20)
    expect(s.forecastMonthSpend).toBe(620)
    expect(s.projectedClose).toBe(1580 - 200)
    expect(s.monthEnd.getDate()).toBe(31)
  })

  it('pace compares against last month up to the same day', () => {
    const base = [makeTx(-100, '2026-10-03')]
    const ahead = computeStatement([...base, makeTx(-150, '2026-09-04'), makeTx(-900, '2026-09-25')], today)!
    expect(ahead.pace).toBe('ahead') // 100 vs 150 (the 25 Sep spend is after day 21)
    const behind = computeStatement([...base, makeTx(-50, '2026-09-04')], today)!
    expect(behind.pace).toBe('behind')
    expect(computeStatement(base, today)!.pace).toBeNull()
  })
})
