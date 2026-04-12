import { generateText } from 'ai'
import { chatModel } from '../llm'
import { langfuse } from '../langfuse'
import { SAVINGS_GOAL_ADVISOR_PROMPT } from '../prompts/savingsGoalAdvisor.prompt'
import type { SavingsGoal, MonthlySnapshot } from '@truffle/types'

export async function adviseSavingsGoals(
  query: string,
  goals: SavingsGoal[],
  snapshot: MonthlySnapshot,
  traceId?: string
): Promise<string> {
  const goalsText =
    goals.length > 0
      ? goals
          .map((g) => {
            const progress = ((g.savedAmount / g.targetAmount) * 100).toFixed(0)
            const remaining = Math.max(0, g.targetAmount - g.savedAmount)
            const deadlineInfo = g.deadline ? ` — deadline ${g.deadline}` : ''
            return `${g.emoji} ${g.name}: €${g.savedAmount} saved of €${g.targetAmount} (${progress}%${deadlineInfo}), €${remaining.toFixed(0)} remaining`
          })
          .join('\n')
      : 'No savings goals set yet.'

  const prompt = SAVINGS_GOAL_ADVISOR_PROMPT.replace('{goals}', goalsText)
    .replace('{totalIncome}', snapshot.totalIncome.toFixed(2))
    .replace('{totalExpenses}', Math.abs(snapshot.totalExpenses).toFixed(2))
    .replace('{currentBalance}', snapshot.balance.toFixed(2))
    .replace('{question}', query)

  const gen = traceId
    ? langfuse.generation({
        traceId,
        name: 'adviseSavingsGoals',
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
