import { generateText } from 'ai'
import { chatModel } from '../llm'
import { ANOMALY_REVIEWER_PROMPT } from '../prompts/anomalyReviewer.prompt'
import type { Transaction, Anomaly } from '@truffle/types'

export async function reviewAnomalies(
  query: string,
  transactions: Transaction[],
  anomalies: Anomaly[]
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

  const { text } = await generateText({
    model: chatModel,
    prompt,
    maxTokens: 300,
  })

  return text
}
