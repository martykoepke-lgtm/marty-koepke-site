-- Migration: 0009_audit_recommendations
--
-- Adds a jsonb column on audits to store the Recommendations service
-- output (5-8 plain-English action items grouped by category).
--
-- Backwards-compatible: column is nullable. Old audits keep their NULL.

alter table public.audits
  add column if not exists recommendations jsonb;

comment on column public.audits.recommendations is
  'Plain-English fix recommendations produced after Scoring. Array of objects with title, category, why_it_matters, do_this[], youll_know_it_worked, effort, dimensions_lifted[], estimated_delta, priority. See lib/avi/recommendations.ts.';
