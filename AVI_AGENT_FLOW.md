# AVI agent flow

Plain-English map of how an audit moves through the AVI pipeline — every step, what runs it (pure code or an LLM role), and which contract governs it.

Read this when you need to know what happens between "user submits a URL" and "report rendered." For the *why* behind each role's boundaries, read the contract file in `packages/avi/agents/`. For the canon that overrides everything, read `AVI_OPERATING_STANDARD.md`.

The orchestrator lives at [packages/avi/src/orchestrator-v2.ts](packages/avi/src/orchestrator-v2.ts). It is deterministic — no autonomous agent picks the order; code does.

---

## Two flows

The same orchestrator runs both modes. The mode flag determines whether the live-engine path (steps 3–6) runs.

- **Free Readiness Check** (`mode: 'free'`) — URL-only, ~30 seconds. Steps 1, 2, 7, 8, 9, 10. No live engine queries, no Visibility outcome, two fixes returned.
- **Paid AVI Index Report** (`mode: 'paid'`) — ~3–8 minutes async. All ten steps. Three fixes returned.

---

## The ten steps

| # | Step | Type | Contract | Code | What goes in | What comes out |
|---|---|---|---|---|---|---|
| 1 | Crawler | pure code | n/a | [crawler-v2.ts](packages/avi/src/crawler-v2.ts) | `subject.url`, industry, canonical name | Title, meta, H1, JSON-LD blocks, sameAs links, raw text sample, deterministic scent flags |
| 2 | Corroborator | pure code | n/a | [corroboration-v2.ts](packages/avi/src/corroboration-v2.ts) | `subject` | General + platform-filtered search results (Reddit, LinkedIn, YouTube, Wikipedia, Quora, Yelp, G2, Gartner) |
| 3 | Query Runner | pure code + API | n/a | [queries.ts](packages/avi/src/queries.ts) + [engine-clients.ts](packages/avi/src/engine-clients.ts) | `subject`, query templates, query count | Raw engine responses from ChatGPT, Claude, Perplexity |
| 4 | **Extractor** | **LLM** | [EXTRACTOR.md](packages/avi/agents/EXTRACTOR.md) | [extractor-v2.ts](packages/avi/src/extractor-v2.ts) | One raw engine response + subject + competitors | `ExtractorOutput`: mentioned, cited URLs, position, sentiment, evidence pointers, scent fields |
| 5 | Citation verification | pure code | n/a | `verifyCitations` in [extractor-v2.ts](packages/avi/src/extractor-v2.ts) | `ExtractorOutput` | Same shape, with hallucinated URLs flagged and excluded |
| 6 | Aggregator | pure code | n/a | [aggregator-v2.ts](packages/avi/src/aggregator-v2.ts) | All verified `ExtractorOutput`s | Visibility outcome: composite, presence, citation, share-of-voice, prominence |
| 7 | **Driver Judge** | **LLM × 5** | [DRIVER_JUDGE.md](packages/avi/agents/DRIVER_JUDGE.md) | [judge-v2.ts](packages/avi/src/judge-v2.ts) | One dimension (D1, D2, D3, D4, D6) + evidence package | 0–5 band or `"insufficient_evidence"`, justification, evidence pointers |
| 8 | Composite + Tier | pure code | n/a | [composite-v2.ts](packages/avi/src/composite-v2.ts) | Driver scores + Visibility outcome | Composite 0–1, tier band (`Invisible` → `Agent-Ready`) |
| 9 | **Recommender** | **LLM** | [RECOMMENDER.md](packages/avi/agents/RECOMMENDER.md) | [recommender-v2.ts](packages/avi/src/recommender-v2.ts) | Driver scores, Visibility outcome, tier, N (2 or 3) | Differentiation candidates + ranked fixes with rationale |
| 10 | **Synthesizer** | **LLM** | [SYNTHESIZER.md](packages/avi/agents/SYNTHESIZER.md) | [synthesize-v2.ts](packages/avi/src/synthesize-v2.ts) | Full structured audit | Headline + short body: strongest signal, biggest drag, closest path to next tier |

**LLM-bearing steps are bolded.** Every LLM call runs at temperature 0 with JSON mode on and schema-validated output, per `AVI_OPERATING_STANDARD.md` §2.

---

## The diagram

```
Free flow:    [1 Crawler] ─┐
                            ├─→ [7 Driver Judge × 5] ─→ [8 Composite] ─→ [9 Recommender] ─→ [10 Synthesizer]
              [2 Corroborator] ─┘

Paid flow:    [1 Crawler] ─────────────────────────────┐
                                                        │
              [2 Corroborator] ───────────────────────  │
                                                        │
              [3 Query Runner] ─→ [4 Extractor × N] ─→ [5 Verify citations] ─→ [6 Aggregator]
                                                        │                            │
                                                        └──────────→ evidence_package ┘
                                                                            │
                                                                            ↓
                                                          [7 Driver Judge × 5]
                                                                            │
                                                                            ↓
                                                          [8 Composite + Tier]
                                                                            │
                                                                            ↓
                                                          [9 Recommender]
                                                                            │
                                                                            ↓
                                                          [10 Synthesizer]
```

The Driver Judge sees `evidence_package = { crawler, corroboration }`. The Visibility outcome (built from steps 3–6) does **not** feed the Driver Judge — it is a separate computed dimension (D5) that joins everything at step 8.

---

## Cross-Judge (out-of-band)

The Cross-Judge ([CROSS_JUDGE.md](packages/avi/agents/CROSS_JUDGE.md)) is **not** in the main pipeline. It runs as a QA layer, triggered by sampling rules (every 10th audit, manual flag, after a rubric bump). It scores the same dimensions on the same evidence using a different vendor, and surfaces disagreement — it does not override the primary score. Status: stub. Schemas pending.

---

## Contract status summary

| Role | Contract file | Schema written | Code wired | Notes |
|---|---|---|---|---|
| Extractor | ✅ | ✅ | ✅ | v1.0, golden examples present |
| Driver Judge | ✅ | ✅ | ✅ | v1.0, parameterized per dimension |
| Recommender | ✅ | ✅ | ✅ | v1.0, Aggarwal 2024 + patent citations |
| Synthesizer | ✅ | ✅ | ✅ | v1.0, contract written retroactively from the implemented code |
| Cross-Judge | ⚠ stub | ❌ | ❌ | Contract scaffolded; schemas and code pending Driver Judge calibration |

---

## Persistence

After step 10, the audit object is handed to [persist-audit.ts](packages/avi/src/persist-audit.ts) which writes:

- The audit row to `audits_v2` (including the new `synthesis` JSONB column added in migration `0013_add_synthesis_to_audits_v2.sql`)
- Every LLM call log to `api_calls` (replayability requirement from operating standard §5.2)
- `rubric_version` stamped on every row so old audits remain interpretable after a bump

The CLI entry point that runs an audit end-to-end is exported from [index.ts](packages/avi/src/index.ts).

---

## When this doc needs to change

Update this file whenever:

- A step is added, removed, or reordered in the orchestrator.
- A pure-code step gains an LLM call (it then needs a contract file *and* a row in the table above).
- An LLM role gets a contract file written, promoted from stub, or archived.
- The free vs. paid branch logic changes.

The orchestrator is the source of truth. If this doc and [orchestrator-v2.ts](packages/avi/src/orchestrator-v2.ts) disagree, the code wins and this doc is stale.
