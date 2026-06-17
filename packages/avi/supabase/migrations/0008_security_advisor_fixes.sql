-- Migration: 0008_security_advisor_fixes
--
-- Fixes the 3 warnings that Supabase Security Advisor flagged
-- as of 2026-06-06:
--
--   1. public.set_updated_at — "Function Search Path Mutable"
--      Without an explicit search_path, a user with permission to
--      create a schema could potentially shadow built-ins called
--      inside the function. Pin search_path to pg_catalog, pg_temp.
--
--   2/3. public.rls_auto_enable() — "Public Can Execute SECURITY
--        DEFINER Function" + "Signed-In Users Can Execute SECURITY
--        DEFINER Function". REVOKE EXECUTE from anon, authenticated,
--        and the public role so only service_role (which bypasses
--        privilege checks) can invoke it. The function appears to be
--        a Supabase auto-RLS helper that doesn't need browser-side
--        access.
--
-- Conservative; nothing destructive. If rls_auto_enable does not
-- exist (Supabase removed it or signature differs), the REVOKEs
-- are wrapped in DO blocks so the migration still succeeds.

----------------------------------------------------------------------
-- 1. set_updated_at — pin search_path
----------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

----------------------------------------------------------------------
-- 2 + 3. rls_auto_enable — revoke from anon / authenticated / public
----------------------------------------------------------------------

do $$
begin
  -- Try with no-arg signature first
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public';
    execute 'revoke execute on function public.rls_auto_enable() from authenticated';
    execute 'revoke execute on function public.rls_auto_enable() from anon';
  end if;
end
$$;
