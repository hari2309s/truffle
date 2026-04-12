import { generateText } from 'ai'
import { chatModel } from '../llm'
import { langfuse } from '../langfuse'
import { ANOMALY_REVIEWER_PROMPT } from '../prompts/anomalyReviewer.prompt'
import type { Transaction, Anomaly } from '@truffle/types'

export async function reviewAnomalies(
  query: string,
  transactions: Transaction[],
  anomalies: Anomaly[],
  traceId?: string
): Promise<string> {
  const anomalyText =
    anomalies.length > 0
      ? anomalies.map((a) => `[${a.severity}] ${a.description}`).join('\n')
      : 'No anomalies detected — spending patterns look normal.'

  const context = transactions
    .slice(0, 20)
    .map((t) => `${t.date}: ${t.description} (${t.category}) €${t.amount}`)
    .join('\n')

  const prompt = ANOMALY_REVIEWER_PROMPT.replace('{anomalies}', anomalyText)
    .replace('{context}', context)
    .replace('{question}', query)

  const gen = traceId
    ? langfuse.generation({
        traceId,
        name: 'reviewAnomalies',
        model: 'llama-3.3-70b-versatile',
        input: prompt,
      })
    : null

  const { text, usage } = await generateText({
    model: chatModel,
    prompt,
    maxTokens: 300,
  })

  gen?.end({
    output: text,
    usage: usage ? { input: usage.promptTokens, output: usage.completionTokens } : undefined,
  })

  return text
}
