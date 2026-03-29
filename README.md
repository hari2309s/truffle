<div align="center">

<img src="apps/web/public/icons/truffle.png" alt="Truffle" width="80" />

# Truffle

### Your finances, unearthed.

Talk to your money. Truffle listens, understands, and surfaces what's hiding beneath the surface of your financial life — without the dread.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hari2309s/truffle)

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)

![LangGraph](https://img.shields.io/badge/LangGraph.js-agent_orchestration-1C3C3C?logo=langchain&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B_%2B_Whisper-F55036?logoColor=white)
![Web Speech API](https://img.shields.io/badge/Web_Speech_API-TTS-orange?logo=googlechrome&logoColor=white)

![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Auth-3ECF8E?logo=supabase&logoColor=white)
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
- 🧾 **Receipt & statement scanning** — photograph a receipt or upload a PDF bank statement; Groq extracts all transactions
- 📂 **CSV import** — drag-and-drop with column auto-detection and category guessing
- 🔄 **Subscription tracker** — automatically detects recurring charges from your history
- 🎯 **Savings goals** — set goals, log deposits, ask the AI how you're tracking
- 🔊 **Weekly audio summary** — spoken recap of your week, once per week
- 💱 **Multi-currency** — EUR, GBP, USD converted to EUR for consistent totals
- 📱 **PWA** — installs on iOS and Android, works offline

---

## How it works

```
You speak → Groq Whisper transcribes → LangGraph routes your intent
→ Groq Llama-3.3-70b reasons over your actual transaction history
→ Response streams back → Web Speech API reads it aloud
```

Your recent transactions are passed directly as context to the model on every query — grounding every answer in your real data, not generic advice.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| PWA | `next-pwa` + Web Speech API + MediaRecorder API |
| AI Orchestration | LangGraph.js |
| LLM | Vercel AI SDK v4 + Groq Llama-3.3-70b-versatile |
| Voice → Text | Groq API (Whisper large-v3) |
| Text → Voice | Web Speech API (browser native) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| State | Zustand + TanStack Query |
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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Database setup

Run both migrations in your Supabase project SQL editor in order:

```bash
packages/db/src/migrations/001_initial.sql   # transactions, anomalies, snapshots, chat
packages/db/src/migrations/002_savings_goals.sql  # savings_goals table + RLS
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

## License

MIT

---

<div align="center">
  <sub>Built in Berlin 🇩🇪 by <a href="https://github.com/hari2309s">Hariharan Selvaraj</a></sub>
</div>