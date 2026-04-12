import { generateText } from 'ai'
import { chatModel } from '../llm'
import { langfuse } from '../langfuse'
import { SPENDING_ANALYST_PROMPT } from '../prompts/spendingAnalyst.prompt'
import type { Transaction, MonthlySnapshot } from '@truffle/types'

export async function analyseSpending(
  query: string,
  transactions: Transaction[],
  snapshot: MonthlySnapshot,
  traceId?: string
): Promise<string> {
  const context = transactions
    .slice(0, 30)
    .map((t) => `${t.date}: ${t.description} (${t.category}) €${t.amount}`)
    .join('\n')

  const prompt = SPENDING_ANALYST_PROMPT.replace('{context}', context)
    .replace('{question}', query)
    .replace('{currentMonth}', snapshot.month)
    .replace('{totalSpent}', Math.abs(snapshot.totalExpenses).toFixed(2))
    .replace('{totalIncome}', snapshot.totalIncome.toFixed(2))

  const gen = traceId
    ? langfuse.generation({
        traceId,
        name: 'analyseSpending',
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
