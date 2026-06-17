-- ============================================================================
-- AVI v0.2 schema — new tables for the v0.2 pipeline (six-dim rubric).
-- ============================================================================
-- Design doc: supabase/SCHEMA_V2.md
-- Canon: AVI_OPERATING_STANDARD.md
--
-- This migration ADDS tables for the v0.2 pipeline alongside the existing
-- v1 tables (audits, audit_query_responses, audit_dimension_scores,
-- audit_recommendations). Legacy v1 tables remain untouched to keep the
-- public /scan flow working.
--
-- RLS pattern: enabled on every new table, NO policies for anon/authenticated.
-- Service role bypasses RLS. /api/* routes use service role with explicit
-- WHERE-clause scoping. Customers never query Supabase directly.
-- ============================================================================

-- Required extensions
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. subjects — customer's audit targets
-- ----------------------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,  -- references customers(id) when that table exists; nullable for CLI use
  canonical_name text not null,
  aliases text[] not null default '{}',
  industry text not null,
  subject_type text not null check (subject_type in ('company','personal_brand')),
  url text not null,
  location text,
  buyer_type text,
  problem text,
  competitors jsonb not null default '[]',  -- [{canonical_name, aliases}]
  known_differentiation_terms text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subjects_customer_id on public.subjects(customer_id);
create index if not exists idx_subjects_url on public.subjects(url);

alter table public.subjects enable row level security;
-- No policies for anon/authenticated. Service role bypasses RLS.

-- ----------------------------------------------------------------------------
-- 2. audits_v2 — audit run record with computed scores
-- ----------------------------------------------------------------------------
create table if not exists public.audits_v2 (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  customer_id uuid,
  mode text not null check (mode in ('free','paid')),
  rubric_version text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress','complete','failed','incomplete_protocol')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Denormalized scores for fast reporting
  composite_score numeric(5,2),
  readiness_score numeric(5,2),
  visibility_score numeric(5,2),
  tier text check (tier in ('Invisible','Hidden','Faintly Visible','Discoverable','Agent-Ready')),
  -- Protocol snapshot
  query_count int not null,
  engine_count int not null,
  reps_per_pair int not null,
  query_mix jsonb not null,  -- {informational, transactional, navigational}
  engines_used text[] not null,
  -- Cost
  total_cost_usd numeric(8,4),
  -- Errors logged at audit level
  errors jsonb not null default '[]'
);

create index if not exists idx_audits_v2_subject_started
  on public.audits_v2(subject_id, started_at desc);
create index if not exists idx_audits_v2_customer_started
  on public.audits_v2(customer_id, started_at desc);
create index if not exists idx_audits_v2_status
  on public.audits_v2(status);

alter table public.audits_v2 enable row level security;

-- ----------------------------------------------------------------------------
-- 3. audit_subjects_snapshot — frozen subject metadata at audit time
-- ----------------------------------------------------------------------------
-- Edits to subjects after the audit do NOT change historical audit data.
create table if not exists public.audit_subjects_snapshot (
  audit_id uuid primary key references public.audits_v2(id) on delete cascade,
  canonical_name text not null,
  aliases text[] not null,
  industry text not null,
  subject_type text not null,
  url text not null,
  location text,
  buyer_type text,
  problem text,
  competitors jsonb not null,
  known_differentiation_terms text[] not null
);

alter table public.audit_subjects_snapshot enable row level security;

-- ----------------------------------------------------------------------------
-- 4. audit_crawler_evidence — crawler output including scent fields
-- ----------------------------------------------------------------------------
create table if not exists public.audit_crawler_evidence (
  audit_id uuid primary key references public.audits_v2(id) on delete cascade,
  url text not null,
  fetched_at timestamptz not null,
  status int not null,
  title text,
  meta_description text,
  h1 text[] not null default '{}',
  schema_blocks jsonb not null default '[]',
  same_as_links text[] not null default '{}',
  has_faq_schema boolean not null default false,
  has_person_schema boolean not null default false,
  has_organization_schema boolean not null default false,
  raw_text_sample text,
  word_count int not null default 0,
  keyword_stuffing_detected boolean not null default false,
  differentiation_above_fold boolean not null default false,
  -- Scent fields (deterministic, computed by crawler)
  meta_description_chars int not null default 0,
  meta_description_has_action_verb boolean not null default false,
  meta_description_names_category boolean not null default false,
  og_description_present boolean not null default false,
  title_has_descriptor boolean not null default false
);

alter table public.audit_crawler_evidence enable row level security;

-- ----------------------------------------------------------------------------
-- 5. audit_corroboration — Tavily search results, one row per result
-- ----------------------------------------------------------------------------
create table if not exists public.audit_corroboration (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  platform text not null,  -- 'general' or specific platform
  result_index int not null,
  title text,
  url text,
  snippet text
);

create index if not exists idx_audit_corroboration_audit
  on public.audit_corroboration(audit_id, platform, result_index);

alter table public.audit_corroboration enable row level security;

-- ----------------------------------------------------------------------------
-- 6. audit_engine_responses — raw engine responses
-- ----------------------------------------------------------------------------
create table if not exists public.audit_engine_responses (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  template_id text not null,
  query text not null,
  intent text not null check (intent in ('informational','transactional','navigational')),
  intent_subtype text check (intent_subtype in ('factual','instrumental','exploratory')),
  engine text not null check (engine in ('chatgpt','claude','perplexity')),
  raw_response text not null,
  captured_at timestamptz not null,
  error text
);

create index if not exists idx_audit_engine_responses_audit_engine
  on public.audit_engine_responses(audit_id, engine);
create index if not exists idx_audit_engine_responses_intent
  on public.audit_engine_responses(audit_id, intent, intent_subtype);

alter table public.audit_engine_responses enable row level security;

-- ----------------------------------------------------------------------------
-- 7. audit_extracted — extractor output per engine response
-- ----------------------------------------------------------------------------
create table if not exists public.audit_extracted (
  engine_response_id uuid primary key
    references public.audit_engine_responses(id) on delete cascade,
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  mentioned boolean not null,
  cited_with_link boolean not null,
  cited_urls text[] not null default '{}',
  cited_urls_verified text[] not null default '{}',
  position text not null check (position in ('top','middle','late','not_named')),
  competitors_mentioned text[] not null default '{}',
  sentiment text not null check (sentiment in ('positive','neutral','negative','missing')),
  evidence_pointers jsonb not null default '[]',
  -- Scent fields (nullable when mentioned=false)
  scent_subject_in_opening boolean,
  scent_description_present boolean,
  scent_description_word_count int,
  scent_category_named boolean,
  scent_differentiation_named boolean
);

create index if not exists idx_audit_extracted_audit_mentioned
  on public.audit_extracted(audit_id, mentioned);

alter table public.audit_extracted enable row level security;

-- ----------------------------------------------------------------------------
-- 8. audit_visibility_outcomes — aggregated sub-metrics
-- ----------------------------------------------------------------------------
create table if not exists public.audit_visibility_outcomes (
  audit_id uuid primary key references public.audits_v2(id) on delete cascade,
  presence numeric(5,4) not null,
  citation numeric(5,4) not null,
  share_of_voice numeric(5,4) not null,
  prominence numeric(5,4) not null,
  composite numeric(5,4) not null,
  check (presence between 0 and 1),
  check (citation between 0 and 1),
  check (share_of_voice between 0 and 1),
  check (prominence between 0 and 1),
  check (composite between 0 and 1)
);

alter table public.audit_visibility_outcomes enable row level security;

-- ----------------------------------------------------------------------------
-- 9. audit_driver_scores — 5 dimension scores per audit
-- ----------------------------------------------------------------------------
create table if not exists public.audit_driver_scores (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  dimension_id text not null check (dimension_id in ('D1','D2','D3','D4','D6')),
  rubric_version text not null,
  band_value int check (band_value between 0 and 5),
  band_insufficient boolean not null default false,
  weight numeric(3,2) not null,
  justification text,
  evidence_pointers jsonb not null default '[]',
  sub_score_observations jsonb not null default '[]',
  cap_triggered text check (cap_triggered in ('keyword_stuffing','below_fold','metadata_scent')),
  judged_at timestamptz not null,
  judge_model text not null,
  unique (audit_id, dimension_id),
  -- Either band_value is set OR band_insufficient is true, never both
  check ((band_value is not null and band_insufficient = false)
         or (band_value is null and band_insufficient = true))
);

create index if not exists idx_audit_driver_scores_audit
  on public.audit_driver_scores(audit_id);

alter table public.audit_driver_scores enable row level security;

-- ----------------------------------------------------------------------------
-- 10. audit_cross_judge_scores — second-vendor scoring (QA)
-- ----------------------------------------------------------------------------
create table if not exists public.audit_cross_judge_scores (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  dimension_id text not null check (dimension_id in ('D1','D2','D3','D4','D6')),
  primary_band int,
  cross_band int,
  agreement text not null check (agreement in ('match','off_by_one','disagree')),
  cross_judge_vendor text not null,
  judged_at timestamptz not null,
  unique (audit_id, dimension_id)
);

alter table public.audit_cross_judge_scores enable row level security;

-- ----------------------------------------------------------------------------
-- 11. audit_v2_recommendations — Recommender output
-- ----------------------------------------------------------------------------
-- Note: audit_recommendations already exists for v1; this is the v0.2 version.
create table if not exists public.audit_v2_recommendations (
  audit_id uuid primary key references public.audits_v2(id) on delete cascade,
  rubric_version text not null,
  differentiation_candidates_observed jsonb not null default '[]',
  differentiation_candidates_suggested jsonb not null default '[]',
  fixes jsonb not null default '[]',
  rank_aware_note text,
  generated_at timestamptz not null,
  recommender_model text not null
);

alter table public.audit_v2_recommendations enable row level security;

-- ----------------------------------------------------------------------------
-- 12. Extend api_calls — add audit_id linking v0.2 calls
-- ----------------------------------------------------------------------------
-- v1 calls populate submission_id; v0.2 calls populate audit_id.
alter table public.api_calls
  add column if not exists audit_id uuid
    references public.audits_v2(id) on delete set null;

create index if not exists idx_api_calls_audit_id
  on public.api_calls(audit_id);

-- ----------------------------------------------------------------------------
-- 13. View: v_audit_progress — composite-score deltas per subject over time
-- ----------------------------------------------------------------------------
create or replace view public.v_audit_progress as
select
  a.subject_id,
  a.id as audit_id,
  a.started_at,
  a.composite_score,
  a.readiness_score,
  a.visibility_score,
  a.tier,
  lag(a.composite_score) over w as prior_composite,
  a.composite_score - lag(a.composite_score) over w as composite_delta,
  lag(a.started_at) over w as prior_audit_at
from public.audits_v2 a
where a.status = 'complete'
window w as (partition by a.subject_id order by a.started_at);

-- ----------------------------------------------------------------------------
-- 14. Comments — table-level documentation
-- ----------------------------------------------------------------------------
comment on table public.subjects is
  'Customer audit targets. One customer can have many subjects. Subject edits do not affect historical audits because of audit_subjects_snapshot.';
comment on table public.audits_v2 is
  'Audit run record for the v0.2 six-dim pipeline. Denormalized composite/readiness/visibility scores for fast reporting.';
comment on table public.audit_subjects_snapshot is
  'Frozen subject metadata at audit start. Read by the report renderer.';
comment on table public.audit_crawler_evidence is
  'Crawler output including the metadata-scent fields per Pirolli & Card 1999.';
comment on table public.audit_corroboration is
  'Tavily search results — general + platform-filtered (Reddit, LinkedIn, Wikipedia, YouTube, G2, Gartner).';
comment on table public.audit_engine_responses is
  'Raw engine responses, one per query x engine combo. 12 rows per paid audit.';
comment on table public.audit_extracted is
  'Extractor output per engine response. Scent fields are nullable when mentioned=false.';
comment on table public.audit_visibility_outcomes is
  'Aggregated Presence, Citation, Share-of-Voice, Prominence + visibility composite. Computed by Aggregator (pure code).';
comment on table public.audit_driver_scores is
  'Five Driver Judge outputs per audit (D1, D2, D3, D4, D6). cap_triggered records when a D3 hard cap fires.';
comment on table public.audit_cross_judge_scores is
  'Independent second-vendor scoring for QA-flagged audits per operating standard §5.3.';
comment on table public.audit_v2_recommendations is
  'Recommender output for v0.2 audits. Includes patent-derived differentiation candidates plus the top fixes.';
comment on view public.v_audit_progress is
  'Composite-score deltas per subject over time. Used for re-measure reports.';

-- ============================================================================
-- End of migration 0011.
-- ============================================================================
