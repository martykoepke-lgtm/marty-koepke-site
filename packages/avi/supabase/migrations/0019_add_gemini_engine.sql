-- Add Gemini as a measured AI system for paid V3 audits.
-- The provider adapter already exists in code; this migration lets Supabase
-- persist Gemini rows in the engine-response table.

alter table public.audit_engine_responses
  drop constraint if exists audit_engine_responses_engine_check;

alter table public.audit_engine_responses
  add constraint audit_engine_responses_engine_check
  check (engine in ('chatgpt', 'claude', 'perplexity', 'gemini'));

comment on column public.audit_engine_responses.engine is
  'Measured AI system: chatgpt, claude, perplexity, or gemini.';
