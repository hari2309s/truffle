import { generateText } from 'ai'
import { geminiFlash } from '../gemini'
import { AFFORDABILITY_CHECKER_PROMPT } from '../prompts/affordabilityChecker.prompt'
import type { Transaction, MonthlySnapshot } from '@truffle/types'

export async function checkAffordability(
  query: string,
  transactions: Transaction[],
  snapshot: MonthlySnapshot
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

  const { text } = await generateText({
    model: geminiFlash,
    prompt,
    maxTokens: 300,
  })

  return text
}
