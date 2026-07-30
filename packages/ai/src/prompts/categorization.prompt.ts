import { TRANSACTION_CATEGORIES } from '@truffle/types'

// Optimized via `weco run` against packages/ai/evals/categorize-eval.ts.
// This is the only guidance the LLM gets for picking a transaction's category,
// in both production (chatSystemPrompt.ts) and the eval harness — keep it as
// a single exported string so the two stay in sync.
export const CATEGORY_GUIDANCE = `Choose the most appropriate category from this list: ${TRANSACTION_CATEGORIES.join(', ')}.`
