import { routedGenerateText } from '../router'
import { INTENT_ROUTER_PROMPT, INTENT_KEYWORDS } from '../prompts/intentRouter.prompt'
import type { QueryIntent } from '@truffle/types'

function classifyByKeywords(query: string): QueryIntent | null {
  const lower = query.toLowerCase()
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (
      keywords.some((kw) =>
        // Short keywords (≤3 chars) like 'hi', 'hey', 'sup' must match as whole
        // words — otherwise 'hi' matches inside "membership", 'hey' inside "they", etc.
        kw.length <= 3 ? new RegExp(`\\b${kw}\\b`).test(lower) : lower.includes(kw)
      )
    ) {
      return intent as QueryIntent
    }
  }
  return null
}

export async function routeIntent(query: string): Promise<QueryIntent> {
  // Fast keyword path first
  const keywordIntent = classifyByKeywords(query)
  if (keywordIntent) return keywordIntent

  // Fall back to LLM classification
  try {
    const { text } = await routedGenerateText('fast-chat', {
      system: INTENT_ROUTER_PROMPT,
      prompt: query,
      maxTokens: 20,
    })
    const intent = text.trim() as QueryIntent
    const validIntents: QueryIntent[] = [
      'spending_summary',
      'affordability_check',
      'anomaly_review',
      'forecast_request',
      'category_breakdown',
      'savings_goal_check',
      'goal_setting',
      'add_transaction',
      'habit_setting',
      'greeting',
      'general_advice',
    ]
    return validIntents.includes(intent) ? intent : 'general_advice'
  } catch {
    return 'general_advice'
  }
}
