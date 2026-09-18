/**
 * CI entry point for langfuse/experiment-action (.github/workflows/langfuse-eval.yml).
 * Runs the "agent-golden" dataset (loaded by the action via `dataset_name`) and
 * fails the job — via RegressionError — if any aggregate drops below its
 * threshold.
 *
 * Thresholds below have margin under a real local baseline run (2026-09-18,
 * https://cloud.langfuse.com/project/cmnany0j100quad077rpanm7t/datasets/cmu6tsf0m00qiad0co2n1dvu9/runs/f803cc85-5b0f-4671-ba15-2a31020cecf4):
 *   avg_intent_accuracy: 0.733 (11/15 router cases)
 *   avg_response_quality: 3.333 (12 agent-response items, 1-5 LLM judge)
 *   avg_numeric_faithfulness: 0.875 (7/8 items with a numericCheck)
 * routeIntent()'s LLM-fallback path and the judge itself are both
 * non-deterministic, so thresholds sit a full item or more below baseline —
 * see packages/ai/evals/README.md for how to re-baseline after a real prompt
 * or model change.
 */

import { RegressionError, type RunnerContext } from '@langfuse/client'
import { runAgentItem } from './task'
import {
  intentExactMatch,
  numericFaithfulness,
  responseQualityJudge,
  avgIntentAccuracy,
  avgResponseQuality,
  avgNumericFaithfulness,
} from './evaluators'
import type { EvalItemInput, EvalItemMetadata } from './dataset-items'

const THRESHOLDS = {
  avg_intent_accuracy: 0.6, // baseline 0.733 (11/15) — allows ~2 more router misses
  avg_response_quality: 3.0, // baseline 3.333 — margin for judge variance
  avg_numeric_faithfulness: 0.75, // baseline 0.875 (7/8) — allows 1 flip before failing
}

export async function experiment(context: RunnerContext<EvalItemInput, undefined, EvalItemMetadata>) {
  const result = await context.runExperiment({
    name: 'CI gate: agent-golden',
    task: runAgentItem,
    evaluators: [intentExactMatch, numericFaithfulness, responseQualityJudge],
    runEvaluators: [avgIntentAccuracy, avgResponseQuality, avgNumericFaithfulness],
    maxConcurrency: 2, // free-tier Gemini quota is 5 req/min; keep bursts well under that
  })

  for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
    const value = result.runEvaluations.find((e) => e.name === metric)?.value
    if (typeof value !== 'number' || value < threshold) {
      throw new RegressionError({
        result,
        metric,
        value: typeof value === 'number' ? value : 0,
        threshold,
      })
    }
  }

  return result
}
