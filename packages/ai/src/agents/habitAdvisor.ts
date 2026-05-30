import { routedGenerateText } from '../router'
import { langfuse } from '../langfuse'

export async function adviseHabit(query: string, traceId?: string): Promise<string> {
  const gen = traceId
    ? langfuse.generation({ traceId, name: 'adviseHabit', model: 'routed', input: query })
    : null

  const { text, usage } = await routedGenerateText(
    'fast-chat',
    { prompt: query, maxTokens: 150 },
    { traceId }
  )

  gen?.end({
    output: text,
    usage: usage ? { input: usage.promptTokens, output: usage.completionTokens } : undefined,
  })

  return text
}
