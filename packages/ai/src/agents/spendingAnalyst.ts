import { generateText } from 'ai'
import { chatModel } from '../llm'
import { SPENDING_ANALYST_PROMPT } from '../prompts/spendingAnalyst.prompt'
import type { Transaction, MonthlySnapshot } from '@truffle/types'

export async function analyseSpending(
  query: string,
  transactions: Transaction[],
  snapshot: MonthlySnapshot
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

  const { text } = await generateText({
    model: chatModel,
    prompt,
    maxTokens: 300,
  })

  return text
}
