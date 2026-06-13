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

type BudgetRow = {
  category: unknown
  amount: unknown
  spentAmount: unknown // computed by caller — current month spend in that category
}

function buildBudgetContext(budgetRows: BudgetRow[] | null, fmt: (n: number) => string): string {
  const budgets = (budgetRows ?? []).slice(0, 12)
  if (!budgets.length) return ''
  return (
    '\nMonthly budgets:\n' +
    budgets
      .map((b) => {
        const limit = b.amount as number
        const spent = b.spentAmount as number
        const pct = limit > 0 ? ((spent / limit) * 100).toFixed(0) : '0'
        const cat = sanitize(String(b.category).replace(/_/g, ' '))
        const status =
          spent > limit ? ' ⚠️ over budget' : spent / limit >= 0.8 ? ' (near limit)' : ''
        return `- ${cat}: ${fmt(spent)} / ${fmt(limit)} (${pct}% used${status})`
      })
      .join('\n')
  )
}

// Intents that need full transaction data
const NEEDS_TRANSACTIONS: QueryIntent[] = [
  'spending_summary',
  'affordability_check',
  'anomaly_review',
  'category_breakdown',
  'goal_setting',
  'add_transaction',
  'general_advice', // follow-up clarifications must retain transaction grounding
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

function buildTransactionContext(
  intent: QueryIntent,
  transactions: Transaction[],
  fmt: (n: number) => string
): string {
  if (!NEEDS_TRANSACTIONS.includes(intent)) return ''
  return (
    "\nThe user's recent transactions:\n" +
    transactions
      .map((t) => `${t.date}: ${sanitize(t.description)} (${t.category}) ${fmt(t.amount)}`)
      .join('\n')
  )
}

function buildAnomalyContext(intent: QueryIntent, anomalyRows: AnomalyRow[] | null): string {
  if (!NEEDS_ANOMALIES.includes(intent) || !anomalyRows?.length) return ''
  return (
    '\nRecent anomalies detected:\n' +
    anomalyRows.map((a) => `- [${a.severity}] ${sanitize(a.description, 200)}`).join('\n')
  )
}

function buildGoalsContext(goalRows: GoalRow[] | null, fmt: (n: number) => string): string {
  const goals = (goalRows ?? []).slice(0, 10)
  if (!goals.length) return ''
  return (
    '\nSavings goals:\n' +
    goals
      .map((g) => {
        const target = g.target_amount as number
        const saved = g.saved_amount as number
        const pct = target > 0 ? ((saved / target) * 100).toFixed(0) : '0'
        return `- ${g.emoji} ${sanitize(g.name)}: ${fmt(saved)} / ${fmt(target)} (${pct}%)${g.deadline ? ` by ${g.deadline}` : ''}`
      })
      .join('\n')
  )
}

type HabitsContextResult = { context: string; pendingHabits: HabitRow[] }

function buildHabitsContext(
  habitRows: HabitRow[] | null,
  fmt: (n: number) => string
): HabitsContextResult {
  const habits = (habitRows ?? []).slice(0, 10)
  if (!habits.length) return { context: '', pendingHabits: [] }
  const pendingHabits = habits.filter((h) => !h.currentPeriodLogged)
  const context =
    '\nSavings habits:\n' +
    habits
      .map((h) => {
        const streakStr = (h.streak as number) > 0 ? ` 🔥 ${h.streak}-period streak` : ''
        const status = h.currentPeriodLogged ? '✓ logged this period' : '⏳ not yet logged'
        return `- ${h.emoji} ${sanitize(h.name)}: ${fmt(h.amount as number)}/${h.frequency} (${status}${streakStr})`
      })
      .join('\n')
  return { context, pendingHabits }
}

function buildHabitReminderContext(intent: QueryIntent, pendingHabits: HabitRow[]): string {
  if (!SHOW_HABIT_REMINDERS.includes(intent) || !pendingHabits.length) return ''
  return `\nHabit reminder: The user has ${pendingHabits.length} saving habit(s) not yet logged this period: ${pendingHabits.map((h) => `${h.emoji} ${sanitize(h.name)}`).join(', ')}. You may gently mention this if it fits naturally.`
}

function buildToolRules(intent: QueryIntent): string {
  if (intent === 'goal_setting') {
    return `Goal tool rules:
- When a user mentions a new goal, ALWAYS ask for the target amount in plain text first. Never call proposeGoal on the same turn.
- Only call proposeGoal when the user's current reply contains a specific amount for this goal. A number mentioned earlier for a different goal does not count — ask again.
- Once you have both a goal name and an amount from the user in the same exchange, call proposeGoal immediately. Do not describe it in text first.
- After a confirmed goal, respond with one warm sentence. If the user then mentions another goal, start fresh and ask for the new amount.
- If the user declined, respond warmly and do not re-propose.`
  }
  if (intent === 'add_transaction') {
    return `Transaction tool rules:
- You MUST call proposeTransaction. Do NOT describe or acknowledge the transaction in plain text — the user must confirm via the card before it is logged.
- NEVER say "I've logged that" or "I've noted that" without calling proposeTransaction first.
- ALWAYS use the exact amount the user states in their CURRENT message. NEVER substitute an amount from transaction history even if a similar transaction exists.
- Use a negative amount for expenses and a positive amount for income.
- Default the date to today if the user does not specify one.
- Choose the most appropriate category from the allowed list.
- If the merchant is not clear, omit it.
- After a confirmed transaction, respond with one warm sentence. Do not log the same transaction twice.
- If the user declined, respond warmly and do not re-propose.`
  }
  if (intent === 'habit_setting') {
    return `Habit tool rules:
- ALWAYS respond in plain text first: explain your reasoning, show the calculation (e.g. €30,000 ÷ 9 months = €3,333/month), and confirm the amount with the user.
- Only call proposeHabit AFTER you have given a text explanation. Never call it as your first and only response.
- If the user asks you to calculate a saving amount, compute it from the goal and deadline they provided — do not guess or invent a number.
- After a confirmed habit, respond with one warm encouraging sentence.
- If the user declined, respond warmly and do not re-propose.`
  }
  return ''
}

function buildSnapshotContext(
  snapshots: MonthlySnapshot[],
  projectedBalance: number,
  daysRemaining: number,
  dailySpend: number,
  currentMonth: string,
  fmt: (n: number) => string
): string {
  if (snapshots.length === 1) {
    const s = snapshots[0]!
    const isCurrentMonth = s.month === currentMonth
    const projectionLine = isCurrentMonth
      ? `\n- Projected end of month: ${fmt(projectedBalance)} (${daysRemaining} days remaining, spending ~${fmt(dailySpend)}/day)`
      : ''
    return `Monthly summary (${s.month}):
- Income: ${fmt(s.totalIncome)}
- Expenses: ${fmt(Math.abs(s.totalExpenses))}
- Balance: ${fmt(s.balance)}${projectionLine}`
  }

  const totalIncome = snapshots.reduce((sum, s) => sum + s.totalIncome, 0)
  const totalExpenses = snapshots.reduce((sum, s) => sum + Math.abs(s.totalExpenses), 0)
  const totalBalance = snapshots.reduce((sum, s) => sum + s.balance, 0)

  const lines = snapshots.map((s) => {
    const projectionNote =
      s.month === currentMonth
        ? ` (projected end: ${fmt(projectedBalance)}, ${daysRemaining}d remaining)`
        : ''
    return `- ${s.month}: income ${fmt(s.totalIncome)}, expenses ${fmt(Math.abs(s.totalExpenses))}, balance ${fmt(s.balance)}${projectionNote}`
  })

  return `Monthly summary (${snapshots[0]!.month} – ${snapshots[snapshots.length - 1]!.month}):
${lines.join('\n')}
- Totals: income ${fmt(totalIncome)}, expenses ${fmt(totalExpenses)}, net balance ${fmt(totalBalance)}`
}

export function buildSystemPrompt(params: {
  intent: QueryIntent
  toneGuidance: string
  snapshots: MonthlySnapshot[]
  currentMonth: string
  transactions: Transaction[]
  anomalyRows: AnomalyRow[] | null
  goalRows: GoalRow[] | null
  habitRows: HabitRow[] | null
  budgetRows: BudgetRow[] | null
  projectedBalance: number
  daysRemaining: number
  dailySpend: number
  currencyCode?: string
  locale?: string
}): string {
  const {
    intent,
    toneGuidance,
    snapshots,
    currentMonth,
    transactions,
    anomalyRows,
    goalRows,
    habitRows,
    budgetRows,
    projectedBalance,
    daysRemaining,
    dailySpend,
    currencyCode = 'EUR',
    locale = 'en',
  } = params

  const decimals = currencyCode === 'JPY' ? 0 : 2
  const symbol =
    currencyCode === 'JPY' ? '¥' : currencyCode === 'GBP' ? '£' : currencyCode === 'USD' ? '$' : '€'
  const fmt = (n: number) => `${symbol}${Math.abs(n).toFixed(decimals)}`

  const languageInstruction =
    locale === 'ja'
      ? '\n\nIMPORTANT: Respond entirely in Japanese (日本語). Use natural, friendly Japanese suitable for a personal finance app.'
      : locale === 'de'
        ? '\n\nIMPORTANT: Respond entirely in German (Deutsch).'
        : ''

  if (intent === 'greeting') {
    return `You are Truffle — a warm, calm personal finance companion. The user is just saying hello.
Respond with a single warm, brief greeting. Do not mention their finances, balance, goals, or any financial data unprompted. Just say hi back.${languageInstruction}`
  }

  const transactionContext = buildTransactionContext(intent, transactions, fmt)
  const anomalyContext = buildAnomalyContext(intent, anomalyRows)
  const goalsContext = buildGoalsContext(goalRows, fmt)
  const { context: habitsContext, pendingHabits } = buildHabitsContext(habitRows, fmt)
  const habitReminderContext = buildHabitReminderContext(intent, pendingHabits)
  const budgetContext = buildBudgetContext(budgetRows, fmt)
  const toolRules = buildToolRules(intent)
  const snapshotContext = buildSnapshotContext(
    snapshots,
    projectedBalance,
    daysRemaining,
    dailySpend,
    currentMonth,
    fmt
  )

  return `You are Truffle — a warm, calm, non-judgmental personal finance companion. You speak like a knowledgeable friend, never a banker or a lecturer.${languageInstruction}

Tone guidance for this conversation: ${toneGuidance}
${transactionContext}${anomalyContext}${goalsContext}${habitsContext}${budgetContext}${habitReminderContext}

${snapshotContext}

Intent detected: ${intent}

Response guidelines:
- Be concise (2-4 sentences) — your response will be read aloud
- Use actual numbers from the transaction data
- No bullet points or lists — use natural spoken language
- Never lecture or shame. Celebrate wins. Reassure when things are tight.
- Do not give unsolicited tips, suggestions, or advice. Only advise if the user explicitly asks for it.
- If you cited specific amounts in a previous message this conversation, those are accurate — do not retract them. The monthly summary reflects only the current period; historical data lives in the transaction list above.

${toolRules}`
}
