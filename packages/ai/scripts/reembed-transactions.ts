/**
 * Re-embed every stored transaction with the current embedding model.
 *
 * Run with: pnpm --filter @truffle/ai reembed
 *
 * Why: `transactions.embedding` vectors are model-specific. Whenever the model in
 * `src/embeddings.ts` changes (e.g. gemini-embedding-001 -> gemini-embedding-2),
 * previously stored vectors live in a different space and `match_transactions`
 * cosine search silently returns irrelevant rows. This backfill rewrites them all.
 * It is idempotent — safe to interrupt and re-run.
 *
 * The embedding column dimensionality (768) is unchanged, so no SQL migration is
 * needed — only the vector values.
 *
 * Requires env vars (use the PROD values — the service-role key bypasses RLS so
 * every user's rows can be updated):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
 *
 * Env resolution order:
 *   1. anything already exported in the shell (wins)
 *   2. the file named by ENV_FILE — absolute, or relative to the repo root
 *   3. .env.local at the repo root
 * e.g.  ENV_FILE=.env.production.local pnpm --filter @truffle/ai reembed
 * (pnpm runs this with cwd=packages/ai, so ENV_FILE is resolved from the repo
 * root, not the current directory.)
 *
 * Add `--dry-run` (or DRY_RUN=1) to just verify the connection and print the row
 * count without writing anything or calling the embeddings API.
 */

// Load env before importing anything that reads process.env
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { isAbsolute, resolve } from 'path'

const repoRoot = resolve(__dirname, '../../..')
const envFile = process.env.ENV_FILE ?? '.env.local'
const envPath = isAbsolute(envFile) ? envFile : resolve(repoRoot, envFile)
if (!existsSync(envPath)) {
  console.error(`env file not found: ${envPath}`)
  process.exit(1)
}
console.log(`loading env from ${envPath}`)
config({ path: envPath })

import { createClient } from '@supabase/supabase-js'
import type { Transaction } from '@truffle/types'
import { embedTransaction } from '../src/embeddings'

const PAGE_SIZE = 200
const CONCURRENCY = Number(process.env.REEMBED_CONCURRENCY ?? 3)
const MAX_RETRIES = 4

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Retry embedding calls with exponential backoff — the Gemini embeddings free
// tier is RPM-limited and returns 429s under load. Config errors (wrong model,
// wrong dimensionality) are not transient, so fail fast on those.
function isTransient(e: unknown): boolean {
  const msg = (e as Error).message ?? ''
  if (/expected 768/.test(msg)) return false
  return /429|rate limit|timeout|ECONN|ETIMEDOUT|50[023]/i.test(msg)
}

async function embedWithRetry(tx: Transaction): Promise<number[]> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await embedTransaction(tx)
    } catch (e) {
      if (attempt >= MAX_RETRIES || !isTransient(e)) throw e
      await sleep(1000 * 2 ** attempt)
    }
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const missing = [
    !url && 'NEXT_PUBLIC_SUPABASE_URL',
    !key && 'SUPABASE_SERVICE_ROLE_KEY',
    !process.env.GEMINI_API_KEY && 'GEMINI_API_KEY',
  ].filter(Boolean)
  if (missing.length) {
    throw new Error(
      `Missing env vars: ${missing.join(', ')}. ` +
        `Check they exist in the loaded env file (Vercel names may differ).`
    )
  }

  const db = createClient(url!, key!)

  const dryRun = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run')
  if (dryRun) {
    const { count, error } = await db
      .from('transactions')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    console.log(`[dry-run] connected OK. ${count ?? 0} transactions would be re-embedded.`)
    return
  }

  let from = 0
  let processed = 0
  let failed = 0

  for (;;) {
    const { data, error } = await db
      .from('transactions')
      .select('id, user_id, amount, currency, description, category, merchant, date, is_recurring')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    for (let i = 0; i < data.length; i += CONCURRENCY) {
      const batch = data.slice(i, i + CONCURRENCY)
      await Promise.all(
        batch.map(async (row) => {
          const tx = {
            id: row.id as string,
            userId: row.user_id as string,
            amount: Number(row.amount),
            currency: (row.currency as Transaction['currency']) ?? 'EUR',
            description: row.description as string,
            category: (row.category as Transaction['category']) ?? 'other',
            merchant: (row.merchant as string | null) ?? undefined,
            date: row.date as string,
            isRecurring: Boolean(row.is_recurring),
          } as Transaction

          try {
            const embedding = await embedWithRetry(tx)
            const { error: updateError } = await db
              .from('transactions')
              .update({ embedding })
              .eq('id', tx.id)
            if (updateError) throw updateError
            processed++
          } catch (e) {
            failed++
            console.error(`  ✗ ${tx.id}:`, (e as Error).message)
          }
        })
      )
    }

    console.log(`re-embedded ${processed} rows (${failed} failed)…`)
    from += PAGE_SIZE
  }

  console.log(`\nDone. ${processed} transactions re-embedded, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
