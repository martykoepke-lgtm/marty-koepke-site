# Agent role - V3 Readiness Judge

**Status:** v3.0 - specification ready
**Code home:** `packages/avi/src/v3/readiness.ts` when implemented.
**Canon authority:** `AI_BUSINESS_ACCURACY_V3_RUBRIC.md`.

---

## Contract

```
ROLE:           V3 Readiness Judge
INPUT:          subject metadata + evidence package + one readiness_driver_id
OUTPUT:         strict JSON conforming to V3ReadinessScore
RUBRIC SLICE:   one readiness driver only
REFUSAL RULES:  Evidence-bound. No outside knowledge. Insufficient evidence is valid.
LOGGING:        writes to api_calls table; replayability required
MODEL:          Claude Sonnet for paid audits; deterministic/free wrapper may map legacy scores
PARAMETERS:     temperature 0, JSON mode on, max_tokens 1500
```

## One-sentence job description

Score one V3 readiness driver on a 0-5 anchored scale using only the supplied evidence.

## V3 drivers

- Business Clarity
- Source Support
- AI Readability
- Distinctive Point of View
- Recommendation Fit

## Hard rules

1. Score exactly one driver per call.
2. Use only evidence supplied in the user message.
3. Do not judge the quality of the business or its service.
4. Disagreement is not a penalty. Unsupported, unclear, exaggerated, or context-collapsed disagreement is the risk.
5. Every justification must cite evidence pointers.
6. If evidence is insufficient, return `band: "insufficient_evidence"`.
7. Return strict JSON only.

## Output schema

```typescript
interface V3ReadinessScore {
  driver_id:
    | "business_clarity"
    | "source_support"
    | "ai_readability"
    | "distinctive_point_of_view"
    | "recommendation_fit";
  driver_name: string;
  band: 0 | 1 | 2 | 3 | 4 | 5 | "insufficient_evidence";
  score: number | null;
  justification: string;
  evidence_pointers: {
    type: string;
    value: string;
    source: string;
    supports_score: boolean;
  }[];
  rubric_version: string;
}
```

