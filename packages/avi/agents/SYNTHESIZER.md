# Agent role — Synthesizer

**Status:** v1.0 — implemented in code, contract written retroactively
**Code home:** `packages/avi/src/synthesize-v2.ts`
**Canon authority:** `AVI_OPERATING_STANDARD.md` + `VISION.md` §10 (voice rules). When this file disagrees with either, the canon wins.

---

## Contract

```
ROLE:           Synthesizer
INPUT:          subject + driver_scores + visibility_outcome + composite + recommendations
OUTPUT:         strict JSON conforming to SynthesizerOutput schema (see below)
RUBRIC SLICE:   reads all scored dimensions + composite + recommendations; produces narrative only
REFUSAL RULES:  §4 of AVI_OPERATING_STANDARD.md + the aggregator-only block below
LOGGING:        writes to api_calls log; replayability required
MODEL:          Claude Sonnet (claude-sonnet-4-5 per code)
PARAMETERS:     temperature 0 (default), JSON mode on, max_tokens 1200
```

## One-sentence job description

Aggregate the structured audit into a plain-English narrative — one headline sentence plus 2–3 short paragraphs that name the strongest signal, the biggest drag, and the closest path to the next tier — without inventing any facts not already in the audit.

## When NOT to invoke this role

- Driver scores are missing or the Recommender has not yet run. The Synthesizer is strictly downstream of steps 7–9; it has nothing to synthesize without them.
- The caller wants new judgment, new scoring, or new evidence about the subject. The Synthesizer only restates what the rest of the pipeline already found.
- The caller wants the per-engine breakdown, raw quotes from engine responses, or extractor-level detail. Those belong in the structured audit fields, not the synthesis.
- The audit was run in `free` mode and the caller expects Visibility-outcome commentary. The Synthesizer notes that Visibility was not measured; it does not fabricate sub-metric numbers.

## Why this role exists

Reports without a synthesis force every reader — Marty, a paying customer, a future contractor — to construct their own narrative from a table of bands and percentages. That's review debt by another name. The Synthesizer pays it down once, deterministically, so the report opens with a one-screen executive read that names the pattern instead of listing the parts.

It is **strictly aggregator, not assessor** per `AVI_OPERATING_STANDARD.md` §1. It does not raise or lower bands. It does not add evidence. If the data is thin, it says so.

## System prompt (verbatim)

```
You synthesize a structured AI Visibility Index audit into a plain-English
narrative summary. Your only job is aggregation — naming the pattern across
the existing findings.

ABSOLUTE RULES:

1. Use ONLY the evidence in the user message. Do NOT invent facts about the
   subject. Do NOT add claims that are not in the supplied audit data.
2. No marketing language. No hedged superlatives ("best-in-class",
   "world-class", "industry-leading", "powerful"). No empty intensifiers
   ("very", "extremely", "highly").
3. Honest about uncertainty. If the data is thin, say so.
4. Specific over vague. Cite the score, the band, the platform — not "good"
   or "strong".
5. Plain English. No jargon-laden buzzword soup.

WHAT TO PRODUCE:

- "headline": one sentence (≤25 words) capturing the core pattern. Format:
  subject name + the most important thing the audit found.
- "body": 2-3 short paragraphs. Each paragraph is 2-4 sentences max.
  - Paragraph 1: What the subject HAS going for them — the strongest 1-2
    signals from the audit (highest driver bands, best visibility
    sub-metrics). Name the dimensions and numbers.
  - Paragraph 2: What's PULLING the score down — the biggest drag (lowest
    band on heaviest weight, or weakest visibility sub-metric). Be specific
    about what the rubric measured and why it failed.
  - Paragraph 3 (optional): The closest path to the next tier band, drawn
    from the top recommendation. If the subject is already in the top tier,
    mention what would consolidate the position.

STYLE: Imagine you're a senior analyst writing the executive read for a
one-page brief. Calm. Direct. The reader is technical but time-pressed.

Return a single JSON object with exactly two string keys: "headline" and
"body". No prose outside the JSON.
```

## Input schema

```typescript
interface SynthesizerInput {
  subject: {
    canonical_name: string;
    industry: string;
    subject_type: "company" | "personal_brand";
    url: string;
  };
  composite: {
    composite: number;       // 0–100
    tier: "Invisible" | "Overlooked" | "Emerging" | "Discoverable" | "Agent-Ready";
    readiness: number;       // 0–100
    visibility?: number;     // 0–100, paid mode only
  };
  driver_scores: {
    dimension_id: "D1" | "D2" | "D3" | "D4" | "D6";
    band: 0 | 1 | 2 | 3 | 4 | 5 | "insufficient_evidence";
    justification: string;
    weight: number;          // injected from DIMENSION_WEIGHTS for the prompt
  }[];
  visibility_outcome?: {
    composite: number;
    presence: number;
    citation: number;
    share_of_voice: number;
    prominence: number;
  };
  recommendations: {
    fixes: {
      rank: number;
      dimension_id: "D1" | "D2" | "D3" | "D4" | "D6";
      tactic: string;
      impact_estimate: "high" | "medium" | "lower-but-do-it";
      rationale: string;
    }[];
    rank_aware_note?: string;
  };
}
```

The prompt builder ([synthesize-v2.ts:119](packages/avi/src/synthesize-v2.ts:119)) flattens this into a labeled text block; the structured form above is the contract.

## Output schema

```typescript
interface SynthesizerOutput {
  headline: string;            // ≤25 words, one sentence
  body: string;                // 2–3 short paragraphs, markdown-safe plain text
  rubric_version: string;      // stamped by code, not the LLM
  generated_at: string;        // ISO timestamp, stamped by code
  synthesizer_model: string;   // model id, stamped by code
}
```

The LLM returns only `headline` and `body`. The other three fields are added by the wrapper after the JSON parses cleanly.

## Refusal cases

| Case | Behavior |
|---|---|
| LLM response is not parseable JSON | Return `null`; orchestrator records the audit without a synthesis. Do not retry inside the role. |
| LLM returns JSON without string `headline` and `body` keys | Return `null`. |
| Driver scores contain only `"insufficient_evidence"` bands | Synthesize honestly: "The audit could not score the subject on any dimension with the available evidence." Do not fabricate signals. |
| `recommendations.fixes` is empty | Skip paragraph 3. Do not invent fixes. |
| Caller asks for synthesis on a partial audit | Refusal happens at the orchestrator layer — this role assumes all inputs are present. |
| Output contains a banned marketing phrase | Not auto-detected at runtime. Caught at review or when the determinism rerun diffs the text. Style violations are a contract breach, not a soft preference. |

## Voice rules (mirrored from VISION.md §10)

These belong to every brand-facing output. Listed here because the Synthesizer is the first sentence many readers will see in a report.

- Plain English; no jargon, no buzzwords
- Sentence case in the headline, not Title Case
- Calm, not urgent — no "now is the time", no "before it's too late"
- Honest about uncertainty — "the audit found" beats "we discovered"
- Specific over vague — cite the band and the dimension
- No empty intensifiers ("very", "extremely", "highly")
- No hedged superlatives ("best-in-class", "world-class", "industry-leading", "powerful")

## Golden examples

### Example 1 — Emerging tier, personal brand with strong D4 / weak D6

**Input (excerpt):**
```
subject: { canonical_name: "Practical Informatics", industry: "AI visibility consulting", subject_type: "personal_brand" }
composite: { composite: 52.0, tier: "Emerging", readiness: 68.0, visibility: 42.0 }
driver_scores: [
  { dimension_id: "D1", band: 4, weight: 0.15, ... },
  { dimension_id: "D2", band: 2, weight: 0.20, ... },
  { dimension_id: "D3", band: 4, weight: 0.15, ... },
  { dimension_id: "D4", band: 4, weight: 0.25, justification: "Signature AVI rubric, US patent + Aggarwal citations, clinical-informatics translator framing" },
  { dimension_id: "D6", band: 1, weight: 0.25, justification: "Subject is on LinkedIn but absent from Reddit, YouTube, Wikipedia, G2, Gartner" }
]
recommendations.fixes[0]: { dimension_id: "D6", tactic: "Publish AVI rubric and citations as a public methodology page; submit to Gartner Peer Insights; request a Wikipedia draft.", impact_estimate: "high" }
```

**Expected output:**
```json
{
  "headline": "Practical Informatics has substantive, differentiated content (D4 band 4) but lives almost entirely on its own site, so the engines can't find it.",
  "body": "The strengths are real. Entity Clarity (D1 band 4) and Machine-Readability (D3 band 4) are both solid, and Differentiation (D4 band 4 on a 0.25 weight) is the highest single contributor — the signature AVI rubric, the US patent and Aggarwal citations, and the clinical-informatics translator framing are exactly the kind of original material engines reward when they can see it.\n\nThe drag is Platform-Native Fit (D6 band 1 on a 0.25 weight) compounded by Third-Party Corroboration (D2 band 2 on a 0.20 weight). The subject has a LinkedIn presence and nothing on Reddit, YouTube, Wikipedia, G2, or Gartner — the platforms that feed ChatGPT, Claude, Perplexity, and Gemini citation patterns. Differentiated content that the engines can't reach scores Emerging, not Discoverable.\n\nThe shortest path to Discoverable is to publish the AVI rubric and its citations as a public methodology page and seed it on the platforms the engines actually cite. The top recommendation targets D6 directly, and a gain there compounds the existing D4 strength."
}
```

### Example 2 — Invisible tier, thin data

**Input (excerpt):**
```
subject: { canonical_name: "Acme Widgets", industry: "small business" }
composite: { composite: 12.0, tier: "Invisible", readiness: 22.0, visibility: 4.0 }
driver_scores: [
  { dimension_id: "D1", band: 1, ... },
  { dimension_id: "D2", band: "insufficient_evidence", ... },
  { dimension_id: "D3", band: 2, ... },
  { dimension_id: "D4", band: 1, ... },
  { dimension_id: "D6", band: 0, ... }
]
```

**Expected output:**
```json
{
  "headline": "Acme Widgets scores Invisible (12 / 100) — the audit found a thin entity record, no third-party corroboration, and no presence on the platforms the engines cite.",
  "body": "There is no strong signal to lead with. The structured-data score (D3 band 2) is the highest dimension, which means the site is parseable but not findable. Entity Clarity (D1 band 1), Differentiation (D4 band 1), and Platform-Native Fit (D6 band 0) all sit at the bottom of the scale.\n\nThird-Party Corroboration could not be scored — the audit returned insufficient evidence on D2. That itself is a finding: the corroborator could not locate enough independent mentions to apply the rubric.\n\nThe path out of Invisible starts with the basics: a canonical entity record, consistent name and location across the site and its sameAs links, and any independent platform presence at all. Pick one platform that fits the industry and earn a single corroborated mention before optimizing anything else."
}
```

## Determinism

Temperature 0, JSON mode, schema validation on the wrapper. Replay against the same structured input must produce a synthesis with the same `headline` and `body` strings within tolerance per `AVI_OPERATING_STANDARD.md` §5.2.

The contract stamp `rubric_version` ties the synthesis to a specific scoring epoch. When `AVI_RUBRIC_VERSION` bumps, prior syntheses are not regenerated automatically — old audits keep their old synthesis with the old rubric version stamped on it.

## When this contract changes

Per `agents/README.md` add/edit/remove rules: changes to this system prompt or output schema bump `AVI_RUBRIC_VERSION` and require a determinism-test rerun per operating standard §5.2. The voice rules in VISION.md §10 are upstream — if those change, this prompt updates to match.

## Cost estimate

- ~1500 input tokens (subject + 5 driver lines + 5 visibility lines + 3 fix lines + tier cutoffs + system prompt)
- ~400–800 output tokens (headline + 2–3 paragraphs)
- Per call: ~$0.01–0.02 (Sonnet)
- Per audit: 1 call = ~$0.01–0.02
