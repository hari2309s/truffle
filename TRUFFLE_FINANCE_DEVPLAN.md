# Truffle 🍄
### Voice-First Personal Finance App
**Tagline:** *Your finances, unearthed.*

> Talk to your money. Truffle listens, understands, and surfaces what's hiding beneath the surface of your financial life — without the dread.

---

## The Problem

Every finance app assumes you're rational about money. You're not. Nobody is.
Revolut shows you a red bar and you close the app. YNAB requires you to categorise 47 transactions. MoneyDashboard gives you charts you don't want to look at.

Truffle is different. It talks *with* you, not *at* you. Calm, honest, non-judgmental — like a knowledgeable friend who happens to be good with numbers.

---

## Core Features

### 1. Voice Interface
Ask anything out loud. Get a calm spoken answer back.
- *"How am I doing this month?"*
- *"Can I afford a weekend in Amsterdam?"*
- *"What did I spend on food last week?"*

### 2. Conversational Financial Reasoning (RAG)
Your transaction history is the knowledge base. Gemini reasons over your actual data to give real, personalised answers — not generic advice.

### 3. Anomaly Detection (ML)
Detects unusual charges, forgotten subscriptions, and spending spikes using `@xenova/transformers` embeddings + statistical pattern matching. No Python microservice — stays in the TS ecosystem.

### 4. Spending Forecast
Predicts your end-of-month balance based on current trajectory and historical patterns.
*"At this pace you'll have €180 left on the 31st."*

### 5. Emotional Tone Awareness
Adapts response tone based on your financial situation. If you're in a tight month, it's reassuring. If you're doing great, it celebrates with you. No shame, ever.

### 6. PWA — Mobile First
Installable on iOS and Android. Works offline. Voice interaction on your commute, no app store needed.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript + Tailwind CSS | Core stack |
| PWA | `next-pwa` + Web Speech API + MediaRecorder API | Installable, offline-capable, native voice |
| State | Zustand + TanStack Query | Lightweight, familiar |
| AI Orchestration | LangGraph.js | Stateful agent graph for multi-step financial reasoning |
| LLM Calls | Vercel AI SDK + Google Gemini 1.5 Flash | Stable SDK, free tier |
| Embeddings | `@xenova/transformers` (local, in-browser or Node) | Free, no API, runs anywhere |
| Voice → Text | Groq API (Whisper) | Free tier, fastest transcription available |
| Text → Speech | Web Speech API (browser native) | Free, no API needed |
| Vector Store | ChromaDB (local, Node) | Free, no account |
| Database | Supabase (PostgreSQL + Auth + Storage) | Free tier, familiar |
| Observability | LangFuse free tier | Agent tracing |
| Deployment | Vercel (free) | Zero config, PWA support |

**Total monthly cost: $0**

---

## Monorepo Structure

```
truffle/
├── package.json                        # root pnpm workspace
├── pnpm-workspace.yaml
├── turbo.json                          # Turborepo config
├── .env                                # shared secrets (gitignored)
├── .env.example
│
├── apps/
│   └── web/                            # Next.js PWA
│       ├── package.json
│       ├── next.config.ts              # PWA config via next-pwa
│       ├── public/
│       │   ├── manifest.json           # PWA manifest
│       │   ├── icons/
│       │   │   ├── truffle-192.png
│       │   │   └── truffle-512.png
│       │   └── sw.js                   # service worker (auto-generated)
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── page.tsx            # onboarding / dashboard
│           │   ├── chat/
│           │   │   └── page.tsx        # voice + text chat interface
│           │   ├── insights/
│           │   │   └── page.tsx        # spending insights + anomalies
│           │   ├── forecast/
│           │   │   └── page.tsx        # end-of-month forecast
│           │   └── api/
│           │       ├── chat/
│           │       │   └── route.ts    # streaming chat endpoint
│           │       ├── voice/
│           │       │   └── route.ts    # Groq Whisper transcription
│           │       ├── transactions/
│           │       │   └── route.ts    # CRUD + sync
│           │       └── insights/
│           │           └── route.ts    # anomaly + forecast endpoint
│           ├── components/
│           │   ├── VoiceButton.tsx     # hold-to-speak interaction
│           │   ├── ChatBubble.tsx      # message display
│           │   ├── FinancialBrief.tsx  # monthly summary card
│           │   ├── AnomalyCard.tsx     # unusual spending alert
│           │   ├── ForecastBar.tsx     # end-of-month projection
│           │   └── TransactionList.tsx
│           ├── hooks/
│           │   ├── useVoiceRecorder.ts # MediaRecorder API wrapper
│           │   ├── useTextToSpeech.ts  # Web Speech API wrapper
│           │   └── useFinancialChat.ts # Vercel AI SDK useChat wrapper
│           └── lib/
│               └── supabase.ts         # Supabase client
│
└── packages/
    ├── types/                          # shared TypeScript types
    │   ├── package.json
    │   └── src/index.ts
    │
    ├── ai/                             # LangGraph agents + prompts
    │   ├── package.json
    │   └── src/
    │       ├── graph.ts                # LangGraph orchestration
    │       ├── agents/
    │       │   ├── intentRouter.ts     # routes query to right agent
    │       │   ├── spendingAnalyst.ts  # analyses spending patterns
    │       │   ├── anomalyDetector.ts  # detects unusual activity
    │       │   ├── forecaster.ts       # predicts end-of-month balance
    │       │   ├── affordability.ts    # "can I afford X?" reasoning
    │       │   └── synthesizer.ts      # formats final spoken response
    │       ├── prompts/
    │       │   ├── spendingAnalyst.prompt.ts
    │       │   ├── anomalyDetector.prompt.ts
    │       │   ├── forecaster.prompt.ts
    │       │   ├── affordability.prompt.ts
    │       │   └── synthesizer.prompt.ts
    │       ├── embeddings.ts           # @xenova/transformers wrapper
    │       ├── vectorStore.ts          # ChromaDB client
    │       └── gemini.ts               # Gemini client via Vercel AI SDK
    │
    └── db/                             # Supabase client + schema types
        ├── package.json
        └── src/
            ├── client.ts
            └── schema.ts
```

---

## PWA Configuration

### `next.config.ts`
```typescript
import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

export default config({
  // your existing next config
})
```

### `public/manifest.json`
```json
{
  "name": "Truffle",
  "short_name": "Truffle",
  "description": "Your finances, unearthed.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a0f0a",
  "theme_color": "#1a0f0a",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/truffle-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/truffle-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Shared Types (`packages/types/src/index.ts`)

```typescript
export interface Transaction {
  id: string
  userId: string
  amount: number                          // negative = expense, positive = income
  currency: 'EUR' | 'GBP' | 'USD'
  description: string
  category: TransactionCategory
  merchant?: string
  date: string
  isRecurring: boolean
  embedding?: number[]                    // @xenova/transformers embedding
}

export type TransactionCategory =
  | 'food_groceries'
  | 'food_delivery'
  | 'transport'
  | 'housing'
  | 'utilities'
  | 'subscriptions'
  | 'health'
  | 'entertainment'
  | 'shopping'
  | 'income'
  | 'savings'
  | 'other'

export interface MonthlySnapshot {
  month: string                           // YYYY-MM
  totalIncome: number
  totalExpenses: number
  byCategory: Record<TransactionCategory, number>
  savingsRate: number
  balance: number
}

export interface Anomaly {
  id: string
  transactionId: string
  type: 'unusual_amount' | 'forgotten_subscription' | 'category_spike' | 'new_merchant'
  severity: 'high' | 'medium' | 'low'
  description: string
  detectedAt: string
}

export interface Forecast {
  currentBalance: number
  projectedEndOfMonth: number
  projectedSavings: number
  confidence: 'high' | 'medium' | 'low'
  assumptions: string[]
  generatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  audioUrl?: string                       // for voice responses
  timestamp: string
}

export interface TruffleState {
  transactions: Transaction[]
  currentMonth: MonthlySnapshot
  anomalies: Anomaly[]
  forecast: Forecast
  chatHistory: ChatMessage[]
  userQuery?: string
  agentResponse?: string
  intent?: QueryIntent
}

export type QueryIntent =
  | 'spending_summary'
  | 'affordability_check'
  | 'anomaly_review'
  | 'forecast_request'
  | 'category_breakdown'
  | 'general_advice'
```

---

## LangGraph Agent Graph (`packages/ai/src/graph.ts`)

```
         ┌─────────────────────┐
         │   START (user query) │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │   Intent Router      │  ← classifies what the user is asking
         └──────────┬──────────┘
                    │
      ┌─────────────┼──────────────┬────────────────┐
      │             │              │                │
      ▼             ▼              ▼                ▼
 Spending      Anomaly        Forecaster      Affordability
 Analyst       Detector                       Checker
      │             │              │                │
      └─────────────┴──────────────┴────────────────┘
                    │
         ┌──────────▼──────────┐
         │    Synthesizer       │  ← formats warm, calm spoken response
         └──────────┬──────────┘
                    │
              spoken answer
```

### Intent Router logic
Routes based on keywords and semantic similarity:
- "how am I doing / spending summary" → Spending Analyst
- "unusual / weird charge / forgotten" → Anomaly Detector
- "end of month / how much left" → Forecaster
- "can I afford / should I buy" → Affordability Checker
- ambiguous → runs multiple agents in parallel

---

## Voice Interaction Flow

```
User holds VoiceButton
        ↓
MediaRecorder API captures audio blob
        ↓
POST /api/voice → Groq Whisper API
        ↓
Transcript text returned
        ↓
POST /api/chat → LangGraph agent graph
  (transactions embedded + stored in ChromaDB)
  (RAG retrieval over user's financial history)
  (Gemini reasons over retrieved context)
        ↓
Streaming text response
        ↓
Web Speech API speaks response aloud
        ↓
Response also displayed as chat bubble
```

---

## Embeddings + Vector Store Strategy

### Transaction embedding (`packages/ai/src/embeddings.ts`)
```typescript
import { pipeline } from '@xenova/transformers'

// model loads once, cached locally
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')

export async function embedTransaction(transaction: Transaction): Promise<number[]> {
  // combine description + category + amount into a rich text representation
  const text = `${transaction.description} ${transaction.category} ${transaction.amount > 0 ? 'income' : 'expense'} €${Math.abs(transaction.amount)}`
  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}
```

### RAG retrieval for chat
When user asks a question:
1. Embed the query with `@xenova/transformers`
2. Retrieve semantically similar transactions from ChromaDB
3. Pass retrieved transactions as context to Gemini
4. Gemini reasons over real data, not hallucinated numbers

---

## Anomaly Detection Strategy

No external ML service needed — uses embeddings + statistical methods entirely in TS:

**Approach 1 — Embedding similarity**
Embed all transactions. Flag any transaction whose embedding is far from its category centroid (cosine distance > threshold). New merchant + unusual amount = anomaly.

**Approach 2 — Statistical baseline**
For each category, compute mean + standard deviation of monthly spend over last 3 months. Flag current month if spend > mean + 2σ.

**Approach 3 — Subscription detection**
Group transactions by merchant + approximate amount. If a recurring pattern stops or a new one appears, flag it.

All three run client-side or in Node — no Python needed, no API cost.

---

## Supabase Schema

```sql
-- Users (handled by Supabase Auth)

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric not null,
  currency text default 'EUR',
  description text not null,
  category text not null,
  merchant text,
  date date not null,
  is_recurring boolean default false,
  embedding vector(384),              -- pgvector extension
  created_at timestamptz default now()
);

-- Monthly snapshots (cached, recomputed on demand)
create table monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  month text not null,                -- YYYY-MM
  data jsonb not null,                -- MonthlySnapshot type
  created_at timestamptz default now(),
  unique(user_id, month)
);

-- Anomalies
create table anomalies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  transaction_id uuid references transactions(id),
  type text not null,
  severity text not null,
  description text not null,
  dismissed boolean default false,
  detected_at timestamptz default now()
);

-- Chat history
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  audio_url text,
  created_at timestamptz default now()
);

-- RLS policies (all tables)
alter table transactions enable row level security;
create policy "users see own data" on transactions
  for all using (auth.uid() = user_id);
-- repeat for other tables
```

---

## API Routes

### `POST /api/voice`
Receives audio blob, transcribes via Groq Whisper, returns text.
```typescript
// Body: FormData { audio: Blob }
// Response: { transcript: string }
```

### `POST /api/chat`
Main reasoning endpoint. Streams response.
```typescript
// Body: { message: string, userId: string }
// Internally: embeds query → ChromaDB retrieval → LangGraph → Gemini
// Response: streaming text (Vercel AI SDK streamText)
```

### `GET /api/insights`
Returns anomalies + forecast for current user.
```typescript
// Response: { anomalies: Anomaly[], forecast: Forecast }
```

### `POST /api/transactions`
Manual transaction entry or bulk import.
```typescript
// Body: { transactions: Omit<Transaction, 'id' | 'embedding'>[] }
// Internally: embeds each transaction → stores in Supabase + ChromaDB
```

---

## Key Hooks

### `useVoiceRecorder.ts`
```typescript
// Wraps MediaRecorder API
// Returns: { isRecording, startRecording, stopRecording, audioBlob }
// On stop: auto-sends to /api/voice for transcription
```

### `useTextToSpeech.ts`
```typescript
// Wraps Web Speech API SpeechSynthesis
// Returns: { speak(text), isSpeaking, cancel }
// Selects a calm, natural voice automatically
```

### `useFinancialChat.ts`
```typescript
// Wraps Vercel AI SDK useChat
// Adds: auto-speak on new assistant message
// Adds: save messages to Supabase
// Returns: { messages, input, handleSubmit, isLoading, startVoice }
```

---

## Environment Variables

```bash
# .env.example

# Gemini (free tier)
GEMINI_API_KEY=

# Groq (free tier — Whisper)
GROQ_API_KEY=

# Supabase (free tier)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LangFuse (free tier)
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Package Dependencies

### `apps/web`
```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "next-pwa": "^5",
    "@tanstack/react-query": "^5",
    "zustand": "^4",
    "tailwindcss": "^3",
    "ai": "^3",
    "@ai-sdk/google": "^0.0.52",
    "@supabase/supabase-js": "^2",
    "@truffle/types": "workspace:*",
    "@truffle/ai": "workspace:*",
    "@truffle/db": "workspace:*"
  }
}
```

### `packages/ai`
```json
{
  "dependencies": {
    "@langchain/langgraph": "^0.2",
    "ai": "^3",
    "@ai-sdk/google": "^0.0.52",
    "@xenova/transformers": "^2",
    "chromadb": "^1",
    "langfuse": "^3",
    "@truffle/types": "workspace:*"
  }
}
```

---

## UX Principles — Non-Negotiable

1. **No red bars, no scary charts** — progress and context only, never judgment
2. **Voice first, text second** — every interaction should work by speaking
3. **One screen at a time** — never overwhelm, surface one insight at a time
4. **Celebrate small wins** — "You spent less on food delivery this week 🎉"
5. **Calm tone always** — even when surfacing a problem, the tone is reassuring
6. **Offline capable** — core features work without internet (PWA + cached data)

---

## Branding

- **Name:** Truffle
- **Tagline:** *Your finances, unearthed.*
- **Secondary tagline:** *Dig into your money. Without the dread.*
- **Logo:** Truffle mushroom icon (two variants — light bg and dark bg — already provided)
- **Colour palette:** Deep earth tones — dark brown background, warm cream text, muted amber accents
- **Tone of voice:** Calm, warm, knowledgeable friend — never a bank, never a lecture

---

## MVP Scope (build this first)

- [ ] pnpm monorepo scaffold with Turborepo
- [ ] Supabase schema + auth (email magic link)
- [ ] Manual transaction entry (text)
- [ ] `@xenova/transformers` embedding pipeline
- [ ] ChromaDB storage of embedded transactions
- [ ] Basic LangGraph graph — Intent Router + Spending Analyst + Synthesizer
- [ ] `/api/chat` streaming endpoint
- [ ] Voice input via Groq Whisper (`/api/voice`)
- [ ] Voice output via Web Speech API
- [ ] Chat UI with VoiceButton (hold to speak)
- [ ] Monthly summary card on dashboard
- [ ] PWA manifest + service worker
- [ ] Deploy to Vercel

## Phase 2 ✅

- [x] Anomaly detection (statistical baseline — category spend vs. 90-day mean + 2σ)
- [x] Forecaster agent — `packages/ai/src/agents/forecaster.ts`, routed via `forecast_request` intent
- [x] Affordability Checker agent — `packages/ai/src/agents/affordabilityChecker.ts`, routed via `affordability_check` intent
- [x] Anomaly Reviewer agent — `packages/ai/src/agents/anomalyReviewer.ts`, routed via `anomaly_review` intent
- [x] Anomaly cards in insights view — `InsightsPage.tsx` `AnomalyCard` component
- [x] Forecast bar on dashboard — `FinancialBrief.tsx` + `InsightsPage.tsx` `ForecastCard`
- [x] Emotional tone adaptation — `getToneGuidance()` in `/api/chat` adapts system prompt based on savings rate + projected balance
- [x] Transaction import via CSV — `CSVImport.tsx` with column auto-detection, category guessing, and preview

## Phase 3

- [ ] Open Banking API integration (not planned — manual entry + CSV import is the intended flow)
- [x] Subscription tracker — `lib/subscriptions.ts` client-side detection, shown in InsightsPage
- [x] Savings goals with voice check-ins — `SavingsGoals.tsx` + `/api/goals` + `savingsGoalAdvisor` agent
- [x] Weekly audio summary — `WeeklySummary.tsx` (once/week via localStorage, Web Speech API read-aloud)
- [x] Multi-currency support — `lib/currency.ts` EUR/GBP/USD conversion, `computeForecast` uses `toEur()`


The @xenova/transformers model downloads on first run (~25MB for all-MiniLM-L6-v2) and caches locally — tell Claude Code to handle that gracefully with a loading state.
The Web Speech API voice selection varies by browser and OS — on iOS it's particularly limited, so tell Claude Code to pick the best available voice rather than a hardcoded one.
Phase 3 has the most exciting angle for your CV — GoCardless/Nordigen is a free open banking API that works across Europe including Germany, which turns this from a manual expense tracker into something genuinely useful. Worth keeping that in mind as the north star even while building the MVP.