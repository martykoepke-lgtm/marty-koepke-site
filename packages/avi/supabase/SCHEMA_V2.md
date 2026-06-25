# Supabase schema for AVI v0.2

**Status:** Design v1.0 — ready for migration `0011_avi_v2_schema.sql`.
**Scope:** Tables, columns, indexes, RLS policies, and views needed to persist the v0.2 pipeline's outputs.
**Out of scope:** Legacy v1 tables (`audits`, `audit_query_responses`, `audit_dimension_scores`, `audit_recommendations`) — those stay intact to keep the public `/scan` flow working. They will be deprecated when /scan is rebuilt against v0.2.
**Canon authority:** `AVI_OPERATING_STANDARD.md`. When this schema disagrees with canon, canon wins.

---

## 1. Design principles

Four invariants the schema enforces:

1. **Rubric version is stamped on every row that contains a judgment or computed score.** Calibration depends on it; old audits stay valid against their own version.
2. **Subject metadata is snapshotted at audit time.** Edits to a subject record after the audit do not silently change historical scores.
3. **Every LLM call is logged in `api_calls` with an `audit_id` column** so the ops monitor sees every cent of v0.2 spend.
4. **RLS is enabled on every new table with a service-role-only policy.** Customers never query Supabase directly; the `/api/*` layer uses the service role with explicit scoping. The RLS policy is defense-in-depth, not the primary access control.

## 2. New tables

Ten new tables. None collide with v1 names.

| Table | Purpose | Row count per audit |
|---|---|---|
| `subjects` | Customer's audit targets | Independent of audits |
| `audit_subjects_snapshot` | Point-in-time copy of subject metadata at audit start | 1 per audit |
| `audits_v2` | Audit run record with computed scores | 1 per audit |
| `audit_crawler_evidence` | Crawler output incl. scent fields | 1 per audit |
| `audit_corroboration` | Tavily search results, one row per result | 30–50 per audit |
| `audit_engine_responses` | Raw engine response per query × engine | 16 per V2 paid audit; 32 per V3 paid audit |
| `audit_extracted` | Extractor output per engine response | 12 per paid audit |
| `audit_visibility_outcomes` | Aggregated sub-metrics | 1 per paid audit |
| `audit_driver_scores` | 5 dimension scores | 5 per audit |
| `audit_cross_judge_scores` | Independent second-vendor scoring (when wired) | 0 or 5 per audit |
| `audit_v2_recommendations` | Recommender output | 1 per audit |

Plus one new column on the existing `api_calls` table (`audit_id`) and one view (`v_audit_progress`).

## 3. Table-by-table specification

### `subjects`

Customer's audit targets. One customer can have multiple subjects. Subject edits after an audit do **not** affect historical audit data because of the snapshot table below.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `customer_id` | UUID → `customers(id)` ON DELETE CASCADE | NULL allowed for internal/CLI use |
| `canonical_name` | text NOT NULL | |
| `aliases` | text[] NOT NULL DEFAULT '{}' | |
| `industry` | text NOT NULL | Used for D6 + extractor scent |
| `subject_type` | text NOT NULL | CHECK in ('company','personal_brand') |
| `url` | text NOT NULL | |
| `location` | text | |
| `buyer_type` | text | |
| `problem` | text | |
| `competitors` | jsonb NOT NULL DEFAULT '[]' | `[{canonical_name, aliases}]` |
| `known_differentiation_terms` | text[] NOT NULL DEFAULT '{}' | Used for extractor `differentiation_named` scent check |
| `created_at` | timestamptz NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz NOT NULL DEFAULT now() | |

**Indexes:** `(customer_id)`, `(url)` for dedup.

### `audit_subjects_snapshot`

Frozen copy of subject metadata at audit start. Read by the report renderer and the methodology page.

Same columns as `subjects` minus `created_at`/`updated_at`, plus `audit_id` as primary key.

### `audits_v2`

Audit run record. The denormalized composite/readiness/visibility scores live here for fast reporting queries.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `subject_id` | UUID → `subjects(id)` ON DELETE CASCADE | |
| `customer_id` | UUID → `customers(id)` ON DELETE CASCADE | NULL allowed for CLI runs |
| `mode` | text NOT NULL CHECK in ('free','paid') | |
| `rubric_version` | text NOT NULL | e.g., 'v0.2' |
| `status` | text NOT NULL CHECK in ('in_progress','complete','failed','incomplete_protocol') | |
| `started_at` | timestamptz NOT NULL DEFAULT now() | |
| `completed_at` | timestamptz | |
| `composite_score` | numeric(5,2) | 0–100 |
| `readiness_score` | numeric(5,2) | 0–100 |
| `visibility_score` | numeric(5,2) | 0–100; NULL for free audits |
| `tier` | text | CHECK in tier band enum |
| `query_count` | int NOT NULL | snapshot of protocol |
| `engine_count` | int NOT NULL | |
| `reps_per_pair` | int NOT NULL | |
| `query_mix` | jsonb NOT NULL | `{informational, transactional, navigational}` |
| `engines_used` | text[] NOT NULL | `['chatgpt','claude','perplexity','gemini']` |
| `total_cost_usd` | numeric(8,4) | aggregated from api_calls |
| `errors` | jsonb NOT NULL DEFAULT '[]' | |

**Indexes:** `(subject_id, started_at DESC)` for history queries; `(customer_id, started_at DESC)` for customer dashboard.

### `audit_crawler_evidence`

Crawler output including the new metadata-scent fields. One row per audit.

| Column | Type | Notes |
|---|---|---|
| `audit_id` | UUID PK → `audits_v2(id)` ON DELETE CASCADE | |
| `url` | text NOT NULL | |
| `fetched_at` | timestamptz NOT NULL | |
| `status` | int NOT NULL | |
| `title` | text | |
| `meta_description` | text | |
| `h1` | text[] NOT NULL DEFAULT '{}' | |
| `schema_blocks` | jsonb NOT NULL DEFAULT '[]' | |
| `same_as_links` | text[] NOT NULL DEFAULT '{}' | |
| `has_faq_schema` | boolean NOT NULL DEFAULT false | |
| `has_person_schema` | boolean NOT NULL DEFAULT false | |
| `has_organization_schema` | boolean NOT NULL DEFAULT false | |
| `raw_text_sample` | text | first ~2000 chars |
| `word_count` | int NOT NULL DEFAULT 0 | |
| `keyword_stuffing_detected` | boolean NOT NULL DEFAULT false | D3 hard cap trigger |
| `differentiation_above_fold` | boolean NOT NULL DEFAULT false | D3 hard cap trigger |
| **`meta_description_chars`** | int NOT NULL DEFAULT 0 | D3 scent cap trigger |
| **`meta_description_has_action_verb`** | boolean NOT NULL DEFAULT false | D3 scent cap trigger |
| **`meta_description_names_category`** | boolean NOT NULL DEFAULT false | D3 scent cap trigger |
| **`og_description_present`** | boolean NOT NULL DEFAULT false | |
| **`title_has_descriptor`** | boolean NOT NULL DEFAULT false | |

### `audit_corroboration`

Tavily search results, one row per result returned. Many rows per audit.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `audit_id` | UUID → `audits_v2(id)` ON DELETE CASCADE | |
| `platform` | text NOT NULL | 'general' OR enum: reddit/linkedin/youtube/wikipedia/quora/yelp/g2/gartner |
| `result_index` | int NOT NULL | ordering within platform |
| `title` | text | |
| `url` | text | |
| `snippet` | text | |

**Indexes:** `(audit_id, platform, result_index)`.

### `audit_engine_responses`

Raw engine response per query × engine combo. 16 rows per V2 paid audit (4 queries × 4 engines) or 32 rows per V3 paid audit (8 queries × 4 engines).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `audit_id` | UUID → `audits_v2(id)` ON DELETE CASCADE | |
| `template_id` | text NOT NULL | links to /queries/*.md by template ID |
| `query` | text NOT NULL | after placeholder substitution |
| `intent` | text NOT NULL | 'informational' / 'transactional' / 'navigational' |
| `intent_subtype` | text | NULL unless informational; 'factual' / 'instrumental' / 'exploratory' |
| `engine` | text NOT NULL | 'chatgpt' / 'claude' / 'perplexity' / 'gemini' |
| `raw_response` | text NOT NULL | engine response verbatim |
| `captured_at` | timestamptz NOT NULL | |
| `error` | text | populated if engine call failed |

**Indexes:** `(audit_id, engine)`; `(audit_id, intent, intent_subtype)` for subtype-aware aggregation.

### `audit_extracted`

Extractor output per engine response including the new scent fields. PK is `engine_response_id` (1:1 with `audit_engine_responses`).

| Column | Type | Notes |
|---|---|---|
| `engine_response_id` | UUID PK → `audit_engine_responses(id)` ON DELETE CASCADE | |
| `audit_id` | UUID → `audits_v2(id)` ON DELETE CASCADE | denormalized for query speed |
| `mentioned` | boolean NOT NULL | |
| `cited_with_link` | boolean NOT NULL | |
| `cited_urls` | text[] NOT NULL DEFAULT '{}' | |
| `cited_urls_verified` | text[] NOT NULL DEFAULT '{}' | populated after citation verification |
| `position` | text NOT NULL | CHECK in ('top','middle','late','not_named') |
| `competitors_mentioned` | text[] NOT NULL DEFAULT '{}' | |
| `sentiment` | text NOT NULL | CHECK in ('positive','neutral','negative','missing') |
| `evidence_pointers` | jsonb NOT NULL DEFAULT '[]' | |
| **`scent_subject_in_opening`** | boolean | NULL when mentioned=false |
| **`scent_description_present`** | boolean | NULL when mentioned=false |
| **`scent_description_word_count`** | int | NULL when mentioned=false |
| **`scent_category_named`** | boolean | NULL when mentioned=false |
| **`scent_differentiation_named`** | boolean | NULL when mentioned=false |

**Indexes:** `(audit_id, mentioned)` for quick "where was the subject mentioned" queries.

### `audit_visibility_outcomes`

Aggregated sub-metrics, one row per paid audit. Populated after the Aggregator runs.

| Column | Type | Notes |
|---|---|---|
| `audit_id` | UUID PK → `audits_v2(id)` ON DELETE CASCADE | |
| `presence` | numeric(5,4) NOT NULL | 0–1 |
| `citation` | numeric(5,4) NOT NULL | 0–1 |
| `share_of_voice` | numeric(5,4) NOT NULL | 0–1 |
| `prominence` | numeric(5,4) NOT NULL | 0–1 |
| `composite` | numeric(5,4) NOT NULL | 0–1; weighted blend |

### `audit_driver_scores`

5 rows per audit, one per driver dimension. Note the cap_triggered field — when a hard cap fires (keyword stuffing, below-fold differentiation, metadata scent), the trigger is recorded so customer reports can explain *why* a band was capped.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `audit_id` | UUID → `audits_v2(id)` ON DELETE CASCADE | |
| `dimension_id` | text NOT NULL CHECK in ('D1','D2','D3','D4','D6') | |
| `rubric_version` | text NOT NULL | |
| `band_value` | int CHECK band_value BETWEEN 0 AND 5 | NULL if insufficient evidence |
| `band_insufficient` | boolean NOT NULL DEFAULT false | true when band is `insufficient_evidence` |
| `weight` | numeric(3,2) NOT NULL | weight applied for this dim under this rubric version |
| `justification` | text | LLM-produced; ≤3 sentences |
| `evidence_pointers` | jsonb NOT NULL DEFAULT '[]' | |
| `sub_score_observations` | jsonb NOT NULL DEFAULT '[]' | D1 Founder Credibility / D4 Methodology Depth |
| `cap_triggered` | text | 'keyword_stuffing' / 'below_fold' / 'metadata_scent' / NULL |
| `judged_at` | timestamptz NOT NULL | |
| `judge_model` | text NOT NULL | e.g., 'claude-sonnet-4-5' |

**Unique constraint:** `(audit_id, dimension_id)`.

### `audit_cross_judge_scores`

Independent second-vendor scoring. 0 rows when not run, 5 rows when run.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `audit_id` | UUID → `audits_v2(id)` ON DELETE CASCADE | |
| `dimension_id` | text NOT NULL CHECK in ('D1','D2','D3','D4','D6') | |
| `primary_band` | int | snapshotted from `audit_driver_scores` |
| `cross_band` | int | |
| `agreement` | text NOT NULL CHECK in ('match','off_by_one','disagree') | |
| `cross_judge_vendor` | text NOT NULL | 'openai' or 'anthropic' |
| `judged_at` | timestamptz NOT NULL | |

**Unique constraint:** `(audit_id, dimension_id)`.

### `audit_v2_recommendations`

Recommender output. Suffix `_v2` because `audit_recommendations` already exists for v1.

| Column | Type | Notes |
|---|---|---|
| `audit_id` | UUID PK → `audits_v2(id)` ON DELETE CASCADE | |
| `rubric_version` | text NOT NULL | |
| `differentiation_candidates_observed` | jsonb NOT NULL DEFAULT '[]' | |
| `differentiation_candidates_suggested` | jsonb NOT NULL DEFAULT '[]' | |
| `fixes` | jsonb NOT NULL DEFAULT '[]' | top 2 or 3 |
| `rank_aware_note` | text | populated when rank-aware refusals were triggered |
| `generated_at` | timestamptz NOT NULL | |
| `recommender_model` | text NOT NULL | |

## 4. Existing table extension

### `api_calls` — add `audit_id` column

Add one nullable column so the ops monitor can break down v0.2 spend per audit:

```sql
ALTER TABLE public.api_calls
  ADD COLUMN IF NOT EXISTS audit_id UUID
    REFERENCES public.audits_v2(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_api_calls_audit_id
  ON public.api_calls(audit_id);
```

`submission_id` (existing column) stays for the v1 /scan flow. v0.2 LLM calls populate `audit_id` instead.

## 5. RLS — service-role-only for every new table

Follow the existing pattern from migration 0001: enable RLS, no SELECT/INSERT/UPDATE/DELETE policies for `anon` or `authenticated`. Service role bypasses RLS by virtue of its role.

For tables that may eventually be customer-readable (e.g., the customer's own audit results via a magic link), add policies in a later migration when that surface exists. Today: lock everything down.

## 6. View: `v_audit_progress`

Tracks composite score deltas per subject over time. Used for the "your progress since last audit" panel in re-measure reports.

```sql
CREATE VIEW v_audit_progress AS
SELECT
  a.subject_id,
  a.id AS audit_id,
  a.started_at,
  a.composite_score,
  a.readiness_score,
  a.visibility_score,
  a.tier,
  LAG(a.composite_score) OVER w AS prior_composite,
  a.composite_score - LAG(a.composite_score) OVER w AS composite_delta,
  LAG(a.started_at) OVER w AS prior_audit_at
FROM audits_v2 a
WHERE a.status = 'complete'
WINDOW w AS (PARTITION BY a.subject_id ORDER BY a.started_at);
```

## 7. Things deliberately NOT in the database

- **Query templates.** They live in `/queries/*.md` under version control. The Query Runner reads them at audit time. The audit captures the resulting `template_id` and `query` in `audit_engine_responses` — that's enough provenance.
- **Rubric anchored scales.** They live in `public/AI-Visibility-Index-Rubric-and-Protocol.md`. The audit captures `rubric_version`.
- **Agent role files / system prompts.** They live in `/agents/*.md`. The audit captures `judge_model` and `recommender_model`. Replayability comes from version control on the role files plus the rubric file plus the captured inputs.
- **Engine-platform mapping.** Lives in the rubric file. Same logic.

These are *configuration*. They belong in source control with diffable history, not in the database.

## 8. Migration ordering

`0011_avi_v2_schema.sql` creates everything in this order to satisfy FK constraints:

1. `subjects` (depends on existing `customers` if present, else customer_id is NULL)
2. `audits_v2` (depends on `subjects` and `customers`)
3. `audit_subjects_snapshot` (depends on `audits_v2`)
4. `audit_crawler_evidence` (depends on `audits_v2`)
5. `audit_corroboration` (depends on `audits_v2`)
6. `audit_engine_responses` (depends on `audits_v2`)
7. `audit_extracted` (depends on `audit_engine_responses` and `audits_v2`)
8. `audit_visibility_outcomes` (depends on `audits_v2`)
9. `audit_driver_scores` (depends on `audits_v2`)
10. `audit_cross_judge_scores` (depends on `audits_v2`)
11. `audit_v2_recommendations` (depends on `audits_v2`)
12. ALTER `api_calls` ADD COLUMN `audit_id`
13. CREATE VIEW `v_audit_progress`
14. Indexes
15. RLS enable + policies on every new table

## 9. Honest open questions

1. **`customers` table.** Existing migrations reference customers via `submissions.email` but there's no separate `customers` table. We should either (a) create a `customers` table now and link `subjects` to it, or (b) leave `subjects.customer_id` nullable and key off email for v0.2's first phase. Lean: defer customers table until Stripe billing flows are wired; for now subjects can be customer-less.
2. **CLI vs production split.** The CLI runner writes to disk (`audits/*.json`). Once we wire Supabase persistence, the same orchestrator should write to *both* (disk for dev, DB for production) controlled by an env var. Not in this migration; in the orchestrator next pass.
3. **Snapshot vs. live subject metadata.** The snapshot table prevents drift but doubles storage. For 100 subjects with 4 audits each = 400 snapshot rows. Trivial. Lean: keep the snapshot table.
4. **Encrypting raw_response and raw_text_sample at rest.** Both could contain PII or business-sensitive content. Supabase default encryption is at-rest disk-level. Application-level encryption is out of scope for v0.2 launch.
