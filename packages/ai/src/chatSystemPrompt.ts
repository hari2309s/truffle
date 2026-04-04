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

export function buildSystemPrompt(params: {
  intent: QueryIntent
  toneGuidance: string
  snapshot: MonthlySnapshot
  transactions: Transaction[]
  anomalyRows: AnomalyRow[] | null
  goalRows: GoalRow[] | null
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
    projectedBalance,
    daysRemaining,
    dailySpend,
  } = params

  const transactionContext = NEEDS_TRANSACTIONS.includes(intent)
    ? "\nThe user's recent transactions:\n" +
      transactions
        .slice(0, 25)
        .map((t) => `${t.date}: ${t.description} (${t.category}) €${t.amount.toFixed(2)}`)
        .join('\n')
    : ''

  const anomalyContext =
    NEEDS_ANOMALIES.includes(intent) && anomalyRows && anomalyRows.length > 0
      ? '\nRecent anomalies detected:\n' +
        anomalyRows.map((a) => `- [${a.severity}] ${a.description}`).join('\n')
      : ''

  const goalsContext =
    goalRows && goalRows.length > 0
      ? '\nSavings goals:\n' +
        goalRows
          .map((g) => {
            const pct = (((g.saved_amount as number) / (g.target_amount as number)) * 100).toFixed(
              0
            )
            return `- ${g.emoji} ${g.name}: €${g.saved_amount} / €${g.target_amount} (${pct}%)${g.deadline ? ` by ${g.deadline}` : ''}`
          })
          .join('\n')
      : ''

  return `You are Truffle — a warm, calm, non-judgmental personal finance companion. You speak like a knowledgeable friend, never a banker or a lecturer.

Tone guidance for this conversation: ${toneGuidance}
${transactionContext}${anomalyContext}${goalsContext}

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
- When a user mentions a new goal, ALWAYS ask for the target amount in plain text first. Never call proposeGoal on the same turn.
- Only call proposeGoal when the user's current reply contains a specific amount for this goal. A number mentioned earlier for a different goal does not count — ask again.
- Once you have both a goal name and an amount from the user in the same exchange, call proposeGoal immediately. Do not describe it in text first.
- After a confirmed goal, respond with one warm sentence. If the user then mentions another goal, start fresh and ask for the new amount.
- If the user declined, respond warmly and do not re-propose.

Transaction tool rules:
- When the user wants to log a transaction, call proposeTransaction immediately with all fields you can infer from their message.
- Use a negative amount for expenses and a positive amount for income.
- Default the date to today if the user does not specify one.
- Choose the most appropriate category from the allowed list.
- If the merchant is not clear, omit it.
- After a confirmed transaction, respond with one warm sentence. Do not log the same transaction twice.
- If the user declined, respond warmly and do not re-propose.`
}
