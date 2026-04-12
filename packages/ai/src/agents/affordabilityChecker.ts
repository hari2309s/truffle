import { generateText } from 'ai'
import { chatModel } from '../llm'
import { langfuse } from '../langfuse'
import { AFFORDABILITY_CHECKER_PROMPT } from '../prompts/affordabilityChecker.prompt'
import type { Transaction, MonthlySnapshot } from '@truffle/types'

export async function checkAffordability(
  query: string,
  transactions: Transaction[],
  snapshot: MonthlySnapshot,
  traceId?: string
): Promise<string> {
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysElapsed = today.getDate()
  const daysRemaining = daysInMonth - daysElapsed

  const dailySpendRate =
    daysElapsed > 0 && snapshot.totalExpenses < 0
      ? Math.abs(snapshot.totalExpenses) / daysElapsed
      : 0

  const projectedBalance = snapshot.balance - dailySpendRate * daysRemaining

  const context = transactions
    .slice(0, 20)
    .map((t) => `${t.date}: ${t.description} (${t.category}) €${t.amount}`)
    .join('\n')

  const prompt = AFFORDABILITY_CHECKER_PROMPT.replace(
    '{currentBalance}',
    snapshot.balance.toFixed(2)
  )
    .replace('{totalIncome}', snapshot.totalIncome.toFixed(2))
    .replace('{totalExpenses}', Math.abs(snapshot.totalExpenses).toFixed(2))
    .replace('{projectedBalance}', projectedBalance.toFixed(2))
    .replace('{daysRemaining}', String(daysRemaining))
    .replace('{context}', context)
    .replace('{question}', query)

  const gen = traceId
    ? langfuse.generation({
        traceId,
        name: 'checkAffordability',
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
