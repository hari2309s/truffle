# Habit Tracker Feature

Truffle's saving habits system lets users commit to a recurring saving target — weekly or monthly — directly from chat. Truffle tracks whether each period has been logged, computes a streak of consecutive completions, and surfaces all active habits in the Insights page where users can log a contribution with one tap.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [TypeScript Types](#typescript-types)
4. [Intent Routing](#intent-routing)
5. [API Routes](#api-routes)
6. [Period & Streak Logic](#period--streak-logic)
7. [Chat Integration](#chat-integration)
8. [UI Components](#ui-components)
9. [Data Flow — End to End](#data-flow--end-to-end)

---

## Overview

| What | How |
|---|---|
| Create a habit | User says "save €50 every week" in chat → Truffle proposes a confirmation card |
| Log a contribution | Tap "+ Log" in Insights, or Truffle reminds you in chat when a period is due |
| Streak | Consecutive periods (weeks or months) with at least one contribution logged |
| Persistence | `savings_habits` + `habit_contributions` tables in Supabase (PostgreSQL) |
| Insights | "Saving Habits" accordion section shows streak, period status, and total saved |

---

## Database Schema

Migration: [`packages/db/src/migrations/004_savings_habits.sql`](../packages/db/src/migrations/004_savings_habits.sql)

### `savings_habits`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated |
| `user_id` | `uuid` | FK → `auth.users`, cascade delete |
| `name` | `text` | Short habit name, e.g. "Emergency fund" |
| `amount` | `numeric` | Amount to save each period (EUR) |
| `frequency` | `text` | `'weekly'` or `'monthly'` |
| `emoji` | `text` | Single emoji chosen by the LLM |
| `is_active` | `boolean` | Soft-delete flag, default `true` |
| `created_at` | `timestamptz` | Auto-set |

Row Level Security: users can only read/write their own rows.

### `habit_contributions`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `habit_id` | `uuid` | FK → `savings_habits`, cascade delete |
| `user_id` | `uuid` | FK → `auth.users`, cascade delete |
| `period` | `text` | `'YYYY-MM'` (monthly) or `'YYYY-WNN'` (weekly ISO week) |
| `amount` | `numeric` | Amount logged for this period |
| `logged_at` | `timestamptz` | Auto-set |

**Unique constraint** on `(habit_id, period)` — one contribution per period per habit. The API uses `upsert` on this constraint so re-logging a period is idempotent.

---

## TypeScript Types

Defined in [`packages/types/src/index.ts`](../packages/types/src/index.ts):

```typescript
export interface SavingsHabit {
  id: string
  userId: string
  name: string
  amount: number
  frequency: 'weekly' | 'monthly'
  emoji: string
  isActive: boolean
  createdAt: string
}

export interface HabitContribution {
  id: string
  habitId: string
  userId: string
  period: string  // 'YYYY-MM' or 'YYYY-WNN'
  amount: number
  loggedAt: string
}

export interface HabitWithStats extends SavingsHabit {
  streak: number              // consecutive completed periods
  currentPeriodLogged: boolean
  totalSaved: number
}
```

`habit_setting` is also added to the `QueryIntent` union type, enabling the intent router to recognise habit-related requests.

---

## Intent Routing

File: [`packages/ai/src/prompts/intentRouter.prompt.ts`](../packages/ai/src/prompts/intentRouter.prompt.ts)

### Keyword fast-path

```typescript
habit_setting: [
  'save every week',
  'save every month',
  'weekly saving',
  'monthly saving',
  'set aside every',
  'put aside every',
  'put away every',
  'recurring saving',
  'save regularly',
  'save each week',
  'save each month',
  'i want to save regularly',
  'automatic saving',
  'savings habit',
]
```

Keyword matching runs first (O(n) string scan). If no keyword matches, the intent falls back to an LLM call with the full intent description, including:

> `habit_setting`: User wants to create a recurring saving habit ("save every week", "set aside monthly", "I want to save regularly", "recurring savings", "put away each month", "weekly saving")

### Follow-up detection

Because a user's reply like "€50 weekly" won't contain habit keywords, the chat route detects when the previous assistant message was asking for habit details and overrides the intent to `habit_setting`:

```typescript
const prevWasAskingForHabitDetails =
  !lastAssistant?.toolInvocations?.length &&
  (prevAssistantText.includes('how much') || prevAssistantText.includes('often') || ...) &&
  (prevAssistantText.includes('habit') || prevAssistantText.includes('save') || ...)
if (prevWasAskingForHabitDetails) intent = 'habit_setting'
```

---

## API Routes

File: [`apps/web/src/app/api/habits/route.ts`](../apps/web/src/app/api/habits/route.ts)

### `GET /api/habits?userId=<id>`

Returns all active habits with computed stats (streak, `currentPeriodLogged`, `totalSaved`).

**Response:**
```json
{
  "habits": [
    {
      "id": "uuid",
      "name": "Emergency fund",
      "amount": 50,
      "frequency": "weekly",
      "emoji": "🏦",
      "streak": 3,
      "currentPeriodLogged": false,
      "totalSaved": 150
    }
  ]
}
```

Stats are computed server-side: all contributions for the user's active habits are fetched in a single query, then grouped by `habit_id` to build period sets used for streak calculation.

**Proactive check-in reminder:** After computing stats, the handler checks each habit. If the current period is not logged and the period midpoint has passed (Thursday for weekly, 15th for monthly), a gentle check-in nudge is sent via `sendHabitCheckInNudge`. Dedup key: `habit-checkin:{habitId}:{period}` — one reminder per habit per period. See [Proactive Nudges](./proactive-nudges.md) for details.

### `POST /api/habits`

Creates a new savings habit.

**Body:**
```json
{
  "userId": "uuid",
  "name": "Emergency fund",
  "amount": 50,
  "frequency": "weekly",
  "emoji": "🏦"
}
```

### `PATCH /api/habits`

Logs a contribution for a specific period. Uses `upsert` on the `(habit_id, period)` unique constraint — idempotent.

**Body:**
```json
{
  "userId": "uuid",
  "habitId": "uuid",
  "period": "2026-W14",
  "amount": 50
}
```

**Proactive streak celebration:** After the upsert, the handler recomputes the full streak. If it lands on a milestone (3, 5, 7, 10, 15, 20, 30, 50, 100), a celebration nudge is sent via `sendHabitStreakNudge`. Dedup key: `habit-streak:{habitId}:{streak}` — one nudge per streak number per habit. See [Proactive Nudges](./proactive-nudges.md) for details.

---

## Period & Streak Logic

File: [`apps/web/src/lib/habits.ts`](../apps/web/src/lib/habits.ts)

### Period key format

| Frequency | Format | Example |
|---|---|---|
| Monthly | `YYYY-MM` | `2026-04` |
| Weekly | `YYYY-WNN` (ISO week, zero-padded) | `2026-W14` |

ISO week numbering: week 1 is the week containing the first Thursday of the year. Weeks start on Monday.

### `getCurrentPeriod(frequency, date?)`

Returns the period key for a given date (defaults to now). The weekly path computes the ISO week number using Thursday-anchor logic.

### `previousPeriod(frequency, current)`

Returns the period key immediately before `current`. For monthly, decrements the month. For weekly, subtracts 7 days from the Monday of the target week, then calls `getCurrentPeriod` on the result.

### `computeStreak(frequency, loggedPeriods)`

```
1. Sort logged periods descending
2. Start from the current period if it is logged, otherwise from the last logged period
3. Walk backwards via previousPeriod(), counting consecutive hits in the logged set
4. Return the count
```

A streak of 0 means no consecutive periods. A streak of 1 means only the current (or most recent) period is logged.

---

## Chat Integration

### `proposeHabit` tool

Defined in [`apps/web/src/app/api/chat/route.ts`](../apps/web/src/app/api/chat/route.ts):

```typescript
proposeHabit: tool({
  description: 'Show a recurring savings habit confirmation card...',
  parameters: z.object({
    name: z.string(),
    amount: z.number().positive(),
    frequency: z.enum(['weekly', 'monthly']),
    emoji: z.string(),
    pitch: z.string(),
  }),
})
```

Tool choice is `'auto'` for `habit_setting` (unlike `add_transaction` which forces the tool), because Truffle may need to ask for missing details — amount or frequency — before calling the tool.

### System prompt context

When habits exist, the system prompt receives two habit blocks:

**1. Full habits list** (always injected when habits exist):
```
Savings habits:
- 🏦 Emergency fund: €50/weekly (⏳ not yet logged 🔥 3-period streak)
```

**2. Proactive reminder** (injected on `greeting`, `general_advice`, and `spending_summary` intents when any habit is unlogged for the current period):
```
Habit reminder: The user has 1 saving habit(s) not yet logged this period: 🏦 Emergency fund.
You may gently mention this if it fits naturally.
```

### Habit tool rules in system prompt

```
- When a user wants to set up a recurring saving habit, call proposeHabit.
- If the user hasn't specified an amount, ask for one first in plain text — never guess.
- Only call proposeHabit when both a name/purpose AND an amount AND a frequency are clear.
- After a confirmed habit, respond with one warm encouraging sentence.
- If the user declined, respond warmly and do not re-propose.
```

---

## UI Components

### `HabitProposalCard`

File: [`apps/web/src/components/HabitProposalCard.tsx`](../apps/web/src/components/HabitProposalCard.tsx)

Shown in chat when `inv.toolName === 'proposeHabit'` and `inv.state === 'call'`. Displays the habit name, emoji, amount/frequency, and Truffle's pitch sentence. Two buttons: **No thanks** and **Add habit**.

On confirmation:
- `POST /api/habits` to persist the habit
- `queryClient.invalidateQueries(['habits', userId])` to refresh Insights
- Calls `onResult(true)` which triggers `addToolResult` on the chat, allowing Truffle to respond with a follow-up sentence

Returns `null` on done/declined — the persistent confirmation bubble is rendered by `ChatPage`'s `inv.state === 'result'` branch.

### `SavingsHabits`

File: [`apps/web/src/components/SavingsHabits.tsx`](../apps/web/src/components/SavingsHabits.tsx)

Rendered inside the "Saving Habits" accordion section in Insights. Fetches from `GET /api/habits` via TanStack Query (`queryKey: ['habits', userId]`).

Each `HabitCard` shows:
- Emoji + name
- Streak flame label (e.g. "🔥 3 in a row") — hidden when streak is 0
- Amount/frequency and total saved
- Period status: green "✓ done" chip if logged, amber "+ Log" button if not

Tapping "+ Log" calls `PATCH /api/habits` with the current period and default amount, then invalidates the query to re-render.

### `InsightsPage` integration

The "Saving Habits" section is placed after "Savings Goals" and before "Recurring Subscriptions":

```tsx
<InsightsAccordionSection title="Saving Habits" scrollRootRef={mainRef}>
  <SavingsHabits userId={userId} />
</InsightsAccordionSection>
```

---

## Data Flow — End to End

### Creating a habit via chat

```
User: "I want to save €50 every week for my emergency fund"
  ↓
intentRouter → 'habit_setting' (keyword: "save every week")
  ↓
chat/route.ts → enableTools = true, toolChoice = 'auto'
  ↓
LLM calls proposeHabit({ name: "Emergency fund", amount: 50, frequency: "weekly", emoji: "🏦", pitch: "..." })
  ↓
ChatPage renders HabitProposalCard
  ↓
User taps "Add habit"
  ↓
POST /api/habits → row inserted in savings_habits
queryClient.invalidateQueries(['habits'])
addToolResult({ confirmed: true })
  ↓
LLM streams follow-up: "Great — €50 every week is now set up. I'll remind you when it's due."
```

### Logging a contribution via Insights

```
User opens Insights → "Saving Habits" section
  ↓
GET /api/habits → habits with streak + currentPeriodLogged
  ↓                ↳ check-in nudge fires if period midpoint passed and not logged
HabitCard shows "+ Log" button (currentPeriodLogged = false)
  ↓
User taps "+ Log"
  ↓
PATCH /api/habits → upsert into habit_contributions (habit_id, period)
  ↓                  ↳ streak milestone nudge fires if streak hits 3/5/7/10/…
queryClient.invalidateQueries(['habits'])
  ↓
HabitCard re-renders with "✓ done" chip, streak increments
```
