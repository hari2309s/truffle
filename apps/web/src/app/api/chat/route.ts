import { NextRequest } from 'next/server'
import { streamText, tool, convertToCoreMessages, StreamData } from 'ai'
import { z } from 'zod'
import { chatModel, queryTransactions, routeIntent, langfuse } from '@truffle/ai'
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

type SpeechTone = 'celebratory' | 'reassuring' | 'concerned' | 'neutral'

function getSpeechTone(snapshot: MonthlySnapshot): SpeechTone {
  const { totalIncome, totalExpenses, balance } = snapshot
  if (totalIncome === 0 && totalExpenses === 0) return 'neutral'

  const savingsRate = totalIncome > 0 ? (totalIncome + totalExpenses) / totalIncome : 0
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysElapsed = today.getDate()
  const daysRemaining = daysInMonth - daysElapsed
  const dailySpend =
    daysElapsed > 0 && totalExpenses < 0 ? Math.abs(totalExpenses) / daysElapsed : 0
  const projectedBalance = balance - dailySpend * daysRemaining

  if (projectedBalance < 0) return 'concerned'
  if (savingsRate < 0.1) return 'reassuring'
  if (savingsRate > 0.4) return 'celebratory'
  return 'neutral'
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

    // Langfuse trace for the full request
    const trace = langfuse.trace({
      name: 'chat',
      userId,
      input: message,
      metadata: { month: currentMonth },
    })

    // Route intent
    const intentSpan = trace.span({ name: 'routeIntent', input: message })
    let intent = await routeIntent(message)
    intentSpan.end({ output: intent })

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

    const speechTone = getSpeechTone(snapshot)
    const toneGuidance = getToneGuidance(snapshot)

    const streamData = new StreamData()
    streamData.append({ type: 'speech_tone', tone: speechTone })

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
- Ask the user for a target amount before calling proposeGoal. Do not guess or estimate — wait for them to state a number.
- Once you have a name and amount from the user, call proposeGoal immediately. Do not describe it in text first.
- After a confirmed goal, respond with one warm sentence acknowledging it.
- If the user declined, respond warmly and do not re-propose the same goal.`

    type ClientMessage = {
      role: string
      content?: string
      toolInvocations?: { toolCallId: string; state: string; result?: unknown }[]
    }
    // Resolve any tool invocations that are still in 'call' or 'partial-call' state —
    // convertToCoreMessages throws if a toolInvocation doesn't have a result yet.
    // Also strip leaked <function=...> XML from assistant message content so the
    // model never sees its own malformed tool-call output in history, which causes
    // it to assume the goal was already proposed/confirmed.
    const normalizedMessages = clientMessages.map((m: ClientMessage) => {
      if (m.role !== 'assistant') return m

      const cleanContent =
        m.content && typeof m.content === 'string'
          ? m.content.replace(/<function=[^>]*>[\s\S]*?<\/function>/g, '').trim()
          : m.content

      if (!m.toolInvocations?.length || m.toolInvocations.every((inv) => inv.state === 'result')) {
        return { ...m, content: cleanContent }
      }
      return {
        ...m,
        content: cleanContent,
        toolInvocations: m.toolInvocations.map((inv) =>
          inv.state === 'result' ? inv : { ...inv, state: 'result', result: { confirmed: false } }
        ),
      }
    })

    // If the last assistant message already has a completed tool result we're in a
    // follow-up turn — disable tools so the LLM just gives a text acknowledgment
    // instead of proposing the same goal again.
    const lastAssistant = [...normalizedMessages]
      .reverse()
      .find((m: ClientMessage) => m.role === 'assistant')
    const isFollowUpAfterTool =
      !!lastAssistant?.toolInvocations?.length &&
      lastAssistant.toolInvocations.every(
        (inv: { toolCallId: string; state: string; result?: unknown }) => inv.state === 'result'
      )

    // If the previous assistant message was asking for a goal amount (mid-collection
    // flow), the user's reply (e.g. "20000 euros") won't match goal_setting keywords.
    // Detect this and force the intent so tools stay enabled for this turn.
    const prevAssistantText =
      typeof lastAssistant?.content === 'string' ? lastAssistant.content.toLowerCase() : ''
    const prevWasAskingForGoalAmount =
      !lastAssistant?.toolInvocations?.length &&
      (prevAssistantText.includes('how much') ||
        prevAssistantText.includes('amount') ||
        prevAssistantText.includes('cost')) &&
      (prevAssistantText.includes('goal') ||
        prevAssistantText.includes('save') ||
        prevAssistantText.includes('saving'))
    if (prevWasAskingForGoalAmount) {
      intent = 'goal_setting'
    }

    const proposeGoalTool = {
      proposeGoal: tool({
        description:
          'Propose a savings goal to the user. Call this ONLY after the user has stated a target amount themselves. The user will see a Yes / No card — do not create the goal yourself.',
        parameters: z.object({
          name: z.string().describe('Short goal name, e.g. "Holiday in Greece"'),
          targetAmount: z
            .union([z.number(), z.string().transform((s) => parseFloat(s))])
            .refine((n) => n > 0, {
              message: 'targetAmount must be positive — ask the user for an amount first',
            })
            .describe('Target amount in EUR stated by the user. Do not guess.'),
          deadline: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe('Optional target date in YYYY-MM-DD format. Omit if no deadline.'),
          emoji: z.string().describe('A single relevant emoji'),
          pitch: z
            .string()
            .describe(
              'One warm sentence explaining why this goal is achievable based on their finances'
            ),
        }),
      }),
    }

    const generation = trace.generation({
      name: 'streamText',
      model: 'llama-3.3-70b-versatile',
      input: [{ role: 'system', content: systemPrompt }],
    })

    // If any prior message has a completed tool invocation, the converted history will
    // contain a { role: 'tool' } message. Groq/LLaMA rejects requests that include tool
    // result messages in history when no tools are defined in the current request.
    // Always pass proposeGoalTool when tool history exists so the model can resolve
    // the context — the system prompt and isFollowUpAfterTool guard prevent re-calling it.
    const historyHasToolResults = normalizedMessages.some(
      (m: ClientMessage) =>
        m.role === 'assistant' && m.toolInvocations?.some((inv) => inv.state === 'result')
    )
    const enableTools = historyHasToolResults || (!isFollowUpAfterTool && intent === 'goal_setting')

    const result = streamText({
      model: chatModel,
      system: systemPrompt,
      messages: convertToCoreMessages(normalizedMessages),
      maxTokens: 400,
      tools: enableTools ? proposeGoalTool : undefined,
      onFinish: async ({ text, usage }) => {
        try {
          generation.end({
            output: text,
            usage: usage
              ? { input: usage.promptTokens, output: usage.completionTokens }
              : undefined,
          })
          await langfuse.flushAsync()
        } finally {
          streamData.close()
        }
      },
    })

    return result.toDataStreamResponse({
      data: streamData,
      getErrorMessage: (error: unknown) => {
        console.error('[chat/stream error]', error)
        return error instanceof Error ? error.message : 'An error occurred.'
      },
    })
  } catch (error) {
    console.error('[chat/route error]', error)
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
