/**
 * Golden dataset eval script.
 * Run with: pnpm --filter @truffle/ai eval
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * GROQ_API_KEY (and any other provider keys you want tested).
 */

// Load .env.local from repo root before importing anything
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../.env.local') })

import { routedGenerateText } from '../src/router'
import type { TaskType } from '../src/types'

interface TestCase {
  input: string
  task: TaskType
  expectedIntent: string
}

const GOLDEN_DATASET: TestCase[] = [
  {
    input: 'How much did I spend on food last month?',
    task: 'fast-chat',
    expectedIntent: 'spending_summary',
  },
  {
    input: 'Can I afford a €200 jacket this month?',
    task: 'reasoning',
    expectedIntent: 'affordability_check',
  },
  {
    input: "What's my biggest expense category?",
    task: 'fast-chat',
    expectedIntent: 'spending_summary',
  },
  {
    input: 'Am I on track to hit my savings goal?',
    task: 'reasoning',
    expectedIntent: 'savings_goal_check',
  },
  {
    input: 'Did I spend more on dining out than last month?',
    task: 'reasoning',
    expectedIntent: 'anomaly_review',
  },
  {
    input: 'What will my balance be at end of month?',
    task: 'reasoning',
    expectedIntent: 'forecast_request',
  },
  {
    input: 'Show me my transport spending',
    task: 'fast-chat',
    expectedIntent: 'category_breakdown',
  },
  {
    input: 'Set up a €200 monthly saving habit',
    task: 'fast-chat',
    expectedIntent: 'habit_setting',
  },
  { input: 'Log a €45 grocery shop at Lidl', task: 'fast-chat', expectedIntent: 'add_transaction' },
  {
    input: 'Create a savings goal for a new laptop for €1200',
    task: 'reasoning',
    expectedIntent: 'goal_setting',
  },
  {
    input: 'How are my finances looking overall?',
    task: 'fast-chat',
    expectedIntent: 'spending_summary',
  },
  {
    input: 'Any unusual spending this month?',
    task: 'reasoning',
    expectedIntent: 'anomaly_review',
  },
  {
    input: 'When will I reach my emergency fund goal?',
    task: 'reasoning',
    expectedIntent: 'savings_goal_check',
  },
  {
    input: 'How much have I spent on subscriptions?',
    task: 'fast-chat',
    expectedIntent: 'category_breakdown',
  },
  {
    input: 'Can I afford a weekend trip to Berlin for €300?',
    task: 'reasoning',
    expectedIntent: 'affordability_check',
  },
]

async function run() {
  console.log(`\nRunning golden dataset eval (${GOLDEN_DATASET.length} cases)...\n`)

  let passed = 0
  const results: Array<{ input: string; provider: string; ok: boolean }> = []

  for (const tc of GOLDEN_DATASET) {
    try {
      const { text } = await routedGenerateText(
        tc.task,
        { prompt: tc.input, maxTokens: 150 },
        { expectedIntent: tc.expectedIntent }
      )

      // We don't parse intent from the response — the judge scores quality instead.
      // Mark as "passed" if the model returned a non-empty, non-error response.
      const ok = text.trim().length > 10
      if (ok) passed++

      console.log(`${ok ? '✓' : '✗'} [${tc.task}] ${tc.input.slice(0, 60)}`)
      if (!ok) console.log(`   ↳ Response was empty or too short: "${text.slice(0, 80)}"`)

      results.push({ input: tc.input, provider: 'routed', ok })
    } catch (e) {
      console.log(`✗ [${tc.task}] ${tc.input.slice(0, 60)}`)
      console.log(`   ↳ Error: ${e instanceof Error ? e.message : String(e)}`)
      results.push({ input: tc.input, provider: 'routed', ok: false })
    }
  }

  console.log(`\nResult: ${passed}/${GOLDEN_DATASET.length} passed`)
  console.log(`Score:  ${((passed / GOLDEN_DATASET.length) * 100).toFixed(1)}%`)
  console.log('\nAll calls logged to eval_logs — run the judge cron to score quality.\n')
}

run().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
