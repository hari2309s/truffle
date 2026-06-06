import { describe, it, expect } from 'vitest'
import { CURRENCY_SYMBOLS, CURRENCY_DECIMALS } from '../currency'

describe('CURRENCY_SYMBOLS', () => {
  it('has correct symbols', () => {
    expect(CURRENCY_SYMBOLS['EUR']).toBe('€')
    expect(CURRENCY_SYMBOLS['GBP']).toBe('£')
    expect(CURRENCY_SYMBOLS['USD']).toBe('$')
    expect(CURRENCY_SYMBOLS['JPY']).toBe('¥')
  })
})

describe('CURRENCY_DECIMALS', () => {
  it('EUR/GBP/USD use 2 decimal places', () => {
    expect(CURRENCY_DECIMALS['EUR']).toBe(2)
    expect(CURRENCY_DECIMALS['GBP']).toBe(2)
    expect(CURRENCY_DECIMALS['USD']).toBe(2)
  })

  it('JPY uses 0 decimal places', () => {
    expect(CURRENCY_DECIMALS['JPY']).toBe(0)
  })
})
