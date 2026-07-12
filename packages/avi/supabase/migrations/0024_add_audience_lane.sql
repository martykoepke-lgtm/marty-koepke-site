-- Add audience_lane to both submissions (used by free scan) and subjects
-- (used by paid Daizie Assessment). Enables audience-aware master-key
-- checks in the free scan and audience-branched query grids in the audit.
--
-- Values:
--   'local'      = brick-and-mortar / local service — checked against
--                  Google Business Profile / Bing Places / Yelp
--   'online_b2b' = online consultant / coach / agency — checked against
--                  LinkedIn / vertical directory / current-year listicles
--
-- Nullable — legacy rows stay unstamped and the pipeline falls back to
-- 'local' when it can't tell.

alter table public.submissions
  add column if not exists audience_lane text;

alter table public.submissions
  drop constraint if exists submissions_audience_lane_check;

alter table public.submissions
  add constraint submissions_audience_lane_check
  check (audience_lane is null or audience_lane in ('local', 'online_b2b'));

alter table public.subjects
  add column if not exists audience_lane text;

alter table public.subjects
  drop constraint if exists subjects_audience_lane_check;

alter table public.subjects
  add constraint subjects_audience_lane_check
  check (audience_lane is null or audience_lane in ('local', 'online_b2b'));
