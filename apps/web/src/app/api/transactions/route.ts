import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@truffle/db'
import { embedTransaction, upsertTransaction } from '@truffle/ai'
import type { Transaction } from '@truffle/types'

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
    const { transactions, userId }: { transactions: Omit<Transaction, 'id' | 'embedding'>[]; userId: string } = body

    if (!transactions?.length || !userId) {
      return NextResponse.json({ error: 'transactions and userId required' }, { status: 400 })
    }

    const db = createServerClient()
    const results = []

    for (const tx of transactions) {
      // Generate embedding
      const txWithId: Transaction = {
        ...tx,
        id: crypto.randomUUID(),
        userId,
      }
      const embedding = await embedTransaction(txWithId)
      txWithId.embedding = embedding

      // Store in Supabase
      const { data, error } = await db.from('transactions').insert({
        id: txWithId.id,
        user_id: userId,
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description,
        category: tx.category,
        merchant: tx.merchant,
        date: tx.date,
        is_recurring: tx.isRecurring,
        embedding: embedding,
      }).select().single()

      if (error) throw error

      // Store in ChromaDB
      await upsertTransaction(txWithId).catch((e) =>
        console.warn('ChromaDB upsert failed (non-fatal):', e)
      )

      results.push(data)
    }

    // Recompute monthly snapshot
    await recomputeSnapshot(userId, db)

    // Run anomaly detection (non-fatal)
    await detectAnomalies(userId, results, db).catch((e) =>
      console.warn('Anomaly detection failed (non-fatal):', e)
    )

    return NextResponse.json({ transactions: results })
  } catch (error) {
    console.error('POST transactions error:', error)
    return NextResponse.json({ error: 'Failed to save transactions' }, { status: 500 })
  }
}

async function detectAnomalies(
  userId: string,
  newTxs: { id: string; amount: number | string; category: string; description: string; merchant?: string | null }[],
  db: ReturnType<typeof createServerClient>
) {
  // Fetch last 90 days of history for statistical baseline
  const since = new Date()
  since.setDate(since.getDate() - 90)
  const { data: history } = await db
    .from('transactions')
    .select('amount, category, merchant, description')
    .eq('user_id', userId)
    .gte('date', since.toISOString().slice(0, 10))
    .lt('amount', '0') // expenses only

  if (!history || history.length < 5) return // not enough history

  // Build per-category stats
  const categoryStats: Record<string, { amounts: number[] }> = {}
  for (const tx of history) {
    const cat = tx.category as string
    if (!categoryStats[cat]) categoryStats[cat] = { amounts: [] }
    categoryStats[cat].amounts.push(Math.abs(Number(tx.amount)))
  }

  const anomaliesToInsert = []

  for (const tx of newTxs) {
    const amount = Number(tx.amount)
    if (amount >= 0) continue // skip income

    const cat = tx.category
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
        transaction_id: tx.id,
        type: 'unusual_amount',
        severity: absAmount > mean + 3 * stdDev ? 'high' : 'medium',
        description: `${tx.description} is unusually high for ${cat.replace(/_/g, ' ')} — €${absAmount.toFixed(2)} vs your usual €${mean.toFixed(2)}`,
      })
    }
  }

  if (anomaliesToInsert.length > 0) {
    await db.from('anomalies').insert(anomaliesToInsert)
  }
}

async function recomputeSnapshot(userId: string, db: ReturnType<typeof createServerClient>) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const startDate = `${currentMonth}-01`

  const { data: txs } = await db
    .from('transactions')
    .select('amount, category')
    .eq('user_id', userId)
    .gte('date', startDate)

  if (!txs) return

  const snapshot = {
    month: currentMonth,
    totalIncome: txs.filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0),
    totalExpenses: txs.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Number(t.amount), 0),
    byCategory: {} as Record<string, number>,
    savingsRate: 0,
    balance: txs.reduce((s, t) => s + Number(t.amount), 0),
    transactionCount: txs.length,
  }

  for (const tx of txs) {
    const cat = tx.category as string
    snapshot.byCategory[cat] = (snapshot.byCategory[cat] ?? 0) + Number(tx.amount)
  }

  if (snapshot.totalIncome > 0) {
    snapshot.savingsRate = Math.max(0, (snapshot.totalIncome + snapshot.totalExpenses) / snapshot.totalIncome)
  }

  await db.from('monthly_snapshots').upsert({
    user_id: userId,
    month: currentMonth,
    data: snapshot,
  })
}
