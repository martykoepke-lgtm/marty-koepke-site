-- Migration: 0022_audit_competitor_readiness
--
-- Adds the audit_competitor_readiness table for the lightweight per-competitor
-- readiness pass introduced in v3.1. For each competitor a customer names at
-- intake, the orchestrator crawls their public site, runs the 5-driver
-- readiness extraction on them, and stores the result here so the Readiness ×
-- Visibility quadrant can plot competitor dots honestly.
--
-- Service-role-only access, matching the rest of the V3 schema per
-- AVI_OPERATING_STANDARD.md. RLS is enabled in the same migration that creates
-- the table, with explicit deny-all RESTRICTIVE policies for anon and
-- authenticated roles (matching migration 0021's posture).

create table public.audit_competitor_readiness (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits_v2(id) on delete cascade,
  competitor_canonical_name text not null,
  competitor_url text not null,
  readiness_score numeric, -- 0-100, null when the crawl failed or yielded insufficient evidence
  driver_scores jsonb not null default '[]'::jsonb, -- array of { driver_id, score, band, justification }
  errors jsonb not null default '[]'::jsonb,
  crawled_at timestamptz,
  created_at timestamptz not null default now()
);

create index audit_competitor_readiness_audit_id_idx
  on public.audit_competitor_readiness(audit_id);

alter table public.audit_competitor_readiness enable row level security;

create policy "deny_all_anon"
  on public.audit_competitor_readiness
  as restrictive
  for all
  to anon
  using (false)
  with check (false);

create policy "deny_all_authenticated"
  on public.audit_competitor_readiness
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

comment on table public.audit_competitor_readiness is
  'V3.1 competitor readiness pass — one row per named competitor per audit. Holds the lightweight crawl + 5-driver readiness extraction for plotting competitors on the Readiness × Visibility quadrant.';
