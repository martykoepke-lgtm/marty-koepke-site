# Paid AI Visibility Index — flow

**Status:** Stub. Structure scaffolded; content to be written against the operating standard in a subsequent session.
**Replaces:** `archive/AVI_INDEX_REPORT.md` (described the seven-service pipeline; six-dim shift means architecture description is partially out of date).
**Canon authority:** This doc must conform to `AVI_OPERATING_STANDARD.md`. When they disagree, the operating standard wins.

---

## What this doc is for

A plain-English walkthrough of the paid AI Visibility Index, end to end: customer journey, async pipeline, every role and every service involved, the report structure, every cost and failure mode. The customer is paying for a measurement instrument — this doc is how we make sure the instrument is reproducible and defensible.

## Scope reminder (from operating standard §6.2)

- **What's retrieved:** everything in the free check, *plus* the cross-engine query grid: **4 queries × 3 engines × 1 rep = 12 query calls per audit**. Engines: ChatGPT, Claude, Perplexity. Query mix: 80% informational / 10% transactional / 10% navigational (per Aggarwal 2024), applied by the deterministic Query Runner.
- **What's scored:** all five drivers + the four Visibility sub-metrics (Presence, Citation, Share-of-Voice, Prominence) + the headline composite and tier.
- **What's reported:** the 8–10 page Index Report with composite, tier, driver radar, outcome breakdown, top three prioritized recommendations, evidence appendix, and a methodology + limits page.
- **Crediting rule:** report fee credits 100% toward a Sprint if booked within 30 days (per VISION §6).

---

## Sections to write

### 1. At a glance
ASCII diagram of the end-to-end flow: customer order → async pipeline → PDF + walkthrough call.

### 2. Customer journey
Every customer-facing touchpoint, in order: order form → confirmation + ETA → PDF delivery email → walkthrough call scheduling → walkthrough call → Sprint upsell.

### 3. System pipeline (the deterministic orchestrator)
Every service in execution order, from operating standard §7:
- Crawler (pure code)
- Corroborator (pure code)
- Query Runner (pure code — sends prompts to engines under audit)
- Extractor (agents/EXTRACTOR.md) — N calls, one per query response
- Aggregator (pure code) — computes Presence, Citation, Share-of-Voice, Prominence
- Driver Judge (agents/DRIVER_JUDGE.md) — 5 calls, one per driver
- Composite + Tier (pure code)
- Cross-Judge (agents/CROSS_JUDGE.md) — QA, second-vendor scoring on flagged audits
- Recommender (agents/RECOMMENDER.md) — top three fixes, ranked by impact-per-hour

### 4. Report structure
Six sections, per operating standard §6 and the rubric structure recommendation:
1. Headline: composite, tier, one-sentence read
2. Differentiation profile: D4 score + named differentiation candidates surfaced
3. Readiness profile: D1, D2, D3, D6 scores with one finding each
4. Visibility outcome: D5 sub-metrics with cited query responses
5. Top three fixes: Recommender output, framed as "what to do differently"
6. Methodology and limits: rubric version, query protocol, judge models, cross-judge agreement, what was not measured

### 5. Refusal and failure modes
What happens when:
- An engine fails to respond (skip, log, recompute over remaining engines)
- The Extractor returns invalid JSON (retry once, then null + flag)
- A Driver Judge returns `insufficient_evidence` (band = null; composite recomputes over available dims)
- Cross-Judge disagreement ≥2 bands on a dimension (flag for human review; do not auto-ship)
- The Recommender can't produce three fixes (deliver as many as evidence supports; explain in the report)

### 6. Cost ceiling
Per-audit cost estimate broken down by service. Spend cap per audit. Cross-reference `AVI_OPS_MONITOR.md`.

### 7. Rank-aware and domain-aware recommendation logic
Per the cross-map findings:
- If the subject's Visibility composite is ≥ 0.6 ("Discoverable" or "Agent-Ready"), the Recommender excludes Cite Sources / Quotation / Statistics additions at the page level (Aggarwal: rank-1 sources lose ground from these tactics) and shifts to platform-fit and corroboration moves.
- Domain priors from Aggarwal Table 3: Statistics for legal/government/opinion subjects; Cite Sources for factual-claim-heavy subjects; Quotations for people-and-society subjects.
- Hard refusals: never recommend keyword stuffing, "more authoritative tone," or "unique synonym padding."

### 8. What this flow does NOT measure (the limits page in the report)
- Deep-session visibility (engines may rerank based on session memory; we measure cold queries only — per US20200349181A1)
- Classical Google rank effects of the recommendations (Aggarwal explicitly did not measure this)
- Voice-assistant-specific behaviors (not in current query grid)
- Engine drift between audit date and customer-implementation date

---

## Open questions before this is written

1. Query grid finalization — adopt Aggarwal's 80/10/10 split as default; document deviations per subject category.
2. Cross-Judge cadence — every audit, every Nth audit, or only on flagged audits? (Open question 3 in operating standard §10.)
3. Walkthrough call format — what's covered, who runs it, length.
4. Inngest vs synchronous orchestration — code-level decision, defer to implementation session.

---

*Last touched: stub created during the canon cleanup pass.*
