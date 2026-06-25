-- Migration: 0013_add_synthesis_to_audits_v2
--
-- Adds a `synthesis` jsonb column on `audits_v2` to store the plain-English
-- narrative summary produced by the Synthesizer LLM role (the headline +
-- 2-3 paragraph executive read written after Recommender).
--
-- Backwards-compatible: column is nullable so historical audits that ran
-- before this migration keep their NULL.
--
-- Shape (kept loose in JSONB so future fields don't need migrations):
--   {
--     "headline": "...",
--     "body": "...",
--     "rubric_version": "v0.2",
--     "generated_at": "2026-06-17T...",
--     "synthesizer_model": "claude-sonnet-4-5"
--   }

alter table public.audits_v2
  add column if not exists synthesis jsonb;

comment on column public.audits_v2.synthesis is
  'Plain-English narrative summary produced by the Synthesizer LLM role. '
  'Aggregator-only — no new facts beyond what the audit''s structured data '
  'contains. See packages/avi/src/synthesize-v2.ts.';
