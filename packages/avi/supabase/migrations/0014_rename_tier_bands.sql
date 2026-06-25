-- Migration: 0014_rename_tier_bands
--
-- Renames two tier labels in the AI Visibility Index canon so the
-- customer-facing rubric language matches the system's output:
--
--   'Hidden'          → 'Overlooked'
--   'Faintly Visible' → 'Emerging'
--
-- The other three labels (Invisible / Discoverable / Agent-Ready) and
-- the composite cutoffs (<20 / 20-40 / 40-60 / 60-80 / ≥80) are unchanged.
--
-- Sequence:
--   1. Drop the existing CHECK constraint on audits_v2.tier
--   2. Backfill existing rows with the new labels
--   3. Add a new CHECK constraint with the renamed values

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

comment on column public.audits_v2.tier is
  'AI Visibility Index tier band — one of Invisible, Overlooked, Emerging, '
  'Discoverable, Agent-Ready. Cutoffs in packages/avi/src/types.ts::tierFromComposite.';
