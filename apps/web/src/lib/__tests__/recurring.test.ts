import { describe, it, expect } from 'vitest'
import { detectRecurring, groupFor, recurringTotals } from '../recurring'
import { computeStatement } from '../forecast'

const TODAY = new Date(2026, 9, 22)
const tx = (merchant: string, amount: number, date: string, category = 'other', description = merchant) => ({
  merchant,
  description,
  amount,
  date,
  category,
})
/** The same charge on `day` of each month, Jun–Oct 2026. */
const monthly = (merchant: string, amount: number, category: string, day = 3, description = merchant) =>
  ['06', '07', '08', '09', '10'].map((m) => tx(merchant, amount, `2026-${m}-${String(day).padStart(2, '0')}`, category, description))

describe('detectRecurring', () => {
  it('never calls rent or an investing plan a subscription', () => {
    const items = detectRecurring(
      [
        ...monthly('Hausverwaltung Krause', -800, 'housing', 1),
        ...monthly('Trade Republic', -300, 'savings', 2, 'ETF Sparplan'),
        ...monthly('Netflix', -13.99, 'subscriptions', 5),
      ],
      TODAY
    )
    expect(items.map((i) => [i.displayName, i.group, i.confidence])).toEqual([
      ['Hausverwaltung Krause', 'fixed', 'high'],
      ['Trade Republic', 'investing', 'high'],
      ['Netflix', 'subscriptions', 'high'],
    ])
  })

  it('groups by name when the category is generic', () => {
    expect(groupFor('other', 'Scalable Capital Tagesgeld')).toBe('investing')
    expect(groupFor('other', 'Allianz Versicherung')).toBe('fixed')
    expect(groupFor('transport', 'BVG Deutschlandticket')).toBe('subscriptions')
  })

  it('splits one merchant into its separate plans', () => {
    const items = detectRecurring(
      [
        ...monthly('Trade Republic', -300, 'savings', 2, 'ETF Sparplan'),
        ...monthly('Trade Republic', -100, 'savings', 2, 'Bitcoin Sparplan'),
      ],
      TODAY
    )
    expect(items.map((i) => i.displayName).sort()).toEqual([
      'Trade Republic · Bitcoin Sparplan',
      'Trade Republic · ETF Sparplan',
    ])
  })

  it('drops shop visits on irregular days; regular ones are only "possible" and not totalled', () => {
    const items = detectRecurring(
      [
        tx('Zalando', -64.95, '2026-09-22', 'shopping'),
        tx('Zalando', -74.85, '2026-10-13', 'shopping'),
        ...monthly('Rewe', -47.63, 'food_groceries', 6),
      ],
      TODAY
    )
    expect(items.map((i) => [i.displayName, i.confidence])).toEqual([['Rewe', 'possible']])
    expect(recurringTotals(items).total).toBe(0)
  })

  it('leaves out goal deposits and habit logs — they’re Truffle’s own goals and habits', () => {
    const items = detectRecurring(
      [
        ...monthly('Japan trip', -350, 'savings', 1, 'Saved to: Japan trip'),
        ...monthly('', -25, 'savings', 3, 'Savings — Weekly top-up'),
        ...monthly('Emergency fund', -200, 'savings', 1).map((t) => ({ ...t, goalId: 'g1' })),
      ],
      TODAY
    )
    expect(items).toEqual([])
  })

  it('ignores income, one-off months and charges that have stopped', () => {
    expect(
      detectRecurring(
        [
          ...monthly('Salary', 3000, 'income'),
          tx('Netflix', -15, '2026-10-01', 'subscriptions'),
          tx('Netflix', -15, '2026-10-15', 'subscriptions'),
          tx('Old Gym', -30, '2026-04-01', 'health'),
          tx('Old Gym', -30, '2026-05-01', 'health'),
        ],
        TODAY
      )
    ).toEqual([])
  })

  it('applies the user’s choices: move, confirm, or not recurring', () => {
    const txs = [
      ...monthly('Rewe', -47.63, 'food_groceries', 6),
      ...monthly('Netflix', -13.99, 'subscriptions', 5),
    ]
    const items = detectRecurring(txs, TODAY, { rewe: 'fixed', netflix: 'none' })
    const rewe = items.find((i) => i.key === 'rewe')!
    expect(rewe).toMatchObject({ group: 'fixed', confidence: 'high', overridden: true })
    expect(items.find((i) => i.key === 'netflix')).toMatchObject({ hidden: true })
    expect(recurringTotals(items)).toMatchObject({ total: 47.63, fixed: 47.63, subscriptions: 0 })
  })

  it('gives each plan its own key when a choice was saved for the whole merchant', () => {
    const items = detectRecurring(
      [
        ...monthly('Trade Republic', -300, 'savings', 2, 'ETF Sparplan'),
        ...monthly('Trade Republic', -100, 'savings', 2, 'Bitcoin Sparplan'),
      ],
      TODAY,
      { 'trade republic': 'other' }
    )
    expect(items.map((i) => i.group)).toEqual(['other', 'other'])
    expect(new Set(items.map((i) => i.key)).size).toBe(2)
  })

  it('only looks at the last twelve months, whatever it is given', () => {
    const old = ['2025-08-05', '2025-09-05', '2025-10-05'].map((d) => tx('Netflix', -13.99, d, 'subscriptions'))
    const recent = ['2026-09-05', '2026-10-05'].map((d) => tx('Netflix', -13.99, d, 'subscriptions'))
    expect(detectRecurring([...old, ...recent], TODAY)[0]!.monthsDetected).toBe(2)
  })

  it('keeps a choice through a price change', () => {
    const hiked = [...monthly('Netflix', -13.99, 'subscriptions', 5).slice(0, 3), ...monthly('Netflix', -15.49, 'subscriptions', 5).slice(3)]
    // Saved before plans were keyed by merchant alone, at the old price.
    const [item] = detectRecurring(hiked, TODAY, { 'netflix|14': 'none' })
    expect(item).toMatchObject({ hidden: true, key: 'netflix|14' })
  })

  it('reads weekly and quarterly rhythms and converts them to a month', () => {
    const weekly = Array.from({ length: 10 }, (_, i) =>
      tx('Savings top-up', -25, new Date(2026, 7, 17 + i * 7).toISOString().slice(0, 10), 'savings')
    )
    const quarterly = ['2026-01-08', '2026-04-08', '2026-07-08'].map((d) => tx('ARD ZDF', -55.08, d, 'utilities'))
    const items = detectRecurring([...weekly, ...quarterly], TODAY)
    expect(items.find((i) => i.displayName === 'Savings Top-up')).toMatchObject({
      every: 'week',
      perCharge: 25,
      monthlyAmount: expect.closeTo(108.71, 2),
    })
    expect(items.find((i) => i.displayName === 'Ard Zdf')).toMatchObject({
      every: 'quarter',
      monthlyAmount: expect.closeTo(18.36, 2),
      confidence: 'high',
    })
  })

  it('counts rent that posts on the 31st instead of the 1st as monthly', () => {
    const rent = ['2026-06-01', '2026-06-30', '2026-08-01', '2026-08-31', '2026-10-01'].map((d) =>
      tx('Landlord', -800, d, 'housing')
    )
    expect(detectRecurring(rent, TODAY)[0]).toMatchObject({ every: 'month', confidence: 'high' })
  })
})

describe('statement and savings', () => {
  it('keeps savings out of spending and the daily rate, but in the close', () => {
    const s = computeStatement(
      [
        tx('Employer', 3000, '2026-10-01', 'income'),
        tx('Trade Republic', -300, '2026-10-02', 'savings'),
        tx('Rewe', -220, '2026-10-10', 'food_groceries'),
      ],
      TODAY
    )!
    expect(s).toMatchObject({ spentThisMonth: 220, savedThisMonth: 300, dailyRate: 10, netThisMonth: 2480 })
    // 3,000 − (10/day × 31) − 300
    expect(s.projectedClose).toBeCloseTo(2390, 6)
  })

  it('treats a goal withdrawal as money back from savings, not income', () => {
    const s = computeStatement(
      [
        tx('Employer', 3000, '2026-10-01', 'income'),
        tx('Laptop goal', -500, '2026-10-02', 'savings'),
        tx('Laptop goal', 200, '2026-10-09', 'savings'),
      ],
      TODAY
    )!
    expect(s).toMatchObject({ incomeThisMonth: 3000, savedThisMonth: 300, netThisMonth: 2700 })
  })
})
