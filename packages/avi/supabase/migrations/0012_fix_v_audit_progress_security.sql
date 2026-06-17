-- Migration: 0012_fix_v_audit_progress_security
--
-- Fixes the 1 error from Supabase Security Advisor (2026-06-17):
--
--   public.v_audit_progress — "Security Definer View"
--   Views default to SECURITY DEFINER, meaning the view runs with the
--   permissions of the view owner (the migration role) rather than the
--   user querying it. With RLS enabled on audits_v2, that means a future
--   grant to anon/authenticated would silently bypass RLS via the view.
--
-- Today this is not exploitable (no grants to anon/authenticated exist),
-- but the advisor correctly flags it as a latent risk. Setting
-- security_invoker = true makes the view honor the caller's permissions,
-- so RLS on audits_v2 stays enforced regardless of who queries the view.
--
-- See: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0010_security_definer_view
-- See: AVI_OPERATING_STANDARD.md (RLS rules); SCHEMA_V2.md §6 (view purpose)

alter view public.v_audit_progress set (security_invoker = true);

comment on view public.v_audit_progress is
  'Composite-score deltas per subject over time. Used for re-measure reports. '
  'security_invoker=true so the view enforces the querying user''s permissions '
  '(service-role bypasses RLS; anon/authenticated remain locked out).';
