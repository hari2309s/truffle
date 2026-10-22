import { describe, it, expect } from 'vitest'
import { pressKey } from '../keypad'

describe('pressKey', () => {
  it('builds an amount digit by digit', () => {
    expect(['1', '2', '.', '5', '0'].reduce((a, k) => pressKey(a, k as never), '')).toBe('12.50')
  })
  it('allows one decimal point and two decimals', () => {
    expect(pressKey('1.2', '.')).toBe('1.2')
    expect(pressKey('1.25', '9')).toBe('1.25')
    expect(pressKey('', '.')).toBe('0.')
  })
  it('replaces a lone zero and backspaces', () => {
    expect(pressKey('0', '7')).toBe('7')
    expect(pressKey('12', '⌫')).toBe('1')
    expect(pressKey('', '⌫')).toBe('')
  })
  it('caps the length', () => {
    expect(pressKey('123456789', '1')).toBe('123456789')
  })
})
