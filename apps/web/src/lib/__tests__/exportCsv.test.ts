import { describe, it, expect } from 'vitest'
import { textCell } from '../exportCsv'

describe('textCell', () => {
  it('neutralises spreadsheet formulas', () => {
    expect(textCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(textCell('+1')).toBe(`"'+1"`)
    expect(textCell('@SUM')).toBe(`"'@SUM"`)
  })
  it('leaves ordinary text alone', () => {
    expect(textCell('Lidl')).toBe('"Lidl"')
  })
})
