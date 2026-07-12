-- Migration: 0021_explicit_deny_all_policies
--
-- Makes the existing "service-role only" security posture EXPLICIT.
--
-- Background
-- ----------
-- Since 0001 the design has been: every table has RLS enabled but NO
-- policies, which means anon + authenticated get nothing, while the
-- service_role key (used server-side by /api/* and the console via
-- supabaseAdmin()) bypasses RLS automatically. See 0001 line ~152 and
-- AVI_OPERATING_STANDARD.md.
--
-- Supabase's security advisor flags every such table with the INFO-level
-- lint `0008_rls_enabled_no_policy`. It is not a vulnerability for a
-- service-role-only app, but the absence of a policy makes the intent
-- ambiguous to anyone reading the schema ("did someone forget?").
--
-- This migration adds an explicit RESTRICTIVE deny-all policy for the
-- anon and authenticated roles on every current public table. Effect:
--   * Functionally identical to today — anon/authenticated still get
--     nothing; service_role still bypasses RLS and is unaffected.
--   * The deny-all intent is now self-documenting in the schema.
--   * All 24 `rls_enabled_no_policy` INFO lints are resolved.
--
-- This is the correct baseline regardless of whether the product later
-- moves to a customer-facing model. Internal/sensitive tables (api_calls,
-- payments, raw audit_* data, claims) must stay service-role-only even in
-- a multi-tenant world — customers receive rendered reports via /api/*,
-- never direct row access. Any future per-customer policies would replace
-- this deny-all on the specific customer-readable tables only, under a new
-- ADR (see DECISIONS.md).
--
-- Idempotent: drops the policy by name first, so re-running is safe.

do $$
declare
  t text;
  tables text[] := array[
    'submissions',
    'audits',
    'payments',
    'api_calls',
    'spend_alerts',
    'audit_query_responses',
    'audit_dimension_scores',
    'subjects',
    'audits_v2',
    'audit_subjects_snapshot',
    'audit_crawler_evidence',
    'audit_corroboration',
    'audit_engine_responses',
    'audit_extracted',
    'audit_visibility_outcomes',
    'audit_driver_scores',
    'audit_cross_judge_scores',
    'audit_v2_recommendations',
    'audit_source_evidence',
    'audit_claims',
    'audit_claim_verifications',
    'audit_prompt_variants',
    'audit_outcome_scores',
    'audit_stability_runs'
  ];
begin
  foreach t in array tables loop
    -- Only touch tables that actually exist, so the migration is portable.
    if exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relkind = 'r'
    ) then
      execute format('alter table public.%I enable row level security;', t);
      execute format('drop policy if exists deny_all_anon_authenticated on public.%I;', t);
      execute format(
        'create policy deny_all_anon_authenticated on public.%I '
        || 'as restrictive for all to anon, authenticated '
        || 'using (false) with check (false);', t);
    end if;
  end loop;
end
$$;
