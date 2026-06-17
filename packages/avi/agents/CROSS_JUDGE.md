# Agent role — Cross-Judge

**Status:** Stub. Contract scaffolded; not yet built. Will be wired in once the Driver Judge is calibrated.
**Code home:** `lib/avi/cross_judge.ts` (to be created)
**Canon authority:** `AVI_OPERATING_STANDARD.md`. When this file disagrees with the operating standard, the operating standard wins.

---

## Contract

```
ROLE:           Cross-Judge
INPUT SCHEMA:   <pointer — to be written>
OUTPUT SCHEMA:  <pointer — to be written>
RUBRIC SLICE:   reads same dimension and same evidence as Driver Judge; produces independent band
REFUSAL RULES:  §4 of AVI_OPERATING_STANDARD.md
LOGGING:        writes to api_calls table; replayability required
```

## One-sentence job description

Run an independent second-vendor scoring of the same dimension on the same evidence the Driver Judge saw, so we can detect when our primary judge is drifting or hallucinating.

## What the Cross-Judge does

For QA-flagged audits (every Nth audit, or any audit manually flagged), re-score each driver dimension using a *different LLM vendor* than the primary Driver Judge. If primary is Anthropic Claude, Cross-Judge is OpenAI GPT-4o, or vice versa. Receives the same anchored scale, the same evidence package, and the same input format. Returns the same output schema as Driver Judge plus an `agreement_with_primary` field.

The Cross-Judge does **not** override the primary score. It surfaces disagreement.

## What the Cross-Judge must NOT do

Per operating standard §4:

1. Never see the primary judge's output before scoring. Independence requires blindness to the prior answer.
2. Never use training-data knowledge about the subject.
3. Never produce arithmetic — picks a band, code computes agreement.
4. Never claim authority over the primary score; only flags disagreement for human review.

## Disagreement handling

Per operating standard §5.3:

- **Cross-judge band == primary band:** clean. No flag.
- **|Cross-judge − primary| == 1:** acceptable variance. Logged, no action.
- **|Cross-judge − primary| ≥ 2:** disagreement. Surfaced in the audit's QA tab; appears in the report's methodology page as the audit's `cross_judge_agreement_rate`.
- **Three audits in a row with ≥2-band disagreement on the same dimension:** flag the anchored scale for revision. Possible rubric calibration trigger.

## When the Cross-Judge runs

Open question from operating standard §10 #3. Default proposal:
- Every 10th audit
- Any audit manually flagged for QA
- Any audit where the primary judge returned `"insufficient_evidence"` on 2+ dimensions
- The full first 30 audits after any rubric version bump (calibration period)

## Sections to write

### System prompt
- Identical to Driver Judge's system prompt for the relevant dimension, but explicitly noted as Cross-Judge ("you are not the primary judge; you are scoring independently").
- Anchored scale loaded from rubric file.
- "Do not attempt to guess what another model said" clause.

### Input schema
- Same as Driver Judge.
- Plus `primary_judge_metadata: { model, vendor }` for logging only — not visible in the prompt.

### Output schema
- Same as Driver Judge plus:
  - `agreement_with_primary: enum(match, off_by_one, disagree)`
  - `cross_judge_vendor: string`

### Refusal cases
- Same as Driver Judge.

### Determinism check
The Cross-Judge run is also part of the determinism test in operating standard §5.2. Replay the same input → expect the same band, within tolerance.

## Model and parameters
- Model: opposite vendor from primary Driver Judge (Claude if primary is GPT; GPT if primary is Claude)
- Temperature: 0
- JSON mode: on
- Max tokens: bounded
