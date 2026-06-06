-- Migration: 0004_api_calls
-- Adds api_calls (per-call logging of every external API the AVI system makes)
-- and spend_alerts (rate-limit + history of out-of-band 95% alert emails).
--
-- Read AVI_OPS_MONITOR.md before editing. Specifically §4.4 for the schema
-- rationale, §6 for failure modes, §10 for the locked design decisions.
--
-- RLS enabled on both tables; no public/anon policies. Service-role-only
-- access from /api/* routes — consistent with the existing submissions /
-- audits / payments tables from migration 0001.

----------------------------------------------------------------------
-- api_calls
----------------------------------------------------------------------

create table public.api_calls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Which external API this call hit.
  -- Allowed values are checked in the wrapper, not enforced at the DB
  -- level (we want to be able to add new providers without a migration).
  provider text not null,
    -- e.g. 'anthropic' | 'openai' | 'gemini' | 'perplexity' | 'tavily' | 'resend'

  model text,
    -- e.g. 'claude-haiku-4-5' | 'claude-sonnet-4-6' | 'gpt-4o-mini' |
    -- 'gemini-2.5-flash' | 'sonar-pro'. Null for non-LLM calls (Tavily/Resend).

  -- What part of the AVI system originated this call. Used to slice
  -- spend per surface (free scan vs paid Index Report vs monitor self-runs).
  endpoint text,
    -- e.g. 'free_scan_score' | 'paid_pipeline_score' |
    -- 'paid_pipeline_extract' | 'paid_pipeline_query' |
    -- 'transactional_email' | 'monitor_alert' | 'monitor_weekly_summary'

  -- Link back to the submission that triggered this call, when applicable.
  -- Null for monitor-internal calls (no associated submission).
  submission_id uuid references public.submissions(id) on delete set null,

  -- Token counts as reported by the provider. Null when not provided
  -- (e.g. Tavily and Resend don't report tokens).
  tokens_input int,
  tokens_output int,

  -- Cost estimate in USD. Computed by lib/avi/llm.ts using the
  -- (provider, model) → pricing lookup table. 6-decimal precision is
  -- enough to track sub-cent costs accurately.
  cost_estimated_usd numeric(10, 6),

  -- Provider's request ID for traceability (e.g. Anthropic's `id` field,
  -- OpenAI's `id`, Tavily's request_id). Useful when debugging a single
  -- call against the provider's own logs.
  request_id text,

  -- Wall-clock duration from request to response.
  duration_ms int,

  -- 'success' | 'error' | 'timeout' | 'rate_limited'.
  -- Classified by lib/avi/llm.ts based on the exception type.
  status text not null,

  -- Truncated error message when status != 'success'. Full stack trace
  -- goes to Vercel logs; this is just for the monitor email's
  -- anomaly-summary section.
  error_message text,

  -- Requester IP when applicable (free scan submissions). Used in the
  -- weekly summary's "top traffic" section to spot abuse patterns.
  -- Null for monitor-internal calls.
  ip text
);

-- Indexes:
-- 1. Recency scan (the weekly summary aggregates the last 7 days)
create index api_calls_created_at_idx
  on public.api_calls (created_at desc);

-- 2. Per-provider, recency-ordered (the hourly threshold check sums
--    month-to-date by provider)
create index api_calls_provider_month_idx
  on public.api_calls (provider, created_at desc);

-- 3. Submission-linked queries (when investigating a specific scan)
create index api_calls_submission_idx
  on public.api_calls (submission_id)
  where submission_id is not null;

alter table public.api_calls enable row level security;
-- No policies. Service role bypasses RLS; anon/authenticated have no access.

comment on table public.api_calls is
  'Per-call log of every external API call the AVI system makes. '
  'Populated by lib/avi/llm.ts, lib/avi/tavily.ts, lib/avi/email.ts. '
  'Read by the weekly summary and hourly threshold-check crons. '
  'See AVI_OPS_MONITOR.md for the full design.';

----------------------------------------------------------------------
-- spend_alerts
----------------------------------------------------------------------

create table public.spend_alerts (
  id uuid primary key default gen_random_uuid(),
  triggered_at timestamptz not null default now(),

  -- Which provider crossed its 95% threshold.
  provider text not null,

  -- Percent of monthly cap consumed at the moment of trigger.
  -- E.g. 96.32. Useful for the "you were at X% when alerted" line
  -- in the alert email.
  pct_of_cap numeric(5, 2) not null,

  -- Filled in by the cron handler once the alert email actually goes
  -- out via Resend. Decouples "we decided to alert" from "the email
  -- was sent" so we can track Resend failures separately.
  alert_email_sent_at timestamptz,

  -- Resend send error if the email failed. Null on success.
  send_error text
);

-- Rate-limit index: the hourly cron looks up "did we already alert
-- this provider in the last 24 hours?" before firing again.
create index spend_alerts_provider_recent_idx
  on public.spend_alerts (provider, triggered_at desc);

alter table public.spend_alerts enable row level security;

comment on table public.spend_alerts is
  'History + rate-limiting state for the 95% out-of-band spend alerts. '
  'One row per alert fire (capped at 1/provider/24h). '
  'See AVI_OPS_MONITOR.md §4.2 for the alert flow.';

----------------------------------------------------------------------
-- Done.
----------------------------------------------------------------------
