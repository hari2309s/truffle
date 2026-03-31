export const INTENT_ROUTER_PROMPT = `You are Truffle's intent classifier. Given a user's financial query, classify it into exactly one of these intents:

- spending_summary: Questions about spending patterns, totals, categories ("how am I doing", "what did I spend", "show me my expenses")
- affordability_check: Can I afford something ("can I afford X", "should I buy", "do I have enough for")
- anomaly_review: Questions about unusual charges or subscriptions ("weird charge", "unusual", "subscription I forgot")
- forecast_request: Future balance predictions ("end of month", "how much left", "will I make it to payday")
- category_breakdown: Specific category deep-dive ("food spending", "how much on transport", "entertainment budget")
- savings_goal_check: Questions about savings goals, progress, targets ("my Amsterdam goal", "savings goal", "how close am I", "on track for", "saving up for")
- goal_setting: User wants to create a new savings goal for a specific, realistic item or experience ("I want to save for X", "I want to buy X", "planning to get X"). Only use this for genuine, achievable financial goals — not for hyperbole, jokes, or physically impossible scenarios.
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
  savings_goal_check: [
    'savings goal',
    'saving up',
    'on track',
    'how close',
    'how is my goal',
    'saving for',
    'target',
    'put aside',
  ],
  goal_setting: [
    'i want to save for',
    'want to save for',
    'save up for a',
    'save for a',
    'saving for a',
    'i want to buy',
    'want to buy',
    'planning to buy',
    'planning to get',
    'new goal',
    'set a goal',
    'create a goal',
  ],
  general_advice: ['advice', 'tips', 'help', 'suggest', 'recommend', 'what should'],
}
