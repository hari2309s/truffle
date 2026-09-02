import { createGroq } from '@ai-sdk/groq'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })

// Groq retired the Llama 3.x chat models in 2026 — GPT-OSS 120B is the current
// general-purpose / reasoning workhorse on GroqCloud.
export const chatModel = groq('openai/gpt-oss-120b')

// Groq's Llama 4 Scout (the old vision model) was deprecated in 2026. Receipt /
// statement extraction now runs on Gemini 3.7 Flash, which handles both images
// and PDFs natively and is the primary provider for the router's `vision` task.
export const visionModel = google('gemini-3.7-flash')

// GPT-OSS models are reasoning models — by default Groq inlines the chain of
// thought as `<think>…</think>` in the message content, which corrupts callers
// that parse `text` (intent labels, judge scores) and pollutes streamed answers.
// `parsed` moves it to a separate `reasoning` field so `text` is only the answer.
// Pass this as `providerOptions` on every Groq generateText/streamText call.
// (Harmless for non-Groq providers — they ignore the `groq` key.)
// NOTE: this SDK (`@ai-sdk/groq` v1) has no `reasoningEffort` knob, so reasoning
// still consumes part of `maxTokens` — budgets below are sized with headroom.
export const groqProviderOptions = { groq: { reasoningFormat: 'parsed' as const } }
