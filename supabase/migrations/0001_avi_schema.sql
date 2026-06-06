-- ============================================================================
-- AI Visibility Index — initial schema
-- ============================================================================
-- Creates the three core tables for the AVI product:
--   1. submissions  — every form submit (lead + preliminary score)
--   2. audits       — the full audit data per paid customer (the four agents' output)
--   3. payments     — Stripe transaction records
--
-- All three have Row Level Security ENABLED with NO public policies. This means:
--   - Anonymous (browser) clients: cannot read or write anything directly
--   - Authenticated users (we have none): cannot read or write anything
--   - Service role key (server-side only): bypasses RLS, has full access
--
-- Every read/write happens through our /api/* routes, which use the service
-- role key. The browser never queries Supabase directly. This is the safest
-- pattern for a system where customers don't log in.
--
-- See: docs.supabase.com/guides/auth/row-level-security
-- ============================================================================

-- Required extensions (Supabase usually has these enabled by default)
create extension if not exists "pgcrypto";  -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. submissions
-- ----------------------------------------------------------------------------
-- One row per form submission. Lives forever as the lead record.
-- Stores preliminary score + findings from the lightweight Crawler.
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- What the customer submitted
  -- URL is optional: customers without a website can still get the
  -- AI Search Ranking eval (category-based queries). Only the Website
  -- Readiness eval needs a URL.
  url text,
  email text not null,
  first_name text not null,
  last_name text not null,
  company_name text not null,
  industry text not null,
  location text,
  competitor_urls text[],
  find_competitors_for_me boolean not null default false,
  target_query text,

  -- Lightweight crawler output (preliminary score shown on teaser page)
  preliminary_score integer,
  preliminary_tier text,           -- 'agent-ready' | 'discoverable' | 'faintly-visible' | 'hidden' | 'invisible'
  preliminary_findings jsonb,      -- 2–3 findings shown on teaser

  -- Stage in the funnel — driven by our /api/* routes
  status text not null default 'new',  -- new | teaser_sent | paid | report_sent | call_complete | sprint_sold | refunded
  constraint submissions_status_check check (status in (
    'new', 'teaser_sent', 'paid', 'report_sent',
    'call_complete', 'sprint_sold', 'refunded'
  )),

  -- Signed access token for the results page (random, hard to guess)
  access_token text not null default replace(gen_random_uuid()::text, '-', '')
);

create index if not exists submissions_email_idx on public.submissions (email);
create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_created_at_idx on public.submissions (created_at desc);

-- ----------------------------------------------------------------------------
-- 2. audits
-- ----------------------------------------------------------------------------
-- One row per PAID audit run. The four agents' outputs live here.
-- A single submission can have multiple audits over time (e.g. 60-day re-scan).
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  created_at timestamptz not null default now(),

  -- Which archetype rubric was applied
  archetype text,                 -- 'solo-expert' | 'young-practice' | 'established' | 'mature'

  -- Raw outputs from the four agents
  crawler_output jsonb,           -- HTML scan, schema, robots.txt, llms.txt findings
  query_output jsonb,             -- LLM responses (ChatGPT, Claude, Gemini)
  scoring_output jsonb,           -- six-dimension breakdown + fix list
  competitor_data jsonb,          -- 2 competitor mini-audits

  -- Headline numbers (denormalized for fast queries)
  total_score integer,
  tier text,
  projected_score integer,
  fixes jsonb,                    -- top-10 fixes ranked

  -- Report rendering
  report_html_path text,          -- e.g. /reports/[id]
  report_pdf_path text,           -- Supabase Storage path or URL

  -- Internal review state
  review_status text not null default 'draft',  -- draft | sent | error
  constraint audits_review_status_check check (review_status in ('draft', 'sent', 'error')),
  sent_at timestamptz
);

create index if not exists audits_submission_id_idx on public.audits (submission_id);
create index if not exists audits_review_status_idx on public.audits (review_status);
create index if not exists audits_created_at_idx on public.audits (created_at desc);

-- ----------------------------------------------------------------------------
-- 3. payments
-- ----------------------------------------------------------------------------
-- One row per Stripe transaction. Tracks $497 Report sales, $2,997 Sprint sales,
-- and any future Monitoring transactions.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete set null,
  created_at timestamptz not null default now(),

  stripe_payment_intent text unique,  -- from Stripe webhook
  stripe_checkout_session text,       -- from Stripe webhook
  amount_cents integer not null,
  currency text not null default 'usd',
  product text not null,              -- 'report' | 'sprint' | 'monitoring_first' | 'monitoring_recurring'
  constraint payments_product_check check (product in ('report', 'sprint', 'monitoring_first', 'monitoring_recurring')),

  customer_email text,
  status text not null default 'succeeded'  -- succeeded | refunded | disputed
);

create index if not exists payments_submission_id_idx on public.payments (submission_id);
create index if not exists payments_stripe_payment_intent_idx on public.payments (stripe_payment_intent);
create index if not exists payments_customer_email_idx on public.payments (customer_email);

-- ----------------------------------------------------------------------------
-- Updated-at trigger for submissions (audits + payments don't need it)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security — enabled, with NO public policies
-- ----------------------------------------------------------------------------
-- The default behavior with RLS enabled and no policies is: deny everything
-- to anon and authenticated roles. Service role bypasses RLS automatically.
-- All access from our app uses the service role key on the server side.
alter table public.submissions enable row level security;
alter table public.audits enable row level security;
alter table public.payments enable row level security;

-- ----------------------------------------------------------------------------
-- Done. Verify in Supabase Table Editor that all three tables appear and
-- show "RLS enabled" indicators.
-- ----------------------------------------------------------------------------
