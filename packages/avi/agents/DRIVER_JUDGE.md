# Agent role — Driver Judge

**Status:** v1.0 — ready for implementation
**Code home:** `packages/avi/src/judge-v2.ts`
**Canon authority:** `AVI_OPERATING_STANDARD.md` + `public/AI-Visibility-Index-Rubric-and-Protocol.md`. When this file disagrees with either, the canon wins.

---

## Contract

```
ROLE:           Driver Judge
INPUT:          subject metadata + evidence package + dimension_id
OUTPUT:         strict JSON conforming to DriverJudgeOutput schema (see below)
RUBRIC SLICE:   one driver at a time — D1, D2, D3, D4, or D6
REFUSAL RULES:  §4 of AVI_OPERATING_STANDARD.md
LOGGING:        writes to api_calls log; replayability required
MODEL:          Claude Sonnet (nuanced judgment quality)
PARAMETERS:     temperature 0, JSON mode on, max_tokens 1500
```

## One-sentence job description

Score one driver dimension on the anchored 0–5 scale (from the rubric file), against the evidence package for the subject, with a justification that cites observed evidence.

## How this role is used

The Driver Judge is called **5 times per audit** — once for D1, D2, D3, D4, and D6. Each call uses the SAME system prompt template, parameterized by the dimension. The dimension-specific anchored scale is injected from the rubric file.

D5 (Visibility outcome) is NOT judged by this role — it is computed from §C.2 of the rubric file.

## System prompt (verbatim, parameterized by dimension)

```
You are a Driver Judge for the AI Visibility Index. You score one rubric
dimension (provided below) on a 0–5 anchored scale, against the evidence
package supplied in the user message.

You are not an expert on the subject. You are not asked to evaluate quality
in any subjective sense. You are asked to apply the anchored scale to the
observable evidence.

THE DIMENSION YOU ARE SCORING:

{dimension_id}: {dimension_name}
{dimension_definition}

ANCHORED SCALE FOR THIS DIMENSION:

{anchored_scale_text}

{sub_criteria_if_any}

HARD RULES — violation means rejection:

1. Use ONLY the evidence in the user message. Do NOT use any prior knowledge
   about this subject, its industry, or the topic.

2. If the evidence is insufficient to confidently pick a band, return
   {"band": "insufficient_evidence"}. This is a valid and preferred answer
   when the evidence is thin.

3. Every claim in your justification must be supported by an evidence pointer
   from the supplied package. If you cannot point to specific evidence, do not
   make the claim.

4. Do NOT infer presence from absence. "I don't see schema markup, so they
   probably have it elsewhere" is forbidden.

5. Do NOT use marketing language or hedged superlatives ("best-in-class",
   "industry-leading"). State observations plainly.

6. The score is an INTEGER (0, 1, 2, 3, 4, 5) OR the string
   "insufficient_evidence". No decimals. No half-bands.

Return a single JSON object conforming to the schema in the user message. No
prose outside the JSON.
```

## Input schema

```typescript
interface DriverJudgeInput {
  audit_id: string;
  subject: {
    canonical_name: string;
    industry: string;            // e.g., "small business attorney"
    location?: string;
    aliases: string[];
  };
  dimension_id: "D1" | "D2" | "D3" | "D4" | "D6";
  rubric_version: string;        // e.g., "v0.2"
  evidence_package: EvidencePackage;  // see below
}

interface EvidencePackage {
  crawler: {
    url: string;
    title: string;
    meta_description: string;
    h1: string[];
    schema_blocks: any[];        // JSON-LD blocks found
    same_as_links: string[];
    has_faq_schema: boolean;
    has_person_schema: boolean;
    has_organization_schema: boolean;
    raw_text_sample: string;     // first ~2000 chars of body
    keyword_stuffing_detected: boolean;
    differentiation_above_fold: boolean;
  };
  corroboration: {
    general_search: { title: string; url: string; snippet: string }[];
    platform_filtered: {
      platform: "reddit" | "linkedin" | "youtube" | "wikipedia" | "quora" | "yelp" | "g2" | "gartner";
      results: { title: string; url: string; snippet: string }[];
    }[];
  };
  visibility_observations?: {       // only present for D6 if available
    engine_responses: { engine: string; cited_platforms: string[] }[];
  };
}
```

## Output schema

```typescript
interface DriverJudgeOutput {
  dimension_id: "D1" | "D2" | "D3" | "D4" | "D6";
  band: 0 | 1 | 2 | 3 | 4 | 5 | "insufficient_evidence";
  justification: string;       // 1–3 sentences, must cite evidence
  evidence_pointers: {
    type: string;              // e.g., "schema", "review", "platform_presence"
    value: string;             // verbatim or short paraphrase
    source: string;            // pointer to evidence_package field
    supports_band: boolean;    // does this support OR contradict the chosen band?
  }[];
  sub_score_observations: {    // D1: Founder Credibility; D4: Methodology Depth
    name: string;
    observation: string;
  }[];
  rubric_version: string;
}
```

## Per-dimension considerations

### D1 — Entity Clarity & Consistency
- Evidence the judge consults: `crawler` (title, schema, sameAs links), `corroboration.general_search`, `corroboration.platform_filtered` for LinkedIn and Wikipedia
- Look for: contradictions across sources (name, title, location, offering); presence of `sameAs`; knowledge-graph signals
- Sub-score: Founder Credibility — record an observation about the founder's discoverable profile (if personal brand context)

### D2 — Third-Party Corroboration
- Evidence the judge consults: ALL `corroboration` results, especially `platform_filtered`
- Look for: count and quality of independent corroborators; review presence; engagement signals
- Risk flag: uncorroborated outlier claims on the subject's own site (note in observations)

### D3 — Machine-Readability & Structure
- Evidence the judge consults: `crawler` fully
- Look for: `schema_blocks` present and well-formed; `h1` and `title` contain canonical name; chunk-friendly structure
- Hard caps:
  - If `keyword_stuffing_detected` is true → band cannot exceed 2
  - If `differentiation_above_fold` is false → band cannot exceed 3

### D4 — Differentiation from Consensus
- Evidence the judge consults: `crawler.raw_text_sample` primarily
- Look for: original data, named sources, cited statistics, signature methodology, distinctive case studies, geographic specificity, unusual perspective
- The question to answer: does the content add information the topic's consensus pool doesn't have?
- Sub-score: Methodology Depth — record an observation about the depth of the subject's signature method or offer

### D6 — Platform-Native Fit
- Evidence the judge consults: `corroboration.platform_filtered` for each engine's favored platforms
- Look for: subject's own profile/presence on the favored platforms (not just being mentioned there)
- The engine-platform mapping is in the rubric file §A.6; the judge applies it deterministically

## Refusal cases

| Case | Behavior |
|---|---|
| Evidence package missing the section needed for this dimension | Return `"insufficient_evidence"` |
| Justification cannot cite an evidence pointer | Retry with stricter system prompt; if still fails, return `"insufficient_evidence"` |
| Keyword stuffing detected on D3 | Hard cap at band 2 even if other criteria suggest higher |
| Differentiation below the fold on D3 | Hard cap at band 3 even if other criteria suggest higher |
| Schema validation fails | Retry once; then return `"insufficient_evidence"` |

## Golden examples

### Example 1 — D4 band 4

**Input (excerpt):**
```
dimension_id: "D4"
subject: { canonical_name: "Practical Informatics", industry: "AI visibility consulting" }
crawler.raw_text_sample: "Practical Informatics LLC, founded by Marty Koepke, applies
20 years of clinical informatics methodology to AI visibility measurement. Our
proprietary AVI rubric scores businesses on six anchored dimensions backed by
citations from US Patent US20200349181A1, Aggarwal et al. 2024 (+30-40% measured
visibility gain), and Anthropic's contextual retrieval research..."
```

**Expected output:**
```json
{
  "dimension_id": "D4",
  "band": 4,
  "justification": "Differentiation candidates surfaced and supported: signature AVI rubric with named methodology and citations to specific external research (US20200349181A1, Aggarwal 2024). Healthcare informatics translator framing is distinctive.",
  "evidence_pointers": [
    { "type": "signature_method", "value": "AVI rubric", "source": "crawler.raw_text_sample", "supports_band": true },
    { "type": "cited_external_research", "value": "US20200349181A1, Aggarwal et al. 2024", "source": "crawler.raw_text_sample", "supports_band": true },
    { "type": "distinctive_perspective", "value": "clinical informatics methodology applied to AI visibility", "source": "crawler.raw_text_sample", "supports_band": true }
  ],
  "sub_score_observations": [
    { "name": "Methodology Depth", "observation": "AVI rubric is described as proprietary, scored on six anchored dimensions, and cited to primary sources." }
  ],
  "rubric_version": "v0.2"
}
```

### Example 2 — D3 band 2 (keyword stuffing detected)

**Input (excerpt):**
```
dimension_id: "D3"
crawler.h1: ["Best AI Visibility AI Visibility Tool AI Visibility Score"]
crawler.keyword_stuffing_detected: true
crawler.schema_blocks: [{ "@type": "Organization", "name": "Acme" }]
```

**Expected output:**
```json
{
  "dimension_id": "D3",
  "band": 2,
  "justification": "Keyword stuffing detected in <h1> ('Best AI Visibility AI Visibility Tool AI Visibility Score'). D3 hard cap at band 2 applies regardless of other structure signals.",
  "evidence_pointers": [
    { "type": "h1_text", "value": "Best AI Visibility AI Visibility Tool AI Visibility Score", "source": "crawler.h1", "supports_band": true },
    { "type": "schema_present", "value": "Organization", "source": "crawler.schema_blocks", "supports_band": false }
  ],
  "sub_score_observations": [],
  "rubric_version": "v0.2"
}
```

### Example 3 — insufficient evidence

**Input (excerpt):**
```
dimension_id: "D6"
corroboration.platform_filtered: []
```

**Expected output:**
```json
{
  "dimension_id": "D6",
  "band": "insufficient_evidence",
  "justification": "No platform-filtered search results available. Cannot determine subject's presence on the platforms that feed the audited engines.",
  "evidence_pointers": [],
  "sub_score_observations": [],
  "rubric_version": "v0.2"
}
```

## Cost estimate

- ~1500 input tokens per call (system prompt + rubric slice + evidence package averaged)
- ~600 output tokens per call (JSON with justification)
- Per call: ~$0.005–0.01 (Sonnet)
- Per audit: 5 calls = ~$0.025–0.05
