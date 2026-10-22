import type { MonthlySnapshot, TransactionCategory, QueryIntent } from '@truffle/types'
import { CATEGORY_GUIDANCE } from './prompts/categorization.prompt'

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
  /** This month's limit (including any rolled-over amount). */
  amount: unknown
  spentAmount: unknown // computed by caller — current month spend in that category
  /** Computed by caller with the budget's own heads-up threshold. */
  status?: 'over' | 'headsUp' | 'onTrack'
}

function buildBudgetContext(budgetRows: BudgetRow[] | null, fmt: (n: number) => string): string {
  const budgets = (budgetRows ?? []).slice(0, 12)
  if (!budgets.length) return ''
  return (
    '\nMonthly budgets (spent this month / limit):\n' +
    budgets
      .map((b) => {
        const limit = b.amount as number
        const spent = b.spentAmount as number
        const pct = limit > 0 ? ((spent / limit) * 100).toFixed(0) : '0'
        const cat = sanitize(String(b.category).replace(/_/g, ' '))
        const state =
          b.status ?? (spent > limit ? 'over' : limit > 0 && spent / limit >= 0.8 ? 'headsUp' : 'onTrack')
        const status = state === 'over' ? ', over budget' : state === 'headsUp' ? ', near limit' : ''
        return `- ${cat}: ${fmt(spent)} / ${fmt(limit)} (${pct}% used${status})`
      })
      .join('\n')
  )
}

/**
 * The figures the assistant may state about the user's money, pre-formatted
 * exactly as the app shows them. Computed by the caller from the same
 * function as the Home statement card, so chat and Home always agree.
 */
export interface FinancialFacts {
  month: string
  income_this_month: string
  spent_this_month: string
  net_this_month: string
  daily_rate: string
  forecast_month_spend: string
  days_remaining: number
  /** Where the user ends the month at the current daily rate; null with nothing logged recently. */
  projected_close: string | null
  /** What projected_close is measured from. */
  projected_close_basis: 'net_of_everything_logged' | 'net_this_month'
  /** Net of every transaction the user has ever logged — not a bank balance. */
  net_of_everything_logged: string | null
  pace_vs_last_month: 'spending less than last month' | 'spending more than last month' | null
  /** e.g. "Netflix: €13.99 a month". */
  recurring: string[]
}

function buildFactsContext(f: FinancialFacts): string {
  const lines = [
    `month: ${f.month}`,
    `income_this_month: ${f.income_this_month}`,
    `spent_this_month: ${f.spent_this_month}`,
    `net_this_month: ${f.net_this_month} (income minus spending this month)`,
    `daily_rate: ${f.daily_rate} per day`,
    `forecast_month_spend: ${f.forecast_month_spend} (total spending by month end at the daily rate)`,
    `days_remaining: ${f.days_remaining}`,
    f.projected_close
      ? `projected_close: ${f.projected_close} (${
          f.projected_close_basis === 'net_this_month'
            ? 'net this month at month end'
            : 'net of everything logged, at month end'
        }, if spending continues at the daily rate)`
      : 'projected_close: not available (not enough logged yet)',
  ]
  if (f.net_of_everything_logged) {
    lines.push(`net_of_everything_logged: ${f.net_of_everything_logged} (all income minus all spending ever logged in Truffle)`)
  }
  if (f.pace_vs_last_month) lines.push(`pace_vs_last_month: ${f.pace_vs_last_month} at this point`)
  lines.push(
    f.recurring.length
      ? `recurring: ${f.recurring.map((r) => sanitize(r, 80)).join('; ')}`
      : 'recurring: none detected'
  )
  return `FINANCIAL FACTS — the only figures you may state about the user's money:\n${lines.map((l) => `- ${l}`).join('\n')}`
}

const FACT_RULES = `Rules for figures:
- Only state amounts that appear in FINANCIAL FACTS, budgets, goals, habits, spending by category or the transaction list. Never calculate, estimate or invent a new total.
- Quote every amount exactly as written, including cents (say "€1,794.52", not "about €1,800"). Never round, approximate or re-express a figure differently from how it is written.
- A leading "−" means a negative amount: write it as "minus €120.00" so it reads aloud correctly.
- Truffle does not know the user's bank or account balance. Never say or imply "in the bank", "in your account", "left in your account", "available", "your balance" or "balance". Income minus spending this month is "net this month". If net_of_everything_logged is given, call it "net of everything you've logged in Truffle" — never a bank balance.
- If the user asks for something these figures don't cover (like their bank balance), say plainly that Truffle doesn't have it.`

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
- If the user already has goals (listed in context), acknowledge them. Don't propose a duplicate of an existing goal — suggest modifying it or ask if they want a new one instead.
- After a confirmed goal, respond with one warm sentence. If the user then mentions another goal, start fresh and ask for the new amount.
- If the user declined, respond warmly and do not re-propose.`
  }
  if (intent === 'add_transaction') {
    return `Transaction tool rules:
- You MUST call proposeTransaction for real, past transactions. Do NOT describe or acknowledge the transaction in plain text — the user must confirm via the card before it is logged.
- NEVER say "I've logged that" or "I've noted that" without calling proposeTransaction first.
- ALWAYS use the exact amount the user states in their CURRENT message. NEVER substitute an amount from transaction history even if a similar transaction exists.
- For HYPOTHETICAL transactions ("I might buy", "I'm thinking about", "should I get"), do NOT call proposeTransaction. Instead, give helpful advice or an affordability check.
- Use a negative amount for expenses and a positive amount for income.
- Default the date to today if the user does not specify one.
- ${CATEGORY_GUIDANCE}
- If the merchant is not clear, omit it.
- After a confirmed transaction, respond with one warm sentence. Do not log the same transaction twice.
- If the user declined, respond warmly and do not re-propose.`
  }
  if (intent === 'habit_setting') {
    return `Habit tool rules:
- If the user provides a specific amount AND frequency (e.g. "save 50 euros every week"), call proposeHabit directly. Put a brief calculation in the pitch field (e.g. "50/week = ~200/month").
- If the user is vague ("I want to start saving regularly") and has NO existing habits, ask what amount and frequency they have in mind — do NOT guess.
- If the user already has saving habits (listed in context), acknowledge them first ("You're already saving X/week and Y/month"). Only propose a new habit if the user explicitly asks for one. Do NOT duplicate an existing habit.
- If the user asks you to calculate a saving amount, compute it from the goal and deadline they provided — do not guess or invent a number.
- After a confirmed habit, respond with one warm encouraging sentence.
- If the user declined, respond warmly and do not re-propose.`
  }
  return ''
}

// Live spend-by-category computed from actual transactions in route.ts.
// Always included for all financial intents — avoids stale snapshot data
// and doesn't depend on intent classification to be correct.
function buildSpendByCategoryContext(
  spendByCategory: Record<string, number> | null,
  fmt: (n: number) => string
): string {
  if (!spendByCategory) return ''
  const entries = Object.entries(spendByCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
  if (!entries.length) return ''
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  return (
    '\nCurrent month spending by category:\n' +
    entries
      .map(([cat, amount]) => {
        const pct = total > 0 ? ((amount / total) * 100).toFixed(0) : '0'
        return `- ${cat.replace(/_/g, ' ')}: ${fmt(amount)} (${pct}%)`
      })
      .join('\n') +
    `\n- Total: ${fmt(total)}`
  )
}

/**
 * Earlier months the user asked about (from monthly summaries). The current
 * month always comes from FINANCIAL FACTS instead, so the two can't disagree.
 */
function buildPastMonthsContext(
  snapshots: MonthlySnapshot[],
  currentMonth: string,
  fmt: (n: number) => string
): string {
  const past = snapshots.filter((s) => s.month !== currentMonth && (s.totalIncome || s.totalExpenses))
  if (!past.length) return ''
  const net = (s: MonthlySnapshot) => `${s.balance < 0 ? '−' : ''}${fmt(s.balance)}`
  return (
    '\nEarlier months (income, spending, net = income minus spending):\n' +
    past
      .map((s) => `- ${s.month}: income ${fmt(s.totalIncome)}, spending ${fmt(Math.abs(s.totalExpenses))}, net ${net(s)}`)
      .join('\n')
  )
}

export function buildSystemPrompt(params: {
  intent: QueryIntent
  userName?: string
  toneGuidance: string
  snapshots: MonthlySnapshot[]
  currentMonth: string
  transactions: Transaction[]
  anomalyRows: AnomalyRow[] | null
  goalRows: GoalRow[] | null
  habitRows: HabitRow[] | null
  budgetRows: BudgetRow[] | null
  spendByCategory?: Record<string, number> | null
  facts: FinancialFacts
  currencyCode?: string
  locale?: string
}): string {
  const {
    intent,
    userName,
    toneGuidance,
    snapshots,
    currentMonth,
    transactions,
    anomalyRows,
    goalRows,
    habitRows,
    budgetRows,
    spendByCategory,
    facts,
    currencyCode = 'EUR',
  } = params

  const decimals = 2
  const symbol = currencyCode === 'GBP' ? '£' : currencyCode === 'USD' ? '$' : '€'
  // Matches the app's own formatting ("€1,794.52") so quoted figures read the same.
  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const fmt = (n: number) => money.format(Math.abs(n))

  const languageInstruction = ''
  // user_metadata.name is user-writable — sanitize like every other
  // user-supplied string here to block prompt injection via the name.
  const trimmedName = sanitize(userName, 40)
  const nameInstruction = trimmedName
    ? ` The user's name is ${trimmedName} — use their first name naturally now and then, not in every sentence.`
    : ''

  if (intent === 'greeting') {
    return `You are Truffle — a warm, familiar personal finance companion. The user is just saying hello.
Say hi back like a friend who's genuinely glad to hear from them — one or two easy, natural sentences${trimmedName ? `, using their first name (${trimmedName})` : ''}. A little warmth or personality is welcome; vary how you open so it never sounds canned. Do not use emoji. Do not bring up their finances, balance, goals, or numbers unless they ask.${languageInstruction}`
  }

  const transactionContext = buildTransactionContext(intent, transactions, fmt)
  const anomalyContext = buildAnomalyContext(intent, anomalyRows)
  const goalsContext = buildGoalsContext(goalRows, fmt)
  const { context: habitsContext, pendingHabits } = buildHabitsContext(habitRows, fmt)
  const habitReminderContext = buildHabitReminderContext(intent, pendingHabits)
  const budgetContext = buildBudgetContext(budgetRows, fmt)
  const toolRules = buildToolRules(intent)
  const factsContext = buildFactsContext(facts)
  const pastMonthsContext = buildPastMonthsContext(snapshots, currentMonth, fmt)
  const categoryContext = buildSpendByCategoryContext(spendByCategory ?? null, fmt)

  return `You are Truffle — a warm, calm, non-judgmental personal finance companion. You speak like a close friend who happens to be good with money, never a banker or a lecturer.${languageInstruction}${nameInstruction}

Voice: you're a familiar, friendly presence — someone who's genuinely glad they asked. Talk the way you would out loud: contractions, an easy rhythm, a bit of personality. Open with a real human reaction to what they just said ("Oh nice", "Ooh, good timing", "Honestly? Not bad at all", "Yeah, let's look") and let a little feeling through — quietly pleased when they're doing well, warm and steady when it's tight. Vary your openings; never reach for the same phrase twice in a row. You are not a statement, a dashboard, or a support script — if a sentence sounds like it could be a push notification, rewrite it.

Tone guidance for this conversation: ${toneGuidance}
${transactionContext}${anomalyContext}${goalsContext}${habitsContext}${budgetContext}${habitReminderContext}

${factsContext}${pastMonthsContext}${categoryContext}

${FACT_RULES}

Intent detected: ${intent}

Response guidelines:
- Keep it short and spoken — usually 2 to 4 sentences, read aloud. Warmth matters more than completeness: pick the one or two figures that tell the story, quoted exactly as written. Don't recite every figure you were given.
- What you say to the user is plain spoken words only — no emoji, asterisks, markdown, bullet points or lists (this does not apply to the emoji argument of a tool call)
- Ground what you say in the real transaction data, but say it like a person, not a ledger.
- Never lecture, shame, or pile on numbers. Celebrate wins like you mean it. When it's tight, be reassuring and human about it.
- Don't hand out unsolicited tips or multi-point advice. One warm, encouraging closing thought is welcome; a to-do list is not.
- If an earlier message in this conversation gave a figure that differs from FINANCIAL FACTS, FINANCIAL FACTS is right — use it.

Register to aim for:
- Flat, avoid this: "Income ${symbol}3,500.00. Spending ${symbol}1,199.50. Net ${symbol}2,300.50. Projected close ${symbol}98."
- Wrong, never this: "You've got about ${symbol}2,300 left in the bank." (Truffle doesn't know their bank balance, and the figure is rounded.)
- Warm, aim for this: "Honestly? You're in good shape. You've spent ${symbol}1,199.50 of the ${symbol}3,500.00 that came in, so you're ${symbol}2,300.50 net this month — and at this pace you'd close the month at ${symbol}98 net."

${toolRules}`
}
