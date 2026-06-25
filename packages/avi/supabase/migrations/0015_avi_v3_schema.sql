-- AVI V3 schema additions
-- Purpose: support AI Business Accuracy measurement without rewriting V2 history.

create table if not exists public.audit_source_evidence (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  url text not null,
  source_type text not null check (
    source_type in (
      'owned_site',
      'google_business_profile',
      'directory',
      'review',
      'article',
      'profile',
      'podcast',
      'social',
      'official_registry',
      'other'
    )
  ),
  fetched_at timestamptz not null default now(),
  fetch_status integer,
  title text,
  excerpt text,
  mentions_subject boolean,
  content_hash text,
  created_at timestamptz not null default now()
);

alter table public.audits_v2
  drop constraint if exists audits_v2_mode_check;

alter table public.audits_v2
  add constraint audits_v2_mode_check
  check (mode in ('free', 'paid', 'snapshot', 'audit', 'monitoring'));

alter table public.audit_driver_scores
  drop constraint if exists audit_driver_scores_dimension_id_check;

alter table public.audit_driver_scores
  alter column weight drop not null;

alter table public.audit_driver_scores
  add constraint audit_driver_scores_dimension_id_check
  check (
    dimension_id in (
      'D1',
      'D2',
      'D3',
      'D4',
      'D6',
      'business_clarity',
      'source_support',
      'ai_readability',
      'distinctive_point_of_view',
      'recommendation_fit'
    )
  );

create index if not exists idx_audit_source_evidence_audit_id
  on public.audit_source_evidence(audit_id);

create index if not exists idx_audit_source_evidence_url
  on public.audit_source_evidence(url);

create table if not exists public.audit_claims (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  engine_response_id uuid references public.audit_engine_responses(id) on delete set null,
  claim_text text not null,
  claim_type text not null check (
    claim_type in (
      'identity',
      'category',
      'service',
      'location',
      'audience',
      'credential',
      'pricing',
      'comparison',
      'recommendation',
      'other'
    )
  ),
  subject_name text,
  source_response_excerpt text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_claims_audit_id
  on public.audit_claims(audit_id);

create index if not exists idx_audit_claims_engine_response_id
  on public.audit_claims(engine_response_id);

create table if not exists public.audit_claim_verifications (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.audit_claims(id) on delete cascade,
  source_evidence_id uuid references public.audit_source_evidence(id) on delete set null,
  label text not null check (
    label in (
      'supported_by_owned_source',
      'supported_by_independent_source',
      'supported_by_multiple_sources',
      'ai_misrepresentation',
      'unsupported',
      'contradicted',
      'stale',
      'ambiguous',
      'not_verifiable'
    )
  ),
  source_url text,
  source_type text,
  evidence_quote text,
  rationale text not null,
  verifier text not null check (verifier in ('code', 'llm', 'human')),
  verifier_model text,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_claim_verifications_claim_id
  on public.audit_claim_verifications(claim_id);

create table if not exists public.audit_prompt_variants (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  query_group_id text not null,
  prompt_variant_id text not null,
  query_text text not null,
  intent text,
  engine text,
  rep_index integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_prompt_variants_audit_id
  on public.audit_prompt_variants(audit_id);

create table if not exists public.audit_outcome_scores (
  audit_id uuid primary key references public.audits_v2(id) on delete cascade,
  visibility numeric(5,4) not null default 0 check (visibility >= 0 and visibility <= 1),
  representation_accuracy numeric(5,4) not null default 0 check (representation_accuracy >= 0 and representation_accuracy <= 1),
  claim_support numeric(5,4) not null default 0 check (claim_support >= 0 and claim_support <= 1),
  context_preservation numeric(5,4) not null default 0 check (context_preservation >= 0 and context_preservation <= 1),
  recommendation_quality numeric(5,4) not null default 0 check (recommendation_quality >= 0 and recommendation_quality <= 1),
  stability numeric(5,4) not null default 0 check (stability >= 0 and stability <= 1),
  ai_visibility_score numeric(5,2) not null default 0 check (ai_visibility_score >= 0 and ai_visibility_score <= 100),
  ai_readiness_score numeric(5,2) not null default 0 check (ai_readiness_score >= 0 and ai_readiness_score <= 100),
  ai_business_accuracy_score numeric(5,2) not null default 0 check (ai_business_accuracy_score >= 0 and ai_business_accuracy_score <= 100),
  ai_business_accuracy_index numeric(5,2) not null default 0 check (ai_business_accuracy_index >= 0 and ai_business_accuracy_index <= 100),
  tier text check (tier in ('Invisible', 'Overlooked', 'Emerging', 'Discoverable', 'Agent-Ready')),
  rubric_version text not null default 'v3.0',
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_stability_runs (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  run_group text not null,
  prompt_variation_count integer not null default 0,
  engine_count integer not null default 0,
  repetition_count integer not null default 0,
  visibility_variance numeric(8,6),
  accuracy_variance numeric(8,6),
  stability_score numeric(5,4) check (stability_score is null or (stability_score >= 0 and stability_score <= 1)),
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_stability_runs_audit_id
  on public.audit_stability_runs(audit_id);

alter table public.audit_engine_responses
  add column if not exists query_group_id text,
  add column if not exists prompt_variant_id text,
  add column if not exists rep_index integer not null default 1;
