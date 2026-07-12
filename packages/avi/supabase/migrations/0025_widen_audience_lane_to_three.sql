-- Widen the audience_lane taxonomy from two lanes to three.
--
-- Previous (migration 0024): 'local' | 'online_b2b'
-- Current:                   'local' | 'services' | 'product'
--
-- The 'online_b2b' bucket collapsed coaches and SaaS founders together,
-- which produced the wrong master-key set for product businesses (G2 /
-- Capterra / SaaS directories / comparison articles) versus services
-- businesses (LinkedIn / vertical directory / listicles). Marty's
-- three-playbook framework — local/opinion, services/advice,
-- product/comparison — is the correct decomposition and is documented
-- in the AI-Visibility-Learning-and-Citation-Reference.md new §4.5.
--
-- Migration steps:
--   1. Drop the old two-value check constraint on both tables.
--   2. Backfill: every existing 'online_b2b' row becomes 'services'.
--      Safest default — most legacy scans were coaches/consultants
--      rather than SaaS founders, and 'services' fails less badly for
--      an actual SaaS founder than 'product' fails for a coach.
--   3. Add the new three-value check constraint on both tables.
--
-- Legacy rows stay reproducible: the rubric weights, driver definitions,
-- and scoring output are lane-agnostic. The lane only decides which
-- master keys get checked and which paid-audit queries get run. A
-- backfilled row's stored scoring_output is unchanged; only future
-- runs against that submission would use the new lane.

alter table public.submissions
  drop constraint if exists submissions_audience_lane_check;

alter table public.subjects
  drop constraint if exists subjects_audience_lane_check;

update public.submissions
  set audience_lane = 'services'
  where audience_lane = 'online_b2b';

update public.subjects
  set audience_lane = 'services'
  where audience_lane = 'online_b2b';

alter table public.submissions
  add constraint submissions_audience_lane_check
  check (audience_lane is null or audience_lane in ('local', 'services', 'product'));

alter table public.subjects
  add constraint subjects_audience_lane_check
  check (audience_lane is null or audience_lane in ('local', 'services', 'product'));
