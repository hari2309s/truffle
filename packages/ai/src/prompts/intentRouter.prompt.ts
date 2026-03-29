export const INTENT_ROUTER_PROMPT = `You are Truffle's intent classifier. Given a user's financial query, classify it into exactly one of these intents:

- spending_summary: Questions about spending patterns, totals, categories ("how am I doing", "what did I spend", "show me my expenses")
- affordability_check: Can I afford something ("can I afford X", "should I buy", "do I have enough for")
- anomaly_review: Questions about unusual charges or subscriptions ("weird charge", "unusual", "subscription I forgot")
- forecast_request: Future balance predictions ("end of month", "how much left", "will I make it to payday")
- category_breakdown: Specific category deep-dive ("food spending", "how much on transport", "entertainment budget")
- general_advice: General financial questions or advice

Respond with ONLY the intent key, nothing else.`

export const INTENT_KEYWORDS: Record<string, string[]> = {
  spending_summary: [
    'how am i doing',
    'spending',
    'spent',
    'expenses',
    'outgoings',
    'this month',
    'last month',
    'this week',
  ],
  affordability_check: ['can i afford', 'should i buy', 'enough for', 'afford', 'budget for'],
  anomaly_review: [
    'unusual',
    'weird',
    'strange',
    'forgotten',
    'subscription',
    'unexpected',
    'charged',
  ],
  forecast_request: [
    'end of month',
    'how much left',
    'payday',
    'will i have',
    'project',
    'forecast',
    'predict',
  ],
  category_breakdown: [
    'food',
    'groceries',
    'transport',
    'entertainment',
    'housing',
    'utilities',
    'health',
    'shopping',
  ],
  general_advice: ['advice', 'tips', 'help', 'suggest', 'recommend', 'what should'],
}
