import { generateText } from 'ai'
import { chatModel } from '../llm'
import { langfuse } from '../langfuse'

export async function adviseHabit(query: string, traceId?: string): Promise<string> {
  const gen = traceId
    ? langfuse.generation({
        traceId,
        name: 'adviseHabit',
        model: 'llama-3.3-70b-versatile',
        input: query,
      })
    : null

  const { text, usage } = await generateText({
    model: chatModel,
    prompt: query,
    maxTokens: 150,
  })

  gen?.end({
    output: text,
    usage: usage ? { input: usage.promptTokens, output: usage.completionTokens } : undefined,
  })

  return text
}
