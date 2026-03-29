import { NextRequest } from 'next/server'
import { streamText, tool, convertToCoreMessages } from 'ai'
import { z } from 'zod'
import { chatModel, queryTransactions, routeIntent } from '@truffle/ai'
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

function getToneGuidance(snapshot: MonthlySnapshot): string {
  const { totalIncome, totalExpenses, balance } = snapshot

  if (totalIncome === 0 && totalExpenses === 0) {
    return 'The user is just getting started — be encouraging and welcoming.'
  }

  const savingsRate = totalIncome > 0 ? (totalIncome + totalExpenses) / totalIncome : 0

  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysElapsed = today.getDate()
  const daysRemaining = daysInMonth - daysElapsed
  const dailySpend =
    daysElapsed > 0 && totalExpenses < 0 ? Math.abs(totalExpenses) / daysElapsed : 0
  const projectedBalance = balance - dailySpend * daysRemaining

  if (projectedBalance < 0) {
    return 'The user is projected to go negative this month — be very reassuring, non-judgmental, and focus on one small practical step they can take. Do not alarm them.'
  }

  if (savingsRate < 0.1) {
    return 'It is a tight month for the user — be warm and reassuring. Acknowledge the difficulty without dwelling on it. Find something positive to mention.'
  }

  if (savingsRate > 0.4) {
    return 'The user is doing really well financially this month — celebrate it genuinely! Be enthusiastic but not over the top.'
  }

  return 'The user is in a solid financial position this month — be calm, informative, and encouraging.'
}

export async function POST(request: NextRequest) {
  try {
    const { messages: clientMessages, userId } = await request.json()
    const message = Array.isArray(clientMessages)
      ? [...clientMessages].reverse().find((m: { role: string }) => m.role === 'user')?.content
      : undefined

    if (!message || !userId) {
      return new Response(JSON.stringify({ error: 'message and userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = createDbClient()

    // Fetch transactions
    const { data: txRows } = await db
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(50)

    const transactions = ((txRows ?? []) as Record<string, unknown>[]).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      amount: Number(row.amount),
      currency: row.currency as 'EUR' | 'GBP' | 'USD',
      description: row.description as string,
      category: row.category as TransactionCategory,
      merchant: (row.merchant as string | null) ?? undefined,
      date: row.date as string,
      isRecurring: row.is_recurring as boolean,
    }))

    // Fetch monthly snapshot
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

    // Fetch recent anomalies for context
    const { data: anomalyRows } = await db
      .from('anomalies')
      .select('description, severity, type')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false })
      .limit(5)

    const anomalyContext =
      anomalyRows && anomalyRows.length > 0
        ? '\nRecent anomalies detected:\n' +
          anomalyRows
            .map((a: Record<string, unknown>) => `- [${a.severity}] ${a.description}`)
            .join('\n')
        : ''

    // Fetch savings goals for context
    const { data: goalRows } = await db
      .from('savings_goals')
      .select('name, target_amount, saved_amount, deadline, emoji')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    const goalsContext =
      goalRows && goalRows.length > 0
        ? '\nSavings goals:\n' +
          goalRows
            .map((g: Record<string, unknown>) => {
              const pct = (
                ((g.saved_amount as number) / (g.target_amount as number)) *
                100
              ).toFixed(0)
              return `- ${g.emoji} ${g.name}: €${g.saved_amount} / €${g.target_amount} (${pct}%)${g.deadline ? ` by ${g.deadline}` : ''}`
            })
            .join('\n')
        : ''

    // Route intent
    const intent = await routeIntent(message)

    // RAG retrieval — falls back to latest 25 if ChromaDB is unavailable
    const relevantTransactions = await queryTransactions(userId, message, 20).catch(
      () => transactions
    )
    const contextTransactions =
      relevantTransactions.length > 0 ? relevantTransactions : transactions

    const context = contextTransactions
      .slice(0, 25)
      .map((t) => `${t.date}: ${t.description} (${t.category}) €${t.amount.toFixed(2)}`)
      .join('\n')

    // Compute forecast numbers for affordability / forecast intents
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const daysElapsed = today.getDate()
    const daysRemaining = daysInMonth - daysElapsed
    const dailySpend =
      daysElapsed > 0 && snapshot.totalExpenses < 0
        ? Math.abs(snapshot.totalExpenses) / daysElapsed
        : 0
    const projectedBalance = snapshot.balance - dailySpend * daysRemaining

    const toneGuidance = getToneGuidance(snapshot)

    const systemPrompt = `You are Truffle — a warm, calm, non-judgmental personal finance companion. You speak like a knowledgeable friend, never a banker or a lecturer.

Tone guidance for this conversation: ${toneGuidance}

The user's recent transactions:
${context}${anomalyContext}${goalsContext}

Monthly summary (${snapshot.month}):
- Income: €${snapshot.totalIncome.toFixed(2)}
- Expenses: €${Math.abs(snapshot.totalExpenses).toFixed(2)}
- Balance: €${snapshot.balance.toFixed(2)}
- Projected end of month: €${projectedBalance.toFixed(2)} (${daysRemaining} days remaining, spending ~€${dailySpend.toFixed(2)}/day)

Intent detected: ${intent}

Response guidelines:
- Be concise (2-4 sentences) — your response will be read aloud
- Use actual numbers from the transaction data
- No bullet points or lists — use natural spoken language
- Never lecture or shame. Celebrate wins. Reassure when things are tight.

Goal tool rules:
- When the user expresses a desire to save for something specific, use the proposeGoal tool
- Gather name and target amount from the conversation before calling the tool
- NEVER describe a goal in plain text without calling proposeGoal — always let the user confirm
- After a confirmed goal, respond with one warm sentence acknowledging it`

    type ClientMessage = {
      role: string
      toolInvocations?: { toolCallId: string; state: string; result?: unknown }[]
    }
    // Resolve any tool invocations that are still in 'call' or 'partial-call' state —
    // convertToCoreMessages throws if a toolInvocation doesn't have a result yet.
    const normalizedMessages = clientMessages.map((m: ClientMessage) => {
      if (
        m.role !== 'assistant' ||
        !m.toolInvocations?.length ||
        m.toolInvocations.every((inv) => inv.state === 'result')
      ) {
        return m
      }
      return {
        ...m,
        toolInvocations: m.toolInvocations.map((inv) =>
          inv.state === 'result' ? inv : { ...inv, state: 'result', result: { confirmed: false } }
        ),
      }
    })

    const result = await streamText({
      model: chatModel,
      system: systemPrompt,
      messages: convertToCoreMessages(normalizedMessages),
      maxTokens: 400,
      tools: {
        proposeGoal: tool({
          description:
            'Propose a savings goal to the user. Call this when the user wants to save for something specific. The user will see a card with Yes / No buttons — do not create the goal yourself.',
          parameters: z.object({
            name: z.string().describe('Short goal name, e.g. "Holiday in Greece"'),
            targetAmount: z.coerce.number().describe('Target amount in EUR'),
            deadline: z.string().optional().describe('Optional target date in YYYY-MM-DD format'),
            emoji: z.string().describe('A single relevant emoji'),
            pitch: z
              .string()
              .describe(
                'One warm sentence explaining why this goal is achievable based on their finances'
              ),
          }),
        }),
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
