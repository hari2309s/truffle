#!/usr/bin/env node
/**
 * Seeds (or resets) the Truffle demo account.
 *
 *   pnpm seed:demo
 *
 * Env (from .env.local locally, or injected directly in CI):
 *   NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY     - service role key (bypasses RLS)
 *   DEMO_USER_EMAIL              - email of the demo account to own the data
 *
 * Idempotent: creates the demo auth user if it is missing, wipes every row it
 * owns, then reloads transactions from transactions.csv plus a few savings
 * goals / budgets / habits so every screen in the app has something to show.
 * The nightly `Reset demo account` GitHub Action runs this same script so the
 * public demo always looks the same for the next visitor.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')

// Local convenience: pull vars from .env.local when they are not already set.
// CI injects the real values through the environment and skips this.
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch {
    /* no .env.local — rely on the ambient environment */
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DEMO_EMAIL) {
  console.error(
    'Missing env — NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_USER_EMAIL are all required.'
  )
  process.exit(1)
}

const DEMO_NAME = 'Hari'
const DEMO_CURRENCY = 'EUR'

const VALID_CATEGORIES = new Set([
  'food_groceries',
  'food_delivery',
  'transport',
  'housing',
  'utilities',
  'subscriptions',
  'health',
  'entertainment',
  'shopping',
  'income',
  'savings',
  'other',
])

// Merchants that bill on a fixed schedule — flagged so the "recurring" views
// and the forgotten-subscription checks have something to work with.
const RECURRING_MERCHANTS = new Set([
  'Hausverwaltung Krause',
  'BVG',
  'Spotify',
  'Netflix',
  'Urban Sports Club',
  'Vattenfall',
  'Vodafone',
  'Telekom',
  'Scalable Capital',
])

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findDemoUser() {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find(
      (u) => u.email && u.email.toLowerCase() === DEMO_EMAIL.toLowerCase()
    )
    if (match) return match
    if (data.users.length < 200) return null
  }
}

async function ensureDemoUser() {
  const metadata = { name: DEMO_NAME, currency: DEMO_CURRENCY, language: 'en' }
  const existing = await findDemoUser()
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { user_metadata: metadata })
    return existing.id
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    email_confirm: true,
    user_metadata: metadata,
  })
  if (error) throw error
  return data.user.id
}

async function wipe(userId) {
  // Child rows first so nothing is orphaned mid-run.
  const tables = [
    'habit_contributions',
    'savings_habits',
    'monthly_budgets',
    'savings_goals',
    'anomalies',
    'monthly_snapshots',
    'chat_messages',
    'transactions',
  ]
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq('user_id', userId)
    if (error) throw new Error(`wipe ${table}: ${error.message}`)
  }
}

function parseTransactions() {
  const csv = readFileSync(join(ROOT, 'transactions.csv'), 'utf8').trim()
  const [header, ...lines] = csv.split('\n')
  const cols = header.split(',').map((c) => c.trim())
  const di = cols.indexOf('date')
  const desci = cols.indexOf('description')
  const amti = cols.indexOf('amount')
  const cati = cols.indexOf('category')
  const meri = cols.indexOf('merchant')

  return lines
    .map((line) => {
      const f = line.split(',')
      const rawCat = (f[cati] ?? '').trim()
      const merchant = (f[meri] ?? '').trim() || null
      return {
        amount: Number(f[amti]),
        currency: DEMO_CURRENCY,
        description: (f[desci] ?? '').trim(),
        category: VALID_CATEGORIES.has(rawCat) ? rawCat : 'other',
        merchant,
        date: (f[di] ?? '').trim(),
        is_recurring: merchant ? RECURRING_MERCHANTS.has(merchant) : false,
      }
    })
    .filter((t) => t.date && Number.isFinite(t.amount) && t.description)
}

const DAY_MS = 86_400_000
const toUtcTs = (isoDate) => Date.parse(`${isoDate}T00:00:00Z`)
const toIsoDate = (ts) => new Date(ts).toISOString().slice(0, 10)

/**
 * Slide the whole transaction window forward so the most recent row lands on
 * today. transactions.csv is a fixed fixture; without this the demo's "current
 * month" goes empty once the wall clock passes the last row's date and the
 * nightly reset just keeps restoring that stale state.
 */
function shiftToToday(rows) {
  if (rows.length === 0) return rows
  const newest = Math.max(...rows.map((r) => toUtcTs(r.date)))
  const offsetDays = Math.round((toUtcTs(toIsoDate(Date.now())) - newest) / DAY_MS)
  if (offsetDays === 0) return rows
  return rows.map((r) => ({ ...r, date: toIsoDate(toUtcTs(r.date) + offsetDays * DAY_MS) }))
}

const currentMonthKey = () => {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * The fixture's monthly salary lands near month-end, so after a small day-shift
 * (when the seed runs early in the month) the current month has no income row
 * and every "income this month" readout shows €0. Add one dated the 1st, reusing
 * the shape of the most recent salary, unless the month already has income.
 */
function ensureCurrentMonthIncome(rows) {
  const month = currentMonthKey()
  if (rows.some((r) => r.date.startsWith(month) && r.amount > 0)) return rows
  const salary = [...rows]
    .reverse()
    .find((r) => r.category === 'income' && r.amount >= 1000) ?? {
    amount: 3500,
    description: 'Gehalt',
    merchant: 'Tech GmbH',
  }
  return [
    ...rows,
    {
      amount: salary.amount,
      currency: DEMO_CURRENCY,
      description: salary.description,
      category: 'income',
      merchant: salary.merchant ?? null,
      date: `${month}-01`,
      is_recurring: true,
    },
  ]
}

// Mirrors apps/web/src/lib/server-db.ts recomputeSnapshot() for the current month.
function buildSnapshot(rows) {
  const month = currentMonthKey()
  const monthRows = rows.filter((t) => t.date.startsWith(month))

  const totalIncome = monthRows
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)
  const totalExpenses = monthRows
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + t.amount, 0)

  const byCategory = {}
  for (const t of monthRows) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  }

  return {
    month,
    totalIncome,
    totalExpenses,
    byCategory,
    savingsRate: totalIncome > 0 ? Math.max(0, (totalIncome + totalExpenses) / totalIncome) : 0,
    balance: monthRows.reduce((s, t) => s + t.amount, 0),
    transactionCount: monthRows.length,
  }
}

function dateInMonths(months) {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function isoWeekLabel(weeksAgo) {
  const d = new Date()
  d.setDate(d.getDate() - weeksAgo * 7)
  const year = d.getUTCFullYear()
  const jan1 = Date.UTC(year, 0, 1)
  const week = Math.ceil(((d.getTime() - jan1) / 86_400_000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

async function main() {
  console.log(`→ demo account: ${DEMO_EMAIL}`)
  const userId = await ensureDemoUser()
  console.log(`→ user id:      ${userId}`)

  await wipe(userId)
  console.log('→ cleared previous demo data')

  const txs = ensureCurrentMonthIncome(shiftToToday(parseTransactions()))
  const { error: txErr } = await admin
    .from('transactions')
    .insert(txs.map((t) => ({ ...t, user_id: userId })))
  if (txErr) throw txErr
  console.log(`→ inserted ${txs.length} transactions`)

  const snapshot = buildSnapshot(txs)
  const { error: snapErr } = await admin
    .from('monthly_snapshots')
    .upsert(
      { user_id: userId, month: snapshot.month, data: snapshot },
      { onConflict: 'user_id,month' }
    )
  if (snapErr) throw snapErr
  console.log(`→ snapshot for ${snapshot.month}`)

  const { error: goalErr } = await admin.from('savings_goals').insert([
    {
      user_id: userId,
      name: 'Japan trip',
      target_amount: 3500,
      saved_amount: 1400,
      emoji: '🏯',
      deadline: dateInMonths(5),
    },
    {
      user_id: userId,
      name: 'Emergency fund',
      target_amount: 10000,
      saved_amount: 6200,
      emoji: '🛟',
    },
  ])
  if (goalErr) throw goalErr

  const { error: budgetErr } = await admin.from('monthly_budgets').insert([
    { user_id: userId, category: 'food_groceries', amount: 400 },
    { user_id: userId, category: 'food_delivery', amount: 120 },
    { user_id: userId, category: 'entertainment', amount: 100 },
  ])
  if (budgetErr) throw budgetErr

  const { data: habit, error: habitErr } = await admin
    .from('savings_habits')
    .insert({
      user_id: userId,
      name: 'No-spend weekdays',
      amount: 25,
      frequency: 'weekly',
      emoji: '🌱',
      is_active: true,
    })
    .select('id')
    .single()
  if (habitErr) throw habitErr

  const { error: contribErr } = await admin.from('habit_contributions').insert([
    { habit_id: habit.id, user_id: userId, period: isoWeekLabel(2), amount: 25 },
    { habit_id: habit.id, user_id: userId, period: isoWeekLabel(1), amount: 25 },
  ])
  if (contribErr) throw contribErr

  console.log('✓ demo account ready')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
