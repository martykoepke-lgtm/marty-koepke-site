-- Migration: 0005_extend_for_v2_rubric
--
-- Adds the columns needed to run the v2.0 AVI tool against the existing
-- submissions/audits tables. Per D002 the rubric is Option 2 (7-dimension
-- subject-adaptive); per D001 every audit row gets a rubric_version stamp;
-- per D004 every audit row gets a total LLM cost stamp.
--
-- Backwards-compatible: every new column is nullable so existing rows still
-- read fine. The old archetype column on audits stays for legacy data — we
-- just stop writing to it from new code.
--
-- See ARCHITECTURE / AVI_INDEX_REPORT.md (to be written) for the design.

----------------------------------------------------------------------
-- submissions
----------------------------------------------------------------------

-- Whether this subject is a personal brand (D7 = "Founder & Author Signal")
-- or a company (D7 = "Methodology & Offer Definition"). Detected heuristically
-- from crawler output, or supplied explicitly during testing.
alter table public.submissions
  add column if not exists subject_type text;

alter table public.submissions
  drop constraint if exists submissions_subject_type_check;

alter table public.submissions
  add constraint submissions_subject_type_check
  check (
    subject_type is null
    or subject_type in ('personal_brand', 'company')
  );

----------------------------------------------------------------------
-- audits
----------------------------------------------------------------------

-- Which version of the rubric this audit was scored against. Bumped when
-- the scoring prompts, anchored scales, or dimension set change. Required
-- to interpret historical scores correctly when prompts evolve.
alter table public.audits
  add column if not exists rubric_version text;

-- Denormalized from submissions for fast benchmark queries
-- (e.g. "average D7 score across all personal_brand audits at rubric v2.0").
alter table public.audits
  add column if not exists subject_type text;

alter table public.audits
  drop constraint if exists audits_subject_type_check;

alter table public.audits
  add constraint audits_subject_type_check
  check (
    subject_type is null
    or subject_type in ('personal_brand', 'company')
  );

-- Final headline numbers. Composite = 0.40 * readiness + 0.60 * visibility.
-- All three are 0.0–1.0 normalized so they're comparable across rubric
-- versions even if dimensional weights change.
alter table public.audits
  add column if not exists composite_score numeric(4, 3);

alter table public.audits
  add column if not exists readiness_score numeric(4, 3);

alter table public.audits
  add column if not exists visibility_score numeric(4, 3);

-- Sum of cost_estimated_usd from api_calls scoped to this audit. Set by
-- the pipeline when the audit finishes; lets the weekly summary attribute
-- spend to specific audits.
alter table public.audits
  add column if not exists total_spend_usd numeric(10, 6);

-- Useful indexes for the benchmark queries.
create index if not exists audits_rubric_version_idx
  on public.audits (rubric_version);
create index if not exists audits_subject_type_idx
  on public.audits (subject_type);

comment on column public.audits.rubric_version is
  'Stamp of which rubric prompts/weights this row was scored under. Bump when prompts change.';
comment on column public.audits.composite_score is
  '0.0–1.0. = 0.40 * readiness_score + 0.60 * visibility_score.';
comment on column public.audits.total_spend_usd is
  'Sum of api_calls.cost_estimated_usd attributed to this audit. Filled at audit completion.';
