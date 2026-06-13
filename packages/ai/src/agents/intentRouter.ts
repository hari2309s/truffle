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

// Detects shorthand transaction messages like "Netflix subscription 15.99",
// "coffee 5.50", "Uber 12" — a description followed by a price-like number.
// Must NOT match questions ("how much did I spend 100 times?") or goals.
const TRANSACTION_SHORTHAND = /^[a-zA-Z][\w\s\-'']+\s\d+(?:\.\d{1,2})?$/

function looksLikeTransaction(query: string): boolean {
  const trimmed = query.trim()
  // Must be short (likely a quick log, not a question or paragraph)
  if (trimmed.length > 80) return false
  // Must not contain question marks or question words
  if (/\?|how|what|when|where|why|which|can i|do i|should|will/i.test(trimmed)) return false
  return TRANSACTION_SHORTHAND.test(trimmed)
}

export async function routeIntent(query: string): Promise<QueryIntent> {
  // Fast keyword path first
  const keywordIntent = classifyByKeywords(query)
  if (keywordIntent) return keywordIntent

  // Pattern-based detection for shorthand transactions ("Netflix 15.99", "Uber 12")
  if (looksLikeTransaction(query)) return 'add_transaction'

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
