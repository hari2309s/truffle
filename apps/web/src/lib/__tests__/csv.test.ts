import { describe, it, expect } from 'vitest'
import { assignColumn, detectColumns, duplicateKey, parseAmount, rowsFrom, splitCSV, splitLine } from '../csv'

const SAMPLE = `Started Date,Description,Amount,Currency,Fee
2026-10-20,Leap Card,-20.00,EUR,0
2026-10-16,PAYPAL *VENTRA,-129.00,EUR,0
2026-10-18,Uniqlo,-38.00,GBP,0`

describe('csv', () => {
  it('detects bank-style headers', () => {
    const { headers } = splitCSV(SAMPLE)
    expect(detectColumns(headers)).toEqual({
      date: 0,
      description: 1,
      amount: 2,
      category: -1,
      merchant: -1,
    })
  })

  it('builds rows newest first', () => {
    const { headers, records } = splitCSV(SAMPLE)
    const rows = rowsFrom(records, detectColumns(headers))
    expect(rows.map((r) => r.date)).toEqual(['2026-10-20', '2026-10-18', '2026-10-16'])
    expect(rows[0]).toMatchObject({ description: 'Leap Card', amount: -20 })
  })

  it('returns no rows until the required fields are mapped', () => {
    const { records } = splitCSV(SAMPLE)
    expect(rowsFrom(records, { date: 0, description: -1, amount: 2, category: -1, merchant: -1 })).toEqual([])
  })

  it('reassigning a column unmaps its previous field', () => {
    const cols = { date: 0, description: 1, amount: 2, category: -1, merchant: -1 }
    expect(assignColumn(cols, 1, 'merchant')).toMatchObject({ description: -1, merchant: 1 })
    expect(assignColumn(cols, 2, 'skip').amount).toBe(-1)
  })

  it('duplicate key ignores case and float noise', () => {
    expect(duplicateKey({ date: '2026-10-20', amount: -20, description: 'Leap Card ' })).toBe(
      duplicateKey({ date: '2026-10-20', amount: -20.0, description: 'leap card' })
    )
  })
})

describe('csv parsing details', () => {
  it('keeps quoted commas inside one field', () => {
    expect(splitLine('2026-10-01,"Amazon, Inc.",-12.50')).toEqual(['2026-10-01', 'Amazon, Inc.', '-12.50'])
    expect(splitLine('"say ""hi""",1')).toEqual(['say "hi"', '1'])
  })

  it('reads both decimal conventions', () => {
    expect(parseAmount('1,234.56')).toBe(1234.56)
    expect(parseAmount('1.234,56')).toBe(1234.56)
    expect(parseAmount('12,50')).toBe(12.5)
    expect(parseAmount('-€20.00')).toBe(-20)
    expect(parseAmount('€100.00')).toBe(100) // a chat tool's amount, as GPT-OSS sometimes sends it
    expect(parseAmount('(45.00)')).toBe(-45)
    expect(parseAmount('1,234')).toBe(1234)
    expect(parseAmount('')).toBeNaN()
  })
})
