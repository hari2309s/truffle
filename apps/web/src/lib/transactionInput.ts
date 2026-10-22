import { TRANSACTION_CATEGORIES, type TransactionCategory } from '@truffle/types'
import { toIsoDay } from './toolArgs'

/** Rows per POST — each one gets an embedding call, so imports send in chunks. */
export const MAX_BATCH = 500
const MAX_AMOUNT = 1_000_000_000
const CURRENCIES = ['EUR', 'GBP', 'USD'] as const
const CATEGORIES = new Set<string>(TRANSACTION_CATEGORIES)

export interface NewTransaction {
  description: string
  amount: number
  currency: (typeof CURRENCIES)[number]
  category: TransactionCategory
  merchant: string | null
  date: string
  isRecurring: boolean
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Field checks shared by create and edit. `undefined` means the field wasn't sent. */
function checkField(field: string, v: unknown): string | null {
  switch (field) {
    case 'amount':
      return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= MAX_AMOUNT
        ? null
        : 'amount must be a finite number'
    case 'date':
      return toIsoDay(v) === v ? null : 'date must be a real date as YYYY-MM-DD'
    case 'category':
      return typeof v === 'string' && CATEGORIES.has(v) ? null : 'category is not a known category'
    case 'currency':
      return CURRENCIES.includes(v as never) ? null : 'currency must be EUR, GBP or USD'
    case 'description':
      return typeof v === 'string' ? null : 'description must be text'
    case 'merchant':
      return v == null || typeof v === 'string' ? null : 'merchant must be text'
    default:
      return null
  }
}

/** One row for POST /api/transactions. Text is trimmed and capped; a blank description takes the merchant's name. */
export function parseNewTransaction(raw: unknown): Result<NewTransaction> {
  if (!raw || typeof raw !== 'object') return fail('each transaction must be an object')
  const r = raw as Record<string, unknown>
  for (const field of ['amount', 'date', 'category', 'currency', 'description', 'merchant']) {
    const error = checkField(field, r[field])
    if (error) return fail(error)
  }
  const merchant = text(r.merchant, 200) || null
  return {
    ok: true,
    value: {
      description: text(r.description, 500) || merchant || 'Transaction',
      amount: r.amount as number,
      currency: r.currency as NewTransaction['currency'],
      category: r.category as TransactionCategory,
      merchant,
      date: r.date as string,
      isRecurring: r.isRecurring === true,
    },
  }
}

/** A POST body: 1–MAX_BATCH valid rows, or the first problem with its row number. */
export function parseNewTransactions(body: unknown): Result<NewTransaction[]> {
  const rows = (body as { transactions?: unknown } | null)?.transactions
  if (!Array.isArray(rows) || rows.length === 0) return fail('transactions required')
  if (rows.length > MAX_BATCH) return fail(`at most ${MAX_BATCH} transactions per request`)
  const out: NewTransaction[] = []
  for (let i = 0; i < rows.length; i++) {
    const row = parseNewTransaction(rows[i])
    if (!row.ok) return fail(`transaction ${i + 1}: ${row.error}`)
    out.push(row.value)
  }
  return { ok: true, value: out }
}

/**
 * The columns a PATCH may change — only the fields that were sent, so a
 * partial edit can't blank the rest. `merchant: null` or "" clears it.
 */
export function parseTransactionEdit(body: Record<string, unknown>): Result<Record<string, unknown>> {
  const update: Record<string, unknown> = {}
  for (const field of ['description', 'amount', 'category', 'merchant', 'date'] as const) {
    if (!(field in body) || body[field] === undefined) continue
    const error = checkField(field, body[field])
    if (error) return fail(error)
    update[field] =
      field === 'merchant'
        ? text(body.merchant, 200) || null
        : field === 'description'
          ? text(body.description, 500)
          : body[field]
  }
  if (update.description === '') return fail('description must not be empty')
  return { ok: true, value: update }
}
