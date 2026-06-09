# The AVI Index Report tool — plain-English flow

**Status:** Draft v0.1 — read this before any service code is touched.
**Scope:** The full AVI scoring pipeline used by Marty (CLI-driven) to audit
test subjects across business sectors. Crawler → Corroboration → Query
Grid → Extraction → Aggregation → Scoring → Report.
**Out of scope:** Customer-facing pages, Stripe checkout, Inngest async
orchestration, the free Readiness Check. Those wrap the tool *later*, after
the rubric has been validated on a real sample (per D005).

This doc answers, in plain English: how do you invoke an audit, what does
each service do, every tool involved, every cost, every place this can
fail. Each service is a testable atom — same input gives same output,
exercised in isolation against a fixed fixture.

---

## 1. What this is

A measurement instrument for Marty's own use. She supplies a subject (the
business to audit), the tool produces a full Index Report:

- The **Visibility** outcome (Y) — are you actually being found by AI search?
- The **Readiness** drivers (X) — the seven rubric dimensions that determine
  whether the answer to Y improves or doesn't.
- A composite score and tier band.

She runs it on test subjects (her own business, a healthcare-adjacent
practice, a regional firm, a personal brand, etc.), reads the JSON, and
evaluates whether the rubric produces defensible findings. The rubric
itself can be calibrated from these results before any customer ever sees
the tool.

The tool is **not** customer-facing in this build. No Stripe, no Inngest,
no `/scan` form. Just CLI invocation and a JSON dump. Customer wrapping
comes after validation, per D005.

---

## 2. At a glance

```
                  ┌──────────────────────────────────────┐
                  │ subject.json                         │
                  │ { name, url, industry, location,     │
                  │   subject_type, competitor_urls,     │
                  │   target_query }                     │
                  └────────────────┬─────────────────────┘
                                   │
                                   │  npm run audit -- subject.json
                                   ▼
                  ┌──────────────────────────────────────┐
                  │  Orchestrator                        │
                  │  scripts/run-audit.mjs               │
                  │  (deterministic; no autonomous agent)│
                  └────────────────┬─────────────────────┘
                                   │
                                   │  inserts submissions + audits row
                                   │
                ┌──────────────────┼──────────────────┐
                ▼                  ▼                  ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ 1. Crawler   │  │ 2. Corrob-   │  │              │
        │              │  │    oration   │  │              │
        │ fetch URL,   │  │              │  │              │
        │ parse schema │  │ Tavily 1-3   │  │              │
        │ /og/llms.txt │  │ searches     │  │              │
        └──────┬───────┘  └──────┬───────┘  │              │
               │                 │           │              │
               └────────┬────────┘           │              │
                        │                    │              │
                        ▼                    │              │
              ┌────────────────────┐         │              │
              │  3. QueryGrid      │◄────────┘              │
              │                    │                        │
              │  10 templates × 4  │                        │
              │  engines × 2 reps  │                        │
              │  = 80 LLM calls    │                        │
              │  (parallel, capped)│                        │
              └─────────┬──────────┘                        │
                        │                                   │
                        │  inserts audit_query_responses    │
                        │  (one row per cell)               │
                        ▼                                   │
              ┌────────────────────┐                        │
              │  4. Extraction     │                        │
              │                    │                        │
              │  one LLM call per  │                        │
              │  response → extract│                        │
              │  mentioned, cited, │                        │
              │  position_band,    │                        │
              │  competitors,      │                        │
              │  evidence_text     │                        │
              └─────────┬──────────┘                        │
                        │                                   │
                        │  updates extracted fields on      │
                        │  the audit_query_responses rows   │
                        ▼                                   │
              ┌────────────────────┐                        │
              │  5. Aggregation    │                        │
              │                    │                        │
              │  pure math:        │                        │
              │  Presence, Citation│                        │
              │  Share-of-Voice,   │                        │
              │  Prominence        │                        │
              └─────────┬──────────┘                        │
                        │                                   │
                        │                                   ▼
                        │                       ┌────────────────────┐
                        ▼                       │  6. Scoring        │
              ┌────────────────────┐            │                    │
              │  Visibility metrics│            │  one LLM-as-judge  │
              │  written to audits │            │  call per dim ×    │
              │  row               │            │  7 dims = 7 calls  │
              └─────────┬──────────┘            │                    │
                        │                       │  reads:            │
                        │                       │   crawler output,  │
                        │                       │   corroboration,   │
                        │                       │   visibility       │
                        │                       │   evidence         │
                        │                       │                    │
                        │                       │  inserts           │
                        │                       │  audit_dimension_  │
                        │                       │  scores rows       │
                        │                       └─────────┬──────────┘
                        │                                 │
                        └────────────┬────────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │  7. Composite + Report │
                        │                        │
                        │  composite = 0.40 R    │
                        │              + 0.60 V  │
                        │                        │
                        │  writes:               │
                        │   audits.composite_    │
                        │   score, readiness_    │
                        │   score, visibility_   │
                        │   score, tier,         │
                        │   total_spend_usd,     │
                        │   rubric_version       │
                        │                        │
                        │  outputs:              │
                        │   reports/<audit>.json │
                        └────────────────────────┘
```

Two principles thread through the whole pipeline:

- **Every external call goes through the wrapper.** `lib/avi/llm.ts` for
  LLM calls, `lib/avi/tavily.ts` for searches, `lib/avi/email.ts` for
  email. The ops monitor sees every call, attributed to this audit's
  `submission_id`, so total spend per audit is sum-of-`api_calls` filtered
  by submission. ESLint rule enforces it.
- **Each service is a pure function over its inputs.** Same crawler input
  → same crawler output. Same query responses + rubric version → same
  scoring output. Reproducibility is what makes the measurement defensible.

---

## 3. How you invoke an audit

CLI, one command, one input file.

### The subject file

`subjects/practicalinformatics.json`:

```json
{
  "name": "Practical Informatics",
  "url": "https://www.practicalinformatics.com",
  "industry": "AI visibility consulting",
  "location": "United States",
  "subject_type": "company",
  "competitor_urls": [
    "https://tryprofound.com",
    "https://otterly.ai"
  ],
  "target_query": "Best AI visibility consultant for healthcare-adjacent businesses"
}
```

Field rules:

- `name`, `url`, `industry`, `subject_type` are required.
- `subject_type` is `'personal_brand'` or `'company'`. Determines D7 in
  the rubric — Founder & Author Signal vs. Methodology & Offer Definition.
- `location` is optional; some query templates use it (e.g. "best X in
  {location}"). When omitted, those templates use "United States."
- `competitor_urls` (1–3) feed two things: (a) generated competitive
  queries (template 9), and (b) Share-of-Voice math (any time a
  competitor URL or name appears in a response, it's counted).
- `target_query` is the customer's own phrasing — if she'd Google or
  ChatGPT something specific, that string slots into template 2 directly.

### The command

```powershell
npm run audit -- subjects/practicalinformatics.json
```

What you get back:

- A line per service as it runs (Crawler done, Corroboration done, QueryGrid
  60 / 80 cells, etc.).
- A final line: `Audit complete. Report at reports/<audit_id>.json`.
- The JSON file at that path contains the full audit data — every query
  response, every extraction, every dimension score, the final composite.

### What's persisted

- One `submissions` row (the subject), idempotent on (url, name).
- One `audits` row.
- 80 `audit_query_responses` rows (10 × 4 × 2).
- 7 `audit_dimension_scores` rows.
- N `api_calls` rows (every external call goes through the wrapper).

All `submission_id`-attributable spend is summed and written to
`audits.total_spend_usd` at the end.

---

## 4. What each service does

### 4.1 Crawler (`lib/avi/crawler.ts` — exists, reused)

Already implemented in v1. Fetches the URL, parses HTML and structured
signals (JSON-LD schema, OpenGraph, meta tags, robots.txt, llms.txt,
headings, links to social profiles). Returns a structured object:

```json
{
  "url": "https://...",
  "reachable": true,
  "fetched_at": "2026-06-06T...",
  "schemas": { "Person": [...], "Organization": [...], "FAQPage": [...] },
  "og": { "title": "...", "description": "...", "image": "..." },
  "meta": { "description": "...", "keywords": "..." },
  "headings": { "h1": [...], "h2": [...] },
  "links_to_social": ["linkedin.com/in/...", "twitter.com/..."],
  "robots_txt": "...",
  "llms_txt": "..."
}
```

Total time: 2–5 seconds. Cost: $0. The output feeds D1, D3, D4, D5
scoring as evidence.

### 4.2 Corroboration (`lib/avi/corroboration.ts` — new)

Tavily searches for entity signals external to the subject's own site.
Three queries:

1. `"{name} {industry}"` — broad presence: LinkedIn, press, podcasts,
   directory listings.
2. `"site:linkedin.com {name}"` — explicit LinkedIn check.
3. `"site:wikidata.org {name}"` — Wikidata entity check.

Returns:

```json
{
  "wikidata_present": false,
  "linkedin_present": true,
  "linkedin_url": "https://...",
  "press_mentions": [
    { "url": "...", "title": "...", "snippet": "...", "domain": "..." }
  ],
  "directory_listings": [...],
  "total_corroborating_domains": 7
}
```

Total time: 3–6 seconds. Cost: 1–3 Tavily searches × $0.005 = $0.005–$0.015.
The output feeds D2 (Cross-Source Corroboration) and D6 (Distribution
Surface) directly.

### 4.3 QueryGrid (`lib/avi/query.ts` — expand existing)

Runs the 10 query templates against 4 engines, 2 reps each. 80 cells
total. All run in parallel with a concurrency limit (default 10 at a time)
so wall-clock is bounded by the slowest concurrent batch, not 80 ×
single-cell-time.

**Locked v2.0 starting set (2026-06-06).** Split 5 / 3 / 1 / 1 across intent
types. Category-heavy because that's where most lost leads happen; name-search
for accuracy; one competitive query bounds Share-of-Voice math; one
buyer-scenario captures realistic decision-context phrasing. Matches
Princeton GEO study patterns.

| # | Template | Intent | Why this template earns its slot |
|---|---|---|---|
| 1 | `Best {industry} for {buyer_descriptor}?` | category-search | Most common buyer phrasing; tests Presence |
| 2 | `Top 5 {industry} in {location}` | category-search | List-based; captures incumbent lock-in |
| 3 | `Who helps {buyer_descriptor} with {pain_point}?` | category-search | Long-tail buyer language; most influenceable |
| 4 | `Recommend a {industry} for someone who {scenario}` | category-search | Hypothetical buyer; tests recommendation engine |
| 5 | `What companies offer {distinctive_term}?` | category-search | Feature/method specificity; tests differentiation |
| 6 | `Tell me about {name}. What do they do?` | name-search | Entity description accuracy |
| 7 | `Is {name} reputable? Should I hire them?` | name-search | Citation + sentiment signal |
| 8 | `What's {name}'s pricing / approach?` | name-search | Schema/Information-Gain depth |
| 9 | `{name} vs {competitor_1}` (only if `competitor_urls` supplied) | competitive | Direct Share-of-Voice signal |
| 10 | `I'm a {buyer_descriptor} in {location}. Should I hire {name}?` | buyer-scenario | Highest-stakes long-tail decision context |

**Optional override:** if `subject.target_query` is supplied in the subject
JSON, it replaces template 3 for that audit — lets you test against the
customer's *actual* phrasing. The slot itself stays category-search; only
the rendered text changes.

For each cell, one `audit_query_responses` row is inserted with the raw
response text and call-level bookkeeping (tokens, cost, duration, status).
Extraction (4.4) fills in the structured fields later.

Total time: ~30 seconds (parallel). Cost: ~$0.40–$0.80 depending on the
engine mix and response lengths.

### 4.4 Extraction (`lib/avi/extraction.ts` — new)

One LLM call per query response. Cheap model (GPT-4o-mini or Haiku) —
the job is pure parsing, not judgment. The extractor reads the raw
response and returns:

```json
{
  "mentioned": true,
  "cited_with_link": false,
  "position_band": "middle",
  "competitors_mentioned": ["Profound", "Otterly"],
  "evidence_text": "Practical Informatics is a small consultancy that helps healthcare-adjacent businesses become visible to AI search engines..."
}
```

The extractor never invents fields. It either finds the subject (by
fuzzy-matched name or url match against the subject record) or doesn't.
Position band is determined by where in the response the subject first
appears (first 25% = top, 25–66% = middle, 66–100% = late, absent =
not_named).

Updates the existing 80 `audit_query_responses` rows in place — no new
rows. Total time: ~15–25 seconds (parallel). Cost: ~$0.05–$0.10.

### 4.5 Aggregation (`lib/avi/aggregation.ts` — new)

Pure math over the extracted fields. No LLM calls. Computes:

- **Presence** = (responses where `mentioned`) ÷ (total responses)
- **Citation** = (responses where `cited_with_link`) ÷ (total responses)
- **Share-of-Voice** = (responses where `mentioned`) ÷ (responses where
  `mentioned` OR any `competitors_mentioned`)
- **Prominence** = average position score, where position bands map to:
  `top` = 1.0, `middle` = 0.5, `late` = 0.25, `not_named` = 0.

Visibility composite (per build plan §3):

```
Visibility = 0.20 × Presence
           + 0.30 × Citation
           + 0.30 × Share-of-Voice
           + 0.20 × Prominence
```

All in [0.0, 1.0]. Written to `audits.visibility_score`. Component
sub-metrics are stored on the audits row as a small jsonb blob for
report rendering. No new table — this is just denormalization.

Time: < 1 second. Cost: $0.

### 4.6 Scoring (`lib/avi/scoring.ts` — new)

The X side of the rubric. Seven LLM-as-judge calls, one per dimension.
Each call is:

- **Model:** Claude Sonnet (best quality for nuanced judgment).
- **Temperature 0, JSON mode, schema-validated output.**
- **System prompt:** the anchored 0–5 scale for *this one dimension*,
  plus 2–3 golden examples of "what a 1 looks like, what a 3 looks like,
  what a 5 looks like."
- **User prompt:** the subject's evidence package (crawler output +
  corroboration + any Visibility evidence that's relevant for this dim) +
  the subject's `name` + `subject_type`.
- **Output:**

  ```json
  {
    "score": 3.5,
    "justification": "Schema.org Organization markup is present and well-formed, but FAQ markup is missing and no Person schema is published for the founder. D3 anchors at 3.5 because the structured signal is partial but coherent.",
    "evidence_pointers": [
      { "type": "schema", "value": "Organization", "found": true },
      { "type": "schema", "value": "FAQPage", "found": false }
    ]
  }
  ```

For D7 specifically, the system prompt branches on `subject_type`:
- `personal_brand` → "Founder & Author Signal" anchored scale
- `company` → "Methodology & Offer Definition" anchored scale

Seven `audit_dimension_scores` rows inserted, stamped with `rubric_version`.

Total time: ~10 seconds (parallel). Cost: ~$0.15–$0.25.

### 4.7 Composite + report

Reads the seven `audit_dimension_scores` rows. Computes weighted readiness
average (weights live in the rubric config). Combines:

```
composite = 0.40 × readiness + 0.60 × visibility
```

Writes to `audits.composite_score`, `audits.readiness_score`, sets `tier`
based on thresholds (Invisible < 0.2, Hidden 0.2–0.4, Faintly Visible
0.4–0.6, Discoverable 0.6–0.8, Agent-Ready ≥ 0.8 — calibratable later).

Aggregates the audit's `api_calls` rows by `submission_id` to sum
`total_spend_usd`.

Writes JSON to `reports/<audit_id>.json`:

```json
{
  "audit_id": "...",
  "rubric_version": "v2.0",
  "subject": { ... },
  "scores": {
    "composite": 0.412,
    "readiness": 0.500,
    "visibility": 0.353,
    "tier": "Faintly Visible"
  },
  "visibility_breakdown": {
    "presence": 0.450,
    "citation": 0.075,
    "share_of_voice": 0.400,
    "prominence": 0.275
  },
  "dimension_scores": [
    { "id": "D1", "name": "Entity Clarity", "score": 4.0, "justification": "..." },
    ...
  ],
  "query_responses": [
    { "query_id": "cat-best-for-buyer", "engine": "anthropic", "rep": 1, "mentioned": true, "position_band": "middle", "evidence_text": "..." },
    ...
  ],
  "crawler": { ... },
  "corroboration": { ... },
  "total_spend_usd": 1.073
}
```

No PDF in this build — JSON is the deliverable until you've evaluated the
findings and decided what the customer artifact should look like.

---

## 5. Tools in this flow

| Tool | One-sentence purpose | Cost per Mid audit | Config / env var |
|---|---|---|---|
| **Anthropic API (Claude Haiku for queries, Sonnet for scoring)** | Primary LLM for query grid and scoring | ~$0.40 | `ANTHROPIC_API_KEY` |
| **OpenAI API (GPT-4o-mini)** | Cheap extraction + secondary query engine | ~$0.10 | `OPENAI_API_KEY` |
| **Google AI (Gemini Flash)** | Free-tier query engine | $0 | `GOOGLE_API_KEY` |
| **Perplexity API (Sonar)** | Web-search-grounded query engine | ~$0.15 | `PERPLEXITY_API_KEY` |
| **Tavily** | Entity corroboration (LinkedIn, Wikidata, press) | ~$0.015 | `TAVILY_API_KEY` |
| **Supabase** | Stores submissions, audits, audit_query_responses, audit_dimension_scores, api_calls | $0 (free tier) | existing |

**Per Mid audit (10×4×2 grid):** approximately **$0.55–$1.10 all-in**.
**Per Full audit (15×4×3 grid):** approximately **$1.30–$2.20 all-in**.

At your $25/mo Anthropic cap, Mid leaves room for ~45 audits/month;
Full leaves room for ~19/month. (Per D005 the build target is Mid.)

---

## 6. Where this can fail

| Stage | Failure | What we do |
|---|---|---|
| Subject input | Required field missing or `subject_type` wrong value | CLI rejects with a clear error before any API call |
| Crawler | Target URL times out / returns 5xx / blocks the User-Agent | Continue with `reachable: false`; score reflects crawler-less evidence |
| Crawler | URL invalid or unparseable | CLI rejects |
| Corroboration | Tavily key missing or rate-limited | Continue with empty corroboration; score reflects "no external signals found" |
| QueryGrid | One engine times out for one cell | Retry once; if still failing, mark cell `status: 'error'`, exclude from aggregation; continue |
| QueryGrid | One engine entirely down for the audit | Cells from that engine show `status: 'error'`; aggregation continues on the other 3; report notes the missing engine |
| Extraction | Extractor returns malformed JSON | Retry once with stricter system prompt; if still failing, leave extracted fields null; aggregation ignores nulls |
| Scoring | Judge LLM fails on one dimension | Retry once; if still failing, that dimension's score is `null`; composite recomputes over the dims we have |
| Database write | Supabase insert fails on a query response | Log warning; continue (lossy logging is acceptable for individual cells) |
| Database write | Supabase insert fails on the audits row | Hard error; CLI exits with non-zero status and a clear message |
| Composite | All seven dim scores are null | Hard error; report not produced |

The orchestrator catches and routes errors; no service throws to the
caller without being intercepted first.

---

## 7. Build order

The seven services are independent enough that each can be built and
tested in isolation. Suggested order:

1. **Extend `lib/avi/llm.ts`** — add Perplexity adapter (currently
   commented as planned in `lib/avi/llm.ts` endpoint enum).
2. **`lib/avi/corroboration.ts`** — Tavily wrapper + the three searches.
   Test with a fixed subject fixture against snapshotted Tavily responses.
3. **Expand `lib/avi/query.ts`** — 10 templates instead of 5; subject
   record threading; rep_index loop; parallel execution with concurrency
   limit. Test against a single subject, 1 rep, 2 engines first to keep
   cost low during iteration.
4. **`lib/avi/extraction.ts`** — one-shot extractor. Build with golden
   inputs (1 known mention, 1 known non-mention) before turning it on
   live. Test against 20 hand-labeled responses.
5. **`lib/avi/aggregation.ts`** — pure math. Unit-testable without any
   API call. Hand-author 5 small input sets and confirm the math.
6. **`lib/avi/scoring.ts`** — seven dimensions, each with anchored scale
   + golden examples. Build one dim at a time, score against your own
   business (you know what you'd expect to see), iterate until the
   judgment matches a person's read.
7. **`scripts/run-audit.mjs`** — the orchestrator. CLI entry point.
   Wires the services together. Writes the report JSON.

Stop after each step and test on a real subject before moving on. The
ops monitor will tell you what each step costs as you go.

---

## 8. What's NOT in this doc

- The **PDF report** rendering. Once the JSON output reads as defensible
  on real subjects, we add the HTML→PDF template. Until then, JSON is the
  artifact you read.
- **Customer-facing pages.** `/scan`, `/ai-visibility/order`, results
  pages — all deferred per D005.
- **Stripe checkout + webhook.** Same — wrapping comes after the tool is
  validated.
- **Inngest async orchestration.** The tool runs synchronously from the
  CLI for now (~80 seconds end-to-end). Inngest gets added when we make
  it customer-facing and the wallclock window becomes a problem.
- **Kit nurture sequence.** Same — only relevant when customers are
  involved.
- **The free Readiness Check rebuild.** Phase 3 of the original build
  plan; deferred per D005.

---

## 9. Locked decisions (resolved 2026-06-06)

1. **Competitor reference set.** Profound, Otterly, Peec, Scrunch. These
   are the named comparison set for share-of-voice math when an audit
   subject is itself in the AVI / GEO consulting space. For audits in
   other industries, the subject's own `competitor_urls` (1–3) drive the
   competitive query and Share-of-Voice math.

2. **Readiness weights.** Equal 1/7 across all seven dimensions for v2.0.
   Starting hypothesis per `VISION.md §9`. Recalibrate from real audit
   data once 20+ subjects have been measured.

3. **Tier band thresholds.** No numeric overlap between bands:

   | Tier | Composite score range |
   |---|---|
   | Invisible | 0.00 – 0.19 |
   | Hidden | 0.20 – 0.39 |
   | Faintly Visible | 0.40 – 0.59 |
   | Discoverable | 0.60 – 0.79 |
   | Agent-Ready | 0.80 – 1.00 |

   In code, the mapping is implemented as cumulative thresholds so the
   bands cover [0.00, 1.00] continuously without ambiguity.

4. **Concurrency limit on the query grid.** 5 concurrent LLM calls at a
   time. Initially set at 10 but lowered after the first real audit
   surfaced a 75% failure rate from Gemini's free-tier rate limits at
   that level. 5 keeps every provider comfortable; audit wall-clock
   ~80–90 seconds instead of ~45.

   **Rule (set 2026-06-06 by Marty):** if Gemini still produces a high
   failure rate at concurrency 5, drop it from `DEFAULT_ENGINES` in
   `lib/avi/query.ts`. We're not staying on a provider that can't
   reliably answer the protocol — better to run 3 reliable engines than
   4 where one fails ~half the time.

5. **Seed test set.** 
Practical Informatics (your own)
One healthcare scribe vendor (Abridge)
One regional law firm (Wilshire Law Firm, Jackson, CA)
One personal-brand consultant (Jonathan Cousins)
One local foothills business (Ferrell Photography)
---

## 10. What I'll do next

Once you've answered the open questions (or signed off on the defaults):

1. **Update this doc** with the answers.
2. **Walk through the seven services inline** so the picture lands
   before any code gets written.
3. **Start building from Step 1** of section 7 — Perplexity adapter —
   and pause at every step for you to react.

No service files get touched until the doc is signed off.

---

**End of v0.1 draft.** Working document. Edit freely; we'll re-sync next
time we touch it.
