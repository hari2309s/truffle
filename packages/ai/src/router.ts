import { generateText } from 'ai'
import type { CoreMessage } from 'ai'
import type { Provider, TaskType } from './types'
import { logEval, incrementUsage, getGlobalUsage } from './eval'
import { getModel as getGroqModel } from './providers/groq'
import { getModel as getGeminiModel } from './providers/gemini'
import { getModel as getCerebrasModel } from './providers/cerebras'
import { getModel as getOpenRouterModel } from './providers/openrouter'
import { getModel as getMistralModel } from './providers/mistral'

// Conservative buffers — stay ~10% under actual free tier limits
export const DAILY_LIMITS: Record<Provider, number> = {
  groq: 900,
  gemini: 1300,
  cerebras: 1500,
  openrouter: 250,
  mistral: 600,
}

// Priority order per task type. First available provider wins.
export const PRIORITY_ORDER: Record<TaskType, Provider[]> = {
  'fast-chat': ['groq', 'cerebras', 'openrouter', 'mistral'],
  vision: ['gemini', 'openrouter'],
  reasoning: ['gemini', 'groq', 'cerebras', 'openrouter'],
  'tool-calling': ['groq', 'gemini', 'cerebras'],
}

// Model ID strings per provider+task — used for Langfuse tracing
export function getModelId(provider: Provider, task: TaskType): string {
  switch (provider) {
    case 'groq':
      return task === 'vision'
        ? 'meta-llama/llama-4-scout-17b-16e-instruct'
        : 'llama-3.3-70b-versatile'
    case 'gemini':
      return task === 'fast-chat' ? 'gemini-2.0-flash-lite' : 'gemini-2.5-flash'
    case 'cerebras':
      return 'llama3.3-70b'
    case 'openrouter':
      return 'meta-llama/llama-3.3-70b-instruct:free'
    case 'mistral':
      return 'mistral-small-latest'
  }
}

function buildModel(provider: Provider, task: TaskType) {
  switch (provider) {
    case 'groq':
      return getGroqModel(task)
    case 'gemini':
      return getGeminiModel(task)
    case 'cerebras':
      return getCerebrasModel()
    case 'openrouter':
      return getOpenRouterModel()
    case 'mistral':
      return getMistralModel()
  }
}

export async function selectModel(
  task: TaskType
): Promise<{ model: ReturnType<typeof buildModel>; provider: Provider; modelId: string }> {
  let usage: Record<string, number> = {}
  try {
    usage = await getGlobalUsage()
  } catch {
    // If usage check fails, proceed with primary provider rather than blocking the user
  }

  const priority = PRIORITY_ORDER[task]
  for (const provider of priority) {
    if ((usage[`${provider}_requests`] ?? 0) >= DAILY_LIMITS[provider]) continue
    return { model: buildModel(provider, task), provider, modelId: getModelId(provider, task) }
  }

  // All providers exhausted — fall back to primary without tracking, let the API error surface
  console.warn('[LLMRouter] All providers exhausted for task:', task)
  const provider = priority[0]!
  return { model: buildModel(provider, task), provider, modelId: getModelId(provider, task) }
}

/**
 * Get all candidate providers for a task, ordered by priority and filtered by daily usage.
 * Used by streaming callers that need to retry on per-minute rate limits.
 */
export async function selectModelCandidates(
  task: TaskType
): Promise<{ model: ReturnType<typeof buildModel>; provider: Provider; modelId: string }[]> {
  let usage: Record<string, number> = {}
  try {
    usage = await getGlobalUsage()
  } catch {}

  const priority = PRIORITY_ORDER[task]
  const candidates = priority
    .filter((p) => (usage[`${p}_requests`] ?? 0) < DAILY_LIMITS[p])
    .map((provider) => ({
      model: buildModel(provider, task),
      provider,
      modelId: getModelId(provider, task),
    }))

  // If all exhausted, still return primary so the caller can try
  if (candidates.length === 0) {
    const provider = priority[0]!
    return [{ model: buildModel(provider, task), provider, modelId: getModelId(provider, task) }]
  }
  return candidates
}

export interface RouterGenerateOptions {
  prompt?: string
  system?: string
  messages?: CoreMessage[]
  maxTokens?: number
  temperature?: number
}

export async function routedGenerateText(
  task: TaskType,
  options: RouterGenerateOptions,
  meta?: { expectedIntent?: string; traceId?: string }
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number } }> {
  let usage: Record<string, number> = {}
  try {
    usage = await getGlobalUsage()
  } catch {}

  const priority = PRIORITY_ORDER[task]
  const input = options.prompt ?? options.system ?? ''

  for (const provider of priority) {
    if ((usage[`${provider}_requests`] ?? 0) >= DAILY_LIMITS[provider]) continue

    const model = buildModel(provider, task)
    const start = Date.now()

    try {
      const result = await generateText({ ...(options as object), model } as Parameters<
        typeof generateText
      >[0])

      const latencyMs = Date.now() - start
      const promptTokens = result.usage?.promptTokens ?? 0
      const completionTokens = result.usage?.completionTokens ?? 0

      Promise.all([
        incrementUsage(provider),
        logEval({
          provider,
          task,
          input,
          output: result.text,
          latencyMs,
          tokensUsed: promptTokens + completionTokens,
          traceId: meta?.traceId,
          expectedIntent: meta?.expectedIntent,
        }),
      ]).catch((e) => console.error('[LLMRouter] eval log error:', e))

      return { text: result.text, usage: { promptTokens, completionTokens } }
    } catch (e) {
      console.warn(`[LLMRouter] provider ${provider} failed, trying next:`, (e as Error).message)
    }
  }

  // All providers failed — surface a graceful message rather than a raw error
  console.error('[LLMRouter] All providers failed for task:', task)
  return {
    text: "I'm having trouble responding right now. Please try again in a moment.",
    usage: { promptTokens: 0, completionTokens: 0 },
  }
}
