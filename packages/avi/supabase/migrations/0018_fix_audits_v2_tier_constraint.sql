-- Repair audits_v2 tier constraint for projects that still have the original
-- V2 labels. Free and V3 audits now emit Overlooked/Emerging instead of
-- Hidden/Faintly Visible.

alter table public.audits_v2
  drop constraint if exists audits_v2_tier_check;

update public.audits_v2
  set tier = 'Overlooked'
  where tier = 'Hidden';

update public.audits_v2
  set tier = 'Emerging'
  where tier = 'Faintly Visible';

alter table public.audits_v2
  add constraint audits_v2_tier_check
  check (tier in ('Invisible', 'Overlooked', 'Emerging', 'Discoverable', 'Agent-Ready'));
