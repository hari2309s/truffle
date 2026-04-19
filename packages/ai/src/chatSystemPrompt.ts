import type { MonthlySnapshot, TransactionCategory, QueryIntent } from '@truffle/types'

type Transaction = {
  date: string
  description: string
  category: TransactionCategory
  amount: number
}

type AnomalyRow = { severity: unknown; description: unknown }
type GoalRow = {
  emoji: unknown
  name: unknown
  saved_amount: unknown
  target_amount: unknown
  deadline: unknown
}
type HabitRow = {
  emoji: unknown
  name: unknown
  amount: unknown
  frequency: unknown
  streak: unknown
  currentPeriodLogged: unknown
}

// Intents that need full transaction data
const NEEDS_TRANSACTIONS: QueryIntent[] = [
  'spending_summary',
  'affordability_check',
  'anomaly_review',
  'category_breakdown',
  'goal_setting',
  'add_transaction',
]

// Intents that need anomaly context
const NEEDS_ANOMALIES: QueryIntent[] = ['anomaly_review', 'spending_summary']

// Intents where pending habit reminders are shown proactively
const SHOW_HABIT_REMINDERS: QueryIntent[] = ['greeting', 'general_advice', 'spending_summary']

// Strips newlines and control chars to block prompt injection via user-supplied text.
// Limits length so a single field can't balloon the context window.
function sanitize(text: unknown, maxLen = 120): string {
  return String(text ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLen)
}

export function buildSystemPrompt(params: {
  intent: QueryIntent
  toneGuidance: string
  snapshot: MonthlySnapshot
  transactions: Transaction[]
  anomalyRows: AnomalyRow[] | null
  goalRows: GoalRow[] | null
  habitRows: HabitRow[] | null
  projectedBalance: number
  daysRemaining: number
  dailySpend: number
}): string {
  const {
    intent,
    toneGuidance,
    snapshot,
    transactions,
    anomalyRows,
    goalRows,
    habitRows,
    projectedBalance,
    daysRemaining,
    dailySpend,
  } = params

  const transactionContext = NEEDS_TRANSACTIONS.includes(intent)
    ? "\nThe user's recent transactions:\n" +
      transactions
        .slice(0, 25)
        .map(
          (t) =>
            `${t.date}: ${sanitize(t.description)} (${t.category}) €${t.amount.toFixed(2)}${t.category === 'income' || !t.category ? '' : ''}`
        )
        .join('\n')
    : ''

  const anomalyContext =
    NEEDS_ANOMALIES.includes(intent) && anomalyRows && anomalyRows.length > 0
      ? '\nRecent anomalies detected:\n' +
        anomalyRows.map((a) => `- [${a.severity}] ${sanitize(a.description, 200)}`).join('\n')
      : ''

  // Cap at 10 to keep prompt size bounded
  const displayGoals = (goalRows ?? []).slice(0, 10)
  const displayHabits = (habitRows ?? []).slice(0, 10)

  const goalsContext =
    displayGoals.length > 0
      ? '\nSavings goals:\n' +
        displayGoals
          .map((g) => {
            const target = g.target_amount as number
            const pct = target > 0 ? (((g.saved_amount as number) / target) * 100).toFixed(0) : '0'
            return `- ${g.emoji} ${sanitize(g.name)}: €${g.saved_amount} / €${target} (${pct}%)${g.deadline ? ` by ${g.deadline}` : ''}`
          })
          .join('\n')
      : ''

  const pendingHabits = displayHabits.filter((h) => !h.currentPeriodLogged)

  const habitsContext =
    displayHabits.length > 0
      ? '\nSavings habits:\n' +
        displayHabits
          .map((h) => {
            const streakStr = (h.streak as number) > 0 ? ` 🔥 ${h.streak}-period streak` : ''
            const status = h.currentPeriodLogged ? '✓ logged this period' : '⏳ not yet logged'
            return `- ${h.emoji} ${sanitize(h.name)}: €${h.amount}/${h.frequency} (${status}${streakStr})`
          })
          .join('\n')
      : ''

  const habitReminderContext =
    SHOW_HABIT_REMINDERS.includes(intent) && pendingHabits.length > 0
      ? `\nHabit reminder: The user has ${pendingHabits.length} saving habit(s) not yet logged this period: ${pendingHabits.map((h) => `${h.emoji} ${sanitize(h.name)}`).join(', ')}. You may gently mention this if it fits naturally.`
      : ''

  if (intent === 'greeting') {
    return `You are Truffle — a warm, calm personal finance companion. The user is just saying hello.
Respond with a single warm, brief greeting. Do not mention their finances, balance, goals, or any financial data unprompted. Just say hi back.`
  }

  return `You are Truffle — a warm, calm, non-judgmental personal finance companion. You speak like a knowledgeable friend, never a banker or a lecturer.

Tone guidance for this conversation: ${toneGuidance}
${transactionContext}${anomalyContext}${goalsContext}${habitsContext}${habitReminderContext}

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

${
  intent === 'goal_setting'
    ? `Goal tool rules:
- When a user mentions a new goal, ALWAYS ask for the target amount in plain text first. Never call proposeGoal on the same turn.
- Only call proposeGoal when the user's current reply contains a specific amount for this goal. A number mentioned earlier for a different goal does not count — ask again.
- Once you have both a goal name and an amount from the user in the same exchange, call proposeGoal immediately. Do not describe it in text first.
- After a confirmed goal, respond with one warm sentence. If the user then mentions another goal, start fresh and ask for the new amount.
- If the user declined, respond warmly and do not re-propose.`
    : intent === 'add_transaction'
      ? `Transaction tool rules:
- You MUST call proposeTransaction. Do NOT describe or acknowledge the transaction in plain text — the user must confirm via the card before it is logged.
- NEVER say "I've logged that" or "I've noted that" without calling proposeTransaction first.
- Use a negative amount for expenses and a positive amount for income.
- Default the date to today if the user does not specify one.
- Choose the most appropriate category from the allowed list.
- If the merchant is not clear, omit it.
- After a confirmed transaction, respond with one warm sentence. Do not log the same transaction twice.
- If the user declined, respond warmly and do not re-propose.`
      : intent === 'habit_setting'
        ? `Habit tool rules:
- You MUST call proposeHabit for this recurring saving habit. Do NOT describe it in plain text.
- The amount and frequency are provided — call proposeHabit now with the details the user stated.
- After a confirmed habit, respond with one warm encouraging sentence.
- If the user declined, respond warmly and do not re-propose.`
        : ''
}`
}
