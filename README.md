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

![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)

![LangGraph](https://img.shields.io/badge/LangGraph.js-agent_orchestration-1C3C3C?logo=langchain&logoColor=white)
![LLM Router](https://img.shields.io/badge/LLM_Router-5_providers-F55036?logoColor=white)
![Groq](https://img.shields.io/badge/Groq-GPT--OSS_120B_%2B_Whisper-F55036?logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-3.7_Flash_%2B_embedding-4285F4?logo=google&logoColor=white)
![Web Speech API](https://img.shields.io/badge/Web_Speech_API-STT_%2B_TTS-orange?logo=googlechrome&logoColor=white)

![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Auth-3ECF8E?logo=supabase&logoColor=white)
![Langfuse](https://img.shields.io/badge/Langfuse-observability-000000?logo=langfuse&logoColor=white)
![PostHog](https://img.shields.io/badge/PostHog-analytics-F54E00?logo=posthog&logoColor=white)

![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

![Vitest](https://img.shields.io/badge/Vitest-unit_tests-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-e2e_tests-2EAD33?logo=playwright&logoColor=white)
![Weco](https://img.shields.io/badge/Weco-prompt_optimization-7C3AED?logoColor=white)

</div>

---

## Features

- 🎙️ **Voice first** — hold to speak, get a spoken answer back
- 🔇 **Voice mute toggle** — mute/unmute AI speech from the chat toolbar; preference persists across sessions
- 🧠 **Conversational reasoning** — ask anything about your finances in plain language
- 🔍 **Anomaly detection** — spots unusual charges automatically
- 📈 **Spending forecast** — projects your end-of-month balance with daily spend rate
- 😌 **Emotionally aware** — calm, warm tone always. Never a lecture
- 🧾 **Receipt & statement scanning** — photograph a receipt or upload a PDF bank statement; extracted by Gemini 3.7 Flash (vision-capable, handles images and PDFs)
- 📂 **CSV import** — drag-and-drop with column auto-detection and category guessing
- ✏️ **Transaction edit & delete** — inline edit form and confirm-before-delete directly in the transaction list; changes sync immediately via TanStack Query cache invalidation
- 🔄 **Subscription tracker** — automatically detects recurring charges from your history
- 🎯 **Savings goals** — set goals manually or let Truffle propose one mid-conversation; confirm with one tap, track progress and deposits in Insights
- 💬 **Log transactions from chat** — say "I just paid €45 at Lidl" and Truffle shows a confirmation card before logging it to your history
- 🔁 **Saving habits** — set up a recurring weekly or monthly saving habit in chat ("save €50 every week"); Truffle tracks your streak, logs contributions, and reminds you when a period is due
- 📊 **Monthly budgets** — set per-category spending limits in Insights; colour-coded progress bars (green → amber at 80% → red at 100%); Truffle fires a proactive nudge when you hit 80% of a budget; budget context is injected into every chat for AI-aware answers
- 🔔 **Proactive nudges** — Truffle messages you in chat when it spots something worth flagging (anomalous charge, goal milestone, at-risk deadline, budget warning, habit streak celebration, habit check-in reminder) without you having to ask; unread badge on the Chat tab
- 📅 **Monthly AI finance report** — on visiting Insights at the start of a new month, Truffle generates a prose summary of the previous month (income, expenses, top categories, goal and habit progress) and delivers it as a chat message; generated once per month per user
- 🔊 **Weekly audio summary** — spoken recap of your week, once per week
- 💱 **Multi-currency** — EUR, GBP, USD converted to EUR for consistent totals
- 🌗 **Dark / light theme** — system-aware with manual override, available on all pages
- 📱 **PWA** — installs on iOS and Android
- 🚀 **Onboarding tour** — new users are walked through the three core features (chat, tracking, nudges) immediately after sign-up
- 📦 **Data export** — download all your transactions, goals, budgets, and habits as a single JSON file from the Settings sheet
- 🗑️ **Account deletion** — self-serve data wipe from the Settings sheet; requires typing `DELETE` to confirm; cascades to all data via Supabase FK constraints

---

## How it works

```
You speak → Groq Whisper transcribes → LangGraph routes your intent
→ LLM Router picks the best available free-tier provider
→ Provider reasons over your actual transaction history
→ Response streams back (or a goal / transaction / habit proposal card appears via AI tool calling)
→ Web Speech API reads the answer aloud
→ Every call is logged to eval_logs; nightly judge scores response quality
```

Your recent transactions are passed directly as context to the model on every query — including follow-up clarifications — grounding every answer in your real data, not generic advice.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion (spring physics, waveform indicators, pulsing orb loader) |
| PWA | Web manifest (installable on iOS and Android) |
| Voice input | MediaRecorder API → Groq Whisper large-v3 |
| Text → Voice | Web Speech API (browser native) |
| AI orchestration | LangGraph.js |
| LLM router | Custom multi-provider router (`packages/ai/src/router.ts`) |
| LLM — fast chat | Groq `openai/gpt-oss-20b` → Cerebras → OpenRouter → Mistral (in priority order) |
| LLM — reasoning | Gemini `gemini-3.7-flash` → Groq `openai/gpt-oss-120b` → Cerebras → OpenRouter (in priority order) |
| LLM — tool calling | Groq `openai/gpt-oss-120b` → Gemini → Cerebras (in priority order) |
| LLM — vision | Gemini `gemini-3.7-flash` → Groq `qwen/qwen3.6-27b` (in priority order) |
| Embeddings | Gemini `gemini-embedding-2` (Google AI Studio, 768-dim) |
| Eval layer | Supabase `eval_logs` table + nightly LLM-as-judge cron |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Observability | Langfuse (traces, generations, token usage) |
| Analytics | PostHog (pageviews, event tracking) |
| State | TanStack Query |
| Monorepo | pnpm workspaces + Turborepo |
| Deployment | Vercel |

---

## Project structure

```
truffle/
├── apps/
│   └── web/                        # Next.js PWA
│       └── src/app/api/
│           ├── chat/               # main streaming chat route
│           ├── cron/
│           │   └── eval-judge/     # nightly LLM quality scoring job
│           └── voice/              # Whisper transcription
└── packages/
    ├── types/                      # shared TypeScript types
    ├── ai/                         # LangGraph agents + router + eval
    │   └── src/
    │       ├── providers/          # groq · gemini · cerebras · openrouter · mistral
    │       ├── agents/             # intentRouter · spendingAnalyst · forecaster · …
    │       ├── router.ts           # selectModel() + routedGenerateText()
    │       ├── eval.ts             # logEval() + incrementUsage()
    │       └── types.ts            # Provider · TaskType · EvalLogEntry
    │   └── evals/
    │       └── run-golden.ts       # manual benchmark script
    └── db/                         # Supabase client + schema
```

---

## Getting started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Supabase account (free)
- Groq account — Whisper STT + GPT-OSS chat (free tier)
- Google AI Studio account — Gemini embeddings + reasoning / vision (free tier)

Optional (router falls back gracefully without these):
- Cerebras account — [cloud.cerebras.ai](https://cloud.cerebras.ai) (free tier)
- OpenRouter account — [openrouter.ai](https://openrouter.ai) (free tier)
- Mistral account — [console.mistral.ai](https://console.mistral.ai) (free tier)

### Installation

```bash
git clone https://github.com/hari2309s/truffle.git
cd truffle
pnpm install
```

### Environment setup

```bash
cp .env.example .env.local
```

Fill in your keys:

```bash
# Required
GROQ_API_KEY=                        # Groq — Whisper STT + GPT-OSS (free tier)
GEMINI_API_KEY=                      # Google AI Studio — embeddings + Gemini (free tier)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_HOST=https://cloud.langfuse.com
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Optional — LLM router fallback providers (add as many as you like)
CEREBRAS_API_KEY=                    # Cerebras — gpt-oss-120b (free tier)
OPENROUTER_API_KEY=                  # OpenRouter — llama-3.3-70b-instruct:free (free tier)
MISTRAL_API_KEY=                     # Mistral — mistral-small-latest (free tier)

# Required for nightly eval judge cron
CRON_SECRET=                         # openssl rand -hex 32
```

### Database setup

Run all migrations in your Supabase project SQL editor in order:

```bash
# Core schema
packages/db/src/migrations/001_initial.sql             # transactions, anomalies, snapshots, chat
packages/db/src/migrations/002_savings_goals.sql       # savings_goals table + RLS
packages/db/src/migrations/003_pgvector_gemini.sql     # pgvector extension + match_transactions RPC
packages/db/src/migrations/004_savings_habits.sql      # savings_habits + habit_contributions + RLS
packages/db/src/migrations/005_proactive_messages.sql  # is_proactive, read_at, nudge_key on chat_messages
packages/db/src/migrations/006_indexes.sql             # performance indexes for common query patterns
packages/db/src/migrations/007_monthly_budgets.sql     # monthly_budgets table + RLS

# LLM router + eval layer
supabase/migrations/20260530000001_daily_llm_usage.sql # global per-provider daily request counters
supabase/migrations/20260530000002_eval_logs.sql       # every LLM call logged with latency + quality score
supabase/migrations/20260530000003_increment_llm_usage_rpc.sql  # atomic Postgres RPC (race-safe increment)
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
┌──────────┬───────────┬────────────┬───────────────┬─────────────────┐
│          │           │            │               │                 │
▼          ▼           ▼            ▼               ▼                 ▼
Spending  Anomaly  Forecaster  Affordability  Savings Goal      Habit
Analyst   Reviewer             Checker        Advisor           Advisor
│          │           │            │               │                 │
└──────────┴───────────┴────────────┴───────────────┴─────────────────┘
    ↓
Synthesizer           ← formats a calm, spoken response
    ↓
Spoken + displayed answer
```

Each agent node calls `routedGenerateText(taskType, options)` which transparently selects the best available provider, logs the call to `eval_logs`, and increments the daily usage counter.

---

## LLM router

`packages/ai/src/router.ts` implements a task-aware multi-provider router. On every LLM call it reads today's global request counts from Supabase and walks a priority list until it finds a provider under its daily budget:

| Task | Priority order |
|---|---|
| `fast-chat` | Groq → Cerebras → OpenRouter → Mistral |
| `reasoning` | Gemini → Groq → Cerebras → OpenRouter |
| `tool-calling` | Groq → Gemini → Cerebras |
| `vision` | Gemini → Groq |

Daily limits (conservative — ~10% below actual free tier caps):

| Provider | Daily limit |
|---|---|
| Groq | 900 |
| Gemini | 1 300 |
| Cerebras | 1 500 |
| OpenRouter | 250 |
| Mistral | 600 |

All limits and priority orders are constants in `router.ts` — easy to tune.

---

## Embeddings

Transaction and query embeddings use Gemini `gemini-embedding-2`, truncated to
768 dims to match the `transactions.embedding` `vector(768)` column
(`packages/ai/src/embeddings.ts`). Similarity search runs in Postgres via the
`match_transactions` RPC (cosine distance, HNSW index).

Embedding vectors are model-specific — if you change the model, existing rows
must be re-embedded or semantic search silently returns irrelevant results:

```bash
# Backfill every transaction with the current model. Idempotent; resumable.
ENV_FILE=.env.production.local pnpm --filter @truffle/ai reembed

# Verify connectivity / row count without writing:
DRY_RUN=1 ENV_FILE=.env.production.local pnpm --filter @truffle/ai reembed
```

The script paces itself under the Gemini free-tier limit (~100 req/min, 1000/day);
raise `REEMBED_RPM` if billing is enabled. On interruption it prints a
`REEMBED_AFTER_ID=…` line to resume from.

---

## Eval layer

Every LLM call — from agents, the chat route, and the golden eval script — writes a row to `eval_logs`:

```
provider · task · input · output · latency_ms · tokens_used · expected_intent · judge_score
```

A nightly cron job at `/api/cron/eval-judge` (runs at 03:00 UTC via Vercel Crons) fetches yesterday's unscored rows and asks Groq to rate each response 1–5. The result is written back to `judge_score`.

**Weekly analytics query** (run in Supabase SQL editor):

```sql
SELECT
  provider,
  task,
  COUNT(*)                            AS total_calls,
  ROUND(AVG(latency_ms))              AS avg_latency_ms,
  ROUND(AVG(judge_score)::NUMERIC, 2) AS avg_quality_score,
  SUM(tokens_used)                    AS total_tokens,
  COUNT(*) FILTER (WHERE judge_score >= 4) * 100 / COUNT(*) AS pct_good_responses
FROM eval_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND judge_score IS NOT NULL
GROUP BY provider, task
ORDER BY task, avg_quality_score DESC;
```

**Manual golden dataset benchmark:**

```bash
pnpm --filter @truffle/ai eval
```

Runs 15 predefined queries through the router, logs all results to `eval_logs`, and prints a pass/fail summary. Run the judge cron afterwards to get quality scores.

**Transaction categorization accuracy:**

```bash
pnpm --filter @truffle/ai run eval:categorize   # scores a 30-row stratified sample of transactions.csv
```

Scores `CATEGORY_GUIDANCE` (`packages/ai/src/prompts/categorization.prompt.ts`) — the instruction the LLM gets when deciding a transaction's category — against a curated ground-truth CSV, and prints `accuracy: N` to stdout.

That guidance string can be iteratively improved with [Weco](https://weco.ai), an LLM-guided tree-search code optimizer:

```bash
pip install weco
weco run \
  -s packages/ai/src/prompts/categorization.prompt.ts \
  -c "pnpm --filter @truffle/ai run eval:categorize" \
  -m accuracy -g maximize \
  -n 15 \
  --api-key gemini=$GEMINI_API_KEY
```

Weco rewrites `categorization.prompt.ts` between steps, re-runs the eval, and keeps the best-scoring version — restoring the original unless you confirm applying the winner at the end (or pass `--apply-change`). Review the winning prompt before keeping it, since a small sample can be gamed.

---

## Testing

### Unit tests (Vitest)

Pure function tests across the `web` and `ai` packages — no DB or LLM calls.

```bash
pnpm test
```

| Package | Covered |
|---|---|
| `apps/web` | `currency` (toEur, formatCurrency), `habits` (getCurrentPeriod, previousPeriod, computeStreak), `forecast` (computeForecast) |
| `packages/ai` | `toneDetection` (getSpeechTone, getToneGuidance) |

### E2E tests (Playwright)

Browser-level tests against the running Next.js dev server. Supabase network calls are intercepted so no real auth or data is needed.

```bash
cd apps/web
pnpm test:e2e          # headless run
pnpm test:e2e:ui       # interactive Playwright UI
```

| Suite | What's covered |
|---|---|
| `auth.spec.ts` | Auth page rendering, email form, OTP confirmation screen, expired-link error |
| `navigation-guards.spec.ts` | `/chat` and `/insights` redirect to `/` when unauthenticated |

---

## License

MIT
