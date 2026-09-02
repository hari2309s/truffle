import { NextRequest } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { generateText } from 'ai'
import { chatModel, groqProviderOptions, langfuseClient } from '@truffle/ai'
import { createServerClient as createDbClient } from '@truffle/db'

export const runtime = 'nodejs'
export const maxDuration = 60

function sanitizeForPrompt(text: string, maxLen = 500): string {
  return String(text ?? '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLen)
}

const JUDGE_PROMPT = (task: string, input: string, output: string) =>
  `
You are evaluating an AI financial assistant response.
Task type: ${sanitizeForPrompt(task, 100)}
User input: ${sanitizeForPrompt(input)}
AI response: ${sanitizeForPrompt(output)}

Score the response 1-5 on this scale:
1 = Wrong, harmful, or completely irrelevant
2 = Partially relevant but missing key info
3 = Adequate but not great
4 = Good, accurate, and helpful
5 = Excellent — precise, useful, well-framed

Reply with only a single digit (1-5). No explanation.
`.trim()

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.warn('[eval-judge] CRON_SECRET env var is not set; all requests will be rejected')
    return new Response('Unauthorized', { status: 401 })
  }
  const secret = req.headers.get('x-cron-secret')
  const expected = process.env.CRON_SECRET
  // Pad to the same length before timingSafeEqual so the comparison never
  // short-circuits on length, preventing a length-based timing side-channel.
  const rawA = Buffer.from(secret ?? '')
  const rawB = Buffer.from(expected)
  const maxLen = Math.max(rawA.length, rawB.length)
  const bufA = Buffer.alloc(maxLen)
  rawA.copy(bufA)
  const bufB = Buffer.alloc(maxLen)
  rawB.copy(bufB)
  // Padding ensures timingSafeEqual always runs in constant time regardless of length.
  // Different-length secrets always diverge after padding, so the length check is redundant.
  const valid = timingSafeEqual(bufA, bufB)
  if (!valid) {
    return new Response('Unauthorized', { status: 401 })
  }

  const db = createDbClient()

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  const todayStr = now.toISOString().split('T')[0]

  const { data: logs, error } = await db
    .from('eval_logs')
    .select('id, input, output, task, trace_id')
    .is('judge_score', null)
    .gte('created_at', `${dateStr}T00:00:00Z`)
    .lt('created_at', `${todayStr}T00:00:00Z`)
    .limit(100)

  if (error) {
    console.error('[eval-judge] fetch error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  let scored = 0
  for (const log of logs ?? []) {
    try {
      const { text } = await generateText({
        model: chatModel,
        prompt: JUDGE_PROMPT(log.task, log.input, log.output),
        // chatModel is GPT-OSS (a reasoning model): it emits reasoning tokens
        // before the answer, so `maxTokens: 1` returned an empty string and no
        // row was ever scored. `providerOptions` keeps reasoning out of `text`.
        maxTokens: 256,
        providerOptions: groqProviderOptions,
      })

      // Expect a bare digit (the prompt asks for one, and reasoning is stripped
      // from `text`). Anything ambiguous → skip the row rather than guess.
      const match = text.trim().match(/^([1-5])(?:\s*\/\s*5)?[.\s]*$/)
      const parsed = match ? Number(match[1]) : NaN
      if (parsed >= 1 && parsed <= 5) {
        // Write score back to eval_logs
        const { error: updateError } = await db
          .from('eval_logs')
          .update({ judge_score: parsed })
          .eq('id', log.id)
        if (updateError) {
          console.warn('[eval-judge] failed to persist score for log', log.id, updateError)
          continue
        }

        // Also attach the score to the Langfuse trace so it appears in the
        // observability dashboard alongside the generation that produced it
        if (log.trace_id) {
          langfuseClient.score.create({
            traceId: log.trace_id,
            name: 'response_quality',
            value: parsed,
            comment: `Automated judge score (1–5) for task: ${sanitizeForPrompt(log.task, 100)}`,
          })
        }

        scored++
      }
    } catch (e) {
      console.warn('[eval-judge] failed to score log', log.id, e)
    }
  }

  // Flush Langfuse scores before the function exits
  await langfuseClient.score.flush()

  return Response.json({ scored, total: logs?.length ?? 0 })
}
