# Free AI Readiness Check — flow

**Status:** Stub. Structure scaffolded; content to be written against the operating standard in a subsequent session.
**Replaces:** `archive/AVI_FREE_FLOW.md` (had pricing drift, used old rubric).
**Canon authority:** This doc must conform to `AVI_OPERATING_STANDARD.md`. When they disagree, the operating standard wins.

---

## What this doc is for

A plain-English walkthrough of the customer journey for the free AI Readiness Check: every screen the customer sees, every system step behind the curtain, every tool involved, every cost, every failure mode. By the end of this doc, anyone (Marty, future Claude, a contractor) should be able to trace a customer from landing-page click all the way to PDF delivery without ambiguity.

## Scope reminder (from operating standard §6.1)

- **What's retrieved:** subject's own URL (crawler) + third-party corroboration (Tavily search). No live engine queries.
- **What's scored:** the five drivers (D1, D2, D3, D4, D6) and the weighted Readiness composite. D5 is **not** scored — the outcome cannot be measured without live queries.
- **What's reported:** Readiness tier band, five driver scores with one-sentence justifications, 2–3 representative findings.
- **What's not promised:** any number about whether AI engines actually mention the subject.

---

## Sections to write

### 1. At a glance
ASCII diagram of the end-to-end flow, customer-perspective on top, system-perspective on bottom.

### 2. Customer journey
Every screen the customer sees, in order: landing → URL input → progress state → on-screen result tier + driver bars + 2–3 findings → email gate → PDF delivery → upsell to paid Index.

### 3. System pipeline
Every system step, in order, mapped to the deterministic services from operating standard §7:
- Crawler (lib/avi/crawler.ts)
- Corroborator (lib/avi/corroboration.ts)
- Aggregator (lib/avi/aggregation.ts) — driver-side only (no visibility)
- Driver Judge (agents/DRIVER_JUDGE.md) — 5 calls, one per driver
- Composite + Tier (pure code)
- Recommender (agents/RECOMMENDER.md) — 2–3 findings only, free tier

### 4. Refusal and failure modes
What the customer sees when:
- The URL doesn't resolve
- The site is JS-walled and the crawler can't read it
- Tavily returns no corroboration
- The Driver Judge returns `insufficient_evidence` on a dimension
- The Recommender can't produce a finding without an evidence pointer

### 5. Cost ceiling
Per-scan cost estimate; rate limiting; spend caps. Cross-reference `AVI_OPS_MONITOR.md`.

### 6. What this flow does NOT include
- Live engine queries (paid only)
- D5 / Visibility outcome (paid only)
- The four Visibility sub-metrics (paid only)
- 8–10 page PDF (paid only — this is a 2–3 page summary)
- The walkthrough call (paid only)

### 7. Upsell pathway
After the free result lands, the customer is offered: "What the paid Index would tell you that this can't." This is the bridge to AVI_FLOW_PAID.md.

---

## Open questions before this is written

1. Email gate placement — before or after the on-screen tier? Current canon: email gate for the PDF, not for the on-screen tier.
2. Pricing references — reconcile with `public/Marty-Koepke-Pricing-Structure.md`. Current numbers in flight; verify before writing customer-facing copy.
3. Routing — `/scan` is the active route per D006; verify against current code before writing.

---

*Last touched: stub created during the canon cleanup pass.*
