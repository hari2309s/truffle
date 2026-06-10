import { describe, it, expect } from 'vitest'
import { translations, LOCALE_LABELS, type Locale } from '../i18n'

const en = translations.en
const de = translations.de
const ja = translations.ja

// ─── Structural completeness ────────────────────────────────────────────────

describe('translations completeness', () => {
  const locales: Locale[] = ['en', 'de', 'ja']
  const topLevelKeys = Object.keys(en) as (keyof typeof en)[]

  it.each(locales)('%s has all top-level keys', (locale) => {
    for (const key of topLevelKeys) {
      expect(translations[locale], `missing key: ${key}`).toHaveProperty(key)
    }
  })

  it('LOCALE_LABELS has an entry for every locale', () => {
    for (const locale of locales) {
      expect(LOCALE_LABELS[locale]).toBeDefined()
      expect(LOCALE_LABELS[locale].flag).toBeTruthy()
      expect(LOCALE_LABELS[locale].label).toBeTruthy()
    }
  })

  it('ja LOCALE_LABELS uses Japanese flag and label', () => {
    expect(LOCALE_LABELS.ja.flag).toBe('🇯🇵')
    expect(LOCALE_LABELS.ja.label).toBe('日本語')
  })
})

// ─── auth.magicLinkSent ──────────────────────────────────────────────────────

describe('auth.magicLinkSent', () => {
  it('en: interpolates email', () => {
    expect(en.auth.magicLinkSent('hello@example.com')).toContain('hello@example.com')
  })

  it('de: interpolates email', () => {
    expect(de.auth.magicLinkSent('hello@example.com')).toContain('hello@example.com')
  })

  it('ja: interpolates email', () => {
    expect(ja.auth.magicLinkSent('hello@example.com')).toContain('hello@example.com')
  })
})

// ─── transactions.filteredCount ──────────────────────────────────────────────

describe('transactions.filteredCount', () => {
  it('en: formats filtered/total', () => {
    expect(en.transactions.filteredCount(3, 10)).toBe('3 of 10 transactions')
  })

  it('de: formats filtered/total', () => {
    expect(de.transactions.filteredCount(3, 10)).toBe('3 von 10 Transaktionen')
  })

  it('ja: contains both numbers', () => {
    const result = ja.transactions.filteredCount(3, 10)
    expect(result).toContain('3')
    expect(result).toContain('10')
  })
})

// ─── transactions.count ──────────────────────────────────────────────────────

describe('transactions.count', () => {
  it('en: formats count', () => {
    expect(en.transactions.count(5)).toBe('5 transactions')
  })

  it('de: formats count', () => {
    expect(de.transactions.count(5)).toBe('5 Transaktionen')
  })

  it('ja: contains count', () => {
    expect(ja.transactions.count(5)).toContain('5')
  })
})

// ─── transactions.loadMonth ──────────────────────────────────────────────────

describe('transactions.loadMonth', () => {
  it('en: formats label', () => {
    expect(en.transactions.loadMonth('May 2026')).toBe('Load May 2026')
  })

  it('de: formats label', () => {
    expect(de.transactions.loadMonth('Mai 2026')).toBe('Mai 2026 laden')
  })

  it('ja: contains label', () => {
    expect(ja.transactions.loadMonth('2026年5月')).toContain('2026年5月')
  })
})

// ─── csvImport.transactionsFound ─────────────────────────────────────────────

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

  it('ja: contains count', () => {
    expect(ja.csvImport.transactionsFound(3)).toContain('3')
  })
})

// ─── csvImport.selectedOf ────────────────────────────────────────────────────

describe('csvImport.selectedOf', () => {
  it('en: formats selected/total', () => {
    expect(en.csvImport.selectedOf(2, 5)).toBe('2 of 5 selected')
  })

  it('de: formats selected/total', () => {
    expect(de.csvImport.selectedOf(2, 5)).toBe('2 von 5 ausgewählt')
  })

  it('ja: contains both numbers', () => {
    const result = ja.csvImport.selectedOf(2, 5)
    expect(result).toContain('2')
    expect(result).toContain('5')
  })
})

// ─── csvImport.import ────────────────────────────────────────────────────────

describe('csvImport.import', () => {
  it('en: formats count', () => {
    expect(en.csvImport.import(3)).toBe('Import 3')
  })

  it('de: formats count', () => {
    expect(de.csvImport.import(3)).toBe('3 importieren')
  })

  it('ja: contains count', () => {
    expect(ja.csvImport.import(3)).toContain('3')
  })
})

// ─── csvImport.imported ──────────────────────────────────────────────────────

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

  it('ja: contains count', () => {
    expect(ja.csvImport.imported(3)).toContain('3')
  })
})

// ─── receiptUpload.fileTooLarge ───────────────────────────────────────────────

describe('receiptUpload.fileTooLarge', () => {
  it('en: interpolates maxMb', () => {
    expect(en.receiptUpload.fileTooLarge(10)).toContain('10 MB')
  })

  it('de: interpolates maxMb', () => {
    expect(de.receiptUpload.fileTooLarge(10)).toContain('10 MB')
  })

  it('ja: interpolates maxMb', () => {
    expect(ja.receiptUpload.fileTooLarge(10)).toContain('10')
  })
})

// ─── savingsGoals.daysLeft ───────────────────────────────────────────────────

describe('savingsGoals.daysLeft', () => {
  it.each([
    ['en', en],
    ['de', de],
    ['ja', ja],
  ] as const)('%s: contains day count', (_locale, t) => {
    expect(t.savingsGoals.daysLeft(7)).toContain('7')
  })
})

// ─── proposals.goal.addedToGoals ─────────────────────────────────────────────

describe('proposals.goal.addedToGoals', () => {
  it.each([
    ['en', en],
    ['de', de],
    ['ja', ja],
  ] as const)('%s: interpolates emoji and name', (_locale, t) => {
    const result = t.proposals.goal.addedToGoals('🏠', 'House')
    expect(result).toContain('🏠')
    expect(result).toContain('House')
  })
})

// ─── offlineBanner.pendingChanges ────────────────────────────────────────────

describe('offlineBanner.pendingChanges', () => {
  it.each([
    ['en', en],
    ['de', de],
    ['ja', ja],
  ] as const)('%s: contains count', (_locale, t) => {
    expect(t.offlineBanner.pendingChanges(4)).toContain('4')
  })
})

// ─── weeklySummary interpolations ────────────────────────────────────────────

describe('weeklySummary', () => {
  it.each([
    ['en', en],
    ['de', de],
    ['ja', ja],
  ] as const)('%s: spent interpolates amount', (_locale, t) => {
    expect(t.weeklySummary.spent('¥5,000')).toContain('¥5,000')
  })

  it.each([
    ['en', en],
    ['de', de],
    ['ja', ja],
  ] as const)('%s: earned interpolates amount', (_locale, t) => {
    expect(t.weeklySummary.earned('¥10,000')).toContain('¥10,000')
  })
})

// ─── savingsHabits.totalSaved ────────────────────────────────────────────────

describe('savingsHabits.totalSaved', () => {
  it.each([
    ['en', en],
    ['de', de],
    ['ja', ja],
  ] as const)('%s: interpolates amount', (_locale, t) => {
    expect(t.savingsHabits.totalSaved('¥50,000')).toContain('¥50,000')
  })
})
