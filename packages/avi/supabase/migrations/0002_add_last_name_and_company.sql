-- ============================================================================
-- Add last_name + company_name columns to submissions
-- ============================================================================
-- Splits first_name into first_name/last_name and adds company_name. This
-- runs as an additive migration so it works whether the table is empty (our
-- case today) or already has data (future case).
--
-- Order of operations matters for tables that already contain rows:
--   1. Add columns as nullable
--   2. Backfill any existing rows (none in our case)
--   3. Set NOT NULL constraints
-- ============================================================================

alter table public.submissions
  add column if not exists last_name text;

alter table public.submissions
  add column if not exists company_name text;

-- Backfill anything pre-existing with a placeholder so the NOT NULL works.
-- This is a no-op today (the table is empty) but it future-proofs the migration.
update public.submissions
  set last_name = coalesce(last_name, ''),
      company_name = coalesce(company_name, '')
  where last_name is null or company_name is null;

alter table public.submissions
  alter column last_name set not null;

alter table public.submissions
  alter column company_name set not null;
