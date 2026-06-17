-- Migration: 0010_free_scan_fields
--
-- Adapts `submissions` for the free /scan flow (D006). The legacy
-- /ai-visibility/order form collected 8 fields up front and made email,
-- first_name, last_name, company_name, industry NOT NULL. The new
-- /scan flow collects only the URL on submit, and email comes in later
-- at the email gate. So those columns drop to nullable.
--
-- Also extends the status enum with scan-specific lifecycle values and
-- adds a `source` column so we can tell at a glance which flow a row
-- came from (free_scan vs paid_order vs legacy).
--
-- The scan output itself lives on the `audits` row (one audit per scan,
-- attached to the submission). That table already has crawler_output,
-- scoring_output, readiness_score, tier, rubric_version — everything the
-- free scan needs. Reusing it keeps the schema small.
--
-- Backwards-compatible: every existing /ai-visibility/order row still
-- reads fine. The constraint relaxation only removes NOT NULL — it does
-- not break existing data.

----------------------------------------------------------------------
-- 1. Relax NOT NULL on legacy-form fields
----------------------------------------------------------------------

alter table public.submissions
  alter column email drop not null;

alter table public.submissions
  alter column first_name drop not null;

alter table public.submissions
  alter column last_name drop not null;

alter table public.submissions
  alter column company_name drop not null;

alter table public.submissions
  alter column industry drop not null;

----------------------------------------------------------------------
-- 2. Source column — distinguish free_scan rows from legacy rows
----------------------------------------------------------------------

alter table public.submissions
  add column if not exists source text not null default 'legacy';

alter table public.submissions
  drop constraint if exists submissions_source_check;

alter table public.submissions
  add constraint submissions_source_check
  check (source in ('free_scan', 'paid_order', 'legacy'));

create index if not exists submissions_source_idx
  on public.submissions (source);

----------------------------------------------------------------------
-- 3. Extend the status enum with scan lifecycle values
----------------------------------------------------------------------
-- Existing values: new | teaser_sent | paid | report_sent | call_complete | sprint_sold | refunded
-- New values for the free scan flow:
--   scan_completed   — /api/scan finished; on-screen result shown; no email yet
--   email_captured   — /api/scan/email got the email + tier-tagged into Kit
--   pdf_sent         — Resend confirmed the PDF email was queued
--   pdf_failed       — PDF generation or send errored; flagged for manual recovery

alter table public.submissions
  drop constraint if exists submissions_status_check;

alter table public.submissions
  add constraint submissions_status_check check (status in (
    'new',
    'scan_completed',
    'email_captured',
    'pdf_sent',
    'pdf_failed',
    'teaser_sent',
    'paid',
    'report_sent',
    'call_complete',
    'sprint_sold',
    'refunded'
  ));

----------------------------------------------------------------------
-- 4. Comments
----------------------------------------------------------------------

comment on column public.submissions.source is
  'Which form produced this row: free_scan (new /scan), paid_order (Stripe-funded), or legacy (/ai-visibility/order pre-D006).';
