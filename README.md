<div align="center">

<img src="apps/web/public/icons/truffle.png" alt="Truffle" width="80" />

# Truffle

### Your finances, unearthed.

Talk to your money. Truffle listens, understands, and surfaces what's hiding beneath the surface of your financial life — without the dread.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hari2309s/truffle)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8)
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

**MVP**
- [x] Monorepo scaffold
- [ ] Manual transaction entry
- [ ] Voice input + output
- [ ] Spending summary agent
- [ ] Monthly dashboard
- [ ] PWA install

**Phase 2**
- [ ] Anomaly detection
- [ ] End-of-month forecast
- [ ] Affordability checker ("can I afford X?")
- [ ] CSV import

**Phase 3**
- [ ] Open Banking via GoCardless/Nordigen (automatic sync, free tier)
- [ ] Subscription tracker
- [ ] Savings goals with voice check-ins
- [ ] Weekly audio summary

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