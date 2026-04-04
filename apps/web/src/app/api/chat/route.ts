import { NextRequest } from 'next/server'
import { streamText, tool, convertToCoreMessages, StreamData } from 'ai'
import { z } from 'zod'
import {
  chatModel,
  queryTransactions,
  routeIntent,
  langfuse,
  getSpeechTone,
  getToneGuidance,
  buildSystemPrompt,
} from '@truffle/ai'
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

    // Fetch savings goals for context
    const { data: goalRows } = await db
      .from('savings_goals')
      .select('name, target_amount, saved_amount, deadline, emoji')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

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

    const systemPrompt = buildSystemPrompt({
      intent,
      toneGuidance,
      snapshot,
      transactions: contextTransactions,
      anomalyRows: anomalyRows as { severity: unknown; description: unknown }[] | null,
      goalRows: goalRows as
        | {
            emoji: unknown
            name: unknown
            saved_amount: unknown
            target_amount: unknown
            deadline: unknown
          }[]
        | null,
      projectedBalance,
      daysRemaining,
      dailySpend,
    })

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
        prevAssistantText.includes('cost') ||
        prevAssistantText.includes('budget') ||
        prevAssistantText.includes('target')) &&
      (prevAssistantText.includes('goal') ||
        prevAssistantText.includes('save') ||
        prevAssistantText.includes('saving') ||
        prevAssistantText.includes('plan') ||
        prevAssistantText.includes('trip') ||
        prevAssistantText.includes('buy') ||
        prevAssistantText.includes('purchase') ||
        prevAssistantText.includes('afford'))
    if (prevWasAskingForGoalAmount) {
      intent = 'goal_setting'
    }

    // Same detection for transaction follow-ups — if Truffle asked for transaction
    // details and the user replies with an amount/description, keep tools enabled.
    const prevWasAskingForTransactionDetails =
      !lastAssistant?.toolInvocations?.length &&
      (prevAssistantText.includes('how much') ||
        prevAssistantText.includes('amount') ||
        prevAssistantText.includes('what did') ||
        prevAssistantText.includes('which category') ||
        prevAssistantText.includes('what category')) &&
      (prevAssistantText.includes('transaction') ||
        prevAssistantText.includes('expense') ||
        prevAssistantText.includes('purchase') ||
        prevAssistantText.includes('payment') ||
        prevAssistantText.includes('spent') ||
        prevAssistantText.includes('paid') ||
        prevAssistantText.includes('log'))
    if (prevWasAskingForTransactionDetails) {
      intent = 'add_transaction'
    }

    const proposeGoalTool = {
      proposeGoal: tool({
        description:
          "Propose a savings goal card for the user to confirm. STRICT RULES: (1) NEVER call on the turn the user first names a goal — always ask for the price first in plain text. (2) Only call when the user's CURRENT message contains a specific numeric amount for THIS goal. A number from a previous turn does not count. (3) Never guess, infer, or reuse amounts from other goals in the conversation.",
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
            .optional()
            .describe(
              'Optional target date in YYYY-MM-DD format (e.g. "2026-04-30"). Omit if the user gave no deadline.'
            ),
          emoji: z.string().describe('A single relevant emoji'),
          pitch: z
            .string()
            .describe(
              'One warm sentence explaining why this goal is achievable based on their finances'
            ),
        }),
      }),
    }

    const proposeTransactionTool = {
      proposeTransaction: tool({
        description:
          'Show a transaction confirmation card. MUST be called whenever the user mentions paying, spending, buying, or receiving money. NEVER skip this and respond in plain text instead — the transaction is only logged after the user confirms the card. Use negative amounts for expenses, positive for income.',
        parameters: z.object({
          description: z.string().describe('Short description, e.g. "Coffee at Costa"'),
          amount: z
            .number()
            .describe(
              'Transaction amount. Negative for expenses (e.g. -4.50), positive for income (e.g. 1500).'
            ),
          category: z
            .enum([
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
            .describe('The most appropriate category for this transaction.'),
          merchant: z.string().optional().describe('Optional merchant or payee name.'),
          date: z
            .string()
            .describe(
              `Transaction date in YYYY-MM-DD format. Default to today: ${new Date().toISOString().slice(0, 10)}`
            ),
        }),
      }),
    }

    const generation = trace.generation({
      name: 'streamText',
      model: 'llama-3.3-70b-versatile',
      input: [{ role: 'system', content: systemPrompt }],
    })

    // Bound history to prevent token bloat on long conversations, but always
    // retain messages with confirmed tool results so goal state is preserved.
    const boundedMessages =
      normalizedMessages.length > 10
        ? [
            ...normalizedMessages.filter((m: ClientMessage) =>
              m.toolInvocations?.some((inv: { state: string }) => inv.state === 'result')
            ),
            ...normalizedMessages.slice(-6),
          ].filter((m: ClientMessage, i: number, arr: ClientMessage[]) => arr.indexOf(m) === i)
        : normalizedMessages

    // If any prior message has a completed tool invocation, the converted history will
    // contain a { role: 'tool' } message. Groq/LLaMA rejects requests that include tool
    // result messages in history when no tools are defined in the current request.
    // Always pass proposeGoalTool when tool history exists so the model can resolve
    // the context — the system prompt and isFollowUpAfterTool guard prevent re-calling it.
    const historyHasToolResults = boundedMessages.some(
      (m: ClientMessage) =>
        m.role === 'assistant' && m.toolInvocations?.some((inv) => inv.state === 'result')
    )
    const enableTools =
      historyHasToolResults ||
      (!isFollowUpAfterTool && (intent === 'goal_setting' || intent === 'add_transaction'))

    // For add_transaction, force the model to call proposeTransaction — don't let it
    // narrate a fake confirmation in plain text. goal_setting stays 'auto' because the
    // model legitimately needs to ask for the amount first (text turn) before tool call.
    const toolChoice =
      !isFollowUpAfterTool && intent === 'add_transaction'
        ? ({ type: 'tool', toolName: 'proposeTransaction' } as const)
        : 'auto'

    const result = streamText({
      model: chatModel,
      system: systemPrompt,
      messages: convertToCoreMessages(boundedMessages),
      maxTokens: 400,
      tools: enableTools ? { ...proposeGoalTool, ...proposeTransactionTool } : undefined,
      toolChoice: enableTools ? toolChoice : undefined,
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
