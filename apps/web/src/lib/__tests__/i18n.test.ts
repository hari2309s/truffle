import { describe, it, expect } from 'vitest'
import { translations } from '../i18n'

const en = translations.en
const de = translations.de

describe('auth.magicLinkSent', () => {
  it('en: interpolates email', () => {
    const result = en.auth.magicLinkSent('hello@example.com')
    expect(result).toContain('hello@example.com')
  })

  it('de: interpolates email', () => {
    const result = de.auth.magicLinkSent('hello@example.com')
    expect(result).toContain('hello@example.com')
  })
})

describe('transactions.filteredCount', () => {
  it('en: formats filtered/total', () => {
    expect(en.transactions.filteredCount(3, 10)).toBe('3 of 10 transactions')
  })

  it('de: formats filtered/total', () => {
    expect(de.transactions.filteredCount(3, 10)).toBe('3 von 10 Transaktionen')
  })
})

describe('transactions.count', () => {
  it('en: formats count', () => {
    expect(en.transactions.count(5)).toBe('5 transactions')
  })

  it('de: formats count', () => {
    expect(de.transactions.count(5)).toBe('5 Transaktionen')
  })
})

describe('transactions.loadMonth', () => {
  it('en: formats label', () => {
    expect(en.transactions.loadMonth('May 2026')).toBe('Load May 2026')
  })

  it('de: formats label', () => {
    expect(de.transactions.loadMonth('Mai 2026')).toBe('Mai 2026 laden')
  })
})

describe('csvImport.transactionsFound', () => {
  it('en: singular', () => {
    const result = en.csvImport.transactionsFound(1)
    expect(result).toContain('1 transaction')
    expect(result).not.toContain('transactions ')
  })

  it('en: plural', () => {
    expect(en.csvImport.transactionsFound(3)).toContain('3 transactions')
  })

  it('de: singular (no -en suffix)', () => {
    expect(de.csvImport.transactionsFound(1)).toContain('1 Transaktion')
    expect(de.csvImport.transactionsFound(1)).not.toContain('Transaktionen')
  })

  it('de: plural (with -en suffix)', () => {
    expect(de.csvImport.transactionsFound(4)).toContain('Transaktionen')
  })
})

describe('csvImport.selectedOf', () => {
  it('en: formats selected/total', () => {
    expect(en.csvImport.selectedOf(2, 5)).toBe('2 of 5 selected')
  })

  it('de: formats selected/total', () => {
    expect(de.csvImport.selectedOf(2, 5)).toBe('2 von 5 ausgewählt')
  })
})

describe('csvImport.import', () => {
  it('en: formats count', () => {
    expect(en.csvImport.import(3)).toBe('Import 3')
  })

  it('de: formats count', () => {
    expect(de.csvImport.import(3)).toBe('3 importieren')
  })
})

describe('csvImport.imported', () => {
  it('en: singular', () => {
    expect(en.csvImport.imported(1)).toContain('1 transaction')
    expect(en.csvImport.imported(1)).not.toContain('transactions ')
  })

  it('en: plural', () => {
    expect(en.csvImport.imported(5)).toContain('5 transactions')
  })

  it('de: singular', () => {
    expect(de.csvImport.imported(1)).not.toContain('Transaktionen')
  })

  it('de: plural', () => {
    expect(de.csvImport.imported(2)).toContain('Transaktionen')
  })
})

describe('receiptUpload.fileTooLarge', () => {
  it('en: interpolates maxMb', () => {
    expect(en.receiptUpload.fileTooLarge(10)).toContain('10 MB')
  })

  it('de: interpolates maxMb', () => {
    expect(de.receiptUpload.fileTooLarge(10)).toContain('10 MB')
  })
})
