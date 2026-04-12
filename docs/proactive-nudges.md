# Truffle Proactive Nudges — Developer Reference

## Overview

Proactive nudges are assistant messages that Truffle initiates on its own — without the user asking anything. They appear in the chat thread and are indistinguishable from a normal reply, except they carry an `is_proactive` flag in the database and a `{ type: 'proactive' }` annotation when loaded into the chat.

The system is **event-driven**: a nudge fires only when something actually happens (an anomaly is detected, a goal milestone is crossed). There are no scheduled cron jobs and no timed polling. Most events produce no nudge at all.

```
User adds transaction
        ↓
POST /api/transactions
        ↓
Anomaly detection runs
        ↓
Anomaly found?
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

---

## Triggers

### 1. Anomaly detected on a new transaction

**Where:** `apps/web/src/app/api/transactions/route.ts`

After `detectAnomalies` runs and returns inserted anomaly rows, a non-blocking `.then()` fires `sendAnomalyNudge` for each anomaly. The response has already been sent to the client before the nudge even starts.

```ts
detectAnomalies(userId, results, db)
  .then(async (anomalies) => {
    if (!anomalies.length) return
    const typedTxs = results.map((r) => ({ ...r } as unknown as Transaction))
    for (const anomaly of anomalies) {
      sendAnomalyNudge({ userId, anomaly, transactions: typedTxs, snapshot: null })
        .catch((e) => console.warn('Proactive anomaly nudge failed (non-fatal):', e))
    }
  })
  .catch(...)
```

The `nudge_key` for an anomaly nudge is `anomaly:{transactionId}` — one nudge per anomalous transaction, ever.

### 2. Savings goal crosses a milestone

**Where:** `apps/web/src/app/api/goals/route.ts` (PATCH handler)

After the goal's `saved_amount` is updated, the handler computes the before/after percentages and checks if any milestone was crossed:

```ts
const MILESTONES = [25, 50, 75, 100] as const
const crossed = MILESTONES.find((m) => prevPct < m && newPct >= m)
```

If a milestone is crossed, `sendGoalMilestoneNudge` fires non-blocking.

The `nudge_key` is `goal:{goalId}:{milestone}` — one nudge per goal per milestone, ever. Depositing €10 across four separate top-ups into a goal will still only produce one nudge when it crosses 50%.

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
  ├── intent === 'anomaly_review'  →  anomalyNudge  →  END
  │
  └── intent === 'savings_goal_check'  →  goalNudge  →  END
```

Both nodes call the same agent functions already used in the conversational graph:

| Node | Agent function | Prompt template |
|---|---|---|
| `anomalyNudge` | `reviewAnomalies()` | `anomalyReviewer.prompt.ts` |
| `goalNudge` | `adviseSavingsGoals()` | `savingsGoalAdvisor.prompt.ts` |

The `userQuery` passed to each node is a synthetic prompt tailored for proactive context — not a real user message:

```ts
// Anomaly
userQuery: `You just detected an anomaly: "${anomaly.description}". Write a brief, warm proactive message for the user — no more than 2-3 sentences.`

// Goal milestone
userQuery: `The user just hit ${milestone}% of their "${goal.name}" goal. Celebrate this briefly and mention their momentum — 1-2 sentences.`
```

The graph shares `GraphAnnotation` from `graph.ts` (exported) so state shapes stay consistent.

### Why not reuse the main graph?

The main `buildTruffleGraph()` always starts with `START → intentRouter`. The intent router calls `routeIntent(userQuery)` which invokes an LLM call to classify the query — adding latency and a failure point for a classification we already know. The proactive graph eliminates this step.

---

## Server Nudge Helper

**File:** `apps/web/src/lib/proactive-nudge.ts`

Thin orchestration layer between the API routes and the AI package. Responsible for:

1. Dedup check against `chat_messages`
2. Importing and calling `generateProactiveMessage`
3. Writing the result to `chat_messages`

```ts
export async function sendAnomalyNudge(params: {
  userId: string
  anomaly: Anomaly
  transactions: Transaction[]
  snapshot: MonthlySnapshot | null
})

export async function sendGoalMilestoneNudge(params: {
  userId: string
  goal: SavingsGoal
  milestone: 25 | 50 | 75 | 100
  snapshot: MonthlySnapshot | null
})
```

Both functions are `async` and are always called in a non-blocking `.catch()` chain — they must never block the API response.

`snapshot` is `null` in current triggers because fetching the monthly snapshot would add a DB round-trip. The agent falls back to `emptySnapshot()` (zeroed values) which is fine — milestone celebrations don't depend on income/expense totals, and anomaly descriptions are self-contained.

---

## Database Schema

**Migration:** `packages/db/src/migrations/005_proactive_messages.sql`

Three columns added to `chat_messages`:

| Column | Type | Purpose |
|---|---|---|
| `is_proactive` | `boolean NOT NULL DEFAULT false` | Distinguishes proactive messages from conversational ones |
| `read_at` | `timestamptz` | Null = unread; set when user opens Chat tab |
| `nudge_key` | `text` | Dedup key, e.g. `anomaly:uuid` or `goal:uuid:50` |

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

### Add a new trigger

1. Identify the API route where the event occurs
2. Implement a `sendXxxNudge` function in `proactive-nudge.ts` with a unique `nudge_key` scheme
3. Call it non-blocking at the end of the relevant route handler:
   ```ts
   sendXxxNudge({ userId, ... })
     .catch((e) => console.warn('Proactive xxx nudge failed (non-fatal):', e))
   ```

### Add a new nudge type (new agent node)

1. Add a node function in `proactive.ts` that calls the relevant agent
2. Add it to the graph with `.addNode()` and a new branch in `routeByIntent`
3. Add the new intent to `GraphAnnotation` state if needed
4. Pass `intent: 'your_new_intent'` from the trigger

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
