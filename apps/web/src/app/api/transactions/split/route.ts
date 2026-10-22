import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import { embedTransaction, upsertTransaction } from '@truffle/ai'
import { TRANSACTION_CATEGORIES, type Transaction, type TransactionCategory } from '@truffle/types'
import { isMissingSchema, recomputeSnapshot } from '@/lib/server-db'
import { sanitizeForLog } from '@/lib/log'
import { requireUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const MAX_PARTS = 10

interface Part {
  amount: number
  category: TransactionCategory
  description: string
}

/**
 * POST { transactionId, parts: [{ amount, category, description }] }
 * Splits one entry into 2–10. Parts must add up to the original amount
 * exactly (to the cent) and keep its sign. The original row becomes the
 * first part; the rest are inserted with the same date/merchant/currency.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse
    const userId = user.id

    const { transactionId, parts } = (await request.json()) as {
      transactionId?: unknown
      parts?: unknown
    }
    if (typeof transactionId !== 'string' || !transactionId) {
      return NextResponse.json({ error: 'transactionId required' }, { status: 400 })
    }
    if (!Array.isArray(parts) || parts.length < 2 || parts.length > MAX_PARTS) {
      return NextResponse.json({ error: `parts must have 2–${MAX_PARTS} items` }, { status: 400 })
    }
    const valid = parts.every(
      (p): p is Part =>
        p &&
        typeof p.amount === 'number' &&
        isFinite(p.amount) &&
        p.amount !== 0 &&
        TRANSACTION_CATEGORIES.includes(p.category) &&
        typeof p.description === 'string' &&
        p.description.trim().length > 0 &&
        p.description.length <= 200
    )
    if (!valid) {
      return NextResponse.json(
        { error: 'each part needs a non-zero amount, a valid category and a description' },
        { status: 400 }
      )
    }

    const db = createServerClient()
    const fetchOriginal = (columns: string) =>
      db.from('transactions').select(columns).eq('id', transactionId).eq('user_id', userId).maybeSingle()
    // goal_id/note ride along to the new parts; older schemas lack them.
    let { data: originalRow, error: fetchError } = await fetchOriginal(
      'id, amount, currency, merchant, date, is_recurring, goal_id, note'
    )
    if (fetchError && isMissingSchema(fetchError)) {
      ;({ data: originalRow, error: fetchError } = await fetchOriginal(
        'id, amount, currency, merchant, date, is_recurring'
      ))
    }
    if (fetchError) throw fetchError
    if (!originalRow) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    const original = originalRow as unknown as {
      id: string
      amount: number | string
      currency: Transaction['currency']
      merchant: string | null
      date: string
      is_recurring: boolean
      goal_id?: string | null
      note?: string | null
    }

    const cents = (n: number) => Math.round(n * 100)
    const total = cents(Number(original.amount))
    const sign = Math.sign(total)
    if (parts.some((p: Part) => Math.sign(p.amount) !== sign)) {
      return NextResponse.json({ error: 'parts must keep the original sign' }, { status: 400 })
    }
    if (parts.reduce((s: number, p: Part) => s + cents(p.amount), 0) !== total) {
      return NextResponse.json({ error: 'parts must add up to the original amount' }, { status: 400 })
    }

    const [first, ...rest] = parts as Part[]
    const inserted = rest.map((p) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      amount: cents(p.amount) / 100,
      currency: original.currency,
      description: p.description.trim(),
      category: p.category,
      merchant: original.merchant,
      date: original.date,
      is_recurring: original.is_recurring,
      ...('goal_id' in original ? { goal_id: original.goal_id ?? null } : {}),
      ...('note' in original ? { note: original.note ?? null } : {}),
    }))

    const { error: insertError } = await db.from('transactions').insert(inserted)
    if (insertError) throw insertError

    const { error: updateError } = await db
      .from('transactions')
      .update({
        amount: cents(first!.amount) / 100,
        category: first!.category,
        description: first!.description.trim(),
      })
      .eq('id', transactionId)
      .eq('user_id', userId)
    if (updateError) {
      // Undo the new parts so the total isn't counted twice.
      await db
        .from('transactions')
        .delete()
        .in(
          'id',
          inserted.map((r) => r.id)
        )
        .eq('user_id', userId)
      throw updateError
    }

    // Re-index every part for chat search (best-effort, like POST): new
    // parts need vectors, and the original's amount/category changed.
    const indexed: Transaction[] = (parts as Part[]).map((p, i) => ({
      id: i === 0 ? transactionId : inserted[i - 1]!.id,
      userId,
      amount: cents(p.amount) / 100,
      currency: original.currency,
      description: p.description.trim(),
      category: p.category,
      merchant: original.merchant ?? undefined,
      date: original.date,
      isRecurring: original.is_recurring,
    }))
    await Promise.all(
      indexed.map(async (tx) => {
        try {
          const embedding = await embedTransaction(tx)
          if (embedding.length) {
            tx.embedding = embedding
            await db.from('transactions').update({ embedding }).eq('id', tx.id).eq('user_id', userId)
          }
          await upsertTransaction(tx)
        } catch (e) {
          console.warn('Split re-index failed (non-fatal):', sanitizeForLog(e instanceof Error ? e.message : e))
        }
      })
    )

    try {
      await recomputeSnapshot(userId, db)
    } catch (e) {
      console.error('Snapshot recompute failed (non-fatal):', e)
    }
    return NextResponse.json({ ok: true, ids: [transactionId, ...inserted.map((r) => r.id)] })
  } catch (error) {
    console.error('POST transactions/split error:', error)
    return NextResponse.json({ error: 'Failed to split transaction' }, { status: 500 })
  }
}
