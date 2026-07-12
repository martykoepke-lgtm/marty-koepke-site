# AVI operating standard — how AI is allowed to work inside this pipeline

**Owner:** Marty Koepke, Practical Informatics LLC
**Status:** Draft v0.1 — proposed canon. Read this before any other AVI doc.
**Audience:** Marty, and any future AI agent (Claude Code, Cowork, a human contractor) asked to touch the AVI codebase.
**Purpose:** A single source of truth for *what AI is permitted to do* inside the AI Visibility Index — both the free Readiness Check and the paid Visibility Check. Defines the principle, the workflow, the locked math, the refusal catalog, and the verification protocol. Every flow doc and every agent role file derives from this one.

This doc supersedes the rules currently scattered across `AVI_AGENT_DESIGN.md` (deprecated), `AVI_INDEX_REPORT.md`, `AVI_FREE_FLOW.md`, `DECISIONS.md` (D001), and `CLAUDE.md` ("AVI app — architectural rules"). When those docs are rewritten in the new canon, they will cite this one.

---

## 1. The principle

**AI is a good aggregator. It is not a good assessor.**

The AVI pipeline is built on that single sentence. Aggregation — fetching, parsing, extracting, summarizing what is already on the page — is what large language models do well. Assessment — judging whether a business is "good," choosing what matters, deciding what to score and how — is what large language models do badly, because they confidently invent answers when evidence is thin.

So the pipeline never asks an LLM to assess. It asks the LLM to **report what was observed**, against a **rubric that humans wrote and locked**, in a **shape humans defined**. The math is done in code. The bands are anchored to human-written criteria. The LLM's only job is to fill in evidence and pick from a fixed menu.

If a step requires the LLM to choose what to do next, invent a number, or rely on knowledge it wasn't given in the prompt, that step is wrong. Stop and re-design it.

---

## 2. The workflow pattern — Retrieve, Constrain, Express

Every audit, free or paid, follows the same three-phase shape. Phases are sequential. Code controls the order. No LLM decides what comes next.

### 2.1 Retrieve — code only, no LLM judgment

Deterministic code fetches public sources. Crawler reads the website. Search APIs find third-party corroboration. The engines under audit (ChatGPT, Claude, Perplexity) are queried with a fixed query grid. Every retrieved artifact is timestamped, logged, and stored.

The LLM is not consulted here. Code does not ask "is this page worth fetching?" — the URL list is the URL list. Code does not ask "did the engine mention the business?" — that's a later step, in Express.

### 2.2 Constrain — the rubric is the shape, not a suggestion

The seven driver dimensions, the four outcome sub-metrics, the anchored 0–5 scales, the weights, the composite formula, the tier bands — all of it is locked in code and prompts, stamped with `AVI_RUBRIC_VERSION`. The LLM cannot invent a dimension, change a weight, redefine a band, or skip a step.

When the rubric changes, the version bumps. Every audit row carries the version it was scored under. Old audits stay reproducible against their own version.

### 2.3 Express — the LLM fills in observed evidence, in a fixed schema

The LLM is given the retrieved evidence plus the relevant slice of the rubric, and asked to return a JSON object that conforms to a pre-declared schema. Schema-validated output, or the call retries; second failure, the field returns `null` and the audit notes the gap.

The LLM does not pick the output shape. It does not add fields the schema doesn't ask for. It does not omit required fields. The schema is the contract.

---

## 3. Universal ground rules — every LLM call, every time

These apply to every call inside the pipeline, free or paid, no exceptions.

1. **One bounded job per call.** A call extracts, or a call judges one dimension, or a call generates one recommendation list. Never two jobs in one call.
2. **Temperature 0. JSON mode where supported. Schema-validated output.** If the output doesn't validate, retry once. If it still doesn't validate, the field is `null` and the gap is logged.
3. **Every claim cites observed evidence.** Every score includes an `evidence_pointers` array referencing the source it came from (URL, query response ID, schema block name). Claims without pointers are rejected by the schema.
4. **"Insufficient evidence" is always a valid answer.** Schemas allow `null` or `"insufficient_evidence"` on every judgment field. The LLM is told, in the system prompt, that returning insufficient evidence is preferred over guessing.
5. **No training-data knowledge about the specific subject.** The system prompt says explicitly: *"Use only the evidence in the user message. Do not use any prior knowledge you may have about this business, person, or product."*
6. **Replayability.** Every call's inputs (system prompt, user prompt, model, temperature) and outputs are logged to `api_calls`. Replaying the same inputs must produce the same output. Determinism is a test, not an aspiration.
7. **Cost ceiling per call.** Each call has a max-token cap. Runaway responses fail closed; they do not silently truncate scores.
8. **No autonomy.** No LLM call decides what call comes next. Orchestration is plain TypeScript. If the next step depends on the previous output, the dependency is encoded in code, not in a meta-LLM.

---

## 3.5 The scoring math — locked

This is the math the code computes. The LLM never does arithmetic. The LLM picks an integer band 0–5 for each driver dimension with an evidence-cited justification; everything below is deterministic.

> **Architectural choice (supersedes D002).** This standard uses the **six-dimension** rubric from `public/AI-Visibility-Index-Rubric-and-Protocol.md` v0.1 — five weighted drivers (D1, D2, D3, D4, D6) plus D5 as the outcome. Founder Credibility lives as a named sub-score inside D1; Methodology Depth lives as a named sub-score inside D4. Reason: easier to score, easier to enforce in the rubric, cleaner radar chart, one shape for every subject. This reverses D002's "Option 2 — seven-dimension subject-adaptive" choice; **a new ADR (proposed D007) must be logged before code is changed.**

### 3.5.1 The five driver dimensions (the X — "Readiness")

The LLM scores each driver 0–5 against a behaviorally anchored scale. One LLM call per driver. The scale lives in the system prompt for that driver's role file. D5 is the outcome and is computed in code from §3.5.2 — it is **not** LLM-judged.

| ID | Dimension | Weight | Notes |
|---|---|---|---|
| D1 | Entity Clarity & Consistency | 0.15 | Founder Credibility lives as a named sub-score inside D1 |
| D2 | Third-Party Corroboration | 0.25 | Corroboration *content* — what third parties say about the subject |
| D3 | Machine-Readability & Structure | 0.15 | Includes canonical exact-term presence and above-the-fold differentiation sub-criterion |
| D4 | Differentiation from Consensus | 0.30 | Methodology Depth lives as a named sub-score inside D4 |
| D6 | Platform-Native Fit | 0.15 | Platform *channel* presence — credible profile/presence on the platforms themselves |

Weights sum to 1.00. They reflect the evidence base assembled in `AVI_LITERATURE_CROSSMAP.md`: D4 carries the highest weight because it has the strongest two-source evidence (US20200349181A1 patent mechanism + Aggarwal 2024 measured +30–40%). D2 rises to 0.25 because third-party platforms are the *primary* citation surface across engines (Article 4 evidence stack). D1 settles to 0.15 — it is a precondition with indirect evidence rather than measured leverage. Weights remain starting hypotheses, calibratable against a held-out subject set. Any change bumps `AVI_RUBRIC_VERSION`.

**D2 vs D6 boundary.** These are distinct:
- D2 = corroboration *content* (third parties saying things about the subject — reviews, mentions, citations)
- D6 = platform *channel* presence (the subject's own profile/presence on the platforms themselves)

A subject with a LinkedIn page but no engagement scores D6 partial, D2 zero. A subject discussed on Reddit without an official account scores D2, D6 partial.

**D6 engine-platform mapping (anchors the D6 scale).** The three engines audited are ChatGPT, Claude (Anthropic), and Perplexity. Each favors different platforms:

| Engine | Favored platforms (cited as primary sources) |
|---|---|
| **ChatGPT** | Wikipedia, Forbes, G2, Reuters, established news (authoritative/encyclopedic) |
| **Claude (Anthropic)** | Academic and government sources, vendor-neutral analyst coverage (Gartner-style), niche SaaS/practitioner blogs, technical documentation |
| **Perplexity** | Reddit, YouTube, Gartner, Yelp, TripAdvisor (community-heavy) |

D6's score = presence on the platforms that feed the buyer's most likely engines.

**D3 above-the-fold sub-criterion.** ChatGPT cites from the first third of source content ~44% of the time (ALM Corp). D3 caps at band 3 if the page's distinctive content (D4 evidence pointers) appears below the first third of the page.

### 3.5.2 The four outcome sub-metrics (the Y — "Visibility")

Computed in code from the extracted fields in `audit_query_responses`. No LLM call.

```
Presence       = (responses where mentioned)       ÷ (total responses)
Citation       = (responses where cited_with_link) ÷ (total responses)
Share-of-Voice = (responses where mentioned)       ÷ (responses where mentioned OR any competitor mentioned)
Prominence     = average position score, where
                 top = 1.0, middle = 0.5, late = 0.25, not_named = 0.0
```

All four are in `[0.0, 1.0]`.

### 3.5.3 Visibility composite

```
Visibility = 0.20 × Presence
           + 0.30 × Citation
           + 0.30 × Share-of-Voice
           + 0.20 × Prominence
```

Result in `[0.0, 1.0]`. Written to `audits.visibility_score`.

### 3.5.4 Readiness composite

```
Readiness = ( Σ (driver_score × weight) ÷ 5 )
```

Sum the five weighted driver scores (weights from §3.5.1, summing to 1.0), then divide by 5 to normalize the 0–5 anchored scale to `[0.0, 1.0]`.

### 3.5.5 The headline composite

```
Composite = 0.40 × Readiness + 0.60 × Visibility
```

The 60/40 weighting reflects D002's stance: drivers are leading indicators; the outcome is what buyers actually pay for.

### 3.5.6 Tier bands

| Composite | Tier |
|---|---|
| `< 0.20` | Invisible |
| `0.20 – 0.40` | Overlooked |
| `0.40 – 0.60` | Emerging |
| `0.60 – 0.80` | Discoverable |
| `≥ 0.80` | Agent-Ready |

Calibratable — once 30+ subjects are scored, revisit the cutoffs. Any change bumps `AVI_RUBRIC_VERSION`.

---

## 4. The refusal catalog — bright lines the LLM cannot cross

These are non-negotiable. If the model violates one, the call is rejected and re-run with a stronger refusal instruction; if it violates again, the field returns `null` and the gap is surfaced in the report.

1. **Never invent a citation, URL, quote, source, or fact not present in the supplied evidence.**
2. **Never score a dimension when the evidence is insufficient.** Return `"insufficient_evidence"` instead.
3. **Never infer presence from absence.** "I don't see FAQ schema, so it probably exists somewhere" is forbidden. The schema either appeared in the crawler payload or it did not.
4. **Never use prior knowledge about the subject from training.** Knowing that *Marty Koepke is run by Marty Koepke* doesn't count unless that fact is in the supplied evidence package for this call.
5. **Never produce output that doesn't validate against the declared schema.** Extra fields, missing fields, wrong types — all rejected.
6. **Never recommend a fix unsupported by an observed gap.** Recommendations must reference a specific dimension score and a specific evidence pointer.
7. **Never use marketing language or hedged superlatives.** "Best-in-class," "world-class," "industry-leading" are banned. Voice rules from VISION §10 apply to every generated string.

---

## 5. The verification protocol — how Marty proves it's behaving

Trust in the system comes from repeatable checks. Three of them, run on every audit and on every release.

### 5.1 Per-audit spot check

After each scoring run, Marty (or a future reviewer) picks **five claims at random** from the report — three driver justifications and two recommendations — and traces each back to its `evidence_pointer`. If the pointer doesn't support the claim, the audit is marked unreliable and the system prompt for that role is tightened.

### 5.2 Determinism test

A nightly job replays the last 10 logged audits against the same model, same temperature, same prompt, same inputs. Any field that changes is logged to a `nondeterminism.log`. Greater than 5% drift on any judgment field triggers an alert and rolls the rubric back to the last known-stable version.

### 5.3 Cross-judge check

For each audit, a **second model** (different vendor — if the judge is Claude, the cross-judge is GPT-4o, or vice versa) is given the same evidence package and asked to score the same dimensions independently. Disagreements ≥ 2 bands on the 0–5 scale are surfaced in the audit's QA tab. Three such disagreements in a row on the same dimension flag the anchored scale for revision.

---

## 6. Free vs paid — same rules, different scope

The free Readiness Check and the paid Visibility Check obey **every rule above**. They differ only in scope: what is retrieved, what is scored, what is reported.

### 6.1 Free Readiness Check (the X side)

- **What's retrieved:** the subject's own URL (crawler) plus third-party corroboration (Tavily web search **and platform-filtered searches** — `site:reddit.com [SUBJECT]`, `site:linkedin.com [SUBJECT]`, `site:youtube.com [SUBJECT]`, `site:en.wikipedia.org [SUBJECT]`, plus Gartner / G2 for B2B subjects). No live engine queries.
- **What's scored:** the five drivers (D1, D2, D3, D4, D6) and the weighted Readiness composite. **D5 is not scored** — the outcome cannot be measured without live queries.
- **What's reported:** a Readiness tier band, the five driver scores with one-sentence justifications, and 2–3 representative findings.
- **What's not promised:** any number about whether AI engines *actually* mention the subject. The free check is honest about what it cannot see, and says so plainly where D5 would otherwise sit.

### 6.2 Paid Visibility Check (the X and the Y)

- **What's retrieved:** everything in 6.1 *plus* the cross-engine query grid: **4 queries × 3 engines × 1 rep = 12 query calls per audit**. Engines: ChatGPT, Claude, Perplexity. Google/Gemini is excluded (rate-limit issues in prior testing). Query mix follows the 80/10/10 informational/transactional/navigational sampling rule per Aggarwal 2024, applied deterministically by the Query Runner. Single-rep design is acknowledged as a snapshot, not a stable measurement; the methodology page in the report states this plainly.
- **What's scored:** all five drivers *plus* the four Visibility sub-metrics (which produce D5 / Visibility) *plus* the headline composite and tier.
- **What's reported:** the 8–10 page Index Report with composite, tier, driver radar, outcome breakdown, top 5 prioritized recommendations, evidence appendix.
- **Crediting rule:** the report fee credits 100% toward a Sprint if booked within 30 days (per VISION §6).

The rules in §1 through §5 do not relax for the paid version. Higher price does not buy looser standards; it buys more retrieval.

---

## 7. What this means for code organization

One LLM **role** = one file. A role is a bounded job with its own system prompt, its own output schema, its own refusal rules, and its own anchored scale where applicable. Roles are called by the deterministic orchestrator (`lib/avi/orchestrator.ts` or equivalent). Roles do not call each other.

The roles fall out of the pipeline; they are not chosen up front. Based on the current canon, the LLM-bearing roles are:

| Role | Job | Where it lives today |
|---|---|---|
| **Extractor** | Parse each engine response into structured fields (mentioned, cited_with_link, position, competitors_mentioned, sentiment) | `lib/avi/extraction.ts` |
| **Driver Judge** | Score one of the five drivers (D1, D2, D3, D4, D6) on the anchored 0–5 scale against the evidence package. One call per driver per audit. | `lib/avi/scoring.ts` |
| **Recommender** | Generate the prioritized top-N fixes from the scored dimensions and the evidence gaps | `lib/avi/recommendations.ts` |
| **Cross-Judge** *(QA only)* | Independent second-model scoring used only for the verification protocol in §5.3 | not yet built |

The Crawler, Corroborator, Query Runner, Aggregator, and Composite/Tier services are **pure code** — they do not call an LLM and are not roles in this sense. They retrieve, compute, and persist.

When the four role files exist, each one carries at the top:

```
ROLE: <name>
INPUT SCHEMA: <pointer>
OUTPUT SCHEMA: <pointer>
RUBRIC SLICE: <pointer or "n/a">
REFUSAL RULES: §4 of AVI_OPERATING_STANDARD.md
LOGGING: writes to api_calls table; replayability required
```

That header is the contract. It tells the next person — or the next AI — exactly what this role is allowed to do and what it cannot.

---

## 8. What changes when this doc changes

This doc is canon. Changes are tracked.

- A change to §3 (universal rules), §3.5 (math), or §4 (refusal catalog) bumps `AVI_RUBRIC_VERSION` *and* requires the determinism test in §5.2 to be re-baselined.
- A change to §5 (verification) requires a one-paragraph note in `DECISIONS.md` explaining what was loosened or tightened and why.
- A change to §6 (free vs paid scope) requires the corresponding flow doc to be rewritten in the same commit.
- A change to §7 (code organization) requires the affected role file headers to be updated in the same commit.

When this doc and a flow doc disagree, **this doc wins**. The flow doc is wrong and gets corrected.

---

## 9. What this doc does not do

It does not describe the customer journey. It does not specify the database schema in detail. It does not enumerate the query grid. Those live in the flow docs (`AVI_FREE_FLOW.md`, `AVI_INDEX_REPORT.md` — both to be rewritten in the new canon) and in the migration files.

It does not replace `VISION.md`. Vision sets the strategic frame ("aggregator, not assessor" is downstream of "translator, not dashboard"). This doc operationalizes the principle for the pipeline.

It does not replace `DECISIONS.md`. ADRs continue to log architectural choices. This doc consolidates the *current* state into one place; DECISIONS.md preserves the *history* of how the state got here.

---

## 10. Open questions before this is locked

1. **Log a new ADR (D007) for the six-dim choice.** This standard supersedes D002. Before any code change, DECISIONS.md needs a D007 entry stating: chose six-dimension rubric, reason (easier to score and enforce), what was considered (Option 2 seven-dim, rejected), affected files. Once D007 is logged, the v0.1 rubric file is the canonical anchored-scale source; `lib/avi/scoring.ts` and any seven-dim prompt files must be revised to match.
2. **D5 in the free check.** The free check cannot measure the outcome. Should the free report still show a D5 row labeled "not measured — paid only," or should it omit D5 entirely from the driver radar? (Lean: show it, labeled, as an honestly stated upsell hook.)
3. **Cross-judge cost.** The verification protocol in §5.3 roughly doubles scoring spend on QA runs. Is that on every audit, or every Nth audit? Default proposal: every 10th audit, plus any audit flagged manually for review.
4. **Failure-mode reporting.** When the schema-validation retry fails and a field returns `null`, where does that surface in the customer-facing PDF? Inside the report ("insufficient public evidence to score D6") or hidden in an appendix?
