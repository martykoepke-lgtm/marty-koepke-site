# Website and product angles — seven ideas grounded in the competitive gap analysis

**Source for the gap analysis:** the ten competitors researched earlier — Profound, Otterly AI, Evertune, Peec AI, Conductor, BrightEdge (AI Catalyst), AthenaHQ, Semrush AI Visibility Toolkit, ZipTie, Ahrefs Brand Radar.

**The shared market weakness in one sentence:** every competitor sells a dashboard or a recurring subscription, and almost none publishes the methodology behind the score they deliver.

Each idea below names one thing PI could do that the cohort does not, ties it back to what already exists in PI's canon and code, and proposes how it shows up on the website and in the product.

---

## Idea 1 — "Show the work" as the website's centerpiece

**The angle.** The methodology page is not buried in an FAQ. It is the front door. The homepage links to a `/methodology` page that publishes the rubric, the citation footnotes, the agent specs, and the named list of what every audit does not measure.

**What competitors don't do.** None of the ten publishes its rubric. Visibility scores are black boxes. Customers cannot audit the audit.

**How it uses what PI already has.**
- `public/AI-Visibility-Index-Rubric-and-Protocol.md` (v0.2) is already written with citation footnotes [1]–[14] pointing at the patent, Aggarwal et al., Anthropic contextual retrieval, Profound, Semrush, Pirolli & Card, Alexander et al., Broder.
- `agents/EXTRACTOR.md`, `agents/DRIVER_JUDGE.md`, `agents/RECOMMENDER.md` carry verbatim system prompts.
- `AVI_OPERATING_STANDARD.md` carries the principle, the refusal catalog, and the verification protocol.

**Website changes.**
- New top-nav item: **Methodology**.
- `/methodology` page renders the rubric, the operating-standard principle ("aggregator not assessor"), and the refusal catalog in customer-friendly form.
- Homepage hero adds: *"Want to see how we score? Here is the rubric. Here are the citations. Here is what we do not measure."*
- Every customer report's methodology page links back to `/methodology` so customers can re-read at any time.

**Risk.** Sophisticated competitors could copy the rubric. They cannot copy the translator role or the cited-source discipline. Transparency itself becomes the moat.

---

## Idea 2 — Productize the walkthrough call as the "Translator Hour"

**The angle.** The paid Index Report is delivered with a 45–60 minute walkthrough. Marty reads the report with the customer, answers their questions in plain English, and explains what to do next. The conversation is the deliverable. The customer keeps the recording.

**What competitors don't do.** Profound, Conductor, AthenaHQ, Evertune all ship dashboards. No human walks the customer through the result. The closest thing in the market is enterprise account management at the $50k+ tier.

**How it uses what PI already has.**
- The translator framing is already in `VISION.md`.
- The HTML report renderer (`lib/avi/render-v2.ts`) is structured to be walked through in 45 minutes — six sections, each with a clear plain-English summary.
- The methodology page in the report sets up the honest-about-limits conversation.

**Product structure.**
- Translator Hour is included with the paid Index Report at $1,000.
- Standalone "Second Opinion" sessions available at $250 — customer brings their own AI visibility report (from a competitor or a previous audit) and Marty walks through what it actually says.

**Risk.** Scale ceiling. At 1 audit per week, Marty's time becomes the bottleneck. The constraint is real but it is also part of what makes the audit defensible. The constraint becomes intentional pricing rather than an accident.

---

## Idea 3 — The differentiation discovery workshop (pre-audit conversation)

**The angle.** Before the paid audit runs, Marty does a 30-minute structured conversation with the customer. The goal is to surface the customer's `known_differentiation_terms` array — what they know, have, or say that nobody else in their category has. Those terms feed directly into the audit's Extractor and Recommender.

**What competitors don't do.** Every competitor runs the audit cold. The customer's actual differentiated knowledge never enters the analysis. The recommendations that come back are generic because the input was generic.

**How it uses what PI already has.**
- The `Subject.known_differentiation_terms` field already exists in `lib/avi/types.ts`.
- The Extractor's S5 scent guardrail (`differentiation_named`) checks engine responses for these terms.
- The Recommender's patent-derived framing ("what does this subject know that consensus doesn't?") is structurally designed to use these terms.

**Product structure.**
- Discovery workshop is included with the paid Index Report at $1,000.
- Standalone discovery workshop available at $300 — for customers who want the strategic conversation without the audit.
- The workshop produces a one-page artifact: "Five things only you know" — the customer keeps it regardless of whether they buy the audit.

**Risk.** The workshop's value depends on Marty's translator skill. Cannot be staffed out cheaply. Same constraint as the Translator Hour.

---

## Idea 4 — Re-measure with proven movement at 60 days

**The angle.** Every paid audit includes a follow-up audit at 60 days. The follow-up uses the same rubric version, same query grid, same engines. The customer sees the delta — what moved, what didn't, by how much. Failure to move is reported honestly; success is documented with the rubric receipts.

**What competitors don't do.** Most competitors sell ongoing tracking at $200–$3,000 per month. The customer pays forever to see movement. PI's model is opposite: pay once, get the movement proof, then decide whether to continue.

**How it uses what PI already has.**
- The Supabase schema (migration `0011`) already includes the `v_audit_progress` view computing composite deltas per subject over time.
- The HTML comparison renderer already supports side-by-side comparison; a "delta" version is a small extension.
- Rubric versioning ensures the comparison is apples-to-apples.

**Product structure.**
- 60-day re-measure included with the paid Index Report at $1,000.
- Or: priced separately at $500 for customers who want to re-measure later without the full Sprint.
- The Sprint includes the 60-day re-measure as part of its proof-of-outcome promise.

**Risk.** If the 60-day re-measure shows no movement, the customer expects refund or remediation. This is solved by being honest about the cause: did the customer act on the recommendations? Did the engines drift? The methodology page handles both honestly.

---

## Idea 5 — Cross-vendor confidence band as a premium signal

**The angle.** For higher-stakes audits, add a second-vendor cross-judge pass. Same evidence package, different AI vendor, independent scoring. The customer's report shows the agreement rate per dimension. When disagreement is high, the methodology page says so plainly. The customer leaves knowing how confident the audit's findings actually are.

**What competitors don't do.** None of the ten discloses which AI vendor produced their score, let alone runs a second-vendor check. The single-LLM black box is the norm. PI's cross-vendor declaration becomes a verifiable trust signal.

**How it uses what PI already has.**
- `agents/CROSS_JUDGE.md` is already specified.
- `AVI_OPERATING_STANDARD.md` §5.3 already defines the cross-judge protocol and the agreement-rate methodology.
- The Supabase schema includes the `audit_cross_judge_scores` table.

**Product structure.**
- Cross-vendor pass available as a $250 add-on at audit purchase.
- Included by default for any audit over $1,500 (e.g., the Expanded Sprint).
- The customer report explicitly names the primary judge model and the cross-judge model on the methodology page.

**Risk.** Implementation work is not zero — the cross-judge code needs to be written. Estimated half-day with the existing scaffold.

---

## Idea 6 — The bias-defense declaration as a marketing asset

**The angle.** PI publishes a one-page "What we defend against" document on the website. It names the documented biases in AI tools — sycophancy, position bias, trend slop, confirmation amplification, chain-of-thought rationalization, citation hallucination — and explains the specific mechanism in the AVI pipeline that defends against each. With citations.

**What competitors don't do.** Every competitor uses LLMs in their recommendation engines. None discloses what biases their tool might inherit. The bias literature (Sharma et al., HBR, PNAS, SycEval, Anthropic CoT) is invisible in their customer-facing materials.

**How it uses what PI already has.**
- `AVI_LITERATURE_CROSSMAP.md` already has Articles 1–4 plus the institutional bias research stack.
- The operating standard's refusal catalog and verification protocol are the underlying defenses.
- The new scent guardrails (S1–S5 in the Extractor, D3 metadata-scent cap in the Crawler) are direct anti-bias mechanisms.

**Website changes.**
- New page: `/how-we-defend-against-bias`.
- Six sections, one per documented bias category. Each says: *here is the research; here is what the bias does to other tools; here is the specific mechanism in our pipeline that addresses it.*
- Linked from the methodology page and from the homepage hero.

**Risk.** This is a positioning move that requires consistent voice. If PI ever ships a recommendation that violates one of these defenses, the credibility cost is large. Discipline matters.

---

## Idea 7 — Done-with-you Sprint as explicit alternative to subscription

**The angle.** PI's offering ladder is explicitly *not* a recurring subscription. The Index Report is one-time. The Sprint is one-time. The Visibility Partner is optional and post-Sprint. The website makes this contrast against the cohort visible. The tagline: *end the work, not the relationship.*

**What competitors don't do.** Profound, Conductor, BrightEdge, Otterly, Semrush, Peec, Evertune all charge monthly. Even ZipTie and AthenaHQ are subscription-first. The recurring-revenue model is the default in this market. Customers who don't want to be locked into ongoing billing have nowhere obvious to go.

**How it uses what PI already has.**
- The ladder is already defined in `VISION.md` and `public/Practical-Informatics-Pricing-Structure.md`.
- The Sprint deliverable list already includes the 60-day re-measure as the proof-of-outcome.
- The translator role means the customer gains skills, not a tool dependency.

**Website changes.**
- A comparison page or section: *"What's different about how Practical Informatics works."*
- Three columns: Self-serve SaaS (Profound, Otterly, etc.), Enterprise agency retainer (Conductor, BrightEdge), Practical Informatics (one-time Sprint + transferred knowledge).
- Each column gets honest credit — SaaS works for the right customer; agency retainer works for the right customer; PI works for owner-operators who want to learn the work.

**Risk.** Subscription models have predictable revenue. One-time Sprints have variable revenue. The financial constraint is real but matches PI's stage (one-person practice, not VC-scale).

---

## A stretch idea — publish the rubric as open source

**The angle.** PI releases the AVI rubric under Creative Commons. Anyone can use the methodology, cite it, build on it. PI's role is not the rubric itself; it is the translator who can apply it well.

**What this would change.** Other AI visibility consultancies (and customers themselves) could cite the AVI rubric in their own work. PI becomes the named reference. Citations compound. Other tools end up validating PI's methodology by adopting it.

**Why it's a stretch.** Open-sourcing the rubric requires confidence that the translator role really is the moat. If a competitor with a bigger marketing budget adopts the rubric, they might out-market PI on it. The bet is that the discipline of applying the rubric correctly cannot be marketed — it can only be practiced. Marty's twenty years of clinical informatics experience is the actual product. The rubric is the documentation.

This is worth considering as a longer-term move, possibly six months after the paid Index Report is in market and the rubric has been calibrated against the first 30 subjects.

---

## How to prioritize these

A quick rubric of my own for picking which to act on first:

| Idea | Effort to implement | Marketing leverage | Defensibility |
|---|---|---|---|
| 1 — "Show the work" methodology page | Low (content already written) | High (no competitor does this) | High (transparency itself is hard to copy) |
| 2 — Translator Hour | Already happening informally; just productize | Medium (differentiates but at lower price point) | High (Marty's voice is the product) |
| 3 — Differentiation discovery workshop | Low (just a structured 30-min conversation) | High (changes what's measured, not just how) | High (ties to the patent mechanism) |
| 4 — 60-day re-measure | Low (schema already supports it) | High (proves outcome, refutes subscription pitch) | High (other tools cannot do this without subscription buy-in) |
| 5 — Cross-vendor confidence band | Medium (cross-judge code needs writing) | Medium (premium-tier signal) | Medium (technically copyable) |
| 6 — Bias-defense declaration | Medium (need one good content writer week) | High (turns a competitive weakness into a category) | High (depends on continued discipline) |
| 7 — One-time vs. subscription positioning | Low (mostly a website edit) | Medium-high (clarifies the buyer who wants this) | Structural (the business model itself is the moat) |

If I had to pick three to do first: **1, 4, and 7**. Together they reframe the entire competitive conversation: PI's audit is verifiable (1), it proves movement (4), and it ends rather than recurs (7). Add **3** (the differentiation workshop) when you want to defend why the audit is more accurate than the cohort's generic dashboards.

The translator role threads through all of them. The discipline is the moat.
