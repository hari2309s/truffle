import { describe, it, expect } from 'vitest'
import type { MonthlySnapshot } from '@truffle/types'
import { buildSystemPrompt, type FinancialFacts } from '../chatSystemPrompt'

const facts: FinancialFacts = {
  month: 'October 2026',
  income_this_month: '€3,250.00',
  spent_this_month: '€1,455.48',
  net_this_month: '€1,794.52',
  daily_rate: '€69.31',
  forecast_month_spend: '€2,148.58',
  days_remaining: 10,
  projected_close: '€732.39',
  net_of_everything_logged: null,
  pace_vs_last_month: 'spent €140.12 less than by this point last month',
  recurring: ['Netflix: €13.99 a month'],
}

const snapshot = (month: string, income: number, expenses: number): MonthlySnapshot =>
  ({ month, totalIncome: income, totalExpenses: -expenses, balance: income - expenses }) as MonthlySnapshot

const build = (overrides: Partial<Parameters<typeof buildSystemPrompt>[0]> = {}) =>
  buildSystemPrompt({
    intent: 'spending_summary',
    toneGuidance: 'calm',
    snapshots: [snapshot('2026-10', 3250, 1455.48)],
    currentMonth: '2026-10',
    transactions: [],
    anomalyRows: null,
    goalRows: null,
    habitRows: null,
    budgetRows: null,
    facts,
    currencyCode: 'EUR',
    ...overrides,
  })

describe('chat system prompt — figures', () => {
  it('gives the Home statement figures as labelled facts, verbatim', () => {
    const prompt = build()
    expect(prompt).toContain('net_this_month: €1,794.52')
    expect(prompt).toContain('projected_close: €732.39')
    expect(prompt).toContain('income_this_month: €3,250.00')
    expect(prompt).toContain('recurring: Netflix: €13.99 a month')
  })

  it('never labels anything a balance', () => {
    const prompt = build({
      snapshots: [snapshot('2026-09', 3000, 2000), snapshot('2026-10', 3250, 1455.48)],
    })
    expect(prompt).not.toMatch(/\bbalance:/i)
    expect(prompt).toContain('2026-09: income €3,000.00, spending €2,000.00, net €1,000.00')
  })

  it('forbids bank-balance claims and rounding', () => {
    const prompt = build()
    expect(prompt).toContain('Truffle does not know the user')
    expect(prompt).toMatch(/Never round/)
    expect(prompt).not.toMatch(/round them conversationally/)
  })

  it('names the all-time figure as logged net when present', () => {
    const prompt = build({
      facts: { ...facts, net_of_everything_logged: '€3,482.16' },
    })
    expect(prompt).toContain('net_of_everything_logged: €3,482.16')
    expect(prompt).toContain("net of everything you've logged in Truffle")
  })

  it('budgets use the caller’s status', () => {
    const prompt = build({
      budgetRows: [{ category: 'food_groceries', amount: 500, spentAmount: 320, status: 'onTrack' }],
    })
    expect(prompt).toContain('food groceries: €320.00 / €500.00 (64% used)')
  })
})
