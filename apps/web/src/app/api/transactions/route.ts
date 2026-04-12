import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import type { Transaction, Anomaly } from '@truffle/types'
import { recomputeSnapshot } from '@/lib/server-db'

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
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ transactions: data })
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
    const results: Record<string, unknown>[] = []

    for (const tx of transactions) {
      // Generate embedding
      const txWithId: Transaction = {
        ...tx,
        id: crypto.randomUUID(),
        userId,
      }
      let embedding: number[] = []
      try {
        const { embedTransaction } = await import('@truffle/ai')
        embedding = await embedTransaction(txWithId)
        txWithId.embedding = embedding
      } catch (e) {
        console.warn('Embedding failed (non-fatal):', e)
      }

      // Store in Supabase
      const { data, error } = await db
        .from('transactions')
        .insert({
          id: txWithId.id,
          user_id: userId,
          amount: tx.amount,
          currency: tx.currency,
          description: tx.description,
          category: tx.category,
          merchant: tx.merchant,
          date: tx.date,
          is_recurring: tx.isRecurring,
          embedding: embedding.length > 0 ? embedding : null,
        })
        .select()
        .single()

      if (error) throw error

      // Store in ChromaDB (non-fatal)
      try {
        const { upsertTransaction } = await import('@truffle/ai')
        await upsertTransaction(txWithId)
      } catch (e) {
        console.warn('ChromaDB upsert failed (non-fatal):', e)
      }

      results.push(data as Record<string, unknown>)
    }

    // Recompute monthly snapshot
    await recomputeSnapshot(userId, db)

    // Run anomaly detection then fire proactive nudges (both non-fatal)
    detectAnomalies(userId, results, db)
      .then(async (anomalies) => {
        if (!anomalies.length) return
        const { sendAnomalyNudge } = await import('@/lib/proactive-nudge')
        const typedTxs = results.map((r) => ({ ...r }) as unknown as Transaction)
        for (const anomaly of anomalies) {
          sendAnomalyNudge({ userId, anomaly, transactions: typedTxs, snapshot: null }).catch((e) =>
            console.warn('Proactive anomaly nudge failed (non-fatal):', e)
          )
        }
      })
      .catch((e) => console.warn('Anomaly detection failed (non-fatal):', e))

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
  // Fetch last 90 days of history for statistical baseline
  const since = new Date()
  since.setDate(since.getDate() - 90)
  const { data: history } = await db
    .from('transactions')
    .select('amount, category, merchant, description')
    .eq('user_id', userId)
    .gte('date', since.toISOString().slice(0, 10))
    .lt('amount', '0') // expenses only

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
