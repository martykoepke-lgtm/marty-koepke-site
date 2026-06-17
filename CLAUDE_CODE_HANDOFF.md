# Session handoff for Claude Code

**Purpose:** Inventory of every file added or changed in the Cowork session that produced the v0.2 AVI design and scaffold. Each entry says what the file is and why it exists, so a fresh Claude Code session can pick up without re-reading the entire chat.

**Read order:** Top to bottom. Canon → agent specs → query library → code scaffold → CLI → schema. The canon files describe *what* the system does and *why*; the code is the *how*.

**Status legend:**
- 🆕 **NEW** — created this session
- ✏️ **UPDATED** — existed before, modified this session
- 📦 **MOVED** — relocated to `archive/`

---

## 1. Canon — project-level guidance

These set the rules. Code and prompts should conform to them; when canon and code disagree, canon wins.

| File | Status | Purpose |
|---|---|---|
| `AVI_OPERATING_STANDARD.md` | 🆕 | Single source of truth for *what AI is permitted to do* inside the AVI pipeline. The principle ("aggregator not assessor"), the universal rules (temp 0, JSON mode, evidence pointers), the locked scoring math, the refusal catalog, verification protocol, free-vs-paid scope, code-organization implications. Read this first. |
| `AVI_LITERATURE_CROSSMAP.md` | 🆕 | Article-by-article comparison of independent published work against the operating standard. Four articles mapped: Dias (RAG retrieval), Aggarwal et al. (GEO empirical), Google patent US20200349181A1 (Information Gain), and a synthesis of third-party platform sourcing research. Each article gets a concept-by-concept table, gaps to act on, and what to cite. |
| `AVI_FLOW_FREE.md` | 🆕 | Stub for the free Readiness Check flow. Scope reminder, sections to write, open questions. Replaces archived `AVI_FREE_FLOW.md`. |
| `AVI_FLOW_PAID.md` | 🆕 | Stub for the paid Visibility Index flow. Scope reminder, six-section report shape, sections to write. Replaces archived `AVI_INDEX_REPORT.md`. |
| `public/AI-Visibility-Index-Rubric-and-Protocol.md` | ✏️ | Rewritten as **v0.2**. Six dimensions (D1, D2, D3, D4 weighted + D5 outcome + D6) with anchored 0–5 scales, citation footnotes [1]–[14], the D3 metadata-scent sub-criterion, the engine-platform map for D6 (ChatGPT/Claude/Perplexity), and the live-measurement protocol (4 × 3 × 1 = 12 calls). The document customers eventually see when they click "show your work." |

---

## 2. Agent specs — LLM role contracts

Each file is a contract for one LLM-bearing role. Header carries the contract; below it are the system prompt (verbatim), input/output schemas, refusal rules, and golden examples. Code in `lib/avi/*-v2.ts` implements these specs.

| File | Status | Purpose |
|---|---|---|
| `agents/README.md` | 🆕 | The role-file pattern: header contract, system prompt, schemas, refusal cases, golden examples. Explains which services are pure-code (no role file) vs LLM-bearing (role file required). |
| `agents/EXTRACTOR.md` | 🆕 | Parses one engine response into structured fields. Now includes the five **scent guardrails (S1–S5)**: literal observable rules for `subject_in_opening`, `description_present`, `description_word_count`, `category_named`, `differentiation_named`. No "richness" judgment — every rule is a window-of-text check or a literal string match. |
| `agents/DRIVER_JUDGE.md` | 🆕 | Scores one driver dimension on the 0–5 anchored scale. Five LLM calls per audit (D1, D2, D3, D4, D6). Per-dimension scope, hard caps (D3: keyword stuffing → ≤2, below-fold differentiation → ≤3, metadata scent → ≤3). |
| `agents/RECOMMENDER.md` | 🆕 | Produces top 2–3 fixes ranked by impact-per-hour. Patent-derived framing ("what does this subject have that consensus doesn't?"). Eight hard refusals: keyword stuffing, authoritative-tone changes, synonym padding, comprehensiveness pushes, rank-aware refusals for already-visible subjects, no evidence pointer = no fix. |
| `agents/CROSS_JUDGE.md` | 🆕 | Stub. Independent second-vendor scoring for QA-flagged audits. Not yet wired into the pipeline. Add when calibrating against 30+ subjects. |

---

## 3. Query library — what the system asks the engines

Templates parameterized with placeholders. Code (the Query Runner) reads these markdown files at audit time, picks templates by the 80/10/10 sampling rule, substitutes placeholders from subject metadata. No LLM judgment in selection.

| File | Status | Purpose |
|---|---|---|
| `queries/README.md` | 🆕 | Pattern, placeholder vocabulary, sampling rule, refusal rules. Also documents the 25–40% query ambiguity caveat per Alexander et al. and Liu et al. |
| `queries/UNIVERSAL.md` | 🆕 | Templates that work for any subject. Now sub-classified by intent subtype (factual / instrumental / **exploratory**) per Alexander et al. ORCAS-I. Includes three new pure-exploratory templates (`EXPL_01`, `EXPL_02`, `EXPL_03`) covering the 36% exploratory category that was previously unrepresented. |
| `queries/AI-VISIBILITY-SAAS.md` | 🆕 | Templates tuned for the competitor cohort test (Profound, Conductor, BrightEdge, etc.). |

---

## 4. TypeScript scaffold — `lib/avi/`

All new code uses the **`-v2` suffix** to coexist with the existing v1 code that serves the public `/scan` flow. The v2 pipeline is wired end-to-end and TypeScript compiles cleanly. Reuses the existing `llm.ts` provider abstraction, `tavily.ts`, and `logging.ts` — no overwrites of working v1 code.

### Shared

| File | Status | Purpose |
|---|---|---|
| `lib/avi/types.ts` | 🆕 | Shared types, weights, tier cutoffs, AVI_RUBRIC_VERSION constant. Includes `Subject`, `Audit`, `EvidencePackage`, `DriverScore`, `ExtractorOutput` (with `scent` sub-object), `CrawlerEvidence` (with five scent flags), `QueryTemplate` (with `intent_subtype`). |
| `lib/avi/subject-loader.ts` | 🆕 | Reads subject JSON and normalizes both the new v0.2 shape AND the legacy shape used by the existing 60+ subjects in `/subjects/`. Backward compatible. |
| `lib/avi/json-clean.ts` | 🆕 | Strips markdown fences before JSON.parse. Same pattern as the existing `extraction.ts` parser. |

### Pure-code services (no LLM)

| File | Status | Purpose |
|---|---|---|
| `lib/avi/crawler-v2.ts` | 🆕 | Fetches HTML, parses schema/meta/h1, detects keyword stuffing + above-the-fold differentiation. **Computes the five metadata-scent flags deterministically** so the Driver Judge cannot drift on them. Exports `ACTION_VERBS` — the canonical verb list shared with the Extractor. |
| `lib/avi/corroboration-v2.ts` | 🆕 | Wraps the existing `tavily.ts` to run general search + platform-filtered searches for Reddit, LinkedIn, YouTube, Wikipedia, G2, Gartner. Output feeds D2 (Third-Party Corroboration) and D6 (Platform-Native Fit). |
| `lib/avi/queries.ts` | 🆕 | Loads templates from `/queries/*.md`, applies the 80/10/10 sampling rule, substitutes placeholders. Distinct from the existing `query.ts` which serves the v1 pipeline. |
| `lib/avi/engine-clients.ts` | 🆕 | Thin wrapper around `llm.ts` for querying ChatGPT, Claude, Perplexity as **subjects** of measurement. Sends the prepared queries and captures raw responses. |
| `lib/avi/aggregator-v2.ts` | 🆕 | Pure math. Computes Presence, Citation, Share-of-Voice, Prominence + the Visibility composite from the Extractor outputs. |
| `lib/avi/composite-v2.ts` | 🆕 | Pure math. Computes Readiness (weighted driver scores), Composite (0.40 × Readiness + 0.60 × Visibility), and the tier band. Handles `insufficient_evidence` via weight renormalization. |

### LLM-bearing services

| File | Status | Purpose |
|---|---|---|
| `lib/avi/extractor-v2.ts` | 🆕 | LLM call per engine response. Implements EXTRACTOR.md including the **scent guardrails S1–S5**. Verifies cited URLs (fetches, checks subject name presence) so the Citation sub-metric only counts verified citations. |
| `lib/avi/judge-v2.ts` | 🆕 | 5 LLM calls per audit, one per driver. Implements DRIVER_JUDGE.md including the D3 hard caps (keyword stuffing → ≤2, below-fold → ≤3, **metadata scent inadequate → ≤3**). The Judge cites the cap trigger in its justification when a cap fires. |
| `lib/avi/recommender-v2.ts` | 🆕 | 1 LLM call per audit. Implements RECOMMENDER.md including the eight hard refusals and the rank-aware exclusions for already-visible subjects. |

### Orchestration & output

| File | Status | Purpose |
|---|---|---|
| `lib/avi/orchestrator-v2.ts` | 🆕 | The deterministic pipeline. Calls services in order: Crawler → Corroborator → Query Runner → Engine queries → Extractor → URL verification → Aggregator → Driver Judge → Composite + Tier → Recommender. No LLM decides ordering; code does. |
| `lib/avi/render-v2.ts` | 🆕 | HTML report renderer + comparison-table renderer. Calm palette (cream/forest/gold per VISION §10), driver bars, fix cards, **methodology page with explicit limitations list** (cold-query only, exploratory unmeasured, snippet-quality unmeasured, single-rep snapshot, 25–40% query ambiguity). No JSON shown to the customer. |
| `lib/avi/SCAFFOLD-V2.md` | 🆕 | README for the v2 scaffold: file inventory, environment vars needed, smoke-test instructions, comparison-test instructions, known not-production-ready items, architecture invariants. |

---

## 5. CLI runners — `scripts/`

| File | Status | Purpose |
|---|---|---|
| `scripts/audit.mts` | 🆕 | Run an audit on one subject: `npx tsx scripts/audit.mts subjects/<file>.json --mode=paid`. Writes both JSON and HTML to `audits/<uuid>.*`. |
| `scripts/compare.mts` | 🆕 | Run audits across a folder of subject JSON files and produce a side-by-side comparison HTML: `npx tsx scripts/compare.mts subjects/competitors`. Sorted by composite score. |
| `scripts/smoke-crawler.mts` | 🆕 | One-purpose smoke test for the Crawler. Verifies the scaffold runs end-to-end on a single URL. Use this first when debugging connectivity. |

---

## 6. Supabase schema

| File | Status | Purpose |
|---|---|---|
| `supabase/SCHEMA_V2.md` | 🆕 | Design doc for the v0.2 schema. Eleven new tables, one column extension, one view. Rationale, RLS pattern (service-role-only, defense-in-depth), open questions. |
| `supabase/migrations/0011_avi_v2_schema.sql` | 🆕 | Runnable migration. Creates `subjects`, `audits_v2`, `audit_subjects_snapshot`, `audit_crawler_evidence` (with scent flags), `audit_corroboration`, `audit_engine_responses` (with `intent_subtype`), `audit_extracted` (with scent fields), `audit_visibility_outcomes`, `audit_driver_scores` (with `cap_triggered`), `audit_cross_judge_scores`, `audit_v2_recommendations`. Extends `api_calls` with an `audit_id` column. Adds `v_audit_progress` view. RLS enabled on every new table; no policies for anon/authenticated — service role bypasses. **Not yet run.** The orchestrator currently writes JSON to disk; persistence is the next pass after migration. |

---

## 7. Archive — legacy v1 docs moved aside

These were superseded; they remain in the repo as historical reference but are **not safe to use as a build guide.**

| File | Status | Why archived |
|---|---|---|
| `archive/README.md` | 🆕 | Explains what's archived and why. "Do not restore" policy. |
| `archive/AVI_AGENT_DESIGN.md` | 📦 | Explicitly deprecated v1.0 — used the rejected "4 agents + orchestrator" framing. Replaced by `AVI_OPERATING_STANDARD.md` + `agents/*.md`. |
| `archive/AVI_CUSTOMER_FLOW.md` | 📦 | Old v1.0 customer journey with $497 pricing and 8-field form. Replaced by `AVI_FLOW_FREE.md` and `AVI_FLOW_PAID.md`. |
| `archive/AGENTS.md` | 📦 | Duplicate of `CLAUDE.md`. One source of truth retained. |
| `archive/AVI_BUILD_PLAN.md` | 📦 | Tactical sequence pre-operating-standard. Superseded. |
| `archive/AVI_FREE_FLOW.md` | 📦 | Pricing drift acknowledged in its own header. Will be rewritten clean as `AVI_FLOW_FREE.md`. |
| `archive/AVI_INDEX_REPORT.md` | 📦 | Described the seven-service pipeline. The six-dim shift made the architecture description partially out of date. Replaced by `AVI_FLOW_PAID.md`. |

---

## 8. Files NOT touched (still authoritative)

For completeness. These existed before the session and remain canonical:

- `CLAUDE.md` — project context. Should be updated to reflect the new canon (it still references some archived docs by name) but was not touched this session.
- `VISION.md` — strategic north star. Should eventually be cited from the rubric file footnotes; not edited this session.
- `DECISIONS.md` — architectural ADRs. **A new D007 should be logged** before code is changed to reflect the six-dim rubric choice (the operating standard §3.5 banner flags this).
- `AVI_OPS_MONITOR.md` — describes the shipped ops monitor; accurate as-is.
- `AVI_TOOLS.md` — services reference; accurate as-is.
- `lib/avi/llm.ts`, `lib/avi/llm-providers/*`, `lib/avi/tavily.ts`, `lib/avi/logging.ts`, `lib/avi/crawler.ts` (v1), `lib/avi/corroboration.ts` (v1), `lib/avi/extraction.ts` (v1), `lib/avi/scoring.ts` (v1), `lib/avi/recommendations.ts` (v1), `lib/avi/free-scan.ts` — all v1 code; left intact so the public `/scan` flow keeps working.

---

## 9. What's still open (for the next session)

Carrying these forward, in priority order:

1. **Log D007 in DECISIONS.md** to record the six-dim rubric choice. Reverses D002.
2. **Run the smoke test locally** against `subjects/practicalinformatics.json` (the Cowork sandbox couldn't reach external APIs due to network allowlist). Verify the HTML report opens cleanly and the methodology page declares its limits.
3. **Wire Supabase persistence** in the orchestrator. Currently writes JSON to disk; production needs DB writes. Migration `0011` is ready when you are.
4. **Run the competitor comparison** (Profound, Conductor, BrightEdge, Evertune, Otterly, Peec, Semrush, ZipTie, AthenaHQ, Ahrefs Brand Radar + Practical Informatics).
5. **Update CLAUDE.md** so its "Strategic spine" section points at the new canon (operating standard, rubric v0.2, flow docs, agent specs) instead of the archived docs.
6. **Cross-judge wiring** — implement `lib/avi/cross-judge-v2.ts` per `agents/CROSS_JUDGE.md` once 30+ subjects are scored under v0.2.

## 10. Architecture invariants (do not violate)

These are the rules from `AVI_OPERATING_STANDARD.md` that the scaffold encodes. When working on this code:

- No LLM decides what to do next. Code controls order.
- Every LLM call: temperature 0 *in spirit* (the existing adapters hardcode 0.2; this should be configurable but isn't yet — flag if it matters), JSON output, schema-validated.
- "Insufficient evidence" is always a valid answer.
- Every cited URL is verified before counting toward Citation sub-metric.
- D3 hard caps: keyword stuffing → band ≤ 2; differentiation below-fold → band ≤ 3; **metadata scent inadequate → band ≤ 3**.
- Recommender refuses negative-evidence tactics: keyword stuffing, authoritative-tone changes, synonym padding, "more comprehensive."
- Scent fields in the Extractor are observable rules S1–S5, not "richness" judgments.
- RLS enabled on every Supabase table, service-role-only.

When you encounter a case where the pipeline wants to violate one of these, **update the canon first, then the code.**
