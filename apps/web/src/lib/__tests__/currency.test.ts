import { describe, it, expect } from 'vitest'
import { TO_EUR, toEur, formatCurrency } from '../currency'

describe('TO_EUR', () => {
  it('EUR rate is 1', () => {
    expect(TO_EUR['EUR']).toBe(1)
  })

  it('GBP rate is 1.17', () => {
    expect(TO_EUR['GBP']).toBe(1.17)
  })

  it('USD rate is 0.92', () => {
    expect(TO_EUR['USD']).toBe(0.92)
  })
})

describe('toEur', () => {
  it('returns amount unchanged for EUR', () => {
    expect(toEur(100, 'EUR')).toBe(100)
  })

  it('converts GBP to EUR', () => {
    expect(toEur(100, 'GBP')).toBeCloseTo(117)
  })

  it('converts USD to EUR', () => {
    expect(toEur(100, 'USD')).toBeCloseTo(92)
  })

  it('falls back to rate 1 for unknown currency', () => {
    expect(toEur(50, 'JPY')).toBe(50)
  })

  it('handles negative amounts', () => {
    expect(toEur(-200, 'GBP')).toBeCloseTo(-234)
  })

  it('handles zero', () => {
    expect(toEur(0, 'USD')).toBe(0)
  })
})

describe('formatCurrency', () => {
  it('formats EUR with € symbol', () => {
    expect(formatCurrency(9.5, 'EUR')).toBe('€9.50')
  })

  it('formats GBP with £ symbol', () => {
    expect(formatCurrency(1234.5, 'GBP')).toBe('£1234.50')
  })

  it('formats USD with $ symbol', () => {
    expect(formatCurrency(0.99, 'USD')).toBe('$0.99')
  })

  it('uses currency code as symbol for unknown currency', () => {
    expect(formatCurrency(100, 'CHF')).toBe('CHF100.00')
  })

  it('uses absolute value for negative amounts', () => {
    expect(formatCurrency(-42.5, 'EUR')).toBe('€42.50')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(1.005, 'EUR')).toBe('€1.00')
  })
})
