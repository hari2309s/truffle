# Truffle Proactive Nudges — Developer Reference

## Overview

Proactive nudges are assistant messages that Truffle initiates on its own — without the user asking anything. They appear in the chat thread and are indistinguishable from a normal reply, except they carry an `is_proactive` flag in the database and a `{ type: 'proactive' }` annotation when loaded into the chat.

The system is **event-driven**: a nudge fires only when something actually happens (an anomaly is detected, a goal milestone is crossed, a deadline approaches, or a habit streak hits a milestone). There are no scheduled cron jobs and no timed polling. Most events produce no nudge at all.

```
Event occurs (transaction, goal update, habit log, page load)
        ↓
API route handler (awaited before response)
        ↓
Condition met?
    ├── No  → nothing
    └── Yes → dedup check (nudge_key unique index)
                  ├── Already sent → nothing
                  └── New → LangGraph proactive graph
                                ↓
                          agentResponse
                                ↓
                      INSERT chat_messages
                      (is_proactive = true)
                                ↓
                      Unread badge on Chat tab
```

> **Important:** All nudge calls are `await`-ed before the HTTP response is returned. Earlier fire-and-forget patterns were silently killed by the Vercel serverless runtime on response. The latency impact is minimal — the `alreadySent` dedup check short-circuits on subsequent requests, so the LLM call only happens once per nudge key.

---

## Triggers

| # | Trigger | Route | Handler | Nudge key | Dedup scope |
|---|---------|-------|---------|-----------|-------------|
| 1 | Anomaly detected | `POST /api/transactions` | `sendAnomalyNudge` | `anomaly:{txId}` | Once per transaction, ever |
| 2 | Goal milestone crossed | `PATCH /api/goals` | `sendGoalMilestoneNudge` | `goal:{goalId}:{pct}` | Once per goal per milestone |
| 3 | Goal at risk | `GET /api/goals` | `sendGoalAtRiskNudge` | `goal-at-risk:{goalId}:{YYYY-MM}` | Once per goal per month |
| 4 | Habit streak milestone | `PATCH /api/habits` | `sendHabitStreakNudge` | `habit-streak:{habitId}:{streak}` | Once per streak number |
| 5 | Habit check-in reminder | `GET /api/habits` | `sendHabitCheckInNudge` | `habit-checkin:{habitId}:{period}` | Once per habit per period |

### 1. Anomaly detected on a new transaction

**Where:** `apps/web/src/app/api/transactions/route.ts`

After `detectAnomalies` runs and returns inserted anomaly rows, `sendAnomalyNudge` is awaited for each anomaly. The detection excludes the just-inserted transactions from the statistical baseline (via a `NOT IN` filter) so the new amount doesn't inflate its own mean/σ.

```ts
const anomalies = await detectAnomalies(userId, results, db)
if (anomalies.length) {
  for (const anomaly of anomalies) {
    await sendAnomalyNudge({ userId, anomaly, transactions: typedTxs, snapshot: null })
  }
}
```

### 2. Savings goal crosses a milestone

**Where:** `apps/web/src/app/api/goals/route.ts` (PATCH handler)

After the goal's `saved_amount` is updated, the handler computes the before/after percentages and checks if any of the four milestones was crossed:

```ts
const MILESTONES = [25, 50, 75, 100] as const
const crossed = MILESTONES.find((m) => prevPct < m && newPct >= m)
```

Depositing €10 across four separate top-ups into a goal will still only produce one nudge when it crosses 50%.

### 3. Goal at risk (deadline approaching)

**Where:** `apps/web/src/app/api/goals/route.ts` (GET handler)

When goals are fetched, any goal with a deadline within 30 days that is not yet complete triggers an at-risk nudge. The nudge key includes the current month, so the user gets at most one at-risk reminder per goal per month.

```ts
const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / 86400000)
if (daysRemaining > 0 && daysRemaining <= 30 && remaining > 0) {
  await sendGoalAtRiskNudge({ userId, goal, daysRemaining, projectedShortfall: remaining })
}
```

### 4. Habit streak milestone

**Where:** `apps/web/src/app/api/habits/route.ts` (PATCH handler)

After a contribution is logged, the full streak is recomputed. If it lands on a milestone number (3, 5, 7, 10, 15, 20, 30, 50, 100), a celebration nudge fires.

```ts
const STREAK_MILESTONES = [3, 5, 7, 10, 15, 20, 30, 50, 100]
const streak = computeStreak(frequency, periods)
if (STREAK_MILESTONES.includes(streak)) {
  await sendHabitStreakNudge({ userId, habitId, habitName, habitEmoji, streak })
}
```

### 5. Habit check-in reminder

**Where:** `apps/web/src/app/api/habits/route.ts` (GET handler)

When habits are fetched, any active habit that hasn't been logged for the current period gets a gentle reminder — but only past the period midpoint (Thursday for weekly, 15th for monthly). This prevents nagging users early in the period.

```ts
const pastMidpoint = h.frequency === 'weekly' ? dayOfWeek >= 4 : dayOfMonth >= 15
if (!h.currentPeriodLogged && pastMidpoint) {
  await sendHabitCheckInNudge({ userId, habitId, habitName, ..., period, lastStreak })
}
```

---

## Deduplication

Dedup happens in two layers:

**Layer 1 — application check** (`proactive-nudge.ts`):

```ts
async function alreadySent(db, userId, nudgeKey): Promise<boolean> {
  const { data } = await db
    .from('chat_messages')
    .select('id')
    .eq('user_id', userId)
    .eq('nudge_key', nudgeKey)
    .limit(1)
  return (data?.length ?? 0) > 0
}
```

Avoids an unnecessary LLM call if the nudge was already sent.

**Layer 2 — DB constraint** (migration 005):

```sql
create unique index chat_messages_nudge_key_unique
  on chat_messages(user_id, nudge_key)
  where nudge_key is not null;
```

If two concurrent requests somehow both pass the application check (race condition), the second INSERT will fail at the DB level. This failure is caught and silently ignored — the user sees one nudge, not two.

---

## LangGraph Proactive Graph

**File:** `packages/ai/src/proactive.ts`

The proactive graph is a purpose-built LangGraph graph separate from the main conversational graph (`graph.ts`). It **skips the intent router** entirely — since the trigger already tells us what kind of insight to surface, routing by intent classification would be redundant and fragile.

```
START
  │
  ├── intent === 'anomaly_review'      →  anomalyNudge  →  END
  │
  ├── intent === 'habit_setting'       →  habitNudge    →  END
  │
  └── (everything else)                →  goalNudge     →  END
```

Each node calls a dedicated agent function:

| Node | Agent function | Used by triggers |
|---|---|---|
| `anomalyNudge` | `reviewAnomalies()` | Anomaly detected |
| `goalNudge` | `adviseSavingsGoals()` | Goal milestone, Goal at risk |
| `habitNudge` | `adviseHabit()` | Habit streak, Habit check-in |

The `userQuery` passed to each node is a synthetic prompt tailored for proactive context — not a real user message. All five triggers build their graph input via `buildGraphInput(trigger)`, which maps each trigger type to the appropriate intent, userQuery, and state fields.

The graph shares `GraphAnnotation` from `graph.ts` (exported) so state shapes stay consistent. Habit triggers don't need structured state fields — all context is encoded in the `userQuery` prompt, keeping the shared annotation unchanged.

### Why not reuse the main graph?

The main `buildTruffleGraph()` always starts with `START → intentRouter`. The intent router calls `routeIntent(userQuery)` which invokes an LLM call to classify the query — adding latency and a failure point for a classification we already know. The proactive graph eliminates this step.

---

## Server Nudge Helper

**File:** `apps/web/src/lib/proactive-nudge.ts`

Thin orchestration layer between the API routes and the AI package. Each function follows the same pattern:

1. Compute `nudge_key`
2. `alreadySent` dedup check against `chat_messages`
3. Dynamically import and call `generateProactiveMessage`
4. Write the result to `chat_messages` via `writeNudge`

```ts
sendAnomalyNudge({ userId, anomaly, transactions, snapshot })
sendGoalMilestoneNudge({ userId, goal, milestone, snapshot })
sendGoalAtRiskNudge({ userId, goal, daysRemaining, projectedShortfall })
sendHabitStreakNudge({ userId, habitId, habitName, habitEmoji, streak })
sendHabitCheckInNudge({ userId, habitId, habitName, habitEmoji, frequency, amount, period, lastStreak })
```

All five are `async` and **must be `await`-ed** in route handlers. Fire-and-forget patterns are killed by the Vercel serverless runtime before they complete. Each call site wraps the await in `try/catch` with `console.error` so failures are visible in function logs without crashing the response.

---

## Database Schema

**Migration:** `packages/db/src/migrations/005_proactive_messages.sql`

Three columns added to `chat_messages`:

| Column | Type | Purpose |
|---|---|---|
| `is_proactive` | `boolean NOT NULL DEFAULT false` | Distinguishes proactive messages from conversational ones |
| `read_at` | `timestamptz` | Null = unread; set when user opens Chat tab |
| `nudge_key` | `text` | Dedup key, e.g. `anomaly:uuid`, `goal:uuid:50`, `goal-at-risk:uuid:2026-04`, `habit-streak:uuid:5`, `habit-checkin:uuid:2026-W15` |

Two indexes:

```sql
-- Fast unread badge count query (partial index — only indexes proactive rows)
create index chat_messages_unread_proactive
  on chat_messages(user_id, is_proactive, read_at)
  where is_proactive = true;

-- DB-level dedup safety net
create unique index chat_messages_nudge_key_unique
  on chat_messages(user_id, nudge_key)
  where nudge_key is not null;
```

---

## Unread Badge

**File:** `apps/web/src/components/BottomNav.tsx`

`BottomNav` self-fetches the unread count on mount via a Supabase client query:

```ts
supabase
  .from('chat_messages')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', session.user.id)
  .eq('is_proactive', true)
  .is('read_at', null)
```

The badge appears as an amber pill on the Chat icon, capped at "9+". Count is fetched once on mount — it does not poll or subscribe to realtime changes. This is intentional: the badge reflects state at page load, not live updates.

---

## Mark as Read

**File:** `apps/web/src/app/chat/page.tsx`

When the chat page mounts and `userId` becomes available, all unread proactive messages are marked read immediately:

```ts
supabase
  .from('chat_messages')
  .update({ read_at: new Date().toISOString() })
  .eq('user_id', userId)
  .eq('is_proactive', true)
  .is('read_at', null)
```

This fires once, non-blocking. The badge on `BottomNav` clears the next time any page mounts (since `BottomNav` re-fetches on mount).

---

## Chat History Integration

Proactive messages are loaded alongside normal chat history in `chat/page.tsx`. The `is_proactive` column is selected and mapped to a `{ type: 'proactive' }` annotation on the `Message` object:

```ts
annotations: row.is_proactive ? [{ type: 'proactive' }] : undefined,
```

This means:

- The message appears in the thread in chronological order alongside user messages and conversational replies
- The agent sees it as an `assistant` message in future conversations — it knows it said this unprompted and can reference it ("as I mentioned when I flagged that Zara charge…")
- Visual differentiation can be added to `ChatBubble` by checking `annotations?.some(a => a.type === 'proactive')` — same pattern used for `offline_fallback` and `answered_just_now`

---

## Extending

### Add a new trigger (using an existing graph node)

1. Add a new interface to the `ProactiveTrigger` union in `proactive.ts`
2. Add a case to `getNudgeKey()` and `buildGraphInput()` — pick an existing `intent` that routes to the right node
3. Implement a `sendXxxNudge` function in `proactive-nudge.ts` following the existing pattern
4. `await` it in the relevant route handler, wrapped in `try/catch`:
   ```ts
   try {
     await sendXxxNudge({ userId, ... })
   } catch (e) {
     console.error('Xxx nudge failed:', e)
   }
   ```

### Add a new nudge type (new agent node)

1. Create an agent function in `packages/ai/src/agents/` (see `habitAdvisor.ts` for a minimal example)
2. Add a node function in `buildProactiveGraph()` that calls the agent
3. Wire it into the graph with `.addNode()`, a new branch in `routeByIntent`, and `.addEdge(nodeName, END)`
4. Map the new `intent` value in `buildGraphInput()` for your trigger type

### Change the message cap or cooldown

Currently dedup is permanent (one nudge per `nudge_key`, ever). To add time-based cooldown instead:

Replace the `alreadySent` query with a time-windowed check:

```ts
const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
const { data } = await db
  .from('chat_messages')
  .select('id')
  .eq('user_id', userId)
  .eq('nudge_key', nudgeKey)
  .gte('created_at', cutoff)
  .limit(1)
```

Remove the `nudge_key` unique index if you do this — otherwise the second nudge after cooldown will be blocked by the DB constraint.
