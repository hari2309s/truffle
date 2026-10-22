import { describe, it, expect } from 'vitest'
import { goalPlan } from '../goalPlan'
import { periodName, recentPeriods } from '../habits'

const TODAY = new Date(2026, 9, 22) // 22 Oct 2026
// Set 22 Apr 2026, due 22 Apr 2027: today is 183 of 365 days in (50.1%).
const trip = { targetAmount: 2000, createdAt: new Date(2026, 3, 22).toISOString(), deadline: '2027-04-22' }

describe('goalPlan', () => {
  it('is on track within 1% of the even-pace share, with the monthly amount to finish', () => {
    const plan = goalPlan({ ...trip, savedAmount: 1000 }, TODAY)
    // Even pace is ≈ €1,002.74 — €2.74 short is well inside 1% of €2,000.
    expect(plan).toMatchObject({ status: 'onTrack', shortBy: 0, daysLeft: 182 })
    // €1,000 left over 182 days ≈ 5.98 months.
    expect(plan.perMonth).toBeCloseTo(1000 / (182 / (365.25 / 12)), 2)
  })

  it('is behind below that share, and says by how much', () => {
    const plan = goalPlan({ ...trip, savedAmount: 800 }, TODAY)
    expect(plan.status).toBe('behind')
    expect(plan.shortBy).toBeCloseTo(202.74, 2)
  })

  it('asks for the whole remainder when under a month is left', () => {
    const plan = goalPlan({ ...trip, deadline: '2026-11-01', savedAmount: 1900 }, TODAY)
    expect(plan.perMonth).toBe(100)
  })

  it('handles reached, overdue and no-deadline goals', () => {
    expect(goalPlan({ ...trip, savedAmount: 2000 }, TODAY).status).toBe('reached')
    const overdue = goalPlan({ ...trip, deadline: '2026-10-01', savedAmount: 10 }, TODAY)
    expect(overdue).toMatchObject({ status: 'overdue', perMonth: null })
    expect(goalPlan({ ...trip, deadline: undefined, savedAmount: 10 }, TODAY)).toMatchObject({
      status: null,
      perMonth: null,
    })
  })

  it('treats the deadline day itself as due, not passed', () => {
    const plan = goalPlan({ ...trip, deadline: '2026-10-22', savedAmount: 1500 }, TODAY)
    expect(plan).toMatchObject({ daysLeft: 0, perMonth: 500 })
  })
})

describe('habit periods', () => {
  it('lists the last n periods, oldest first, ending now', () => {
    const months = recentPeriods('monthly', 3, new Date(2026, 9, 22, 12))
    expect(months).toEqual(['2026-08', '2026-09', '2026-10'])
    expect(recentPeriods('weekly', 8, TODAY)).toHaveLength(8)
  })

  it('names periods for people', () => {
    expect(periodName('2026-W42', (n) => `Week ${n}`, 'en-GB')).toBe('Week 42')
    expect(periodName('2026-10', (n) => `Week ${n}`, 'en-GB')).toBe('Oct 2026')
  })
})
