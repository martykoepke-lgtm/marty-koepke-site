-- Migration: 0007_audit_dimension_scores
--
-- Per-dimension storage for the Readiness side of the rubric. One row per
-- (audit × dimension). Seven rows per audit at Option 2: D1–D6 universal
-- plus D7 subject-adaptive (Founder & Author Signal for personal brands,
-- Methodology & Offer Definition for companies).
--
-- Separated from audits because:
--   * Lets you compare dimension-by-dimension across audits without
--     JSON unpacking.
--   * Stores the judge's justification verbatim so you can audit why a
--     particular score was given.
--   * Survives rubric_version changes — old rows stay queryable under
--     their original rubric_version stamp.
--
-- RLS enabled, no policies. Service-role-only.

create table public.audit_dimension_scores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  audit_id uuid not null references public.audits(id) on delete cascade,

  -- Stable identifier — 'D1' through 'D7'. D7 specifically toggles
  -- per the subject_type recorded on the audit row.
  dimension_id text not null,
  constraint audit_dimension_scores_dimension_check check (
    dimension_id in ('D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7')
  ),

  -- Denormalized human-readable name so reports don't need to look up
  -- the rubric source on every render. e.g. 'Entity Clarity',
  -- 'Founder & Author Signal'.
  dimension_name text not null,

  -- 0–5 anchored scale. Half-point granularity is OK if a judge wants
  -- to express "between 3 and 4."
  score numeric(3, 1) not null,
  constraint audit_dimension_scores_score_range
    check (score >= 0 and score <= 5),

  -- The judge's prose explanation of WHY this score, in 1–3 sentences.
  -- This is what you read when reviewing a finding ("D6 scored 2/5 because
  -- the subject is linked from only one industry directory and zero
  -- press mentions in the last 12 months").
  justification text,

  -- Optional structured pointers to specific evidence — typically url
  -- + quote snippets the judge used. Stored as jsonb because the shape
  -- evolves with the rubric.
  evidence_pointers jsonb,

  -- Which LLM produced this score (for replay + drift analysis).
  judge_model text,

  -- Per-judge-call cost bookkeeping.
  judge_tokens_input int,
  judge_tokens_output int,
  judge_cost_usd numeric(10, 6),
  judge_duration_ms int,

  -- Stamp the rubric version so old scores stay interpretable when
  -- prompts evolve. Matches audits.rubric_version.
  rubric_version text not null,

  -- Forbid two scores for the same (audit × dimension) — would mean
  -- a double-judge bug.
  constraint audit_dimension_scores_dim_unique
    unique (audit_id, dimension_id)
);

create index audit_dimension_scores_audit_idx
  on public.audit_dimension_scores (audit_id);

create index audit_dimension_scores_dim_rubric_idx
  on public.audit_dimension_scores (dimension_id, rubric_version);

alter table public.audit_dimension_scores enable row level security;
-- No policies. Service role only.

comment on table public.audit_dimension_scores is
  'One row per (audit × rubric dimension). Stores the judge LLM''s ' ||
  'score, prose justification, evidence pointers, and per-call cost. ' ||
  'Separated from audits so dimension-level analytics work cleanly.';
