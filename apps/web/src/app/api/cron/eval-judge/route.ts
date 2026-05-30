import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { chatModel, langfuse } from '@truffle/ai'
import { createServerClient as createDbClient } from '@truffle/db'

export const runtime = 'nodejs'
export const maxDuration = 60

const JUDGE_PROMPT = (task: string, input: string, output: string) =>
  `
You are evaluating an AI financial assistant response.
Task type: ${task}
User input: ${input}
AI response: ${output}

Score the response 1-5 on this scale:
1 = Wrong, harmful, or completely irrelevant
2 = Partially relevant but missing key info
3 = Adequate but not great
4 = Good, accurate, and helpful
5 = Excellent — precise, useful, well-framed

Reply with only a single digit (1-5). No explanation.
`.trim()

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const db = createDbClient()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  const { data: logs, error } = await db
    .from('eval_logs')
    .select('id, input, output, task, trace_id')
    .is('judge_score', null)
    .gte('created_at', `${dateStr}T00:00:00Z`)
    .lt('created_at', `${dateStr}T23:59:59Z`)
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
        maxTokens: 1,
      })

      const parsed = parseInt(text.trim(), 10)
      if (parsed >= 1 && parsed <= 5) {
        // Write score back to eval_logs
        await db.from('eval_logs').update({ judge_score: parsed }).eq('id', log.id)

        // Also attach the score to the Langfuse trace so it appears in the
        // observability dashboard alongside the generation that produced it
        if (log.trace_id) {
          langfuse.score({
            traceId: log.trace_id,
            name: 'response_quality',
            value: parsed,
            comment: `Automated judge score (1–5) for task: ${log.task}`,
          })
        }

        scored++
      }
    } catch (e) {
      console.warn('[eval-judge] failed to score log', log.id, e)
    }
  }

  // Flush Langfuse scores before the function exits
  await langfuse.flushAsync()

  return Response.json({ scored, total: logs?.length ?? 0 })
}
