# Truffle Offline Capability — Developer Reference

## Overview

Truffle's offline support is a layered system. Each layer degrades independently — if the service worker isn't supported, the client falls back to `navigator.onLine` checks; if IndexedDB fails, the UI still works without cached data. No single point of failure breaks the app.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / PWA                        │
│                                                          │
│  ┌──────────────┐   ┌─────────────────────────────────┐ │
│  │ Service      │   │ Client App                      │ │
│  │ Worker       │   │                                 │ │
│  │ (sw.js)      │   │  useNetworkStatus               │ │
│  │              │   │  useFinancialChat (offline mode) │ │
│  │ - Asset      │   │  TransactionList (cache fallback)│ │
│  │   cache      │   │  AddTransactionForm (queue)      │ │
│  │ - API cache  │   │  SavingsGoals (cache + queue)   │ │
│  │ - BG sync    │   │  SavingsHabits (cache + queue)  │ │
│  └──────┬───────┘   │  InsightsPage (anomaly cache)   │ │
│         │           │  OfflineBanner                  │ │
│         │           └───────────────┬─────────────────┘ │
│         └──────────┬────────────────┘                    │
│                    ▼                                     │
│          ┌─────────────────┐                             │
│          │  IndexedDB      │                             │
│          │  (truffle-      │                             │
│          │   offline v3)   │                             │
│          │                 │                             │
│          │  transactions   │                             │
│          │  queuedActions  │                             │
│          │  pendingChat    │                             │
│          │  Messages       │                             │
│          │  goals          │                             │
│          │  habitsWithStats│                             │
│          │  anomalies      │                             │
│          └─────────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

---

## Feature Coverage

| Feature | Offline read | Offline write | Notes |
|---|---|---|---|
| Transactions | IndexedDB fallback | Queue + optimistic add | Up to last 100 |
| Recurring subscriptions | Derived from cached transactions | N/A | Client-side — free |
| Month forecast | Derived from cached transactions | N/A | Client-side — free |
| Savings goals | IndexedDB fallback | Queue: create, fund, delete | All optimistic |
| Saving habits | IndexedDB fallback | Queue: log contribution | Optimistic `currentPeriodLogged` |
| Habit creation | N/A | Not queued | Created via AI chat tool only |
| Anomalies | IndexedDB fallback | N/A — server-computed | Stale until next online sync |
| Chat | Warm fallback reply (TTS) | Queue for real AI answer | Answered just now on reconnect |
| Auth / sign in | No | No | Requires Supabase network call |
| CSV import | No | No | Requires API POST |
| Receipt scan | No | No | Requires vision model API |

---

## Layer 1 — Service Worker & Asset Caching

### Files

- `apps/web/next.config.mjs` — PWA config, Workbox runtime caching rules
- `apps/web/worker/index.js` — custom SW code merged by next-pwa
- `apps/web/src/app/offline/page.tsx` — document fallback page

### How it works

`next-pwa` wraps the Next.js build with Workbox. On `next build` it generates:

- `public/sw.js` — the main service worker (auto-registered via next-pwa)
- `public/workbox-*.js` — Workbox runtime
- `public/worker-*.js` — compiled `worker/index.js` merged into the SW
- `public/fallback-*.js` — offline document fallback bundle

**All generated files are gitignored** — they are always regenerated at build time. Never commit them.

The SW is disabled in development (`disable: process.env.NODE_ENV === 'development'`) to avoid caching interfering with hot reload. To test offline behaviour locally, run `pnpm build && pnpm start` and use Chrome DevTools → Application → Service Workers → Offline.

### Runtime cache strategies

| URL pattern | Strategy | Cache name | TTL |
|---|---|---|---|
| `fonts.googleapis.com`, `fonts.gstatic.com` | CacheFirst | `google-fonts` | 365 days |
| `*.png`, `*.jpg`, `*.svg`, `*.webp`, etc. | StaleWhileRevalidate | `images` | 30 days |
| `/api/transactions*` | NetworkFirst (10s timeout) | `api-transactions` | 24 hours |
| `/api/insights*` | StaleWhileRevalidate | `api-insights` | 1 hour |
| `/api/goals*` | StaleWhileRevalidate | `api-goals` | 24 hours |
| `/api/habits*` | StaleWhileRevalidate | `api-habits` | 24 hours |
| All Next.js pages / JS / CSS | Precached at install | `workbox-precache` | Until next build |

**NetworkFirst** — try the network; on failure or timeout, serve from cache. Used for transactions because freshness matters.

**StaleWhileRevalidate** — serve from cache immediately, revalidate in the background. Used for insights, goals, habits where slightly stale data is acceptable.

**CacheFirst** — always serve from cache; only fetch if not cached. Used for fonts that never change.

### Document fallback

When a navigation request fails while offline and the page isn't pre-cached, the SW serves `/offline`:

```
User navigates to /insights (offline, not cached)
  → SW intercepts
  → NetworkFirst fails
  → SW serves /offline (pre-cached at SW install)
```

`/offline` (`src/app/offline/page.tsx`) is a `'use client'` page with a "Try again" button that calls `window.location.reload()`.

### Custom service worker (`worker/index.js`)

Merged into the Workbox-generated SW by next-pwa. Handles two responsibilities:

**Background Sync** — replays queued actions when the browser wakes the SW:

```
Client goes offline
  → action added to IndexedDB queuedActions
  → client registers 'truffle-sync-queue' Background Sync tag
  → [browser decides when to wake SW — usually on reconnect]
  → SW 'sync' event fires
  → SW reads queuedActions via raw IDB API
  → SW replays each action via fetch
  → SW posts SYNC_COMPLETE to all open clients
  → clients call queryClient.invalidateQueries()
```

**Message listener** — responds to `{ type: 'REGISTER_SYNC' }` messages from the client to register the Background Sync tag from JS context.

> **Browser support**: Background Sync (`SyncManager`) is supported in Chrome and Edge. Safari and Firefox do not support it. In those browsers, the client-side `online` event flush (Layer 2) handles sync instead.

---

## Layer 2 — Client Network Detection & Queue Flush

### Files

- `apps/web/src/hooks/useNetworkStatus.ts`
- `apps/web/src/components/OfflineBanner.tsx`
- `apps/web/src/app/providers.tsx`

### `useNetworkStatus`

```
window online/offline events
    ↓
useNetworkStatus
    ├── isOnline: boolean       — current connectivity state
    ├── isSyncing: boolean      — flush in progress
    ├── pendingCount: number    — items in queuedActions (polled every 5s)
    └── sync()                  — manually trigger flush
```

On `online` event: calls `flushQueuedActions()` from `offline-db.ts`, then calls `queryClient.invalidateQueries()` to refresh all stale queries.

`pendingCount` polls every 5 seconds because IndexedDB has no change notification API. This drives the `OfflineBanner`.

### `OfflineBanner`

Fixed to the top of the viewport via `layout.tsx`. Three states:

| State | Text |
|---|---|
| `!isOnline` | "Offline — changes will sync when reconnected" |
| `isOnline && isSyncing` | "Syncing…" |
| `isOnline && pendingCount > 0` | "N pending changes — tap to sync" |
| Fully synced and online | Hidden (returns null) |

### `providers.tsx`

Two offline-relevant settings on the global `QueryClient`:

1. **`networkMode: 'always'`** — tells TanStack Query to always run `queryFn` regardless of `navigator.onLine`. Without this, TanStack Query pauses queries when offline, which prevents the IndexedDB fallback from running.

2. **SW message listener** — listens for `{ type: 'SYNC_COMPLETE' }` posted by the service worker after Background Sync completes, then calls `queryClient.invalidateQueries()`.

---

## Layer 3 — IndexedDB (Dexie)

### File

`apps/web/src/lib/offline-db.ts`

### Schema

**Database name:** `truffle-offline` | **Current version:** 3

| Store | Key | Indexes | Purpose |
|---|---|---|---|
| `transactions` | `id` (string) | `userId`, `date`, `category` | Mirror of Supabase transactions for offline reads |
| `queuedActions` | `++id` (autoincrement) | `type`, `createdAt` | API calls queued while offline |
| `pendingChatMessages` | `++id` (autoincrement) | `userId`, `createdAt` | Chat messages awaiting real AI response |
| `goals` | `id` (string) | `userId` | Mirror of savings goals |
| `habitsWithStats` | `id` (string) | `userId` | Mirror of habits with computed streak/totalSaved |
| `anomalies` | `id` (string) | `userId` | Mirror of server-computed anomalies |

### Schema version history

| Version | Change |
|---|---|
| 1 | `transactions`, `queuedActions` |
| 2 | Added `pendingChatMessages` |
| 3 | Added `goals`, `habitsWithStats`, `anomalies` |

Dexie handles IDB upgrades automatically between versions. To add a new store in the future, bump to v4 and declare it:

```ts
this.version(4).stores({
  // repeat all existing stores
  transactions: 'id, userId, date, category',
  queuedActions: '++id, type, createdAt',
  pendingChatMessages: '++id, userId, createdAt',
  goals: 'id, userId',
  habitsWithStats: 'id, userId',
  anomalies: 'id, userId',
  // new store
  myNewStore: '++id, someIndex',
})
```

Also add the corresponding `createObjectStore` block in `worker/index.js` `onupgradeneeded` if the SW needs to access it directly.

### `QueuedAction` shape

```ts
interface QueuedAction {
  id?: number           // autoincrement PK
  type:
    | 'add_transaction'
    | 'create_goal'
    | 'fund_goal'
    | 'delete_goal'
    | 'create_habit'
    | 'log_habit_contribution'
  payload: unknown      // exact body sent to the API
  createdAt: number     // Date.now()
}
```

Actions are processed in chronological order (`orderBy('createdAt')`) on both reconnect (client-side flush) and Background Sync (SW).

### `flushQueuedActions`

Exported from `offline-db.ts`. Used by `useNetworkStatus` on the `online` event. Returns the count of successfully flushed actions. Each action is deleted from the queue only after its fetch returns `ok`.

The service worker's `worker/index.js` duplicates this logic using raw `indexedDB` calls because Dexie is a browser JS library and cannot be imported into the SW bundle. **The action handling in both places must stay in sync when new action types are added.**

---

## Layer 4 — Transaction Offline Read/Write

### Files

- `apps/web/src/components/TransactionList.tsx`
- `apps/web/src/components/AddTransactionForm.tsx`
- `apps/web/src/components/InsightsPage.tsx` (shares the same query key)

### Read path

All components using `queryKey: ['transactions', userId]` share TanStack Query's cache. The `queryFn` pattern:

```
queryFn runs (networkMode: 'always')
    ├── Online: fetch /api/transactions
    │       → bulkPut into offlineDb.transactions
    │       → return fetched data
    │
    └── Offline / fetch fails:
            → offlineDb.transactions.where('userId').equals(userId).toArray()
            → sort by date descending
            → return cached data
```

`TransactionList` shows a "Showing cached data" label when serving from IndexedDB. Up to 100 transactions are mirrored (the API limit). Older transactions are not available offline.

### Write path (AddTransactionForm)

**Online:** `POST /api/transactions` → invalidate query.

**Offline:**
```
navigator.onLine === false
  → write to offlineDb.transactions (optimistic, temporary UUID)
  → write to offlineDb.queuedActions (type: 'add_transaction')
  → register Background Sync tag (Chrome/Edge only)
  → invalidate query (triggers IndexedDB read path)
  → show "Saved offline" confirmation
```

After sync flushes, the temporary local record is replaced by the real server record when `queryClient.invalidateQueries()` runs.

---

## Layer 5 — Goals & Habits Offline Read/Write

### Files

- `apps/web/src/components/SavingsGoals.tsx`
- `apps/web/src/components/SavingsHabits.tsx`

### Read path (both)

Same pattern as transactions — `queryFn` tries the API, catches on failure, reads from IndexedDB:

```ts
queryFn: async () => {
  try {
    const res = await fetch(`/api/goals?userId=${userId}`)
    // ...
    await offlineDb.goals.bulkPut(mapped)
    return mapped
  } catch {
    return offlineDb.goals.where('userId').equals(userId).toArray()
  }
},
networkMode: 'always',
```

### Write paths

**Create goal (offline):**
- Optimistic goal with `crypto.randomUUID()` written to `offlineDb.goals`
- Queued as `create_goal`
- On flush: server creates real goal, query refresh replaces optimistic record

**Fund goal (offline):**
- `offlineDb.goals.update(goalId, { savedAmount: newAmount })` — immediate progress bar update
- Queued as `fund_goal` with absolute `savedAmount` (not a delta)
- On flush: server updates goal + creates a `savings` transaction + recomputes monthly snapshot

**Delete goal (offline):**
- Immediately deleted from `offlineDb.goals`
- Queued as `delete_goal`
- On flush: server deletes goal

**Log habit contribution (offline):**
- `offlineDb.habitsWithStats.update(id, { currentPeriodLogged: true, totalSaved: ... })`
- Queued as `log_habit_contribution`
- On flush: server upserts the contribution record

> **Note on `fund_goal`:** The server-side PATCH creates a linked `savings` transaction and recomputes the monthly snapshot. These side effects only happen on flush. Until then, the balance/forecast shown offline may not reflect the deposit.

---

## Layer 6 — Anomalies Offline Read

### File

`apps/web/src/components/InsightsPage.tsx`

Anomalies are server-computed (statistical analysis of transaction history). There is no offline write path. The read path follows the same cache-then-fallback pattern:

```ts
queryFn: async () => {
  try {
    const res = await fetch(`/api/insights?userId=${userId}`)
    const anomalies = json.anomalies as Anomaly[]
    await offlineDb.anomalies.bulkPut(anomalies.map(a => ({ ...a, userId })))
    return anomalies
  } catch {
    const cached = await offlineDb.anomalies.where('userId').equals(userId).toArray()
    return cached as Anomaly[]
  }
},
networkMode: 'always',
```

`StoredAnomaly` extends `Anomaly` with a `userId` field (not present in the server response) to enable the `userId` index query.

---

## Layer 7 — Chat Offline Experience

### Files

- `apps/web/src/lib/offline-chat.ts` — fallback response generator
- `apps/web/src/hooks/useFinancialChat.ts` — intercept + queue + flush
- `apps/web/src/components/ChatBubble.tsx` — offline / answered-just-now visual treatment
- `apps/web/src/components/ChatPage.tsx` — renders annotations, shows offline hint

### Offline message flow

```
User sends message (typed or voice)
    ↓
useFinancialChat detects !isOnline
    ↓
handleOfflineMessage(content)
    ├── Build userMsg   { role: 'user', content, createdAt }
    ├── await generateOfflineFallback(userId, content)
    │       → reads offlineDb.transactions for context
    │       → detects intent (spending / balance / goal)
    │       → returns warm, personalised reply
    ├── Build fallbackMsg { role: 'assistant', annotations: [{ type: 'offline_fallback' }] }
    ├── chat.setMessages([...prev, userMsg, fallbackMsg])
    ├── offlineDb.pendingChatMessages.add({ userId, content, createdAt })
    └── speak(fallbackContent)   ← TTS plays fallback in same calm voice
```

### Reconnect flush flow

```
window 'online' event fires
    ↓
useFinancialChat → flushPendingMessages()
    ↓
isFlushingRef.current = true
for each pendingChatMessage (ordered by createdAt):
    chat.append({ role: 'user', content })   ← triggers real /api/chat stream
    await stream completes (onFinish fires)
        → adds { type: 'answered_just_now' } annotation to assistant message
        → saves to Supabase chat_messages
    offlineDb.pendingChatMessages.delete(id)
isFlushingRef.current = false
```

`isFlushingRef` is a plain ref (not state) to avoid re-renders. It is checked in `onFinish` synchronously to annotate the response.

### Fallback response generator (`offline-chat.ts`)

Reads from `offlineDb.transactions` and runs lightweight keyword intent detection:

| Detected intent | Personalisation |
|---|---|
| Spending question (`spend`, `cost`, `budget`…) | Top spending category + amount |
| Balance question (`afford`, `how am I doing`…) | Net income vs expenses |
| Goal question (`saving`, `goal`, `trip`…) | Encouraging tone, no data needed |
| Anything else | Cycles through 3 warm generic templates (`message.length % 3`) |

All responses acknowledge being offline, confirm the message is queued, and maintain Truffle's calm, non-judgmental voice.

### ChatBubble annotations

Two annotation types are used on `message.annotations` (Vercel AI SDK standard field):

| Annotation `type` | Visual effect |
|---|---|
| `offline_fallback` | Muted background, 80% opacity, italic text, `· offline` label |
| `answered_just_now` | Normal bubble, `· answered just now` label in green |

In `ChatPage`, annotations are read per message:

```tsx
const annotations = message.annotations as { type: string }[] | undefined
const isOfflineFallback = annotations?.some((a) => a.type === 'offline_fallback')
const isAnsweredJustNow = annotations?.some((a) => a.type === 'answered_just_now')
```

---

## Data Flow Summary

### Going offline

```
connection drops
    → window 'offline' event
    → isOnline = false  (useNetworkStatus, useFinancialChat, AddTransactionForm)
    → OfflineBanner appears
    → all queryFns catch network errors → read from IndexedDB
    → write operations queue to offlineDb.queuedActions
    → chat submissions → handleOfflineMessage path
```

### Coming back online

```
connection restores
    → window 'online' event
    → useNetworkStatus.sync()
        → flushQueuedActions() → POST/PATCH/DELETE for each queued action
        → queryClient.invalidateQueries() → all queries refetch from API
    → useFinancialChat.flushPendingMessages()
        → chat.append() for each pending chat message
        → real AI responses arrive with 'answered_just_now' annotation
    → OfflineBanner disappears when pendingCount reaches 0
    → Background Sync event in SW fires as belt-and-suspenders (Chrome/Edge)
```

---

## Extending Offline Support

### Add a new queueable action type

**1. Extend the type union in `offline-db.ts`:**

```ts
type:
  | 'add_transaction'
  | 'create_goal'
  | 'fund_goal'
  | 'delete_goal'
  | 'create_habit'
  | 'log_habit_contribution'
  | 'your_new_action'   // ← add here
```

**2. Handle it in `flushQueuedActions` in `offline-db.ts`:**

```ts
} else if (action.type === 'your_new_action') {
  res = await fetch('/api/your-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.payload),
  })
}
```

**3. Mirror it in `worker/index.js` for Background Sync coverage:**

```js
} else if (action.type === 'your_new_action') {
  res = await fetch('/api/your-endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.payload),
  })
}
```

**4. In your component, queue it when offline:**

```ts
if (!navigator.onLine) {
  await offlineDb.myStore.update(id, { /* optimistic change */ })
  await offlineDb.queuedActions.add({
    type: 'your_new_action',
    payload: { /* exact API body */ },
    createdAt: Date.now(),
  })
  await queryClient.invalidateQueries({ queryKey: ['your-key', userId] })
  return
}
// normal online path
```

### Add a new IndexedDB store

**1. Bump the version in `offline-db.ts`:**

```ts
this.version(4).stores({
  // ...repeat all existing stores unchanged...
  newStore: 'id, userId',
})
```

**2. Add a `Table` property and type:**

```ts
newStore!: Table<YourType>
```

**3. Add `createObjectStore` in `worker/index.js` `onupgradeneeded` if the SW needs access:**

```js
if (!db.objectStoreNames.contains('newStore')) {
  const s = db.createObjectStore('newStore', { keyPath: 'id' })
  s.createIndex('userId', 'userId', { unique: false })
}
```

**4. Add the API route to SW runtime caching in `next.config.mjs`:**

```js
{
  urlPattern: /^\/api\/your-endpoint/,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'api-your-endpoint',
    expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 },
  },
},
```

### Add fallback copy for a new chat intent

In `apps/web/src/lib/offline-chat.ts`, add an intent check before the generic fallbacks:

```ts
const isNewIntent = /keyword1|keyword2/.test(msg)
if (isNewIntent) {
  // read from IndexedDB if needed
  return `Warm, context-aware reply for this intent. Queued for real answer on reconnect.`
}
```

---

## Build & Deployment

### Local testing

The SW is disabled in development. To test offline:

```bash
pnpm build && pnpm start
# Then in Chrome DevTools → Application → Service Workers → check Offline
```

### Vercel

No special config required. `next build` on Vercel generates all SW artifacts into `public/` which Vercel serves as static files at their respective paths (`/sw.js`, `/workbox-*.js`, etc.).

### Generated files (gitignored)

```
apps/web/public/sw.js
apps/web/public/sw.js.map
apps/web/public/workbox-*.js
apps/web/public/workbox-*.js.map
apps/web/public/worker-*.js
apps/web/public/worker-*.js.map
apps/web/public/fallback-*.js
apps/web/public/fallback-*.js.map
```

Never commit these. Vercel regenerates them on every deploy.

### Dependencies

| Package | Role |
|---|---|
| `next-pwa@5.6.0` | Wraps Next.js build with Workbox SW generation |
| `dexie@3.x` | Typed IndexedDB wrapper for client-side storage |
| `babel-loader`, `@babel/core` | Required by next-pwa to compile `worker/index.js` |

> **Dexie version note:** Dexie v4 dropped CommonJS support. Do not upgrade without verifying next-pwa's Webpack pipeline handles ESM-only packages correctly.
