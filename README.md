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
![Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-Whisper_STT-F55036?logoColor=white)
![Web Speech API](https://img.shields.io/badge/Web_Speech_API-TTS-orange?logo=googlechrome&logoColor=white)

![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Auth-3ECF8E?logo=supabase&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-vector_store-E85D27?logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## Features

- 🎙️ **Voice first** — hold to speak, get a spoken answer back
- 🧠 **Conversational reasoning** — ask anything about your finances in plain language
- 🔍 **Anomaly detection** — spots unusual charges and forgotten subscriptions automatically
- 📈 **Spending forecast** — tells you where you'll land at end of month
- 😌 **Emotionally aware** — calm, warm tone always. Never a lecture
- 📱 **PWA** — installs on iOS and Android, works offline

---

## How it works

```
You speak → Groq Whisper transcribes → LangGraph routes your intent
→ Gemini reasons over your actual transaction history (via RAG)
→ Response streams back → Web Speech API reads it aloud
```

Your transactions are embedded locally using `@xenova/transformers` and stored in ChromaDB — meaning the reasoning is grounded in your real data, not generic advice.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| PWA | `next-pwa` + Web Speech API + MediaRecorder API |
| AI Orchestration | LangGraph.js |
| LLM | Vercel AI SDK + Google Gemini 1.5 Flash |
| Embeddings | `@xenova/transformers` (local, free) |
| Voice → Text | Groq API (Whisper) |
| Text → Voice | Web Speech API (browser native) |
| Vector Store | ChromaDB |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| State | Zustand + TanStack Query |
| Monorepo | pnpm workspaces + Turborepo |
| Deployment | Vercel |

**Monthly infrastructure cost: $0**

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
- Google AI Studio account for Gemini API key (free)
- Groq account for Whisper API key (free)

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
GEMINI_API_KEY=           # Google AI Studio — free
GROQ_API_KEY=             # Groq — free
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LANGFUSE_PUBLIC_KEY=      # LangFuse — free tier
LANGFUSE_SECRET_KEY=
```

### Database setup

```bash
# Run migrations in your Supabase project SQL editor
# File: packages/db/src/migrations/001_initial.sql
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
┌───┬───┬───┬──────┐
│   │   │   │      │
▼   ▼   ▼   ▼      ▼
Spending  Anomaly  Forecaster  Affordability
Analyst   Detector             Checker
│   │   │   │      │
└───┴───┴───┴──────┘
    ↓
Synthesizer           ← formats a calm, spoken response
    ↓
Spoken + displayed answer
```

---

## Roadmap

**MVP** ✅
- [x] Monorepo scaffold (pnpm + Turborepo)
- [x] Supabase schema + magic link auth
- [x] Manual transaction entry
- [x] `@xenova/transformers` embedding pipeline
- [x] ChromaDB vector store
- [x] LangGraph agent graph (intent router + spending analyst + synthesizer)
- [x] `/api/chat` streaming endpoint (Gemini via Vercel AI SDK)
- [x] Voice input via Groq Whisper (`/api/voice`)
- [x] Voice output via Web Speech API
- [x] Chat UI with hold-to-speak VoiceButton
- [x] Monthly summary card + end-of-month forecast
- [x] PWA manifest + service worker
- [x] Vercel deployment config

**Phase 2**
- [x] Statistical anomaly detection (category spend vs. 90-day baseline)
- [ ] Forecaster agent (LangGraph node)
- [ ] Affordability checker ("can I afford X?")
- [ ] Emotional tone adaptation in responses
- [ ] CSV import
- [ ] Image/PDF upload — parse receipts and statements via Gemini Vision

**Phase 3**
- [ ] Subscription tracker
- [ ] Savings goals with voice check-ins
- [ ] Weekly audio summary (push notification → voice brief)
- [ ] Multi-currency support

> **Note:** Truffle is intentionally bank-link free. All transactions are entered manually — via text, CSV, or uploaded images/PDFs. No third-party data brokers, no OAuth bank flows.

---

## Contributing

This is a personal project but PRs are welcome. Open an issue first to discuss what you'd like to change.

---

## License

MIT

---

<div align="center">
  <sub>Built in Berlin 🇩🇪 by <a href="https://github.com/hari2309s">Hariharan Selvaraj</a></sub>
</div>