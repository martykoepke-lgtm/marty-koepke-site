-- Retire the `snapshot` audit mode.
--
-- Rationale: `snapshot` was a retired product tier that lingered in the
-- engine + schema as a "2-engine cheaper run" mode. It's no longer offered
-- to customers, and the admin API defaulted to it, which meant admin runs
-- were accidentally underpowered.
--
-- After this migration the allowed modes are:
--   free       — free readiness scan (no live AI)
--   paid       — legacy V2 label kept for back-compat with existing rows;
--                v3 orchestrator writes 'paid' via a compat shim
--   audit      — paid Daizie AI Visibility Assessment
--   monitoring — recurring monthly rerun
--
-- Existing rows with mode='snapshot' (if any) are relabeled to 'audit'
-- since that's how snapshot-mode runs were sold internally.

update public.audits_v2
   set mode = 'audit'
 where mode = 'snapshot';

alter table public.audits_v2
  drop constraint if exists audits_v2_mode_check;

alter table public.audits_v2
  add constraint audits_v2_mode_check
  check (mode in ('free', 'paid', 'audit', 'monitoring'));
