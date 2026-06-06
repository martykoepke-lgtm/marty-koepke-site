# The AI Visibility Index — Rubric, Scoring & Measurement Protocol

*Practical Informatics measurement methodology. Version 0.1 (draft for field-testing).*

---

## 0. Design principles (the Lean frame)

A measurement is only worth charging for if it is **valid** (measures what it claims), **reliable** (same input → same score, across runs and across analysts), and **calculable** (produces a number, not an opinion). This rubric is built to survive the question a skeptical client will eventually ask: *"Is this repeatable?"*

The core structural decision — and it maps directly to your business model:

- **Drivers (the X's) = "Readiness."** Leading indicators you can assess from public data without querying the engines. This is what your free/low-cost **AI-Readiness Check** approximates.
- **Outcome (the Y) = "Visibility."** Whether the entity is actually surfaced and cited when you query the engines. This requires live measurement and is the heart of your **paid AI Visibility Index**.

You are modeling a cause→effect relationship: improve the drivers, and the outcome should rise. Tracking both over time is what proves your remediation works.

| | Sub-index | What it answers | Data source |
|---|---|---|---|
| **X (leading)** | Readiness Score (Dimensions 1–4, 6) | "Are you *built* to be found?" | Public web inspection |
| **Y (lagging)** | Visibility Score (Dimension 5) | "Are you *actually* being found?" | Live cross-engine queries |
| **Composite** | **AI Visibility Index (0–100)** | The headline number | Weighted blend |

---

## PART A — The Six Dimensions

Each dimension has an operational definition, the evidence for *why it matters*, the measurement method, and a **0–5 behaviorally-anchored scale**. Anchored scales are what make scoring reproducible between two analysts (your inter-rater reliability control). Score whole numbers only.

### Dimension 1 — Entity Clarity & Consistency *(driver)*
**Measures:** Whether the person/business is represented as one coherent, machine-recognizable entity across the web (name, role, location, offering — consistent everywhere).
**Why it matters:** Knowledge-graph entity recognition underpins source trust; contradictions degrade it. (See Reference §1.)
**How to measure:** Inspect website, LinkedIn, Google listing, directories, social profiles. Note any conflicts in name/title/location/description.
**Scale:**
- 0 — No discernible consistent entity; conflicting or absent identity.
- 1 — Entity exists but major contradictions across ≥3 sources.
- 2 — Recognizable but inconsistent (title/location/offering vary).
- 3 — Consistent core identity; minor gaps.
- 4 — Consistent across all major surfaces; clear single entity.
- 5 — Fully consistent + structured identity (e.g., sameAs links, knowledge-panel-ready).

### Dimension 2 — Third-Party Corroboration *(driver)*
**Measures:** Independent sources that vouch for the entity — reviews, directory listings, earned mentions, citations elsewhere.
**Why it matters:** A stitched-together identity across many sources beats a single self-published one. (Reference §3–4.)
**How to measure:** Count and quality-rate independent corroborating sources; note reviews and any earned media / community presence.
**Scale:**
- 0 — None. Only the entity's own website.
- 1 — 1–2 thin listings, no reviews.
- 2 — A few listings; sparse or stale reviews.
- 3 — Solid listings + active reviews on ≥1 platform.
- 4 — Multiple independent corroborators incl. reviews and a mention or two.
- 5 — Broad, current corroboration incl. earned media and community discussion.

### Dimension 3 — Machine-Readability & Structure *(driver)*
**Measures:** How easily an AI can parse the entity's owned content — direct-answer passages, clean HTML, schema/structured data.
**Why it matters:** Retrieval happens at the passage level; clean, direct-answer structure is more extractable. (Reference §1, §3.)
**How to measure:** Inspect the site for direct-answer formatting, heading structure, FAQ/Q&A blocks, and schema markup.
**Scale:**
- 0 — Unparseable (image-only text, no structure, JS-walled).
- 1 — Wall-of-text, no headings, no schema.
- 2 — Some structure; no direct-answer passages or schema.
- 3 — Good headings + some direct-answer passages.
- 4 — Direct-answer passages + basic schema (Organization/Person/FAQ).
- 5 — Fully structured, schema-rich, passage-optimized throughout.

### Dimension 4 — Information-Gain / Original-Data Signal *(driver)*
**Measures:** Whether owned content contains original statistics, data, named sources, or unique perspective — not consensus repetition.
**Why it matters:** Adding statistics (~41% lift) and citing sources (~115% for lower-ranked content) are the highest-leverage moves in the GEO study; consensus content gets filtered out. (Reference §2.)
**How to measure:** Sample key pages; count original data points, cited external sources, and unique claims vs. generic restatement.
**Scale:**
- 0 — Pure boilerplate; nothing original.
- 1 — Generic content, no data, no citations.
- 2 — Occasional specifics; no original data.
- 3 — Some specific claims or numbers.
- 4 — Original data/statistics present and cited.
- 5 — Distinctive original data + external citations as a consistent pattern.

### Dimension 5 — Cross-Engine Citation Presence *(OUTCOME — the Visibility Score)*
**Measures:** Whether, and how prominently, the entity actually appears when real buyer queries are run across multiple AI engines. **This is the dimension that requires the live protocol in Part C and produces the calculated Visibility Score.**
**Why it matters:** This is the thing clients are actually paying to know. Engines diverge sharply (only ~11% domain overlap), so it must be measured per-engine. (Reference §3.)
**How to measure:** Run the standardized query set across engines per Part C; compute Presence, Citation, Share-of-Voice, and Prominence. The 0–5 score below is derived *from* the calculated Visibility Score (see Part B conversion table) — you don't eyeball it.

### Dimension 6 — Platform-Native Fit *(driver)*
**Measures:** Alignment between where the entity has presence and the source platforms that feed the engines its buyers actually use.
**Why it matters:** Native-platform → engine mappings are real and divergent; presence on the wrong platform won't surface in the buyer's engine. (Reference §3.)
**How to measure:** Map buyer's likely engine(s) → the source platforms those engines favor → does the entity have strong presence there?
**Scale:**
- 0 — Presence only on platforms irrelevant to buyer's engines.
- 1 — Minimal presence on one relevant platform.
- 2 — Present on one relevant platform, weak.
- 3 — Solid presence on the single most relevant platform.
- 4 — Strong presence across the 2 most relevant platforms.
- 5 — Strong, native, active presence across all relevant feeder platforms.

---

## PART B — The Scoring Mechanism

### Step 1 — Readiness Score (the drivers)
Dimensions 1, 2, 3, 4, 6. Each scored 0–5. These are **weighted** by leverage (weights sum to 1.0):

| Dimension | Weight |
|---|---|
| D1 Entity Clarity & Consistency | 0.25 |
| D2 Third-Party Corroboration | 0.20 |
| D3 Machine-Readability & Structure | 0.15 |
| D4 Information-Gain / Original Data | 0.25 |
| D6 Platform-Native Fit | 0.15 |

**Readiness Score (0–100)** = ( Σ (dimension_score × weight) ÷ 5 ) × 100

*(Dividing by 5 normalizes the 0–5 scale to 0–1 before scaling to 100.)*

### Step 2 — Visibility Score (the outcome)
Calculated from the live query runs in Part C. It is a 0–100 number built from four measured components (defined in Part C): Presence Rate, Citation Rate, Share-of-Voice, and Prominence.

**Visibility Score (0–100)** = (0.20 × Presence) + (0.30 × Citation) + (0.30 × ShareOfVoice) + (0.20 × Prominence)
*(each component expressed 0–100; see Part C for how each is computed.)*

### Step 3 — Composite AI Visibility Index
The headline deliverable. Visibility (the outcome) carries more weight than Readiness (the drivers), because clients are buying the outcome:

**AI Visibility Index (0–100)** = (0.40 × Readiness Score) + (0.60 × Visibility Score)

### Step 4 — Convert Dimension 5 back to a 0–5 (for a clean six-dimension radar chart)
| Visibility Score | D5 score |
|---|---|
| 0–9 | 0 |
| 10–29 | 1 |
| 30–49 | 2 |
| 50–69 | 3 |
| 70–89 | 4 |
| 90–100 | 5 |

### Interpretation bands (for the client-facing report)
- **0–24 Invisible** — not present in AI answers; foundational work needed.
- **25–49 Emerging** — sporadic presence; clear remediation path.
- **50–74 Competitive** — regularly surfaced; optimize prominence & share.
- **75–100 Dominant** — consistently cited; defend and monitor drift.

---

## PART C — The Measurement Protocol (the agent-runnable "scientific method")

This is the part you can hand to an agent. It is written as a procedure with fixed conditions so results are **repeatable** (same analyst/agent, repeated runs) and **reproducible** (different analyst, same result). Treat it like a measurement-system analysis: control the conditions, repeat the runs, log everything.

### C.1 — Define the study (do this before any querying)
1. **Subject entity:** the person or business being measured (e.g., a specific clinic or physician).
2. **Competitor/comparison set:** 3–10 named alternatives that *should* plausibly appear for the same queries. This is the denominator for Share-of-Voice — without it, SoV isn't calculable.
3. **Query set Q:** 10–20 real buyer queries in the entity's niche. Write them the way a real person asks, in plain language. Cover three query types so you capture the contextual nuance: **discovery** ("best…", "who should I see for…"), **comparison** ("X vs Y"), and **factual/transactional** ("does [entity] offer…", "[entity] reviews").
4. **Engine set E:** the AI engines to test (e.g., ChatGPT, Claude, Gemini, Perplexity, Google AI Overviews).
5. **Repetitions R:** run each query **3 times per engine** in fresh sessions. LLM outputs are stochastic; repetition is your repeatability control — you average across runs.

### C.2 — Fixed run conditions (control the noise)
- Fresh session each run; **memory/personalization OFF**; logged out or neutral account.
- Record the **date** of every run (results drift over time — undated data is worthless).
- Note location setting (affects local results).
- Use identical query wording every time. No follow-ups; capture the first full answer.
- Same engine versions within a study; if an engine updates mid-study, restart that engine's runs.

### C.3 — The agent instruction (template)
Give the agent this job, per query, per engine, per repetition:

> "Submit the exact query below to {engine} in a fresh, non-personalized session. Capture the complete answer. Then, for the subject entity '{entity}' and each competitor in {competitor_set}, extract the structured record defined in the schema. Do not infer or add entities not present in the answer. Record verbatim the sentence(s) where any listed entity appears."

### C.4 — Extraction schema (one record per query × engine × repetition)
```json
{
  "study_id": "string",
  "date": "YYYY-MM-DD",
  "engine": "string",
  "query": "string",
  "query_type": "discovery | comparison | factual",
  "repetition": 1,
  "subject": {
    "mentioned": true,
    "cited_with_link": false,
    "position_band": "first_third | middle_third | last_third | absent",
    "sentiment": "positive | neutral | negative | absent",
    "evidence_text": "verbatim sentence or empty"
  },
  "competitors_mentioned": ["name1", "name2"],
  "total_entities_mentioned": 0
}
```

### C.5 — The calculations (deterministic, from the logged records)
Let **N = number of query×engine×repetition cells** in the study.

- **Presence Rate (0–100)** = ( cells where `subject.mentioned = true` ÷ N ) × 100
- **Citation Rate (0–100)** = ( cells where `subject.cited_with_link = true` ÷ N ) × 100
- **Share-of-Voice (0–100)** = ( total subject mentions ÷ total of all listed entities' mentions across all cells ) × 100
- **Prominence (0–100):** assign each cell points by `position_band` — first_third = 100, middle_third = 60, last_third = 30, absent = 0 — then average across all N cells.

Feed these four into the Visibility Score formula in Part B. Keep the **per-engine** breakdowns too — a single blended number hides the divergence that is often the most useful finding for the client.

### C.6 — Reliability & validity controls (your credibility layer)
- **Repeatability:** the 3 repetitions per cell; report the variance, not just the average. High variance is itself a finding ("the engine is unstable for this query").
- **Reproducibility:** the anchored 0–5 scales (Part A) so a second analyst lands on the same driver scores. Periodically have two people score the same entity and compare — a mini Gage R&R.
- **Test–retest / drift:** re-run the full study monthly; chart the Index over time. This is also how you *prove remediation worked.*
- **Date and version everything.** Every report states the date, engine versions, query set, and competitor set used.

---

## PART D — Worked Example (illustrative numbers)

**Goal:** measure the AI visibility of a hypothetical clinic, *"Sierra Women's Health,"* for menopause / alternative-HRT buyers. (Numbers below are invented to show the math — not real measurements.)

**Study setup:**
- Subject: Sierra Women's Health
- Competitor set: 4 named clinics/physicians in the region
- Query set Q (n=4 shown; you'd use 10–20):
  1. *"gynecologist for menopausal women alternative hormone therapy near [region]"* (discovery)
  2. *"bioidentical hormone replacement specialist [region] reviews"* (factual)
  3. *"Sierra Women's Health vs [Competitor] for menopause care"* (comparison)
  4. *"who treats perimenopause with non-standard HRT options"* (discovery)
- Engines E: ChatGPT, Claude, Gemini, Perplexity (4 engines)
- Repetitions R: 3
- **N = 4 queries × 4 engines × 3 reps = 48 cells**

*(Note: a niche like "carnivore-diet physicians" works identically, but expect sparser and more cautious answers on contested health topics — that sparseness shows up as low Presence and is a legitimate, measurable result, not a failure of the method.)*

**Suppose the logged results came back as:**
- Subject mentioned in 18 of 48 cells → **Presence = 18/48 × 100 = 37.5**
- Subject cited with a link in 7 of 48 cells → **Citation = 7/48 × 100 = 14.6**
- Across all cells, all 5 entities were mentioned 60 times total; subject accounted for 18 → **Share-of-Voice = 18/60 × 100 = 30.0**
- Prominence: of the 18 mentions, 4 first_third (400), 9 middle_third (540), 5 last_third (150); the other 30 cells = absent (0). Total = 1090 points ÷ 48 cells → **Prominence = 22.7**

**Visibility Score** = (0.20 × 37.5) + (0.30 × 14.6) + (0.30 × 30.0) + (0.20 × 22.7)
= 7.5 + 4.38 + 9.0 + 4.54 = **25.4 / 100**

**Readiness Score** — suppose the public-data inspection scored: D1=3, D2=2, D3=4, D4=2, D6=3.
Weighted sum = (3×0.25)+(2×0.20)+(4×0.15)+(2×0.25)+(3×0.15) = 0.75+0.40+0.60+0.50+0.45 = 2.70
**Readiness = (2.70 ÷ 5) × 100 = 54.0 / 100**

**Composite AI Visibility Index** = (0.40 × 54.0) + (0.60 × 25.4) = 21.6 + 15.2 = **36.8 / 100 → "Emerging"**

**The story this tells the client (and the remediation hook):** *"You're reasonably built (Readiness 54) but barely showing up (Visibility 25). Your structure is fine; your problem is that you're absent from the engines and platforms your buyers actually use, and your share-of-voice against four competitors is only 30%. Here's the remediation plan — and we'll re-run this in 60 days to prove it moved."* That gap between a decent Readiness and a low Visibility **is your sales conversation.**

---

## PART E — Blank data-table template

| query | query_type | engine | rep | subject_mentioned | cited_w_link | position_band | sentiment | #competitors_mentioned |
|---|---|---|---|---|---|---|---|---|
| | | | 1 | | | | | |
| | | | 2 | | | | | |
| | | | 3 | | | | | |

Driver scoring sheet:

| Dimension | Weight | Score (0–5) | Weighted |
|---|---|---|---|
| D1 Entity Clarity | 0.25 | | |
| D2 Third-Party Corroboration | 0.20 | | |
| D3 Machine-Readability | 0.15 | | |
| D4 Information-Gain | 0.25 | | |
| D6 Platform-Native Fit | 0.15 | | |
| **Readiness total** | | | |

---

*Version 0.1. The weights and component formulas are starting hypotheses — field-test them against real entities you already understand, and adjust the weights once you see which drivers actually predict the Visibility outcome. That calibration work is itself proprietary IP worth protecting.*
