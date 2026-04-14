<div align="center">

<img src="apps/web/public/icons/truffle.png" alt="Truffle" width="80" />

# Truffle

### Your finances, unearthed.

Talk to your money. Truffle listens, understands, and surfaces what's hiding beneath the surface of your financial life — without the dread.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hari2309s/truffle)

![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-server_state-FF4154?logo=reactquery&logoColor=white)

![PWA](https://img.shields.io/badge/PWA-offline--ready-5A0FC8?logo=pwa&logoColor=white)
![Workbox](https://img.shields.io/badge/Workbox-service_worker-FF6D00?logo=googlechrome&logoColor=white)
![Dexie](https://img.shields.io/badge/Dexie.js-IndexedDB-0769AD?logoColor=white)

![LangGraph](https://img.shields.io/badge/LangGraph.js-agent_orchestration-1C3C3C?logo=langchain&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B_%2B_Llama_4_Scout_%2B_Whisper-F55036?logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-text--embedding--004-4285F4?logo=google&logoColor=white)
![Web Speech API](https://img.shields.io/badge/Web_Speech_API-STT_%2B_TTS-orange?logo=googlechrome&logoColor=white)

![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Auth-3ECF8E?logo=supabase&logoColor=white)
![Langfuse](https://img.shields.io/badge/Langfuse-observability-000000?logo=langfuse&logoColor=white)

![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Features

- 🎙️ **Voice first** — hold to speak, get a spoken answer back
- 🧠 **Conversational reasoning** — ask anything about your finances in plain language
- 🔍 **Anomaly detection** — spots unusual charges automatically
- 📈 **Spending forecast** — projects your end-of-month balance with daily spend rate
- 😌 **Emotionally aware** — calm, warm tone always. Never a lecture
- 🧾 **Receipt & statement scanning** — photograph a receipt or upload a PDF bank statement; extracted by Groq Llama 4 Scout (vision-capable)
- 📂 **CSV import** — drag-and-drop with column auto-detection and category guessing
- 🔄 **Subscription tracker** — automatically detects recurring charges from your history
- 🎯 **Savings goals** — set goals manually or let Truffle propose one mid-conversation; confirm with one tap, track progress and deposits in Insights
- 💬 **Log transactions from chat** — say "I just paid €45 at Lidl" and Truffle shows a confirmation card before logging it to your history
- 🔁 **Saving habits** — set up a recurring weekly or monthly saving habit in chat ("save €50 every week"); Truffle tracks your streak, logs contributions, and reminds you when a period is due
- 🔔 **Proactive nudges** — Truffle messages you in chat when it spots something worth flagging (anomalous charge, goal milestone, at-risk deadline, habit streak celebration, habit check-in reminder) without you having to ask; unread badge on the Chat tab
- 🔊 **Weekly audio summary** — spoken recap of your week, once per week
- 💱 **Multi-currency** — EUR, GBP, USD converted to EUR for consistent totals
- 📱 **PWA** — installs on iOS and Android, fully offline-capable
- 📡 **Offline-first** — browse transactions, goals, and insights with no connection; writes are queued via Background Sync and flushed automatically on reconnect
- 💬 **Offline chat** — Truffle responds from cached data when offline; queued messages are sent to the real AI the moment the connection returns, annotated "answered just now"

---

## How it works

```
You speak → Groq Whisper transcribes → LangGraph routes your intent
→ Groq Llama-3.3-70b reasons over your actual transaction history
→ Response streams back (or a goal / transaction / habit proposal card appears via AI tool calling)
→ Web Speech API reads the answer aloud
```

Your recent transactions are passed directly as context to the model on every query — grounding every answer in your real data, not generic advice.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| PWA / Service Worker | `next-pwa` v5 + Workbox (asset caching, runtime caching, offline fallback) |
| Offline storage | Dexie.js v3 (typed IndexedDB wrapper) |
| Offline sync | Background Sync API + client-side online-event fallback |
| Voice input | MediaRecorder API → Groq Whisper large-v3 |
| Text → Voice | Web Speech API (browser native) |
| AI Orchestration | LangGraph.js |
| LLM (chat / reasoning) | Vercel AI SDK v4 + Groq `llama-3.3-70b-versatile` |
| LLM (vision / receipt parsing) | Groq `meta-llama/llama-4-scout-17b-16e-instruct` |
| Embeddings | Gemini text-embedding-004 (Google AI Studio) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Observability | Langfuse (traces, generations, token usage) |
| State | TanStack Query (`networkMode: always`) |
| Monorepo | pnpm workspaces + Turborepo |
| Deployment | Vercel |

---

## Project structure

```
truffle/
├── apps/
│   └── web/                  # Next.js PWA
└── packages/
    ├── types/                # shared TypeScript types
    ├── ai/                   # LangGraph agents + prompts + embeddings
    └── db/                   # Supabase client + schema
```

---

## Getting started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Supabase account (free)
- Groq account — used for both Whisper STT and Llama chat (free tier)
- Google AI Studio account (free) — used for Gemini text-embedding-004

### Installation

```bash
git clone https://github.com/hari2309s/truffle.git
cd truffle
pnpm install
```

### Environment setup

```bash
cp .env.example .env
```

Fill in your keys:

```bash
GROQ_API_KEY=                    # Groq — free tier (Whisper STT + Llama chat)
GEMINI_API_KEY=                  # Google AI Studio — free tier (text-embedding-004)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LANGFUSE_SECRET_KEY=                 # Langfuse — free tier (observability)
LANGFUSE_PUBLIC_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

### Database setup

Run all migrations in your Supabase project SQL editor in order:

```bash
packages/db/src/migrations/001_initial.sql          # transactions, anomalies, snapshots, chat
packages/db/src/migrations/002_savings_goals.sql    # savings_goals table + RLS
packages/db/src/migrations/003_pgvector_gemini.sql  # pgvector extension + match_transactions RPC
packages/db/src/migrations/004_savings_habits.sql   # savings_habits + habit_contributions + RLS
packages/db/src/migrations/005_proactive_messages.sql  # is_proactive, read_at, nudge_key on chat_messages
```

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Agent architecture

Truffle uses a LangGraph.js agent graph to route and reason over your financial data:

```
User query
    ↓
Intent Router         ← classifies what you're asking
    ↓
┌──────┬─────────┬───────────┬───────────────┬──────────────────┐
│      │         │           │               │                  │
▼      ▼         ▼           ▼               ▼                  ▼
Spending  Anomaly  Forecaster  Affordability  Savings Goal
Analyst   Reviewer             Checker        Advisor
│      │         │           │               │                  │
└──────┴─────────┴───────────┴───────────────┴──────────────────┘
    ↓
Synthesizer           ← formats a calm, spoken response
    ↓
Spoken + displayed answer
```

---

## Offline capability

Truffle is fully usable without a network connection.

| Feature | Offline behaviour |
|---|---|
| Transaction list | Served from IndexedDB cache |
| Add transaction | Saved locally, synced on reconnect |
| Savings goals | Read + write (optimistic UI), synced on reconnect |
| Saving habits | Read + log contribution, synced on reconnect |
| Insights / forecast | Computed from cached transactions |
| Anomalies | Last-fetched results served from cache |
| Chat | Warm contextual reply from cached data; real answer delivered on reconnect |

**How sync works:**
1. Any write while offline is queued as a typed action in IndexedDB (`queuedActions` table).
2. On reconnect the browser fires the `online` event (and optionally the Background Sync API fires a `truffle-sync-queue` event via the service worker).
3. Each queued action is replayed against the API in order, then removed from the queue.
4. TanStack Query caches are invalidated so the UI reflects the synced state.

For the full technical reference see [docs/offline-capability.md](docs/offline-capability.md).

---

## License

MIT

---
