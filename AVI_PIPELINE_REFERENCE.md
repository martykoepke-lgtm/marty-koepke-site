# AVI assessment process — step-by-step, code-grounded

**Owner:** Marty Koepke, Practical Informatics LLC
**Status:** Reference. Grounded in `packages/avi/src/*` only.
**Audience:** Anyone (Marty, contractor, future Claude) who needs to know what runs at each step of the v2 audit pipeline, what mechanism completes it, and — for the LLM-bearing steps — exactly what guardrails the AI works under.
**Source of truth:** the files referenced in each step are the only authority. If a canonical doc says otherwise, the code wins.

---

## Mechanism legend

- **Code** — deterministic TypeScript. No LLM involvement. Replays identically given the same input.
- **External API** — third-party service (Tavily, Anthropic, OpenAI, Perplexity). Code wraps it; the call itself is external.
- **AI** — a single LLM call with a system prompt, structured input, and a schema-validated JSON output. Every AI call in the system is invoked through `llmCall()` in `packages/avi/src/llm.ts` which logs the call to `api_calls` with provider, model, token counts, cost estimate, status, and latency. Direct provider imports are forbidden.

## Pipeline order

Defined in `packages/avi/src/orchestrator-v2.ts`. The orchestrator is plain TypeScript — no LLM decides what runs next. Steps execute sequentially.

```
Free mode: 1 → 2 → 6 → 7 → 8 → 9 → 10
Paid mode: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
```

---

## Step 1 — Crawler

**Mechanism:** Code (with one external `fetch` to the subject's URL)
**Code:** `crawl()` in `packages/avi/src/crawler-v2.ts`
**Input:** `subject.url`, `subject.industry`, `subject.canonical_name`
**Timeout:** 20 seconds (`FETCH_TIMEOUT_MS = 20_000`)

**What runs (all deterministic regex/parsing):**

- Fetches the page with User-Agent `PracticalInformatics-AVI/0.2`
- Parses `<title>`, `<meta name="description">`, `<meta property="og:description">`, all `<h1>` tags
- Extracts all `<script type="application/ld+json">` blocks (JSON-LD schema)
- Walks schema blocks for `Organization`, `Person`, `FAQPage` types and `sameAs` links
- Strips tags → body text; samples first 2000 chars
- Computes scent flags **literally**:
  - `meta_description_has_action_verb` — case-insensitive whole-word match against a 41-verb canonical list (`ACTION_VERBS`)
  - `meta_description_names_category` — `subject.industry` substring or whole-word match
  - `title_has_descriptor` — title contains canonical name + ≥2 other significant words
  - `og_description_present` — non-empty
- Computes anti-signal flags:
  - `keyword_stuffing_detected` — title/h1 word repeats >3, OR top word >4% of body, OR top-3 words >12% of body
  - `differentiation_above_fold` — first 600 chars contain a number, year, $, URL, or proper noun phrase

**No LLM. No third-party API except the page fetch.**

---

## Step 2 — Corroborator

**Mechanism:** Code + external API (Tavily)
**Code:** `corroborate()` in `packages/avi/src/corroboration-v2.ts`
**Input:** `subject` (canonical name + industry)

**What runs:**

- One general Tavily search: `"<canonical_name>" <industry>`, max 8 results
- Six platform-filtered Tavily searches, max 5 results each:
  - `reddit.com`, `linkedin.com`, `youtube.com`, `en.wikipedia.org`, `g2.com`, `gartner.com`
- Total: **up to 7 Tavily calls per audit** (free + paid)
- Each call routed through `tavilySearch()` and logged via the shared logging layer (endpoint string `corroboration_broad` and `corroboration_<platform>`)

**No LLM. Tavily is the only external service.** Failures are caught silently and recorded as empty result sets.

---

## Step 3 — Query Runner (paid only)

**Mechanism:** Code
**Code:** `loadTemplates()` and `buildQueryGrid()` in `packages/avi/src/queries.ts`
**Input:** Subject + `options.queryCount` (default 4)

**What runs:**

- Loads markdown templates from `packages/avi/queries/*.md` (excluding README.md)
- Applies the 80/10/10 sampling rule to pick informational / transactional / navigational queries
- Substitutes placeholders (subject canonical name, industry, buyer_type, problem, location) into template strings
- Returns a `PreparedQuery[]` of length `queryCount`

**No LLM. No external API.**

---

## Step 4 — Engine query grid (paid only)

**Mechanism:** AI — but the engines are being **measured as subjects**, not used as workers
**Code:** `runQueryGrid()` in `packages/avi/src/engine-clients.ts`
**Input:** Prepared queries × engines

**What runs:**

- For each (query × engine) pair, calls `llmCall()` to the respective provider:
  - `chatgpt` → OpenAI
  - `claude` → Anthropic
  - `perplexity` → Perplexity
- `maxTokens: 1500` per call
- 4 queries × 3 engines = **12 calls per paid audit** at default queryCount
- Captures `raw_response` text + timestamp; errors recorded as `error` field on the response row

**This is the only step where the AI is NOT being "asked to do a job" — it is being asked the buyer's question to see what it says.** No system prompt is sent; the query is the user message. There are no guardrails because we are not constraining the engine — we are observing it.

---

## Step 5 — Extractor (paid only) — AI

**Mechanism:** AI (OpenAI, GPT-4o-mini by adapter default) + post-processing Code
**Code:** `extract()` in `packages/avi/src/extractor-v2.ts`, system prompt at line 14
**Input:** One `EngineResponse` (raw text from Step 4) + the `Subject` metadata
**Output:** One `ExtractorOutput` row per engine response (12 rows per paid audit)
**Cost cap:** `maxTokens: 1200` per call
**Citation verification (Code):** `verifyCitations()` — fetches each cited URL, checks (a) HTTP ok, (b) page text contains the subject canonical name or any alias. Failed checks drop the URL from `cited_urls_verified`. 8-second timeout per URL.

### What the AI is doing

Parsing one engine response into a strict JSON object with the fields:

- `mentioned`, `cited_with_link`, `cited_urls`
- `position` (top / middle / late / not_named)
- `competitors_mentioned`, `sentiment`
- `evidence_pointers` — verbatim spans of the response text with char offsets
- `scent` — five literal observable checks (only when mentioned)

### Guardrails it operates under (from the system prompt)

**Hard rules:**

1. Use ONLY the response text + supplied subject metadata. **No prior knowledge.**
2. Do NOT invent citations, URLs, quotes, or facts. If no citation, `cited_urls = []`.
3. Do NOT infer presence from absence. If subject is not mentioned, `mentioned = false`.
4. If response is empty / error / off-topic, return `mentioned: false`, optional fields null.
5. Every `evidence_pointer` value must point to a verbatim span of the response text.

**Scent guardrails (S1–S5) — literal, not interpretive:**

- **S1** `subject_in_opening` — true ONLY if canonical name/alias appears in the **first 100 characters** (count literally)
- **S2** `description_present` — true ONLY if the 200 chars after first mention contain a whole-word match from a frozen 41-verb list (the same list `ACTION_VERBS` from `crawler-v2.ts`)
- **S3** `description_word_count` — words between first mention and next subject/competitor mention OR end of sentence (whichever comes first)
- **S4** `category_named` — `subject.industry` exact string OR a >3-char word from it appears in the S3 window
- **S5** `differentiation_named` — at least one `known_differentiation_terms` string appears in the S3 window

**Post-validation in Code:** result fields are coerced to the schema's enum values. If JSON parsing fails OR the call errors, an `emptyExtraction()` (all-zeros, not-mentioned) is returned and the audit continues.

---

## Step 6 — Aggregator (paid only)

**Mechanism:** Code (pure math)
**Code:** `aggregate()` in `packages/avi/src/aggregator-v2.ts`
**Input:** All `ExtractorOutput[]` rows from Step 5
**Output:** `VisibilityOutcome` (presence, citation, share_of_voice, prominence, composite)

**Math (no LLM):**

```
presence       = mentioned                              / total
citation       = (cited_with_link AND verified URLs)    / total
share_of_voice = mentioned / (mentioned OR competitor_mentioned)
prominence     = avg(position_score)  where top=1.0, middle=0.5, late=0.25, not_named=0.0

composite = 0.20×presence + 0.30×citation + 0.30×share_of_voice + 0.20×prominence
```

All values rounded to 3 decimal places.

---

## Step 7 — Driver Judge — AI

**Mechanism:** AI (Anthropic, Claude Sonnet by adapter default)
**Code:** `judge()` in `packages/avi/src/judge-v2.ts`, system prompt template at line 22
**Calls per audit:** **5** — one per dimension (D1, D2, D3, D4, D6)
**Cost cap:** `maxTokens: 1500` per call
**Input:** `dimension_id`, `subject`, and the `evidence_package` (crawler + corroboration)
**Output:** Per-dimension `DriverScore` with band, justification, evidence_pointers, sub_score_observations

### What the AI is doing

Picking one integer band (0–5) OR the string `"insufficient_evidence"` for one rubric dimension. Writing a 1–3 sentence justification anchored to evidence pointers from the supplied package. Recording sub-score observations (for D1 Founder Credibility / D4 Methodology Depth).

The system prompt is assembled per-dimension by substituting:

- `{DIMENSION_BLOCK}` — the dimension's name, what it measures, and its anchored 0–5 scale (full text per dimension in `DIMENSION_BLOCKS`)
- `{SUB_CRITERIA_BLOCK}` — hard caps and sub-criteria for that dimension (currently only D3 has cap rules)
- `{DIMENSION_ID}` — the literal ID string in the output schema

### Guardrails it operates under

**Hard rules (system prompt):**

1. Use ONLY the evidence in the user message. **No prior knowledge** about the subject, industry, or topic.
2. If evidence is insufficient → return `{"band": "insufficient_evidence"}`. **Preferred over guessing.**
3. Every justification claim must be supported by an evidence pointer. Cannot point → cannot claim.
4. Do NOT infer presence from absence ("I don't see schema, so they probably have it elsewhere" is forbidden).
5. No marketing language, no hedged superlatives ("best-in-class", "industry-leading").
6. Band is an **integer 0–5 or the string `insufficient_evidence`**. No decimals. No half-bands.

**D3-specific hard caps (enforced by the LLM via prompt before output):**

- `keyword_stuffing_detected = true` → cap at **band 2**
- `differentiation_above_fold = false` → cap at **band 3**
- Inadequate metadata scent (any of: `meta_description_chars < 50` OR no action verb OR doesn't name category) → cap at **band 3**

**Post-validation in Code:** if the call errors OR JSON fails to parse, returns `band: "insufficient_evidence"` with the reason as the justification. The audit continues.

---

## Step 8 — Composite + Tier

**Mechanism:** Code (pure math)
**Code:** `compositeScore()` in `packages/avi/src/composite-v2.ts` + `tierFromComposite()` in `packages/avi/src/types.ts`

**Math (no LLM):**

Driver weights (from `DIMENSION_WEIGHTS` in `types.ts`):

- D1 = 0.15, D2 = 0.25, D3 = 0.15, D4 = 0.30, D6 = 0.15

```
Readiness = ( Σ (band × weight) ) / total_weight / 5 × 100
            (renormalized over scored drivers — insufficient_evidence drivers are skipped)
Visibility = visibility_outcome.composite × 100   (paid mode only)
Composite  = 0.40 × Readiness + 0.60 × Visibility   (paid)
           = Readiness                              (free)

Tier (from tierFromComposite):
< 20 → Invisible
20–40 → Overlooked
40–60 → Emerging
60–80 → Discoverable
≥ 80  → Agent-Ready
```

---

## Step 9 — Recommender — AI

**Mechanism:** AI (Anthropic, Claude Sonnet by adapter default)
**Code:** `recommend()` in `packages/avi/src/recommender-v2.ts`, system prompt at line 21
**Calls per audit:** **1**
**Cost cap:** `maxTokens: 2000`
**Input:** Subject + all driver scores + visibility outcome + tier + nFixes (2 free / 3 paid)
**Output:** `RecommenderOutput` — differentiation candidates observed + suggested + top-N fixes ranked by impact-per-hour

### What the AI is doing

Identifying what the subject has that the category's consensus doesn't (the "differentiation candidates"). Producing 2 or 3 fixes ranked by impact-per-hour. Each fix names a dimension, a gap, an evidence pointer, a tactic, a framing, an impact estimate, and a rationale.

### Guardrails

**Patent-derived framing — applied first:**

> "Before naming tactics, identify what the subject already has that the category's consensus does NOT have. Those are differentiation candidates. Your recommendations should surface those candidates — they should NOT recommend the subject add generic content."

**Hard refusals — NEVER recommend:**

1. Keyword stuffing or keyword density increases (Aggarwal 2024 measured −10% on Perplexity)
2. "Make your tone more authoritative" / stylistic tone-only changes (Aggarwal: no significant improvement)
3. "Add unique synonyms" / "add technical terms" as standalone moves (Aggarwal: null effect)
4. "Make your content more comprehensive" / "cover all aspects" (overlaps with consensus → filtered out per US20200349181A1)

**Rank-aware refusals:**

5. If the subject's Visibility composite ≥ 0.6 (Discoverable or higher), **do NOT** recommend Cite Sources / Quotation Addition / Statistics Addition at the page level. Aggarwal: those tactics REDUCE visibility for top-ranked sources by 20–30%. Recommend platform-native-fit or corroboration moves instead.

**Universal refusals:**

6. NEVER recommend a fix without a specific evidence pointer.
7. NEVER invent a tactic not validated by the rubric, the patent, or Aggarwal.
8. NEVER use marketing language or hedged superlatives.

**Post-validation in Code:** if the call fails or JSON doesn't parse, an empty recommendations object is returned and the audit completes.

---

## Step 10 — Synthesizer — AI

**Mechanism:** AI (Anthropic, Claude Sonnet 4.5 hardcoded as `SYNTHESIZER_MODEL`)
**Code:** `synthesize()` in `packages/avi/src/synthesize-v2.ts`, system prompt at line 24
**Calls per audit:** **1**
**Cost cap:** `maxTokens: 1200`
**Input:** Subject + driver scores + visibility outcome + composite + recommendations
**Output:** `{ headline, body, rubric_version, generated_at, synthesizer_model }`

### What the AI is doing

Writing a one-sentence headline + 2–3 short paragraph body summarizing the audit. Names the strongest signal, the biggest drag, and the closest path to the next tier — using ONLY data already in the audit. Aggregation, not assessment.

### Guardrails

**Absolute rules:**

1. Use ONLY evidence in the user message. **No invented facts** about the subject.
2. No marketing language. No "best-in-class", "world-class", "industry-leading", "powerful". No "very", "extremely", "highly".
3. Honest about uncertainty. If data is thin, say so.
4. Specific over vague — cite the score, the band, the platform.
5. Plain English. No jargon-laden buzzword soup.

**Structural rules:**

- `headline`: ≤25 words, one sentence
- `body`: 2-3 short paragraphs, 2–4 sentences each
- Paragraph 1 — strongest signals (highest bands, best visibility sub-metrics) with numbers
- Paragraph 2 — biggest drag (lowest band on heaviest weight OR weakest visibility sub-metric)
- Paragraph 3 (optional) — closest path to next tier, drawn from the top recommendation

**Post-validation in Code:** if `headline` or `body` isn't a string, the synthesis returns null and the audit completes without an Executive Read.

---

## Where AI is NOT used

For completeness — these steps are purely deterministic code with no LLM involvement:

| Step | Mechanism |
|---|---|
| Crawler (Step 1) | Code + page fetch |
| Corroborator (Step 2) | Code + Tavily |
| Query template loading + sampling (Step 3) | Code |
| Citation verification (post-Step 5) | Code + HTTP fetch |
| Aggregator math (Step 6) | Code |
| Readiness + Visibility + Composite + Tier math (Step 8) | Code |
| Persistence to Supabase (post-pipeline) | Code |

## Logging surface

Every AI call routes through `llmCall()` in `packages/avi/src/llm.ts` which records the call to the `api_calls` table with: provider, model, endpoint (tagged per call type), tokens in/out, cost estimate, latency, status, error message, optional IP and submission_id. Logging failures don't propagate — the audit continues even if the spend tracker fails.

**Per paid audit, total AI calls:**

- Step 4 — 12 engine queries (audit-target engines, no guardrails — they're the subject of measurement)
- Step 5 — 12 extraction calls (OpenAI, guarded)
- Step 7 — 5 driver judge calls (Anthropic, guarded)
- Step 9 — 1 recommender call (Anthropic, guarded)
- Step 10 — 1 synthesizer call (Anthropic, guarded)
- **Total: 31 LLM calls per paid audit.** Plus ~7 Tavily searches in Step 2.

**Per free audit:** 5 judge + 1 recommender + 1 synthesizer = **7 LLM calls**. Plus ~7 Tavily searches.

---

## When the code changes, this document changes

This doc is a mirror of the code. Update triggers:

- Any change to `packages/avi/src/orchestrator-v2.ts` pipeline order
- Any change to a system prompt's hard rules, refusal catalog, or output schema
- Any change to a cost cap (`maxTokens`)
- Any change to weights, cutoffs, or tier labels
- New LLM-bearing step added to the pipeline
- New external service introduced

If you change one of those and don't update this doc, the doc is wrong. The code is right.
