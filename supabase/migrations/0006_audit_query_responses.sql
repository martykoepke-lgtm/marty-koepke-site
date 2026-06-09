-- Migration: 0006_audit_query_responses
--
-- Per-cell storage for the AVI query grid. One row per
-- (audit × query_template × engine × rep). Lets you do cross-audit
-- analytics without unpacking JSON every time:
--
--   select query_id,
--          avg((mentioned)::int)::numeric(3,2) as mention_rate
--   from audit_query_responses
--   join audits on audits.id = audit_query_responses.audit_id
--   where audits.rubric_version = 'v2.0'
--     and audits.subject_type = 'personal_brand'
--   group by query_id
--   order by mention_rate desc;
--
-- At Mid grid size (10 × 4 × 2) you get 80 rows per audit. At Full
-- (15 × 4 × 3) you get 180. At 50 test audits that's 4–9k rows —
-- still tiny by Postgres standards.
--
-- RLS enabled, no policies. Service-role-only access. Same pattern as
-- the existing AVI tables.

create table public.audit_query_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  audit_id uuid not null references public.audits(id) on delete cascade,

  -- The query template that was rendered for this cell.
  -- e.g. 'cat-best-for-buyer', 'name-tell-me-about', 'compare-vs-x'.
  query_id text not null,

  -- Coarse grouping for slicing in reports.
  query_category text not null,
  constraint audit_query_responses_category_check check (query_category in (
    'category-search', 'name-search', 'competitive', 'buyer-scenario'
  )),

  -- The fully rendered question that was asked.
  query_text text not null,

  -- Which AI engine answered.
  engine text not null,
  constraint audit_query_responses_engine_check check (engine in (
    'anthropic', 'openai', 'gemini', 'perplexity'
  )),

  -- 1-indexed repetition number. 1 = first time we asked this query on this
  -- engine in this audit; 2 = second; etc. Reps surface stochasticity.
  rep_index int not null,

  -- The full raw response. Capped indirectly via MAX_RESPONSE_TOKENS in the
  -- provider adapters, so typically < 4 KB.
  response_text text,

  -- ===== Extracted signals (filled by the Extraction service) =====
  --
  -- Whether the subject is named in the response. Substring + alias match
  -- in v1; LLM-based extraction in v2.
  mentioned boolean,

  -- Whether the response cites the subject's URL or a substantial direct quote.
  cited_with_link boolean,

  -- Where in the response the subject is named.
  position_band text,
  constraint audit_query_responses_position_check check (
    position_band is null
    or position_band in ('top', 'middle', 'late', 'not_named')
  ),

  -- Other businesses named in the response. Used for Share-of-Voice math.
  competitors_mentioned text[],

  -- The strongest single sentence or fragment that motivated `mentioned`/
  -- `cited_with_link`/`position_band` — useful for reviewing why the
  -- extractor classified the response the way it did.
  evidence_text text,

  -- ===== Call-level bookkeeping (parallel to api_calls schema) =====
  tokens_input int,
  tokens_output int,
  cost_usd numeric(10, 6),
  duration_ms int,
  status text not null default 'success',
  constraint audit_query_responses_status_check check (status in (
    'success', 'error', 'timeout', 'rate_limited'
  )),
  error_message text,

  -- Forbid duplicate (audit, query_id, engine, rep_index) tuples — they
  -- would represent an incorrect double-insert from a retry bug.
  constraint audit_query_responses_cell_unique
    unique (audit_id, query_id, engine, rep_index)
);

-- For the typical UI/report query (give me all responses for one audit).
create index audit_query_responses_audit_idx
  on public.audit_query_responses (audit_id);

-- For cross-audit analytics (give me mention rate per query across N audits).
create index audit_query_responses_query_engine_idx
  on public.audit_query_responses (query_id, engine);

-- For benchmarking against the rubric version, given the join to audits.
create index audit_query_responses_created_at_idx
  on public.audit_query_responses (created_at desc);

alter table public.audit_query_responses enable row level security;
-- No policies. Service role only.

comment on table public.audit_query_responses is
  'One row per (audit × query × engine × rep). The granular outcome ' ||
  'storage that lets you slice mention rates, share-of-voice, position ' ||
  'bands across the test set without unpacking JSON blobs. See ' ||
  'AVI_INDEX_REPORT.md (when written) for the design.';
