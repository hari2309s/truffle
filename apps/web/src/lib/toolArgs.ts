import { TRANSACTION_CATEGORIES, type TransactionCategory } from '@truffle/types'
import { parseAmount } from './csv'
import { lastEmoji } from './emoji'

/**
 * Cleaners for what a model puts in a tool call or a JSON reply. Models
 * send "€100.00" for a number, null for an optional field, "Groceries" for
 * a category or "today" for a date — each of these used to fail validation
 * (no card at all) or reach a card that could never save.
 */

/** A number, or a string like "€1,234.56" / "-4,50"; NaN when unreadable. */
export function toAmount(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseAmount(value)
  return NaN
}

/** Trimmed text capped at `max`, or `fallback` when missing or blank. */
export function toText(value: unknown, max: number, fallback = ''): string {
  const text = typeof value === 'string' ? value.trim() : ''
  return (text || fallback).slice(0, max)
}

/** One emoji from whatever was sent, else `fallback`. */
export function toEmoji(value: unknown, fallback: string): string {
  return (typeof value === 'string' && lastEmoji(value)) || fallback
}

const CATEGORY_SET = new Set<string>(TRANSACTION_CATEGORIES)
const CATEGORY_ALIASES: Record<string, TransactionCategory> = {
  groceries: 'food_groceries',
  grocery: 'food_groceries',
  supermarket: 'food_groceries',
  delivery: 'food_delivery',
  takeaway: 'food_delivery',
  takeout: 'food_delivery',
  restaurant: 'food_delivery',
  dining: 'food_delivery',
  rent: 'housing',
  bills: 'utilities',
  utility: 'utilities',
  subscription: 'subscriptions',
  salary: 'income',
  saving: 'savings',
}

/** A known category; near-misses ("Groceries", "food delivery") map, the rest are 'other'. */
export function toCategory(value: unknown): TransactionCategory {
  const key = (typeof value === 'string' ? value : '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (CATEGORY_SET.has(key)) return key as TransactionCategory
  return CATEGORY_ALIASES[key] ?? 'other'
}

const MONEY_BACK = /\b(refund(ed)?|return(ed)?|reimburs\w*|cash ?back|money back|paid me back)\b/i

/**
 * Income is money in. A spending category is money out unless the entry says
 * it's money back (a refund from Zara stays +€30); 'other' keeps the model's
 * sign. Models often send "I spent 12" as +12.
 */
export function signedForCategory(amount: number, category: TransactionCategory, description: string): number {
  if (category === 'income') return Math.abs(amount)
  if (category === 'other' || (amount > 0 && MONEY_BACK.test(description))) return amount
  return -Math.abs(amount)
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/

/** "YYYY-MM-DD" when `value` starts with a real calendar date, else null. */
export function toIsoDay(value: unknown): string | null {
  const m = typeof value === 'string' ? value.trim().match(ISO_DAY) : null
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(y, mo - 1, d)
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
    ? `${m[1]}-${m[2]}-${m[3]}`
    : null
}

/** A past-or-today transaction date; "yesterday", junk and future dates fall back sensibly. */
export function toTransactionDate(value: unknown, today: string): string {
  if (typeof value === 'string' && /^\s*yesterday\s*$/i.test(value)) {
    const [y, m, d] = today.split('-').map(Number)
    const prev = new Date(y!, m! - 1, d! - 1)
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
  }
  const day = toIsoDay(value)
  return day && day <= today ? day : today
}

/** A goal deadline strictly after today, else undefined (no deadline). */
export function toDeadline(value: unknown, today: string): string | undefined {
  const day = toIsoDay(value)
  return day && day > today ? day : undefined
}

/** "weekly" / "Week" / "every month" → the habit frequency, else null. */
export function toFrequency(value: unknown): 'weekly' | 'monthly' | null {
  const text = typeof value === 'string' ? value.toLowerCase() : ''
  if (/week/.test(text)) return 'weekly'
  if (/month/.test(text)) return 'monthly'
  return null
}

/**
 * A date string as a local day — `new Date("2026-10-22")` is UTC and shows the
 * day before west of Greenwich. Anything that isn't YYYY-MM-DD goes to Date.
 */
export function parseLocalDay(value: string): Date {
  const day = toIsoDay(value)
  if (!day) return new Date(value)
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}
