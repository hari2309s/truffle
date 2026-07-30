/**
 * Held-out validation for the Weco-optimized CATEGORY_GUIDANCE.
 * Run with: pnpm --filter @truffle/ai run eval:categorize:holdout
 *
 * Scores the full transactions_tokyo.csv (never seen by `weco run`, which only
 * trains against the sampled transactions.csv rows in categorize-eval.ts) to
 * check the optimized guidance generalizes rather than overfitting to the
 * training sample. Run this once after applying a Weco change, before keeping it.
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../../.env.local') })

import { loadCsvRows, runCategoryEval } from './categorize-lib'

const CSV_PATH = resolve(__dirname, '../../../transactions_tokyo.csv')

async function run() {
  const rows = loadCsvRows(CSV_PATH)
  console.log(
    `\nRunning held-out categorization eval (${rows.length} rows, transactions_tokyo.csv)...\n`
  )
  await runCategoryEval(rows)
}

run().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
