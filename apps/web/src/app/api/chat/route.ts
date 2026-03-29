import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { geminiFlash, queryTransactions, routeIntent } from '@truffle/ai'
import { createServerClient as createDbClient } from '@truffle/db'
import type { MonthlySnapshot, TransactionCategory } from '@truffle/types'

export const runtime = 'nodejs'
export const maxDuration = 30

function buildEmptySnapshot(): MonthlySnapshot {
  return {
    month: new Date().toISOString().slice(0, 7),
    totalIncome: 0,
    totalExpenses: 0,
    byCategory: {
      food_groceries: 0,
      food_delivery: 0,
      transport: 0,
      housing: 0,
      utilities: 0,
      subscriptions: 0,
      health: 0,
      entertainment: 0,
      shopping: 0,
      income: 0,
      savings: 0,
      other: 0,
    },
    savingsRate: 0,
    balance: 0,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()

    if (!message || !userId) {
      return new Response(JSON.stringify({ error: 'message and userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get transactions from Supabase for context
    const db = createDbClient()
    const { data: txRows } = await db
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(50)

    const transactions = ((txRows ?? []) as Record<string, unknown>[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      amount: Number(row.amount),
      currency: row.currency as 'EUR' | 'GBP' | 'USD',
      description: row.description,
      category: row.category as TransactionCategory,
      merchant: row.merchant ?? undefined,
      date: row.date,
      isRecurring: row.is_recurring,
    }))

    // Get or build monthly snapshot
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: snapshotRow } = await db
      .from('monthly_snapshots')
      .select('data')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single()

    const snapshot: MonthlySnapshot =
      ((snapshotRow as Record<string, unknown> | null)?.data as unknown as MonthlySnapshot) ??
      buildEmptySnapshot()

    // Route intent
    const intent = await routeIntent(message)

    // Get RAG context
    const relevantTransactions = await queryTransactions(userId, message, 20).catch(
      () => transactions
    )

    // Build context string
    const contextTransactions =
      relevantTransactions.length > 0 ? relevantTransactions : transactions
    const context = contextTransactions
      .slice(0, 25)
      .map((t) => `${t.date}: ${t.description} (${t.category}) €${t.amount.toFixed(2)}`)
      .join('\n')

    const systemPrompt = `You are Truffle — a warm, calm, non-judgmental personal finance companion.

The user's recent transactions:
${context}

Monthly summary (${snapshot.month}):
- Income: €${snapshot.totalIncome.toFixed(2)}
- Expenses: €${Math.abs(snapshot.totalExpenses).toFixed(2)}
- Balance: €${snapshot.balance.toFixed(2)}

Intent detected: ${intent}

Guidelines:
- Be concise (2-4 sentences) — your response will be read aloud
- Use actual numbers from the transaction data
- Warm, friendly tone — like a knowledgeable friend, not a banker
- Never lecture or shame. Celebrate wins. Reassure when needed.
- No bullet points or lists — use natural spoken language`

    const result = await streamText({
      model: geminiFlash,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      maxTokens: 250,
    })

    return result.toAIStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
