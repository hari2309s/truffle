import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages, isToolUIPart, type UIMessage } from 'ai'
import { normalizeHistory } from '@/lib/chatHistory'
import { proposalTools } from '@/lib/proposalTools'
import { startObservation, propagateAttributes } from '@langfuse/tracing'
import {
  queryTransactions,
  routeIntent,
  langfuseSpanProcessor,
  getSpeechTone,
  getToneGuidance,
  buildSystemPrompt,
  type FinancialFacts,
  selectModelCandidates,
  groqChatProviderOptions,
  incrementUsage,
  logEval,
} from '@truffle/ai'
import { createServerClient as createDbClient } from '@truffle/db'
import type { MonthlySnapshot, TransactionCategory, QueryIntent } from '@truffle/types'
import { INTENT } from '@truffle/types'
import { getCurrentPeriod, computeStreak } from '@/lib/habits'
import { localDate, parseDateRange, userToday } from '@/lib/date'
import { requireUser } from '@/lib/supabase-server'
import { fetchTotals, fetchTransactionsSince, fetchRecurringOverrides } from '@/lib/server-db'
import { computeStatement } from '@/lib/forecast'
import { formatMoney, formatSignedMoney } from '@/lib/money'
import { budgetView, spendByCategory as categorySpend } from '@/lib/budgets'
import { detectRecurring, recurringSince, type RecurringGroup } from '@/lib/recurring'

export const runtime = 'nodejs'
export const maxDuration = 30

/** How chat names each recurring group — rent is a fixed cost, never "a subscription". */
const RECURRING_GROUP_LABEL: Record<RecurringGroup, string> = {
  fixed: 'fixed cost',
  investing: 'investing or savings plan',
  subscriptions: 'subscription',
  other: 'other recurring',
}

/** This month's transactions shown to the model for summaries and anomaly scans. */
const MAX_MONTH_CONTEXT_ROWS = 150

function buildEmptySnapshot(month: string): MonthlySnapshot {
  return {
    month,
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

// Detects whether the previous assistant message was asking for follow-up details
// in a multi-turn collection flow, so we can force the correct intent even when
// the user's reply (e.g. "20000 euros") doesn't contain intent keywords.
function detectFollowUpIntent(prevText: string, hasToolInvocations: boolean): QueryIntent | null {
  if (hasToolInvocations) return null
  const has = (...words: string[]) => words.some((w) => prevText.includes(w))
  if (
    has('how much', 'amount', 'cost', 'budget', 'target') &&
    has('goal', 'save', 'saving', 'plan', 'trip', 'buy', 'purchase', 'afford')
  )
    return INTENT.GOAL_SETTING
  // Deadline follow-up: AI asked "when would you like to reach this goal?" etc.
  if (
    has('when', 'deadline', 'target date', 'by when', 'date') &&
    has('goal', 'save', 'saving', 'reach', 'achieve', 'trip', 'buy', 'purchase')
  )
    return INTENT.GOAL_SETTING
  if (
    has('how much', 'amount', 'what did', 'which category', 'what category') &&
    has('transaction', 'expense', 'purchase', 'payment', 'spent', 'paid', 'log')
  )
    return INTENT.ADD_TRANSACTION
  if (
    has('how much', 'amount', 'often', 'weekly', 'monthly') &&
    has('habit', 'save', 'saving', 'set aside', 'put away', 'regularly')
  )
    return INTENT.HABIT_SETTING
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireUser(request)
    if (errorResponse) return errorResponse
    const userId = user.id
    const userName =
      typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : ''

    const {
      messages: clientMessages,
      currency: requestedCurrency = 'EUR',
      locale = 'en',
      today,
    } = (await request.json()) as { messages: UIMessage[]; currency?: string; locale?: string; today?: unknown }
    // Client-supplied; only the currencies the app supports reach Intl.
    const currency = ['EUR', 'GBP', 'USD'].includes(requestedCurrency) ? requestedCurrency : 'EUR'

    // v5 UIMessages carry text in `parts`, not a `content` string.
    const textOf = (m: UIMessage | undefined): string =>
      (m?.parts ?? [])
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('')

    const message = Array.isArray(clientMessages)
      ? textOf([...clientMessages].reverse().find((m) => m.role === 'user'))
      : ''

    if (!message) {
      return new Response(JSON.stringify({ error: 'message required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Kick off model candidate selection immediately — it only depends on the
    // constant task name ('tool-calling'), not on anything computed below, so
    // it can run in parallel with the DB reads, intent routing, RAG retrieval,
    // and prompt building instead of starting only after all of those finish.
    // The result is awaited later, right where it's used. A no-op `.catch` is
    // attached so a rejection here doesn't surface as an unhandled promise
    // rejection if an earlier DB read fails first and we return before this
    // is ever awaited — the real error still surfaces at the await below.
    const candidatesPromise = selectModelCandidates('tool-calling')
    candidatesPromise.catch(() => {})

    const db = createDbClient()

    // The user's own date, so "this month" matches their Home card at month boundaries.
    const now = userToday(today)
    const currentMonth = localDate(now).slice(0, 7)
    const dateRange = parseDateRange(message, now)

    // Run all independent queries in parallel — contributions depends on habit IDs so runs after
    // Twelve months back: this month + last month for the statement and budget
    // rollover, the rest so recurring charges can be detected.
    // The recurring detector's own window, so chat and Insights find the same items.
    const historyFromStr = recurringSince(now)

    const [
      { data: txRows },
      { data: snapshotRows },
      { data: anomalyRows },
      { data: goalRows },
      { data: rawHabitRows },
      { data: rawBudgetRows },
      recentRows,
      totals,
      { overrides: recurringOverrides },
    ] = await Promise.all([
      db
        .from('transactions')
        .select(
          'id, user_id, amount, currency, description, category, merchant, date, is_recurring'
        )
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(50),
      db
        .from('monthly_snapshots')
        .select('data')
        .eq('user_id', userId)
        .gte('month', dateRange.from)
        .lte('month', dateRange.to)
        .order('month', { ascending: true }),
      db
        .from('anomalies')
        .select('description, severity, type')
        .eq('user_id', userId)
        .order('detected_at', { ascending: false })
        .limit(5),
      db
        .from('savings_goals')
        .select('name, target_amount, saved_amount, deadline, emoji')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      db
        .from('savings_habits')
        .select('id, name, amount, frequency, emoji')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      // select('*') so rollover/alert_pct are used when the migration is applied.
      db.from('monthly_budgets').select('*').eq('user_id', userId),
      // Soft-fail like the reads above: the facts fall back to zeros.
      fetchTransactionsSince(db, userId, historyFromStr).catch((err) => {
        console.warn('[chat] history read failed:', err)
        return []
      }),
      fetchTotals(db, userId),
      fetchRecurringOverrides(db, userId).catch(() => ({ overrides: {}, available: false })),
    ])

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

    const snapshots: MonthlySnapshot[] = ((snapshotRows ?? []) as Record<string, unknown>[])
      .map((row) => row.data as unknown as MonthlySnapshot)
      .filter(Boolean)
    if (snapshots.length === 0) snapshots.push(buildEmptySnapshot(currentMonth))

    // ── This month's figures: the same function and data as the Home card ──
    const statement = computeStatement(recentRows, now, totals?.balance ?? null)
    const monthRows = recentRows.filter((tx) => tx.date.startsWith(currentMonth))
    const money = (n: number) => formatMoney(n, currency)
    const signed = (n: number, whole = false) => formatSignedMoney(n, currency, { whole })
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const facts: FinancialFacts = {
      month: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      income_this_month: money(statement?.incomeThisMonth ?? 0),
      spent_this_month: money(statement?.spentThisMonth ?? 0),
      saved_this_month: signed(statement?.savedThisMonth ?? 0),
      net_this_month: signed(statement?.netThisMonth ?? 0),
      daily_rate: money(statement?.dailyRate ?? 0),
      forecast_month_spend: money(statement?.forecastMonthSpend ?? 0),
      days_remaining: daysInMonth - now.getDate(),
      projected_close: statement ? signed(statement.projectedClose) : null,
      net_of_everything_logged: totals ? signed(totals.balance) : null,
      // Same comparison and wording as the footer of the Home card.
      pace_vs_last_month:
        statement?.pace === 'ahead'
          ? `spent ${money(statement.paceDelta)} less than by this point last month`
          : statement?.pace === 'behind'
            ? `spent ${money(statement.paceDelta)} more than by this point last month`
            : statement?.pace === 'even'
              ? 'right in line with last month so far'
              : null,
      // Same detection and the user's corrections as the Recurring section;
      // only confirmed items, with their group so rent is never "a subscription".
      recurring: detectRecurring(recentRows, now, recurringOverrides)
        .filter((item) => !item.hidden && item.confidence === 'high')
        .slice(0, 12)
        .map((item) => {
          const cost =
            item.every && item.every !== 'month'
              ? `${money(item.perCharge)} every ${item.every} (${money(item.monthlyAmount)} a month)`
              : `${money(item.monthlyAmount)} a month`
          return `${item.displayName} (${RECURRING_GROUP_LABEL[item.group]}): ${cost}`
        }),
    }

    // Tone reads this month from the same figures (not a cached snapshot).
    const currentMonthSnapshot: MonthlySnapshot = {
      ...buildEmptySnapshot(currentMonth),
      month: currentMonth,
      totalIncome: statement?.incomeThisMonth ?? 0,
      totalExpenses: -(statement?.spentThisMonth ?? 0),
      balance: statement?.netThisMonth ?? 0,
    }

    // Contributions query depends on habit IDs from the parallel batch above
    const habitIds = (rawHabitRows ?? []).map((h: Record<string, unknown>) => h.id as string)
    const { data: habitContribRows } =
      habitIds.length > 0
        ? await db
            .from('habit_contributions')
            .select('habit_id, period')
            .in('habit_id', habitIds)
            .eq('user_id', userId)
        : { data: [] }

    // Build per-habit period sets for quick lookup
    const habitPeriodMap: Record<string, string[]> = {}
    for (const c of (habitContribRows ?? []) as { habit_id: string; period: string }[]) {
      if (!habitPeriodMap[c.habit_id]) habitPeriodMap[c.habit_id] = []
      habitPeriodMap[c.habit_id]!.push(c.period)
    }

    const habitRows = (rawHabitRows ?? []).map((h: Record<string, unknown>) => {
      const freq = h.frequency as 'weekly' | 'monthly'
      const periods = habitPeriodMap[h.id as string] ?? []
      const currentPeriod = getCurrentPeriod(freq)
      const currentPeriodLogged = periods.includes(currentPeriod)
      const streak = computeStreak(freq, periods)
      return {
        emoji: h.emoji,
        name: h.name,
        amount: h.amount,
        frequency: h.frequency,
        streak,
        currentPeriodLogged,
      }
    })

    // Current-month spend per category, from the complete month (not just
    // the latest transactions), and budgets as the Insights page shows them.
    const spendByCategory = categorySpend(recentRows, currentMonth)
    const budgetRows = (rawBudgetRows ?? []).map((b: Record<string, unknown>) => {
      const view = budgetView(
        {
          amount: Number(b.amount),
          category: String(b.category),
          rollover: b.rollover as boolean | undefined,
          alertPct: b.alert_pct === undefined ? undefined : (b.alert_pct as number | null),
          createdAt: b.created_at as string | undefined,
        },
        recentRows,
        now
      )
      return { category: b.category, amount: view.limit, spentAmount: view.spent, status: view.status }
    })

    return await propagateAttributes({ userId }, async () => {
      // Langfuse trace for the full request
      const trace = startObservation('chat', {
        input: message,
        metadata: { month: currentMonth },
      })

      // Route intent and run RAG retrieval concurrently — retrieval's query is
      // derived only from the raw `message`, not from the routed intent, so
      // there's no data dependency between the two and they don't need to be
      // sequential.
      const intentSpan = trace.startObservation('routeIntent', { input: message })
      const embeddingQuery = message.slice(0, 500)
      const [routedIntent, relevantTransactions] = await Promise.all([
        routeIntent(message),
        queryTransactions(userId, embeddingQuery, 100).catch(() => transactions),
      ])
      let intent = routedIntent
      intentSpan.update({ output: intent }).end()
      const filteredRelevant = dateRange.explicit
        ? relevantTransactions.filter(
            (tx) => tx.date.slice(0, 7) >= dateRange.from && tx.date.slice(0, 7) <= dateRange.to
          )
        : relevantTransactions
      // For anomaly_review, use all current-month transactions so the model
      // can scan the full month for duplicates, unusual amounts, etc. — RAG
      // semantic search for "unusual charges" returns poor results.
      // For spending_summary, also use full month data for accurate totals.
      const needsFullMonth = intent === INTENT.ANOMALY_REVIEW || intent === INTENT.SPENDING_SUMMARY
      const contextTransactions = needsFullMonth
        ? monthRows
            // Newest first; totals live in FINANCIAL FACTS, so a cap loses no accuracy.
            .slice(0, MAX_MONTH_CONTEXT_ROWS)
            .map((tx) => ({ ...tx, category: tx.category as TransactionCategory }))
        : filteredRelevant.length > 0
          ? filteredRelevant
          : transactions

      const speechTone = getSpeechTone(currentMonthSnapshot)
      const toneGuidance = getToneGuidance(currentMonthSnapshot)

      const systemPrompt = buildSystemPrompt({
        intent,
        userName,
        toneGuidance,
        snapshots,
        currentMonth,
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
        habitRows,
        budgetRows,
        spendByCategory,
        facts,
        currencyCode: currency,
        locale,
      })

      const normalizedMessages = normalizeHistory(clientMessages)

      // If the previous assistant message was asking for a goal amount (mid-collection
      // flow), the user's reply (e.g. "20000 euros") won't match goal_setting keywords.
      // Detect this and force the intent so tools stay enabled for this turn.
      const lastAssistant = [...normalizedMessages].reverse().find((m) => m.role === 'assistant')
      const prevAssistantText = textOf(lastAssistant).toLowerCase()
      // Skip follow-up intent override when the message looks like code, SQL, or injection
      // — let the LLM handle it as general input rather than forcing a collection flow.
      const looksLikeCode =
        /\b(select|insert|update|delete|drop|create|alter|truncate)\b\s+\w/i.test(message) ||
        /[{}<>]|\/\/|\/\*|\*\/|console\.|function\s*\(/.test(message)
      const followUpIntent = looksLikeCode ? null : detectFollowUpIntent(prevAssistantText, false)
      if (followUpIntent) intent = followUpIntent

      const candidates = await candidatesPromise

      // Drop assistant messages left with nothing — some providers reject
      // empty-content assistant messages, causing a 500 on follow-up turns.
      const filteredMessages = normalizedMessages.filter(
        (m) => !(m.role === 'assistant' && !textOf(m).trim() && !m.parts.some(isToolUIPart))
      )

      // Bound history to prevent token bloat on long conversations.
      const boundedMessages =
        filteredMessages.length > 10 ? filteredMessages.slice(-10) : filteredMessages

      // Every request carries all three tools: Groq rejects the whole reply if
      // the model calls a tool it wasn't sent ("attempted to call tool … which
      // was not in request.tools"), which a misrouted "I spent €12 on lunch"
      // used to trigger. Intent still decides the rules in the prompt and
      // whether a card is forced, and every card needs the user's confirmation.
      const allTools = proposalTools(localDate(now))
      const isToolIntent =
        intent === INTENT.HABIT_SETTING ||
        intent === INTENT.GOAL_SETTING ||
        intent === INTENT.ADD_TRANSACTION

      // Detect whether the user's message describes a definite past transaction
      // (not hypothetical). If definite, force tool call; otherwise let the model
      // decide (it may give advice instead of proposing a card).
      const isDefiniteTransaction =
        intent === INTENT.ADD_TRANSACTION &&
        /\b(i\s+(just\s+)?(spent|paid|bought|got paid|received)|i\s+just\s+spend|add\s+(a\s+)?transaction|log\s+(a\s+)?transaction)\b/i.test(
          message
        )

      // A named tool choice forces that card — use only when the user clearly wants a
      // card (definite past transaction, or new habit with all details and no
      // existing habits). Otherwise 'auto' lets the model respond with text
      // (e.g. for hypotheticals, vague requests, or acknowledging existing data).
      const toolChoice = (() => {
        if (isDefiniteTransaction) return { type: 'tool' as const, toolName: 'proposeTransaction' as const }
        if (intent === INTENT.HABIT_SETTING && habitRows.length === 0)
          return { type: 'tool' as const, toolName: 'proposeHabit' as const }
        return 'auto' as const
      })()

      const modelMessages = convertToModelMessages(boundedMessages)

      // Try each candidate provider in priority order. If one hits a rate limit
      // (per-minute TPM/RPM), fall through to the next instead of surfacing the error.
      let lastError: unknown = null
      for (const { model: chatModel, provider: chatProvider, modelId } of candidates) {
        try {
          const generation = trace.startObservation(
            'streamText',
            { model: modelId, input: [{ role: 'system', content: systemPrompt }] },
            { asType: 'generation' }
          )

          const result = streamText({
            model: chatModel,
            system: systemPrompt,
            messages: modelMessages,
            // GPT-OSS (the primary Groq model) spends part of the budget on
            // reasoning tokens before the reply/tool call. With chat running at
            // `reasoningEffort: 'medium'` (warmer prose) the cap needs headroom
            // so neither the reasoning nor the answer is truncated. Reasoning is
            // parsed out of `text` but still counts against this budget.
            maxOutputTokens: 1400,
            // A little sampling warmth so the prose doesn't collapse to the same
            // flat, analytical phrasing every turn (GPT-OSS runs cold by default).
            // Only on the text-only intents — the tool paths (add_transaction,
            // goal_setting, habit_setting) emit structured card arguments
            // (amount, category, date) that must stay faithful, so keep those cold.
            temperature: isToolIntent ? 0.2 : 0.75,
            providerOptions: groqChatProviderOptions,
            tools: allTools,
            toolChoice,
            onFinish: async ({ text, usage }) => {
              try {
                generation
                  .update({
                    output: text,
                    usageDetails: usage
                      ? { input: usage.inputTokens ?? 0, output: usage.outputTokens ?? 0 }
                      : undefined,
                  })
                  .end()
                trace.end()
                await langfuseSpanProcessor.forceFlush()
              } catch (e) {
                console.error('[chat/langfuse teardown]', e)
              }
              // Fire-and-forget usage tracking and eval logging
              Promise.all([
                incrementUsage(chatProvider),
                logEval({
                  provider: chatProvider,
                  task: 'tool-calling',
                  input: message,
                  output: text,
                  latencyMs: 0,
                  tokensUsed: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
                  traceId: trace.traceId,
                }),
              ]).catch((e) => console.error('[chat/eval log error]', e))
            },
          })

          // If the stream errors mid-flight, `onError` maps it to a client
          // message. The retry loop only catches sync/init errors.
          return result.toUIMessageStreamResponse({
            // Attach tone (for TTS), trace id (for feedback) and a timestamp to
            // the assistant message.
            messageMetadata: ({ part }) =>
              part.type === 'start'
                ? { traceId: trace.traceId, speechTone, createdAt: new Date().toISOString() }
                : undefined,
            onError: (error: unknown) => {
              console.error('[chat/stream error]', error)
              return error instanceof Error ? error.message : 'An error occurred.'
            },
          })
        } catch (e) {
          lastError = e
          console.warn(
            `[chat] provider ${chatProvider} failed, trying next:`,
            (e as Error).message
          )
        }
      }

      // All candidates failed
      console.error('[chat] all providers failed:', lastError)
      trace.end()
      await langfuseSpanProcessor.forceFlush()
      return new Response(
        JSON.stringify({
          error: 'All providers are currently unavailable. Please try again shortly.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    })
  } catch (error) {
    console.error('[chat/route error]', error)
    return new Response(JSON.stringify({ error: 'Chat failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
