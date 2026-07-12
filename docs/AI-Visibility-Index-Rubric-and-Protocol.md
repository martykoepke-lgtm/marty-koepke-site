# The AI Visibility Index — Rubric, Scoring & Measurement Protocol

*Marty Koepke measurement methodology — evidence-anchored.*

**Effective:** 2026-06-16
---

## 0. Design principles

A measurement is only worth charging for if it is **valid** (measures what it claims), **reliable** (same input → same score, across runs and across analysts), and **calculable** (produces a number, not an opinion). This rubric is built to survive the question a skeptical client will eventually ask: *"Is this repeatable?"*

The core structural decision — and it maps directly to the business model:

- **Drivers (the X's) = "Readiness."** Leading indicators that can be assessed from public data without querying the engines. This is what the free AI Readiness Check approximates.
- **Outcome (the Y) = "Visibility."** Whether the entity is actually surfaced and cited when the engines are queried live. This requires the paid AI Visibility Index.

The cause→effect relationship: improve the drivers, and the outcome should rise. Tracking both over time is what proves the remediation worked.

| | Sub-index | What it answers | Data source |
|---|---|---|---|
| **X (leading)** | Readiness Score (Dimensions 1, 2, 3, 4, 6) | "Are you *built* to be found?" | Public web inspection |
| **Y (lagging)** | Visibility Score (Dimension 5) | "Are you *actually* being found?" | Live cross-engine queries |
| **Composite** | **AI Visibility Index (0–100)** | The headline number | Weighted blend |

---

## 1. The principle behind every band

**AI engines are good aggregators of observable facts; they are not good assessors of subjective quality.** Every scoring band in this rubric is therefore anchored to *observable evidence* — what exists on the public web, what was returned by a search, what a crawler can extract. The LLM judge picks a band by citing the evidence; it does not assert quality.

Every band carries a footnote linking to its primary source. When a band cannot cite a source, it is marked "starting hypothesis" and surfaces in the methodology page of every report.

---

## PART A — The Six Dimensions

### Dimension 1 — Entity Clarity & Consistency *(driver, weight 0.15)*

**Measures:** Whether the person/business is represented as one coherent, machine-recognizable entity across the web (name, role, location, offering — consistent everywhere).

**Why it matters:** Knowledge-graph entity recognition underpins source trust; contradictions degrade it. Engines use knowledge graphs to verify claims and identify authoritative sources [1].

**Sub-score (named, not separately weighted):** Founder Credibility — for personal brands, the founder's discoverable history, qualifications, and unique perspective.

**How to measure:** Inspect website, LinkedIn, Google Business listing, directory profiles, social profiles, schema.org markup. Note any conflicts in name/title/location/description. Check for `sameAs` links.

**Anchored scale:**
- **0** — No discernible consistent entity; conflicting or absent identity.
- **1** — Entity exists but major contradictions across ≥3 sources.
- **2** — Recognizable but inconsistent (title, location, or offering vary).
- **3** — Consistent core identity; minor gaps; some structured identity signals.
- **4** — Consistent across all major surfaces; clear single entity; `sameAs` present.
- **5** — Fully consistent + structured identity; knowledge-panel-ready; Wikidata or knowledge-graph presence.

---

### Dimension 2 — Third-Party Corroboration *(driver, weight 0.25)*

**Measures:** Independent sources that vouch for the entity — reviews, directory listings, earned mentions, citations elsewhere, presence on the platforms engines cite from. **Corroboration content** — what third parties say about the subject.

**Why it matters:** A stitched-together identity across many sources beats a single self-published one [2]. AI engines disproportionately cite third-party platforms over the subject's own site — Reddit (40.1%), Wikipedia (26.3%), YouTube (23.5%) across measured AI citations [3]. Corroboration is the primary citation surface, not a corroborating signal.

**How to measure:** Run platform-filtered searches (Reddit, LinkedIn, YouTube, Quora, Wikipedia, Yelp, G2, Gartner) for the subject. Count and quality-rate independent corroborating sources. Note reviews. Note any earned media or community discussion. Flag uncorroborated outlier claims on the subject's own site as a risk.

**Anchored scale:**
- **0** — None. Only the entity's own website mentions it.
- **1** — 1–2 thin listings, no reviews, no community discussion.
- **2** — A few listings; sparse or stale reviews; no platform-specific presence.
- **3** — Solid listings + active reviews on ≥1 platform; some platform-specific corroboration.
- **4** — Multiple independent corroborators including reviews and earned mentions; presence visible on 2+ engine-favored platforms.
- **5** — Broad, current corroboration including earned media and community discussion; visible across multiple platforms each engine favors.

---

### Dimension 3 — Machine-Readability & Structure *(driver, weight 0.15)*

**Measures:** How easily an AI can parse the entity's owned content — direct-answer passages, clean HTML, schema/structured data, exact-term presence. Includes a **hard penalty cap** for keyword stuffing.

**Why it matters:** Retrieval happens at the passage level; clean, direct-answer structure is more extractable [4]. Anthropic's contextual retrieval reduced chunk failure rates by 35% (and 67% when combined with reranking) [5]. Stylistic methods (fluency optimization, readability) boost visibility 15–30% [6]. ChatGPT cites from the first third of source content ~44% of the time [7]. Keyword stuffing actively *reduces* visibility (−10% on Perplexity) [6].

**Sub-criteria (mandatory checks):**
- **Canonical exact-term presence** — the subject's canonical name and primary product/service names appear in `<title>`, `<h1>`, and structured-data identifier fields.
- **Above-the-fold differentiation** — the subject's distinctive content (D4 evidence pointers) appears in the first third of the page. If not, D3 caps at band 3.
- **Keyword stuffing penalty** — any evidence of unnatural keyword density caps D3 at band 2 regardless of other criteria.
- **Metadata scent (per Pirolli & Card 1999, Alexander et al. 2022)** — the `<meta name="description">` must be ≥ 50 characters AND contain at least one action verb AND name the subject's category. If any of these three checks fails, D3 caps at band 3. This addresses information-scent signals that determine downstream click-through and AI-engine snippet quality.

**Anchored scale:**
- **0** — Unparseable (image-only text, no structure, JS-walled, schema absent).
- **1** — Wall-of-text, no headings, no schema.
- **2** — Some structure; no direct-answer passages or schema. (Cap if keyword stuffing detected.)
- **3** — Good headings + some direct-answer passages; canonical exact terms in `<title>` and `<h1>`. (Cap if differentiation is below-the-fold OR metadata scent inadequate.)
- **4** — Direct-answer passages + basic schema (Organization/Person/FAQ); differentiation above the fold; clean HTML; scent-rich meta description.
- **5** — Fully structured, schema-rich, passage-optimized throughout; chunk-friendly; differentiation leads the page; meta description names category and action.

---

### Dimension 4 — Differentiation from Consensus *(driver, weight 0.30)*

**Measures:** Whether the subject's content adds non-redundant information to the topic-level pool that AI engines aggregate across sources. *What does this subject know, have, or say that the topic's consensus doesn't, and is it structured for engines to extract?*

**Why it matters:** Engines filter for complementary sources and exclude redundant ones — this is the patent mechanism behind selection [8]. Adding citations, statistics, and direct quotations boosts visibility 30–40% on average and up to +115% for lower-ranked subjects [6]. Differentiation is the strongest single lever in this rubric, supported by the deepest evidence stack.

**Sub-score (named, not separately weighted):** Methodology Depth — for company subjects, the discoverable depth of the signature methodology, framework, or offer definition.

**How to measure:** Sample key pages. For each, ask: what does this content add to the topic's existing pool? Count original data points, cited external sources, distinctive case studies, geographic specificity, signature methodology. Compare against generic restatement of consensus.

**Anchored scale:**
- **0** — Pure consensus restatement. No proprietary data, no unique angle, no distinctive case studies.
- **1** — Some specifics, but nothing that distinguishes from category peers.
- **2** — One identifiable differentiation candidate (proprietary data, signature method, geographic specificity, distinctive case study), but not surfaced in extractable form.
- **3** — One differentiation candidate surfaced in extractable form (direct-answer passage, schema, supported by citation).
- **4** — Multiple differentiation candidates; at least one with empirical support (data, statistics, named sources).
- **5** — Consistent pattern of differentiated, cited content across multiple pages.

---

### Dimension 5 — Cross-Engine Citation Presence *(OUTCOME — the Visibility Score)*

**Measures:** Whether, and how prominently, the entity actually appears when real buyer queries are run across multiple AI engines. **This dimension requires the live protocol in Part C and produces the calculated Visibility Score.**

**Why it matters:** This is the thing customers are paying to know. Engines diverge sharply (only ~11% domain overlap) — must be measured per-engine [9]. Selection rate (the frequency models cite the source) is the AI-era replacement for click-through rate [9].

**How to measure:** Run the standardized query set across engines per Part C; compute Presence, Citation, Share-of-Voice, and Prominence. The 0–5 score below is *derived from* the calculated Visibility Score (see Part B conversion).

**Anchored scale (derived from Visibility composite, not directly judged):**
- **0** — Visibility < 0.10. Not surfaced anywhere.
- **1** — Visibility 0.10–0.20. Mentioned rarely; never primary.
- **2** — Visibility 0.20–0.40. Mentioned across some queries; below competitors.
- **3** — Visibility 0.40–0.60. Solid mid-pack presence; some citations.
- **4** — Visibility 0.60–0.80. Consistently mentioned and cited; competitive Share-of-Voice.
- **5** — Visibility ≥ 0.80. Dominant presence across queries; high citation and prominence.

---

### Dimension 6 — Platform-Native Fit *(driver, weight 0.15)*

**Measures:** Whether the subject has credible presence on the source platforms that feed the buyer's most likely AI engines. **Channel presence** — the subject's own profile/presence on the platforms themselves.

**Why it matters:** Engines diverge sharply in which platforms they cite [3, 10]. Native-platform → engine mappings are real and divergent. Presence on the wrong platform won't surface in the buyer's engine.

**"Relevant platform" is a two-lookup answer**, not a one-lookup. Both the engine AND the business lane matter. A coffee shop's relevant platforms are Yelp / Google Business Profile / Reddit city threads; a SaaS founder's relevant platforms are G2 / Capterra / comparison articles. The engine table alone would tell you both need Perplexity's platforms — the lane table tells you WHICH of those platforms.

**Engine-platform mapping (still anchors what each engine reads):**

| Engine | Favored platforms |
|---|---|
| **ChatGPT** | Wikipedia, Forbes, G2, Reuters, Yelp (Feb 2026 partnership), established news |
| **Claude (Anthropic)** | Academic/government sources, vendor-neutral analyst coverage (Gartner-style), niche SaaS/practitioner blogs, technical documentation |
| **Perplexity** | Reddit, YouTube, Gartner, Yelp, TripAdvisor |
| **Gemini / Google AI Overviews** | Google Business Profile, YouTube, Reddit, established news |

**Lane-platform priority mapping (which of the engine's platforms actually matter for THIS business):**

| Lane | Priority platforms (in order) | Query type buyers ask |
|---|---|---|
| **Local** (brick-and-mortar) | Google Business Profile · Bing Places · Yelp · Reddit city threads · local blogs | Opinion — "best latte in town" |
| **Services** (advice-driven) | LinkedIn (company + founder) · services vertical directory (Clutch / Avvo / Super Lawyers / Chief Outsiders) · current-year "best of" listicle · podcast appearances | Advice — "what does executive coaching cost" |
| **Product / SaaS** | Software review platform (G2 / Capterra / TrustRadius) · SaaS directory (AlternativeTo / SaaSHub / Product Hunt) · comparison articles ("X vs Y") · clean factual own-site pages | Comparison — "best CRM for a 2-person team" |

**How to measure:** (1) Identify the buyer's most likely engine(s) for the subject's category. (2) Identify the subject's lane (local / services / product) from intake. (3) Map both — the priority platforms are the intersection. (4) Verify the subject has credible presence (profile + content + recency) on those platforms.

**Anchored scale (unchanged; "relevant platform" is now lane-aware):**
- **0** — Presence only on platforms irrelevant to the buyer's engines AND the subject's lane.
- **1** — Minimal presence on one relevant platform.
- **2** — Present on one relevant platform, weak engagement.
- **3** — Solid presence on the single most relevant platform.
- **4** — Strong presence across the two most relevant platforms.
- **5** — Strong, native, active presence across all relevant feeder platforms.

---

## PART B — The Scoring Mechanism

### Step 1 — Readiness Score (the drivers)

Dimensions 1, 2, 3, 4, 6. Each scored 0–5 against the anchored scales above. Weighted by leverage (weights sum to 1.0):

| Dimension | Weight |
|---|---|
| D1 Entity Clarity & Consistency | 0.15 |
| D2 Third-Party Corroboration | 0.25 |
| D3 Machine-Readability & Structure | 0.15 |
| D4 Differentiation from Consensus | 0.30 |
| D6 Platform-Native Fit | 0.15 |

**Readiness Score (0–100)** = ( Σ (driver_score × weight) ÷ 5 ) × 100

*(Dividing by 5 normalizes the 0–5 scale to 0–1 before scaling to 100.)*

### Step 2 — Visibility Score (the outcome)

Calculated from the live query runs in Part C. It is a 0–100 number built from four measured components:

```
Visibility = (0.20 × Presence)
           + (0.30 × Citation)
           + (0.30 × Share-of-Voice)
           + (0.20 × Prominence)
```

Each component is 0.0–1.0 (see Part C for computation). Result is scaled to 0–100.

### Step 3 — Composite AI Visibility Index

```
Composite = (0.40 × Readiness) + (0.60 × Visibility)
```

The 60/40 weighting reflects that drivers are leading indicators; the outcome is what buyers pay to know.

### Step 4 — Tier band

| Composite (0–100) | Tier |
|---|---|
| `< 20` | Invisible |
| `20 – 40` | Overlooked |
| `40 – 60` | Emerging |
| `60 – 80` | Discoverable |
| `≥ 80` | Agent-Ready |

---

## PART C — The Live Measurement Protocol

### C.1 The query grid

| Parameter | Value | Source |
|---|---|---|
| Number of queries | 8 | Company-centered business accuracy and buying questions |
| Engines | ChatGPT, Claude (Anthropic), Perplexity, Gemini | Four measured systems for paid audits |
| Reps per query/engine | 1 | Acknowledged as a snapshot, not a stable measurement |
| Total query calls | **32** | 8 × 4 × 1 |
| Query category mix | 80% informational / 10% transactional / 10% navigational | Aggarwal 2024 GEO-bench distribution [6] |

**The 8 queries are *not* one universal set.** Buyers ask different question types depending on the business's lane. Same 8 slots, three different query archetype tables — chosen at intake from the lane the visitor selected.

**Lane: Local (brick-and-mortar) — opinion queries:**
Buyers ask *best latte in town, recommend a plumber in Sacramento, cutest brunch spot for a first date.* Query archetypes: category+location recommendation, best-of-city framing, use-case-specific fit ("kid-friendly," "quick lunch"), reviews-focused ("well-reviewed," "highly rated"), competitor comparison ("[our category] vs [their category]" adjacent), hours/availability, price-tier ("cheap," "upscale"), and disambiguation ("[our name] or [similar-named local]").

**Lane: Services (advice-driven) — advice queries:**
Buyers ask *what does executive coaching cost, how do I switch careers, do I need a bookkeeper yet.* Query archetypes: category recommendation for a persona ("best [category] for [ICP]"), pricing and scope ("how much does [service] cost"), outcome question ("how do I [outcome]"), decision-stage ("when do I need [service]"), fit criteria ("[service] for [buyer type]"), credential check ("is [subject] qualified for [scope]"), competitor comparison ("[subject] vs [named competitor]"), and problem statement ("I'm dealing with X, who do I hire").

**Lane: Product / SaaS — comparison queries:**
Buyers ask *best CRM for a two-person team, cheapest scheduling tool with a good API.* Query archetypes: best-in-category-for-use-case ("best [category] for [use case]"), price-tier ("cheapest [category] with [feature]"), feature-first ("[category] with [feature]"), competitor comparison ("[our product] vs [competitor]"), alternative-search ("alternatives to [competitor]"), integration ("[category] that integrates with [X]"), sizing ("[category] for [company size]"), and API/technical ("[category] with a good API").

**Which lane the audit uses** is decided by the `audience_lane` set on the subject at intake — `local` / `services` / `product`. The 32-total-responses math and the four visibility sub-metrics below don't change. Only the query set does.

### C.2 The four Visibility sub-metrics

For each query response from each engine, the Extractor records: was the subject mentioned, was it cited with a link, what position, which competitors were mentioned, sentiment.

The Aggregator then computes:

```
Presence       = (responses where mentioned)       ÷ (total responses)
Citation       = (responses where cited_with_link) ÷ (total responses)
Share-of-Voice = (responses where mentioned)       ÷ (responses where mentioned OR any competitor mentioned)
Prominence     = average position score, where
                 top = 1.0, middle = 0.5, late = 0.25, not_named = 0.0
```

All four are 0.0–1.0.

### C.3 Citation verification

Every URL the engine cites is fetched and verified to (a) resolve and (b) contain content related to the claim. Hallucinated citations are logged and *excluded* from sub-metric math. Citation hallucination rates in deployed models range 11–57% [11] — verification is not optional.

### C.4 The methodology page

Every report includes a one-page methodology section that declares:

- Query protocol (4 × 3 × 1, 80/10/10 mix)
- Judge model and cross-judge model
- Cross-judge agreement rate for this audit
- Known limitations (cold-query only, single rep per pair, classical SEO effects unmeasured, engine drift)

---

## Citation footnotes

1. Dias, P. (2026). *How LLMs and RAG Systems Retrieve, Rank, and Cite Content.* "Entity recognition matters. Systems use knowledge graphs to verify claims and identify authoritative sources."
2. Same source as [1], on source reliability estimation and corroboration. Cross-mapped in `AVI_LITERATURE_CROSSMAP.md` Article 1.
3. Profound (2025), *AI Platform Citation Patterns* (680M citations, Aug 2024 – June 2025). Semrush (2025), *Most-Cited Domains in AI* (150,000 citations across 5,000 keywords): Reddit 40.1%, Wikipedia 26.3%, YouTube 23.5%. Cross-mapped in Article 4.
4. Dias (2026), on chunk-level extraction and clear section structure.
5. Anthropic (2024), *Introducing Contextual Retrieval.* Chunk retrieval failure reduced by 35% (67% with reranking).
6. Aggarwal et al. (2024), *GEO: Generative Engine Optimization* (arxiv 2311.09735). 9 methods tested on 10,000-query GEO-bench. Cross-mapped in Article 2.
7. ALM Corp (2025), *ChatGPT Citations: 44% Come From the First Third of Content.*
8. US Patent Application US20200349181A1, Google, *Determining Information Gain Subsequent to Identifying a User Interest.* Engines filter for non-redundancy and may exclude redundant sources entirely (paragraph 0059). Cross-mapped in Article 3.
9. Dias (2026), engine divergence (~11% domain overlap); Tow Center (2025), 1,600-query audit.
10. Industry analyses of Claude's sourcing pattern: Stridec, Erlin.ai, Oltre.ai, Stackmatix. Cross-mapped in Article 4 §4.7. Triangulated, not peer-reviewed.
11. Onweller, H., Lumer, E., Huber, A., Ramchandani, P., Subbiah, V. K., & Feld, C. (2026). *Cited but Not Verified: Parsing and Evaluating Source Attribution in LLM Deep Research Agents.* arxiv:2605.06635. Tested 14 LLMs across three citation dimensions. Strongest frontier models: link validity >94%, topical relevance >80%, but factual accuracy only 39–77%. Scaling tool calls from 2 to 150 drops factual accuracy by ~42%.
12. Pirolli, P., & Card, S. K. (1999). *Information Foraging.* Psychological Review, 106(4), 643–675. Users abandon results when snippet/metadata doesn't signal relevance.
13. Alexander, D., Kusa, W., & de Vries, A. P. (2022). *ORCAS-I: Queries Annotated with Intent using Weak Supervision.* SIGIR '22. Identifies factual/instrumental/exploratory subcategories of informational intent; 36% of informational queries are exploratory and require session context not captured in cold-query measurement.
14. Broder, A. (2002). *A Taxonomy of Web Search.* SIGIR Forum, 36(2). Foundational nav/trans/info macro-intents.

---

## Calibration policy

Weights and band cutoffs are starting hypotheses. They remain stable until:

1. **30+ subjects are scored** under the current methodology.
2. **Cross-judge agreement** is computed across that sample.
3. **Inter-rater reliability** falls below threshold on any specific dimension or band cutoff.

Any change to weights, anchored scales, or cutoffs is tracked internally. Old audits stay valid against the scoring method used at the time.
