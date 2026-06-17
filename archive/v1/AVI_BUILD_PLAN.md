# AVI Build Plan — Fresh-Chat Briefing

**Owner:** Marty Koepke, Practical Informatics LLC
**Status:** Strategy locked, build sequence defined, infra signups in progress
**Reference docs in repo:**
- `AVI_AGENT_DESIGN.md` (v1.0 — superseded; see "What changed from v1.0" below)
- `AVI_CUSTOMER_FLOW.md` (still useful for journey reference)
- `public/AI-Visibility-Index-Rubric-and-Protocol.md` (current canonical rubric)
- `public/AI-Visibility-Learning-and-Citation-Reference.md` (evidence backbone)
- `public/Practical-Informatics-Positioning-and-Comparison.md` (brand canon)
- `public/Practical-Informatics-Pricing-Structure.md` (current pricing canon)

---

## 1. What we're building

A two-tier productized service for AI visibility, with a Sprint upsell:

**Free AI Readiness Check** — URL-only, ~30 seconds, fully automated.
Answers: *"Are you built to be found by AI?"*
Scores the 5 driver dimensions of the rubric from public data only (no live LLM queries).
Lead magnet. Email gate on the full report, not on the start.

**Paid AI Visibility Index — ~$1,000 (range $750–$1,500)** — fully automated agent pipeline, ~3–8 minute background job, 8–10 page PDF report + hosted URL + 30-minute walkthrough call.
Answers: *"Are you actually being found by AI, in real measured data, and what do you do about it?"*
Re-scores the 5 drivers rigorously with anchored scales, runs the live cross-engine protocol (10–20 queries × 4–5 engines × 3 reps), computes Visibility outcome from 4 sub-metrics (Presence, Citation, Share-of-Voice, Prominence), benchmarks against 2–3 competitors, produces top-5 prioritized fixes ranked by impact-per-hour.
**Index Report fee credits 100% toward a Sprint if booked within 30 days.**

**Done-With-You Remediation Sprint — $3,000 (Foundations) / $5,000 (Expanded)** — 30–60 day engagement, top fixes implemented with the client, includes 60-day re-measure that proves the number moved.

**Ongoing Visibility Partner — $600/mo (optional, post-Sprint only)** — monthly monitoring, quarterly re-measures.

The strategic gist: free tier proves you're built to be found, paid tier proves you're actually found, Sprint does the work. Marty's role on the paid tier is QA + client walkthrough — not labor.

---

## 2. The big architectural decision (locked)

**No orchestrating agent. Deterministic pipeline orchestration with constrained LLM calls at specific points.**

The v1.0 design framed the system as "4 agents + 1 orchestrator." That's wrong for what we're building. Measurement systems need to be deterministic; agents are non-deterministic by nature.

The right pattern:

- **Deterministic pipeline orchestration** — code (Inngest functions), not autonomous agents
- **LLM-as-tool calls at bounded points only:**
  - One LLM call per query response: extract structured JSON (`subject_mentioned`, `cited_with_link`, `position_band`, `competitors_mentioned`, `evidence_text`)
  - One LLM call per driver dimension: read evidence, return `{ score: 0-5, justification }` against the anchored scale in the system prompt
- Every LLM call: temperature 0, JSON-mode, schema validation, logged raw inputs and outputs

The "agents" in the v1.0 design (Crawler, Query, Scoring, Report) are **modules**, not autonomous agents. Renaming matters for clarity and for reliability discipline.

Why this is the right call: replay any single LLM call against its logged inputs and you get the same answer. Reproducibility is what makes the measurement defensible to a paying client. A chatty orchestrator agent destroys that.

---

## 3. The rubric (locked direction, final variant TBD)

Use the rubric in `public/AI-Visibility-Index-Rubric-and-Protocol.md` (Rubric B) as the spine. Two open variants for how to recover the brand-language dimensions from the older Rubric A:

> **CLOSED 2026-06-06:** Per `DECISIONS.md` D002, **Option 2 was locked**.
> The two options are kept here for historical context only — see
> `AVI_INDEX_REPORT.md` for the active 7-dimension subject-adaptive design.

**Option 1 — Six-dimension calibrated hybrid.** Six dimensions, B's architecture intact. Founder Credibility lives as a named sub-score inside D1 (Entity Clarity). Methodology Depth lives as a named sub-score inside D4 (Information-Gain). Cleaner math, cleaner radar chart, brand language preserved in sub-scores and prose.

**Option 2 — Seven-dimension subject-adaptive (LOCKED).** Six universal dimensions plus a seventh that toggles by subject type: "Founder & Author Signal" for personal brands, "Methodology & Offer Definition" for companies. Louder buyer-language hook, slightly more complex math, two distinct radar shapes (personal vs. company).

Both variants share the spine:
- Drivers (X, Readiness) vs. Outcome (Y, Visibility) split
- 0–5 behaviorally-anchored scale per driver
- Composite = 0.40 × Readiness + 0.60 × Visibility
- Visibility = 0.20 Presence + 0.30 Citation + 0.30 Share-of-Voice + 0.20 Prominence
- 10–20 queries × 4–5 engines × 3 reps protocol with fixed run conditions
- Interpretation bands: Invisible / Emerging / Competitive / Dominant

---

## 4. Required tools and services

### Phase 0 — Sign up, get keys, set spend caps (no code)

| Tool | Purpose | Pricing | Where it shows up |
|---|---|---|---|
| **Anthropic API** | Claude for live queries + LLM-as-judge + extraction | Pay-as-you-go (~$3/M in, $15/M out for Sonnet) | Query module, Scoring module |
| **OpenAI API** | GPT-4o for live queries; GPT-4o-mini for cheap extraction | Pay-as-you-go | Query module |
| **Google AI (Gemini)** | Gemini for live queries | Pay-as-you-go | Query module |
| **Perplexity API** | Perplexity for live queries (Sonar models) | Pay-as-you-go | Query module |
| **Tavily** | Web search for entity corroboration (LinkedIn, GBP, directories, press, Wikidata) | ~$0.005/search, 1k free/mo | Driver scoring module (D2, D6) |
| **SerpAPI** *(optional)* | Google AI Overviews access (no public API for AIO direct) | $75/mo for 5k searches | Query module, AIO engine |
| **Inngest** | Background job runner — async paid pipeline, scheduled re-scans, drift monitoring | Free tier generous | Orchestration layer |
| **Stripe** | Payment Links → Checkout for paid AVI + Sprint | 2.9% + $0.30 | Checkout, webhook trigger |
| **Resend** | Transactional email — order confirmation, report delivery, alerts | Free up to 3k emails/mo | Email delivery |
| **Kit (ConvertKit)** | Lead-magnet email gate, tier-tagged nurture sequences | $25/mo Creator tier | Free flow email gate, post-scan nurture |
| **Cloudflare Turnstile** | CAPTCHA on free `/scan` form, abuse mitigation | Free | Free flow form |
| **Upstash Rate Limit** | IP-based rate limiting on free `/api/scan` | Free tier | Free flow API |
| **Supabase** *(already set up)* | Postgres + Storage for submissions, audits, payments, raw response logs | Free tier sufficient at launch | Data store |

### Phase 0 admin tasks

- Sign up for each service above
- Generate API keys, paste into a notes file
- **Set hard daily spend caps in every vendor dashboard** (this is the single most important pre-launch step — a runaway agent on a Tuesday can cost you $500 before lunch)
- Verify Resend sending domain DNS
- Create Kit subscriber list with tier-tag scheme: `scan-completed`, `tier-invisible`, `tier-hidden`, `tier-faintly-visible`, `tier-discoverable`, `tier-agent-ready`, `avi-customer`, `sprint-customer`
- Configure Turnstile site key for the production domain
- Stripe Payment Links in test mode for the Index Report ($1,000) and Sprint Foundations ($3,000) and Sprint Expanded ($5,000)

---

## 5. Order of events (build sequence)

### Phase 0 — Foundation (~half day, pure admin)
1. Sign up for every service in Section 4
2. Set spend caps everywhere
3. Get all keys into a notes file (eventually `.env.local` and Vercel env vars)
4. Decide between Rubric Option 1 vs. Option 2

### Phase 1 — Re-spec (1 day, writing only, no code)
5. Write `AVI_AGENT_DESIGN_v2.md` reflecting:
   - Deterministic-pipeline framing (modules, not autonomous agents)
   - New rubric (chosen variant)
   - Two pipelines (free synchronous, paid async)
   - Updated pricing structure
   - Kit integration touchpoints
   - LLM-as-judge prompts with anchored scales and golden examples
6. Mark `AVI_AGENT_DESIGN.md` as v1.0 (deprecated)

### Phase 2 — The spine (a few days, code)
7. Wire **Inngest** into the Next.js app, smoke-test with a hello-world function
8. Build **`/api/webhooks/stripe`** — signature-verified, status-flip on payment, enqueues paid audit job
9. Build **`/api/alerts/new-order`** — emails Marty on every new paid order (via Resend)
10. Add `.env.example` listing every required env var

### Phase 3 — Free Readiness Check (a few days, code)
11. Build new **`/scan`** page — URL-only form, Turnstile on the field
12. Build **`/api/scan`** — synchronous Crawler + Tavily-light + LLM-as-judge driver scoring → returns score, tier, redacted findings inline
13. Wire **Upstash Rate Limit** to `/api/scan` (3/day per IP)
14. Build email gate on results page — user enters email to get the full readiness PDF
15. Kit integration — subscribe + tag by tier on email submit
16. Resend email — delivers the readiness PDF with embedded "Get the full AVI" CTA
17. Test end-to-end with abuse simulation

### Phase 4 — Paid AVI pipeline (the big build, ~1–2 weeks, code)
18. Add Perplexity adapter to `lib/avi/llm-providers/`
19. Add Google AIO query path (via SerpAPI) if doing AIO
20. Build **structured-extraction module** — per-response LLM call producing the JSON schema in the rubric doc
21. Build **rubric-aligned scoring module** — per-dimension LLM-as-judge with anchored scales and golden examples in the system prompt
22. Expand Query module — query templates by industry, 3 reps per cell, parallel execution with concurrency limits
23. Build **report generation** — HTML template (forest-green/gold brand) → PDF via weasyprint, max 10 pages
24. Build **Inngest function: `runFullAVI`** — orchestrates Crawler → Tavily → Query → Extraction → Scoring → Report → email
25. Wire Stripe webhook to enqueue `runFullAVI` on `paid` status
26. Add `rubric_version` column to `audits`, log every raw LLM response, log API spend per audit
27. Test on `practicalinformatics.com` itself first

### Phase 5 — Operational hardening (a few days, code + ops)
28. Add drift monitoring — Inngest cron re-runs the AVI monthly on a representative subject, alerts on Δ > N
29. Build internal admin page — list of submissions, status, spend per audit, raw logs
30. Confirm RLS policies on every Supabase table
31. Verify `.env.example` matches production
32. Final pass: Cloudflare Turnstile live, rate limits live, spend caps confirmed, every LLM key works

### Phase 6 — Launch (the visible part)
33. Update site copy on `/ai-visibility` to match new pricing + new rubric language
34. Add `/scan` link to nav and home page hero
35. Soft-launch: drive own LinkedIn audience, watch the first 10 audits
36. Publish first benchmark study (e.g., ambient-AI scribe field) as proof-of-method

---

## 6. What changed from `AVI_AGENT_DESIGN.md` v1.0

If anyone (including future Claude) is reading the old design doc to orient, these are the substantive changes:

- **Pricing** — $497 / $2,997 / $397mo → $1,000 / $3K–$5K / $600mo (per `public/Practical-Informatics-Pricing-Structure.md`)
- **Free scan scope** — 8-field form gating email at submit → URL-only form, email gate after on-screen results
- **MVP phase** — Wizard-of-Oz (Marty hand-runs first 20) → fully-automated from v1 (Marty's role is QA + walkthrough)
- **Rubric** — Rubric A (six equal-peer dimensions with raw point allocations) → Rubric B with drivers/outcome split, 0–5 anchored scales, explicit weights, four-sub-metric Visibility outcome
- **Archetypes** — four archetype-weighted tables (Solo Expert / Young Practice / Established / Mature) → either uniform (Option 1) or two subject-types (Option 2: personal vs. company)
- **Agent vs. module framing** — "4 agents + orchestrator" → deterministic modules with bounded LLM-as-tool calls
- **Query Agent scope** — 7 queries × 4 LLMs = 28 calls, no reps → 10–20 queries × 4–5 engines × 3 reps = 120–300 cells, with structured extraction per response
- **Report length** — 12 pages → 8–10 pages
- **Tool stack additions** — Inngest (background jobs), Tavily (web search), Kit (lead nurture), Turnstile (abuse), Upstash Rate Limit, Resend (transactional)

---

## 7. Open decisions to close before code

1. **Rubric variant** — ~~Option 1 (six-dim hybrid) or Option 2 (seven-dim adaptive).~~ **CLOSED 2026-06-06:** Option 2 locked per `DECISIONS.md` D002.
2. **Background job runner** — Default: **Inngest**. Override only with reason.
3. **PDF generator** — weasyprint (Python) vs. Puppeteer (Node). Default: **weasyprint** (already used for the lead-magnet PDF; lighter; better for serverless).
4. **Google AIO inclusion** — yes via SerpAPI ($75/mo), or skip for v1 (defer). Default: defer; ChatGPT + Claude + Gemini + Perplexity is enough for the headline visibility story.
5. **Kit list architecture** — one list with tags vs. multiple lists. Default: one list, tags do the segmentation.
6. **Whether to expose the rubric `.md` files publicly at production paths** — currently in `/public`, so they'll serve at `practicalinformatics.com/AI-Visibility-Index-Rubric-and-Protocol.md`. That's intentional (LLMs crawling your site ingest the methodology) but worth confirming.

---

## 8. The very next action (re-stated)

**Decide on the background job runner.** Default: Inngest. 30 minutes to confirm and sign up for a free account. Then move to Phase 0 admin signups.

After Phase 0 is complete, the next move is to write `AVI_AGENT_DESIGN_v2.md` — the new spec that the rest of the build follows.

---

## 9. Reference: what's already in the repo

Don't rebuild these:

- **Supabase schema** (`supabase/migrations/`) — 3 tables: submissions, audits, payments, RLS-enabled
- **`/api/submissions`** API route (currently feeds the old `/order` form — repurpose for paid pipeline trigger after Stripe webhook)
- **Lightweight Crawler** (`lib/avi/crawler.ts`) — fetch+regex, parses schema/OG/meta. Right tool for the free check; don't replace with Playwright
- **Query module** (`lib/avi/query.ts`) — needs expansion (Perplexity, reps, structured extraction) but the skeleton is there
- **LLM provider adapters** (`lib/avi/llm-providers/`) — OpenAI, Anthropic, Gemini; add Perplexity
- **Submission status enum** — already models the funnel (`new → teaser_sent → paid → report_sent → call_complete → sprint_sold → refunded`)
- **Stripe Payment Link env vars** — wired in `lib/links.ts`
- **Results teaser page** (`/ai-visibility/results/[id]`)
- **Brand canon** — colors, fonts, motion conventions, content patterns documented in `CLAUDE.md`

---

**End of briefing.**

Paste this into a new chat as context, then start with the Phase 0 admin checklist (Section 5, items 1–4).
