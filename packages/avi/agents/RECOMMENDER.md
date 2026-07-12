# Agent role — Recommender

**Status:** v1.0 — ready for implementation
**Code home:** `packages/avi/src/recommender-v2.ts`
**Canon authority:** `AVI_OPERATING_STANDARD.md` + `public/AI-Visibility-Index-Rubric-and-Protocol.md`. When this file disagrees with either, the canon wins.

---

## Contract

```
ROLE:           Recommender
INPUT:          subject metadata + driver_scores + visibility_outcome + evidence pointers
OUTPUT:         strict JSON conforming to RecommenderOutput schema (see below)
RUBRIC SLICE:   reads scored dimensions + observed evidence gaps; produces top N fixes
REFUSAL RULES:  §4 of AVI_OPERATING_STANDARD.md + the negative-evidence block below
LOGGING:        writes to api_calls log; replayability required
MODEL:          Claude Sonnet (for nuanced framing) or GPT-4o
PARAMETERS:     temperature 0, JSON mode on, max_tokens 2000
```

## One-sentence job description

Produce the top 2 or 3 fixes the subject should make, ranked by impact-per-hour, each grounded in the subject's specific scored gaps and rank-aware to the subject's current visibility.

## When NOT to invoke this role

- The Driver Judge has not yet produced scores for D1–D4 + D6 on this audit. Recommendations are derivative of scored evidence; no scores means no recommendations.
- The subject's `tier_band` is `"Agent-Ready"` (composite ≥ 0.8). At that tier the Recommender returns monitoring guidance only — no page-level tactics. The orchestrator should branch before calling, not ask for fixes and discard them.
- The caller wants generic marketing or SEO advice. The Recommender only proposes tactics traceable to the rubric, the patent (US20200349181A1), or the Aggarwal 2024 paper.
- The free-tier flow is running. Free Readiness Check uses a fixed two-fix template, not this LLM role. The Recommender runs only for the paid AVI Index Report.

## The patent-derived framing (the question every recommendation answers)

Before tactics, the Recommender asks: **what does this subject know, have, or say that the topic's consensus doesn't?**

This is the patent's mechanism (US20200349181A1) operationalized as a prescription engine. Engines select sources that add information to the topic-level pool; the highest-leverage fixes are the ones that surface the subject's differentiation candidates.

The Recommender therefore has a pre-step: identify the subject's differentiation candidates from the evidence package (proprietary data, signature methodology, geographic specificity, distinctive case studies, unusual perspective). Tactics are then *vehicles for surfacing those candidates* — not generic content additions.

## System prompt (verbatim)

```
You are the Recommender for the AI Visibility Index. You produce the top
{N} fixes for the audited subject, ranked by impact-per-hour. Each fix
addresses a specific scored gap and surfaces a specific differentiation
candidate.

You are not a marketing consultant. You are not asked to give general
advice. You apply the rubric's evidence to produce specific, observable
recommendations.

THE PATENT-DERIVED FRAMING — apply this first:

Before naming tactics, identify what the subject already has that the
category's consensus does NOT have. Those are differentiation candidates.
Your recommendations should surface those candidates — they should NOT
recommend the subject add generic content.

HARD REFUSALS — these tactics are NEVER recommended:

1. NEVER recommend keyword stuffing or keyword density increases.
   Empirical evidence: Aggarwal et al. 2024 measured −10% visibility on
   Perplexity from this tactic.

2. NEVER recommend "make your tone more authoritative" or stylistic
   tone-only changes. Aggarwal: no significant improvement.

3. NEVER recommend "add unique synonyms" or "add technical terms" as
   standalone moves. Aggarwal: essentially null effect.

4. NEVER recommend "make your page more comprehensive" or "cover all
   aspects of the topic." Comprehensive content overlaps with consensus
   and gets filtered out per US20200349181A1.

RANK-AWARE REFUSALS:

5. If the subject's Visibility composite is ≥ 0.6 (tier Discoverable or
   higher), do NOT recommend Cite Sources / Quotation Addition / Statistics
   Addition at the page level. Aggarwal: these tactics REDUCE visibility
   for top-ranked sources by 20–30%. Instead recommend platform-native-fit
   moves and corroboration moves.

UNIVERSAL REFUSALS:

6. NEVER recommend a fix without a specific evidence pointer. "Improve
   your About page" is not a recommendation. "Add proprietary client
   outcome data to the About page (D4 gap: no observed differentiation
   candidates surfaced)" IS a recommendation.

7. NEVER invent a tactic that wasn't validated by the rubric, the patent,
   or the Aggarwal paper. If a recommendation can't trace to one of those,
   do not propose it.

8. NEVER use marketing language or hedged superlatives.

Return a single JSON object conforming to the schema. No prose outside
the JSON.
```

## Input schema

```typescript
interface RecommenderInput {
  audit_id: string;
  subject: {
    canonical_name: string;
    industry: string;
    subject_type: "company" | "personal_brand";
    location?: string;
  };
  driver_scores: {
    dimension_id: "D1" | "D2" | "D3" | "D4" | "D6";
    band: number | "insufficient_evidence";
    justification: string;
    evidence_pointers: any[];
    sub_score_observations: any[];
  }[];
  visibility_outcome?: {
    composite: number;       // 0–1
    presence: number;
    citation: number;
    share_of_voice: number;
    prominence: number;
  };
  tier_band: "Invisible" | "Overlooked" | "Emerging" | "Discoverable" | "Agent-Ready";
  n_fixes: 2 | 3;            // 2 for free tier, 3 for paid
  rubric_version: string;
}
```

## Output schema

```typescript
interface RecommenderOutput {
  differentiation_candidates_observed: {
    name: string;
    description: string;
    evidence_source: string;        // pointer to where it was observed
  }[];
  differentiation_candidates_suggested: {
    question: string;               // questions to ask the subject — not assertions
    rationale: string;
  }[];
  fixes: {
    rank: number;                   // 1, 2, or 3
    dimension_id: "D1" | "D2" | "D3" | "D4" | "D6";
    gap: string;                    // what's missing
    evidence_pointer: string;       // where the gap was observed
    tactic: string;                 // the specific action
    framed_as: string;              // customer-facing framing
    impact_estimate: "high" | "medium" | "lower-but-do-it";
    rationale: string;              // why this is the right move
  }[];
  rank_aware_note?: string;         // present if rank-aware refusals were triggered
  rubric_version: string;
}
```

## Domain priors (applied during ranking)

When the subject's industry is known, weight the tactics per Aggarwal Table 3:

| Subject industry | Prefer tactic | Rationale |
|---|---|---|
| Law, government, regulatory | Statistics Addition | Aggarwal: top performer for legal/government |
| Factual claim heavy (medical, finance, technical reference) | Cite Sources | Aggarwal: top performer for factual queries |
| People & society, biography, personal brand | Quotation Addition | Aggarwal: top performer for narrative content |
| Business, science, health | Fluency Optimization + Statistics | Aggarwal: top performers in combination |
| Debate, opinion, history | Authoritative-with-evidence framing | Aggarwal: works in debate domain |
| AI visibility / SEO / marketing technology | Differentiated-data + signature methodology | No prior; use the universal D4 framing |

These are priors, not rules. Specific evidence in the subject's package overrides the prior.

## Refusal cases

| Case | Behavior |
|---|---|
| No evidence pointer for the proposed gap | Drop the fix; deliver fewer than N fixes if needed |
| All three potential fixes are negative-evidence tactics | Flag the audit for human review; return what fixes you can |
| Subject is at tier Agent-Ready (composite ≥ 0.8) | Recommend monitoring + Sprint upgrade only; no page-level tactics |
| Subject is rank-1-equivalent (Visibility ≥ 0.6) on a specific tactic | Apply rank-aware refusal #5 |
| Subject has zero differentiation candidates surfaced | Output `differentiation_candidates_suggested` (questions) instead of `differentiation_candidates_observed`. Make the top fix "discovery work" — ask the subject what they know |

## Golden example

### Subject: Emerging AI visibility consultancy

**Input (excerpt):**
```
subject: { canonical_name: "Marty Koepke", industry: "AI visibility consulting", subject_type: "personal_brand" }
driver_scores: [
  { dimension_id: "D1", band: 4, ... },
  { dimension_id: "D2", band: 2, justification: "Solid LinkedIn presence, no Reddit/Wikipedia presence, sparse third-party reviews", ... },
  { dimension_id: "D3", band: 4, ... },
  { dimension_id: "D4", band: 4, justification: "Signature AVI rubric with named methodology and citations", ... },
  { dimension_id: "D6", band: 1, justification: "Subject is on LinkedIn but not on Reddit, YouTube, Wikipedia, G2, or Gartner", ... }
]
visibility_outcome: { composite: 0.42, ... }
tier_band: "Emerging"
n_fixes: 3
```

**Expected output:**
```json
{
  "differentiation_candidates_observed": [
    { "name": "AVI rubric methodology", "description": "Anchored 6-dim measurement with citations to primary sources", "evidence_source": "D4 justification" },
    { "name": "Clinical informatics translator framing", "description": "20-year healthcare informatics background applied to AI visibility", "evidence_source": "D4 justification" }
  ],
  "differentiation_candidates_suggested": [],
  "fixes": [
    {
      "rank": 1,
      "dimension_id": "D6",
      "gap": "Subject is absent from Wikipedia, Reddit, YouTube, Gartner, and G2 — the platforms that feed ChatGPT, Claude, Perplexity, and Gemini citation patterns.",
      "evidence_pointer": "D6 score: 1 / 5; corroboration.platform_filtered showed no presence on 5 of 6 engine-favored platforms",
      "tactic": "Publish the AVI rubric and its citations as a public-facing methodology page; submit a structured profile to Gartner Peer Insights; request a Wikipedia draft.",
      "framed_as": "Make the work findable on the platforms the engines actually cite.",
      "impact_estimate": "high",
      "rationale": "D6 is the largest unaddressed gap. Subject has substantive differentiated content (D4 = 4) that is currently invisible to engines because it lives only on the subject's own site."
    },
    {
      "rank": 2,
      "dimension_id": "D2",
      "gap": "No third-party corroboration on Reddit, Wikipedia, or industry analyst coverage. Reviews are sparse.",
      "evidence_pointer": "D2 score: 2 / 5; corroboration.platform_filtered showed solid LinkedIn but nothing else",
      "tactic": "Earn 2–3 third-party mentions on niche AI/SEO/practitioner blogs that align with Claude's preferred sources. Specifically target outlets that cite primary research.",
      "framed_as": "Earn citations from the kinds of sources Claude already trusts.",
      "impact_estimate": "high",
      "rationale": "Claude (one of three audited engines) favors niche practitioner blogs and analyst coverage. D2 gain compounds D6 gain."
    },
    {
      "rank": 3,
      "dimension_id": "D4",
      "gap": "Differentiation candidates exist but are described abstractly. Specific case study or measured outcome would deepen the evidence.",
      "evidence_pointer": "D4 score: 4 / 5; current content describes methodology but does not yet include a worked audit example",
      "tactic": "Publish one worked AVI audit on a real subject (e.g., a competitor company) with the full evidence stack visible.",
      "framed_as": "Show the work on a real subject so the methodology is concrete, not abstract.",
      "impact_estimate": "medium",
      "rationale": "D4 is already strong; this move converts the methodology from claim to demonstration, which raises the band ceiling for D2 and D6 by giving third parties something specific to cite."
    }
  ],
  "rubric_version": "v0.2"
}
```

## Cost estimate

- ~2500 input tokens (system prompt + scored audit + evidence summaries)
- ~1500 output tokens (3 fixes with rationale + differentiation candidates)
- Per call: ~$0.02–0.03 (Sonnet)
- Per audit: 1 call = ~$0.02–0.03
