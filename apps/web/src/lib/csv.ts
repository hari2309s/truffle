import type { TransactionCategory } from '@truffle/types'

export interface ParsedRow {
  date: string
  description: string
  amount: number
  category: TransactionCategory
  merchant?: string
}

export type CsvField = 'date' | 'description' | 'amount' | 'category' | 'merchant'
export const CSV_FIELDS: CsvField[] = ['date', 'description', 'amount', 'category', 'merchant']
export const REQUIRED_FIELDS: CsvField[] = ['date', 'description', 'amount']

/** Column index per Truffle field (-1 = not mapped). */
export type CsvColumns = Record<CsvField, number>

const CATEGORY_MAP: Record<string, TransactionCategory> = {
  groceries: 'food_groceries',
  supermarket: 'food_groceries',
  food: 'food_delivery',
  delivery: 'food_delivery',
  restaurant: 'food_delivery',
  transport: 'transport',
  uber: 'transport',
  train: 'transport',
  bus: 'transport',
  housing: 'housing',
  rent: 'housing',
  utilities: 'utilities',
  electricity: 'utilities',
  gas: 'utilities',
  internet: 'utilities',
  subscriptions: 'subscriptions',
  netflix: 'subscriptions',
  spotify: 'subscriptions',
  health: 'health',
  pharmacy: 'health',
  doctor: 'health',
  entertainment: 'entertainment',
  cinema: 'entertainment',
  shopping: 'shopping',
  amazon: 'shopping',
  income: 'income',
  salary: 'income',
  savings: 'savings',
}

const CATEGORY_ENTRIES = Object.entries(CATEGORY_MAP)

export function guessCategory(description: string, category?: string): TransactionCategory {
  const raw = (category ?? description).toLowerCase()
  for (const [keyword, cat] of CATEGORY_ENTRIES) {
    if (raw.includes(keyword)) return cat
  }
  return 'other'
}

/** Splits one CSV line, honouring double quotes ("Amazon, Inc." stays one field). */
export function splitLine(line: string): string[] {
  const out: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cell.trim())
      cell = ''
    } else cell += ch
  }
  out.push(cell.trim())
  return out
}

/**
 * Reads an amount in either convention: "1,234.56", "1.234,56", "12,50",
 * "-€20.00". The last separator followed by 1–2 digits is the decimal mark.
 */
export function parseAmount(raw: string | undefined): number {
  if (!raw) return NaN
  const negative = /^\s*[-−(]/.test(raw) || /\)\s*$/.test(raw)
  const cleaned = raw.replace(/[^0-9.,]/g, '')
  const decimal = cleaned.match(/[.,](\d{1,2})$/)
  const whole = decimal ? cleaned.slice(0, -decimal[0].length) : cleaned
  const digits = whole.replace(/[.,]/g, '') + (decimal ? `.${decimal[1]}` : '')
  const value = parseFloat(digits)
  return isNaN(value) ? NaN : negative ? -value : value
}

/** Header row + data rows. */
export function splitCSV(text: string): { headers: string[]; records: string[][] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2 || !lines[0]) return { headers: [], records: [] }
  const headers = splitLine(lines[0])
  const records = lines
    .slice(1)
    .filter((line) => line.trim())
    .map(splitLine)
  return { headers, records }
}

/** Guesses which column feeds each field from common header names. */
export function detectColumns(headers: string[]): CsvColumns {
  const lower = headers.map((h) => h.toLowerCase())
  const find = (names: string[]) => lower.findIndex((h) => names.includes(h))
  return {
    date: find(['date', 'started date', 'completed date', 'booking date', 'transaction date']),
    description: find(['description', 'desc', 'name', 'narrative', 'details']),
    amount: find(['amount', 'value', 'sum']),
    category: find(['category']),
    merchant: find(['merchant', 'payee', 'vendor']),
  }
}

export function hasRequired(columns: CsvColumns): boolean {
  return REQUIRED_FIELDS.every((f) => columns[f] !== -1)
}

const YMD = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/
const DMY_OR_MDY = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})\b/

/**
 * Whether a file's numeric dates are day-first or month-first. One date with
 * a first part over 12 means day-first; a second part over 12, month-first;
 * otherwise day-first (most of Truffle's banks are European).
 */
export function dateOrder(raws: string[]): 'dmy' | 'mdy' {
  for (const raw of raws) {
    const m = raw.trim().match(DMY_OR_MDY)
    if (m && Number(m[1]) > 12) return 'dmy'
    if (m && Number(m[2]) > 12) return 'mdy'
  }
  return 'dmy'
}

/** A bank date ("2026-10-20", "20/10/2026", "10/20/26", "20 Oct 2026") as YYYY-MM-DD, or null. */
export function toIsoDate(raw: string, order: 'dmy' | 'mdy'): string | null {
  const text = raw.trim()
  let y: number, mo: number, d: number
  const ymd = text.match(YMD)
  const numeric = ymd ? null : text.match(DMY_OR_MDY)
  if (ymd) [y, mo, d] = [Number(ymd[1]), Number(ymd[2]), Number(ymd[3])]
  else if (numeric) {
    const [a, b, yy] = [Number(numeric[1]), Number(numeric[2]), numeric[3]!]
    ;[d, mo] = order === 'dmy' ? [a, b] : [b, a]
    y = yy.length === 2 ? 2000 + Number(yy) : Number(yy)
  } else {
    // Month names ("20 Oct 2026", "Oct 20, 2026") — only when a year is present.
    if (!/\d{4}/.test(text) || !/[a-z]/i.test(text)) return null
    const parsed = new Date(text)
    if (isNaN(parsed.getTime())) return null
    ;[y, mo, d] = [parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()]
  }
  const date = new Date(y, mo - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Builds rows from records with the given mapping; skips unreadable amounts and dates. */
export function rowsFrom(records: string[][], columns: CsvColumns): ParsedRow[] {
  if (!hasRequired(columns)) return []
  const order = dateOrder(records.map((cols) => cols[columns.date] ?? ''))
  const rows: ParsedRow[] = []
  for (const cols of records) {
    const amount = parseAmount(cols[columns.amount])
    if (isNaN(amount)) continue
    const date = toIsoDate(cols[columns.date] ?? '', order)
    if (!date) continue
    const description = cols[columns.description] ?? ''
    const rawCategory = columns.category !== -1 ? cols[columns.category] : undefined
    const merchant = columns.merchant !== -1 ? cols[columns.merchant] : undefined
    rows.push({
      date,
      description,
      amount,
      category: guessCategory(description, rawCategory),
      merchant: merchant || undefined,
    })
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Same day, same amount, same description → treated as already on record. */
export function duplicateKey(row: { date: string; amount: number; description: string }): string {
  return `${row.date}|${Number(row.amount).toFixed(2)}|${row.description.trim().toLowerCase()}`
}

/** Points `field` at `column`, unmapping whatever field had that column before. */
export function assignColumn(columns: CsvColumns, column: number, field: CsvField | 'skip'): CsvColumns {
  const next = { ...columns }
  for (const f of CSV_FIELDS) if (next[f] === column) next[f] = -1
  if (field !== 'skip') next[field] = column
  return next
}
