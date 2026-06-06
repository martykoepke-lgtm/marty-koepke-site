-- ============================================================================
-- Make `submissions.url` nullable
-- ============================================================================
-- Customers without a website yet should still be able to submit. The
-- AI Search Ranking eval (category-based queries) works without a URL.
-- Only the Website Readiness eval requires a URL — and that runs only
-- when one is provided.
-- ============================================================================

alter table public.submissions
  alter column url drop not null;
