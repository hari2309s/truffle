import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import { embedTransaction, upsertTransaction } from '@truffle/ai'
import type { Transaction, Anomaly } from '@truffle/types'
import { recomputeSnapshot } from '@/lib/server-db'
import { sendAnomalyNudge } from '@/lib/proactive-nudge'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const db = createServerClient()
    const { data, error } = await db
      .from('transactions')
      .select(
        'id, user_id, amount, currency, description, category, merchant, date, is_recurring, created_at'
      )
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json(
      { transactions: data },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (error) {
    console.error('GET transactions error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      transactions,
      userId,
    }: { transactions: Omit<Transaction, 'id' | 'embedding'>[]; userId: string } = body

    if (!transactions?.length || !userId) {
      return NextResponse.json({ error: 'transactions and userId required' }, { status: 400 })
    }

    const db = createServerClient()

    // Assign IDs upfront so embeddings and DB rows share the same ID
    const txsWithIds: Transaction[] = transactions.map((tx) => ({
      ...tx,
      id: crypto.randomUUID(),
      userId,
    }))

    // Generate all embeddings in parallel (non-fatal per transaction)
    const embeddings = await Promise.all(
      txsWithIds.map((tx) =>
        embedTransaction(tx).catch((e) => {
          console.warn('Embedding failed (non-fatal):', e)
          return [] as number[]
        })
      )
    )

    // Apply embeddings so ChromaDB upserts have the vector attached
    txsWithIds.forEach((tx, i) => {
      if (embeddings[i]!.length > 0) tx.embedding = embeddings[i]
    })

    // Batch insert all transactions in a single round-trip
    const { data: insertedRows, error: insertError } = await db
      .from('transactions')
      .insert(
        txsWithIds.map((tx, i) => ({
          id: tx.id,
          user_id: userId,
          amount: tx.amount,
          currency: tx.currency,
          description: tx.description,
          category: tx.category,
          merchant: tx.merchant,
          date: tx.date,
          is_recurring: tx.isRecurring,
          embedding: embeddings[i]!.length > 0 ? embeddings[i] : null,
        }))
      )
      .select()

    if (insertError) throw insertError

    const results = (insertedRows ?? []) as Record<string, unknown>[]

    // Upsert all to ChromaDB in parallel (non-fatal)
    await Promise.all(
      txsWithIds.map((tx) =>
        upsertTransaction(tx).catch((e) => console.warn('ChromaDB upsert failed (non-fatal):', e))
      )
    )

    // Recompute monthly snapshot
    await recomputeSnapshot(userId, db)

    // Run anomaly detection then fire proactive nudges (both non-fatal)
    try {
      const anomalies = await detectAnomalies(userId, results, db)
      if (anomalies.length) {
        const typedTxs = results.map((r) => ({ ...r }) as unknown as Transaction)
        for (const anomaly of anomalies) {
          try {
            await sendAnomalyNudge({ userId, anomaly, transactions: typedTxs, snapshot: null })
          } catch (e) {
            console.error(`Anomaly nudge failed for tx ${anomaly.transactionId}:`, e)
          }
        }
      }
    } catch (e) {
      console.error('Anomaly detection failed:', e)
    }

    return NextResponse.json({ transactions: results })
  } catch (error) {
    console.error('POST transactions error:', error)
    return NextResponse.json({ error: 'Failed to save transactions' }, { status: 500 })
  }
}

async function detectAnomalies(
  userId: string,
  newTxs: Record<string, unknown>[],
  db: ReturnType<typeof createServerClient>
): Promise<Anomaly[]> {
  // Fetch last 90 days of history for statistical baseline, excluding the
  // transactions we just inserted so the new amounts don't inflate the mean/σ.
  const newIds = newTxs.map((tx) => tx.id as string)
  const since = new Date()
  since.setDate(since.getDate() - 90)
  const { data: history } = await db
    .from('transactions')
    .select('amount, category, merchant, description')
    .eq('user_id', userId)
    .gte('date', since.toISOString().slice(0, 10))
    .lt('amount', '0') // expenses only
    .not('id', 'in', `(${newIds.join(',')})`)

  if (!history || history.length < 5) return [] // not enough history

  // Build per-category stats
  const categoryStats: Record<string, { amounts: number[] }> = {}
  for (const tx of history as Record<string, unknown>[]) {
    const cat = tx.category as string
    if (!categoryStats[cat]) categoryStats[cat] = { amounts: [] }
    categoryStats[cat].amounts.push(Math.abs(Number(tx.amount)))
  }

  const anomaliesToInsert: Record<string, unknown>[] = []

  for (const tx of newTxs) {
    const amount = Number(tx.amount)
    if (amount >= 0) continue // skip income

    const cat = tx.category as string
    const stats = categoryStats[cat]
    if (!stats || stats.amounts.length < 3) continue

    const mean = stats.amounts.reduce((s, v) => s + v, 0) / stats.amounts.length
    const variance = stats.amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / stats.amounts.length
    const stdDev = Math.sqrt(variance)
    const absAmount = Math.abs(amount)

    // Flag if > mean + 2σ
    if (stdDev > 0 && absAmount > mean + 2 * stdDev) {
      anomaliesToInsert.push({
        user_id: userId,
        transaction_id: tx.id as string,
        type: 'unusual_amount',
        severity: absAmount > mean + 3 * stdDev ? 'high' : 'medium',
        description: `${tx.description} is unusually high for ${cat.replace(/_/g, ' ')} — €${absAmount.toFixed(2)} vs your usual €${mean.toFixed(2)}`,
      })
    }
  }

  if (anomaliesToInsert.length === 0) return []

  const { data: inserted } = await db
    .from('anomalies')
    .insert(anomaliesToInsert)
    .select('id, transaction_id, type, severity, description, detected_at')

  return (inserted ?? []).map((row) => ({
    id: row.id as string,
    transactionId: row.transaction_id as string,
    type: row.type as Anomaly['type'],
    severity: row.severity as Anomaly['severity'],
    description: row.description as string,
    detectedAt: row.detected_at as string,
  }))
}
