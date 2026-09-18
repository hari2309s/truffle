# Eval layer

Two independent eval suites live here.

## `agent-golden` — router + agent quality (this directory's main suite)

- **Source of truth**: `dataset-items.ts` (git-diffable, reviewable) — 15 router
  intent-classification cases plus 2 cases each for the 6 agents that call an
  LLM directly (`affordabilityChecker`, `forecaster`, `spendingAnalyst`,
  `savingsGoalAdvisor`, `habitAdvisor`, `anomalyReviewer`).
- **Fixtures**: `fixtures.ts` — one synthetic "Hari" user (transactions,
  snapshot, goals, anomalies), reused across items so the dataset doesn't
  duplicate the same data 12 times.
- **Sync to Langfuse**: `pnpm eval:sync-dataset` upserts `dataset-items.ts`
  into the Langfuse dataset `agent-golden` (idempotent — items upsert on
  their `id`). Run this after editing dataset-items.ts.
- **Run locally**: `pnpm eval` — fetches the dataset from Langfuse and runs
  `task.ts` (dispatches each item to the real production function it names)
  through the evaluators in `evaluators.ts`:
  - `intentExactMatch` — deterministic, router items only: does
    `routeIntent()` return the expected `QueryIntent`?
  - `numericFaithfulness` — deterministic, items with a `numericCheck` in
    metadata: does the response cite the figure actually computed from the
    fixture (via the same `computeMonthProjection()` helper the agents use),
    within €1? Catches a model doing its own (wrong) mental math instead of
    restating the number already in its prompt.
  - `responseQualityJudge` — LLM-as-judge, non-router items: mirrors the
    `response-quality` evaluator already live in Langfuse (id
    `cmtoi8lc8034iad0cpr0z1r59`) so CI gets an immediate score instead of
    waiting on that evaluator's async production pipeline. Keep the rubric
    in the two in sync if either changes.
- **CI gate**: `gate.ts` + `.github/workflows/langfuse-eval.yml`, via
  [`langfuse/experiment-action`](https://github.com/langfuse/experiment-action).
  Runs on every push to `main` (this repo has no PR flow) and fails the job
  if `avg_intent_accuracy`, `avg_response_quality`, or
  `avg_numeric_faithfulness` drops below the threshold in `gate.ts`.

### Re-baselining thresholds

`routeIntent()`'s LLM-fallback path and the quality judge are both
non-deterministic, so don't chase the exact baseline number. After a real
prompt, model, or router change:

1. `pnpm eval` locally a couple of times to see the new steady-state range.
2. Update the comments + values in `gate.ts`'s `THRESHOLDS`, leaving the same
   kind of margin (roughly one item's worth) the current values have.
3. Note the new baseline run's Langfuse URL in the comment above
   `THRESHOLDS` for the next person to re-baseline.

Concurrency in both `run-golden.ts` and `gate.ts` is capped at 2 — the
Gemini free tier's per-minute quota is easy to blow through at higher
concurrency, which surfaces as noisy, not-representative scores rather than
a fast failure.

## `categorize-eval.ts` — transaction categorization accuracy

Unrelated suite, driven by weco.ai for prompt optimization — scores
`CATEGORY_GUIDANCE` against a stratified sample of `transactions.csv`. Run
with `pnpm eval:categorize`. See the file header for details.
