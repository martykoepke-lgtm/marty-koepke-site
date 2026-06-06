# The AVI operations monitor — plain-English flow

**Status:** Draft v0.1 — read this before any source files get touched.
**Scope:** Per-call logging of every external API call the AVI system makes (LLM, search, email), plus a weekly summary email Monday morning and immediate out-of-band alerts if any provider crosses 95% of its monthly spend cap.
**Out of scope:** The free Readiness Check itself, the paid Index Report pipeline, the Remediation Sprint. Those get built *after* this one is live and logging.

This doc answers, in plain English: what's the email you'll receive every Monday morning, what does the system do behind the curtain, every tool involved, every cost, every failure mode. By the end, you should be able to defend the monitor design to anyone who asks — including future-Marty when she opens this codebase in six months.

---

## 1. What this is

A safety rail. With $25/month caps on Anthropic and OpenAI (no auto-reload), a single bad-faith script — or one viral LinkedIn post — could burn through your monthly LLM budget in an afternoon. When a cap hits 100%, your API key stops responding. The next free scan errors. The customer sees a 500. You don't know it happened until someone tells you.

The monitor prevents that. It does three jobs:

1. **Logs every external API call** the AVI system makes — to Anthropic, OpenAI, Google AI, Perplexity, Tavily, Resend. Each call gets a row in a new `api_calls` table: provider, tokens, cost estimate, status, latency, link back to the submission that triggered it.

2. **Emails you a weekly summary** every Monday morning at 8:00 AM Pacific. Last week's spend per provider, total traffic, conversion rate, top IPs, anything weird. Calm by design — green-and-quiet when nothing's wrong.

3. **Sends an out-of-band alert** the moment any provider crosses 95% of its monthly cap. Immediate, regardless of cadence. The only time you ever see one is when something is actually wrong.

This is the **first thing built** before any customer-facing AVI work ships. No free scan, no paid pipeline, until logging + the monitor are live. Reason: every other build assumes call logging exists, and you can't safely launch a free scan without the ability to see who's hitting it.

---

## 2. At a glance

```
                  ┌────────────────────────────────────────────┐
                  │           THE AVI SYSTEM, ANY ENTRY POINT  │
                  │  (free scan, paid pipeline, monitor jobs)  │
                  └────────────────┬───────────────────────────┘
                                   │
                                   │  every LLM / Tavily / Resend call
                                   │  goes through a wrapper
                                   ▼
                  ┌────────────────────────────────────────────┐
                  │  lib/avi/llm.ts  +  lib/avi/tavily.ts      │
                  │  (logging wrappers; all callers use these) │
                  └────────────────┬───────────────────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
            ▼                      ▼                      ▼
       provider API           Supabase insert        return to caller
       (Anthropic etc.)       INTO api_calls         (response + log id)
            │                      │
            │                      ▼
            │            ┌────────────────────────┐
            │            │  api_calls table       │
            │            │  (Supabase, RLS on)    │
            │            └─────────┬──────────────┘
            │                      │
            │  ┌───────────────────┴───────────────────┐
            │  │                                       │
            │  ▼                                       ▼
            │  HOURLY threshold-check cron           WEEKLY summary cron
            │  (Vercel Cron, every hour)             (Vercel Cron, Mon 08:00 PT)
            │      │                                       │
            │      │  if any provider month-to-date        │  aggregate last 7 days
            │      │  > 95% of cap → fire alert            │  + month-to-date
            │      │                                       │  + traffic + anomalies
            │      ▼                                       ▼
            │  out-of-band alert email                weekly summary email
            │  (Resend → Marty)                       (Resend → Marty)
            │                                                │
            ▼                                                │
       provider returns                                      ▼
       response                                         your Monday-morning inbox
```

The wrapper is the one rule that makes everything else work: **every external API call goes through the wrapper, every time, with no exceptions.** If a caller bypasses the wrapper, that call doesn't get logged and the monitor under-counts. The wrapper is enforced by code review and the fact that direct provider SDK calls are removed from everywhere except inside the wrapper.

---

## 3. What you receive every Monday morning

The full sample email you'd get a few weeks in, with realistic numbers and the layout calm-by-default.

```
Subject:   AVI weekly ops report — June 15, 2026
From:      hello@practicalinformatics.com
To:        mkoepkeci@gmail.com

────────────────────────────────────────────────────────
AVI weekly ops report — Jun 8 to Jun 14, 2026

Last week, at a glance:
  Free scans started:    14
  Free scans completed:  13   (1 failed at scoring — see logs)
  Emails captured:       8    (62% conversion)
  Paid Reports run:      0
  Monitor self-runs:     7    (hourly threshold checks)

Spend last week, by provider:
  Anthropic     $2.83    (Haiku × 91 calls)
  OpenAI        $0.04    (4o-mini × 14 calls, fallback only)
  Google AI     $0       (free tier × 14 calls)
  Perplexity    $0       (not on free-scan path yet)
  Tavily        $0.21    (39 searches)
  Resend        $0       (13 emails, well inside free tier)
  ──────────────────────
  Total         $3.08

Month-to-date spend, vs caps:
  Anthropic     $7.42  / $25.00   30%
  OpenAI        $0.18  / $25.00    1%
  Tavily        $0.86  / (no cap set yet)
  Perplexity    $0.00  / $10.00 prepaid balance
  ──────────────────────
  No provider above 80% — no flags.

Top traffic last week (free scans by IP):
  71.34.x.x     3 scans     no rate limit hits
  12.4.x.x      2 scans
  205.180.x.x   2 scans
  (8 others, 1 scan each)

Failures and anomalies:
  • Jun 11 14:23 — free scan 7e3a... failed at scoring step,
    Anthropic returned 529 (overloaded). Fallback to OpenAI
    succeeded on retry. No customer impact.
  • Jun 13 — average free-scan LLM cost rose from $0.06
    to $0.09 over 3 days. Possible cause: rubric prompt edit
    on Jun 12 (commit 7934bd7). Worth a glance.

Things to do this week:
  • Check the Jun 13 prompt cost jump — was the change
    intentional, or is the prompt accidentally longer than
    expected?
  • You're at 30% of Anthropic monthly cap with 16 days left
    in the month. Plenty of headroom.

[View all logs in Supabase →]
[Adjust caps in .env.local →]

────────────────────────────────────────────────────────
This report runs every Monday morning at 8:00 AM Pacific.
You'll receive an out-of-band alert (separate email) if any
provider crosses 95% of its monthly cap mid-week.
```

**When a provider crosses 80%**, the subject line gets a prefix:

```
Subject: [HEADS UP] AVI weekly ops report — June 22, 2026
```

…and the spend section moves to the top of the body with the over-threshold provider bolded.

**When a provider crosses 95% mid-week**, an immediate out-of-band alert email goes out the next hour:

```
Subject: [URGENT] Anthropic spend at 96% of monthly cap

Anthropic month-to-date: $24.12 / $25.00  (96%)

If spend continues at the current rate (about $1.20/day),
the cap will hit on June 28. After that, Anthropic API calls
will start returning errors and the free scan will fail until
the cap resets on July 1.

Options:
  1. Raise the cap in the Anthropic console (you'll be billed
     for actual usage above $25)
  2. Reduce volume — temporarily disable the free scan, or
     reduce rate limit from 3/IP/day to 1/IP/day
  3. Let it ride and accept the free scan goes dark Jun 28–Jul 1

Last 24 hours, top contributors:
  IP 71.34.x.x — 6 free scans, $2.40
  IP 71.34.x.x — 5 free scans, $2.00
  (this looks like one IP testing repeatedly — consider
  a per-IP weekly cap)

[View Anthropic console →]
[Toggle free scan off →]
```

Out-of-band alerts only fire when something needs your attention. Quiet by design.

---

## 4. What the system does behind the curtain

### 4.1 The logging wrapper

Every entry point to an external API goes through a wrapper. Pseudocode:

```ts
// lib/avi/llm.ts
async function llmCall({ provider, model, endpoint, submissionId, messages }) {
  const startedAt = Date.now();
  let response, tokensIn = 0, tokensOut = 0, status = "success", errorMessage = null;

  try {
    response = await callProviderSDK(provider, model, messages);
    tokensIn = response.usage.input_tokens;
    tokensOut = response.usage.output_tokens;
  } catch (err) {
    status = classifyError(err);  // "error" | "timeout" | "rate_limited"
    errorMessage = err.message;
    throw err;
  } finally {
    // Always log, even on failure
    await supabase.from("api_calls").insert({
      provider,
      model,
      endpoint,
      submission_id: submissionId,
      tokens_input: tokensIn,
      tokens_output: tokensOut,
      cost_estimated_usd: estimateCost(provider, model, tokensIn, tokensOut),
      duration_ms: Date.now() - startedAt,
      status,
      error_message: errorMessage,
      request_id: response?.id ?? null,
    });
  }

  return response;
}
```

Same shape for `lib/avi/tavily.ts` and any future `lib/avi/email.ts`. The wrapper is the contract; no caller goes around it.

`estimateCost()` is a small lookup table mapping `(provider, model)` to per-token pricing. Updated when vendors change pricing — a 30-second edit.

### 4.2 The hourly threshold check

Vercel Cron, hourly, runs `app/api/cron/check-spend/route.ts`. Sequence:

1. Read month-to-date sum from `api_calls` per provider:
   ```sql
   select provider, sum(cost_estimated_usd) as mtd
   from api_calls
   where created_at >= date_trunc('month', now())
   group by provider;
   ```
2. Compare each provider's MTD against its cap (caps come from env vars: `SPEND_CAP_ANTHROPIC=25`, `SPEND_CAP_OPENAI=25`, etc.).
3. For each provider:
   - If MTD/cap > 0.95 AND no alert sent in the last 24 hours for this provider → send out-of-band alert via Resend, log `last_alert_sent_at` in a `spend_alerts` row.
   - Otherwise → do nothing.
4. The 24-hour rate-limit on alerts prevents spamming you if you cross 95% and stay there.

### 4.3 The weekly summary

Vercel Cron, weekly, Monday at 08:00 Pacific (`0 15 * * 1` in UTC), runs `app/api/cron/weekly-summary/route.ts`. Sequence:

1. Aggregate the previous 7 days from `api_calls` and `submissions`:
   - Free scans started / completed / failed
   - Emails captured (count of submissions with `email` not null)
   - Paid Reports run (later, when that exists)
   - Spend per provider, last 7 days
2. Aggregate month-to-date from same tables.
3. Compare each provider's MTD against cap. If any > 80% → `[HEADS UP]` subject prefix.
4. Identify anomalies — simple heuristics for v1:
   - Any failed scans (any `status != 'success'` in last 7 days)
   - Average cost-per-scan vs. prior 7 days — flag if Δ > 30%
   - Top traffic IPs (last 7 days, free scans)
5. Render the HTML email using the template (`emails/weekly-summary.tsx` or similar).
6. Send via Resend to `ALERT_TO_ADDRESS` (your inbox).

The HTML template uses the brand palette (cream, forest, gold) and Lora/Inter so the email visually matches the site.

### 4.4 The `api_calls` schema

New Supabase migration `0004_api_calls.sql`:

```sql
create table api_calls (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  provider text not null,           -- 'anthropic' | 'openai' | 'gemini' | 'perplexity' | 'tavily' | 'resend'
  model text,                       -- 'claude-haiku-4-5' | 'gpt-4o-mini' | null
  endpoint text,                    -- 'free_scan_score' | 'paid_pipeline_score' | 'transactional_email' | etc.
  submission_id uuid references submissions(id),
  tokens_input int,
  tokens_output int,
  cost_estimated_usd numeric(10,6),
  request_id text,
  duration_ms int,
  status text not null,             -- 'success' | 'error' | 'timeout' | 'rate_limited'
  error_message text,
  ip text
);

create index api_calls_created_at_idx on api_calls (created_at desc);
create index api_calls_provider_month_idx on api_calls (provider, created_at desc);

alter table api_calls enable row level security;
-- No public policies. Service-role-only access from /api/* routes.

create table spend_alerts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  triggered_at timestamptz not null default now(),
  pct_of_cap numeric(5,2) not null,
  alert_email_sent_at timestamptz
);

alter table spend_alerts enable row level security;
```

RLS enabled, service-role only — same as the existing AVI tables.

---

## 5. Tools in this flow

| Tool | One-sentence purpose | Cost | Config / env var |
|------|---------------------|------|------------------|
| **Supabase** | Stores `api_calls` and `spend_alerts` rows. | Free tier sufficient. | Existing: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Vercel Cron Jobs** | Schedules the hourly threshold check and weekly summary. | Free on your existing Vercel plan. | Cron paths declared in `vercel.json`. No new env vars. |
| **Resend** | Sends weekly summary email and out-of-band alerts to you. | Free tier (under 3k/mo). Monitor sends ~5 emails/month. | Existing: `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `ALERT_TO_ADDRESS` |
| **Spend cap env vars** | The numbers the monitor checks against. | Free. | New: `SPEND_CAP_ANTHROPIC=25`, `SPEND_CAP_OPENAI=25`, `SPEND_CAP_TAVILY=25` (or whatever you set later), `SPEND_CAP_PERPLEXITY=10` (the prepaid balance) |

That's it. No new accounts to sign up for. No new vendors. The monitor uses what you already have.

---

## 6. Where this can fail

| Stage | Failure | What happens | What we do |
|-------|---------|--------------|------------|
| API call wrapper | The provider call succeeds, but the Supabase insert fails | The caller gets their response (good); the log is missed (bad — under-counts spend) | Log the failed insert to Vercel logs. Acceptable rare loss. Monitor catches the absence eventually via traffic-vs-spend mismatch. |
| API call wrapper | The provider call fails AND the Supabase insert fails | Caller gets the original error (correct). Log is missed. | Same as above — extreme edge case. |
| Hourly threshold cron | Vercel Cron is delayed by hours (rare, but happens) | Threshold alert fires a few hours late | Acceptable. The 95% threshold has built-in slack; one cap hit in the gap is still recoverable. |
| Hourly threshold cron | Cron fails to run entirely | No alert; you find out via Monday email or via API failures | Vercel Cron has built-in retry. If sustained, you'll notice the missing weekly email — at which point the cron observability page tells you what's wrong. |
| Weekly summary cron | Resend send fails | The summary email doesn't arrive | Retry once. If still failing, log to Supabase and you find out next week. Acceptable since it's a weekly. |
| `estimateCost()` | A vendor changes pricing and the table is stale | Costs are wrong; threshold checks fire late or early | Maintained manually. Quarterly review of vendor pricing pages. Worth a note on the doc. |
| Caps in env vars | You raise a cap in the vendor dashboard but forget to update `.env.local` | Monitor uses the old (lower) cap. You get a HEADS-UP earlier than necessary. | Acceptable — false-positive alert is way better than missing a real one. |

**The single most important failure mode to avoid**: a caller goes around the wrapper. A direct call to `anthropic.messages.create(...)` somewhere in the code, without going through `lib/avi/llm.ts`, means that call isn't logged. Spend goes up, monitor doesn't see it.

**How we prevent it:** ESLint rule (or lint script) that bans direct imports of `@anthropic-ai/sdk`, `openai`, `@google/generative-ai` outside of `lib/avi/llm-providers/*`. The provider files themselves are wrapped by `lib/avi/llm.ts`. Everything else goes through the wrapper.

---

## 7. Costs to build and to run

**Build cost:** ~1 day of code.

| Piece | Time |
|---|---|
| `api_calls` + `spend_alerts` schema migrations | 30 min |
| `lib/avi/llm.ts` wrapper around the 4 provider adapters | 1.5 hr |
| `lib/avi/tavily.ts` wrapper (when Tavily lands) | 30 min — deferred |
| ESLint rule banning direct SDK imports outside the wrappers | 30 min |
| Hourly threshold check cron (`/api/cron/check-spend`) | 1 hr |
| Weekly summary cron (`/api/cron/weekly-summary`) | 1.5 hr |
| HTML email template (weekly + alert) | 2 hr |
| `vercel.json` cron config + deploy | 30 min |
| Manual test: trigger an alert, trigger a weekly summary, sanity-check costs against a real call | 1 hr |
| **Total** | **~8.5 hours** |

**Runtime cost:** essentially $0/month.

- Supabase: ~30 inserts/day (free scans + monitor itself) — well inside free tier.
- Vercel Cron: free on Hobby and Pro plans.
- Resend: ~5 emails/month — well inside free tier (3,000/month).

The monitor pays for itself the first time it catches an unexpected spend spike.

---

## 8. Build order for the monitor (Phase 0 + Phase 1)

This is the order of operations to ship the monitor.

1. **Apply migration `0004_api_calls.sql`** to your Supabase project (`tfjlacjbafwqghiemwdy`).
2. **Add spend cap env vars** to `.env.local`: `SPEND_CAP_ANTHROPIC=25`, `SPEND_CAP_OPENAI=25`, `SPEND_CAP_PERPLEXITY=10`. (Tavily comes later when you sign up.)
3. **Add cap env vars to Vercel** in the production environment dashboard — same values.
4. **Implement `lib/avi/llm.ts`** — the LLM wrapper around the 4 provider adapters. Existing direct callers (currently in `lib/avi/query.ts`) get refactored to route through the wrapper.
5. **Implement `lib/avi/email.ts`** — Resend wrapper that also logs to `api_calls`.
6. **Implement `app/api/cron/check-spend/route.ts`** — hourly cron, threshold check + alert.
7. **Implement `app/api/cron/weekly-summary/route.ts`** — weekly cron, aggregate + render + send.
8. **Add HTML templates** at `lib/avi/email-templates/weekly-summary.tsx` and `lib/avi/email-templates/spend-alert.tsx`.
9. **Add `vercel.json`** with cron schedule entries.
10. **Add ESLint rule** banning direct SDK imports outside `lib/avi/llm-providers/`.
11. **Manual smoke test** locally — trigger the weekly summary handler with a fake date, confirm the email renders correctly. Trigger the spend-check handler with a faked `SPEND_CAP_ANTHROPIC=0.01` to force the alert path.
12. **Deploy and watch** — push to main, watch Vercel deploy, wait for next hourly cron tick, confirm it runs cleanly. Wait until the following Monday, confirm the first real weekly email arrives.

No Phase 0 signups needed beyond what you already have.

---

## 9. What's NOT in this doc

- The **free Readiness Check** rebuild. Phase 3 of the build plan. Doc: `AVI_FREE_FLOW.md` (already written, draft v0.1).
- The **paid Index Report** pipeline. Phase 4. Its own flow doc, written before that build.
- The **drift monitoring** (re-scanning a representative subject on a schedule to detect rubric drift). Phase 5. Different from this monitor — that one watches the rubric; this one watches the wallet.
- An **internal admin page** with raw `api_calls` browsing. Phase 5. Until then, you query Supabase directly when curious.
- **Per-IP spend caps** (e.g., "stop accepting from this IP if they've cost more than $5 this week"). Worth adding once we see real traffic. Not in v1.

---

## 10. Locked decisions (resolved 2026-06-06)

What was previously "open questions" is now locked.

1. **Timezone for the Monday 8 AM email.** America/Los_Angeles (Pacific). The cron in `vercel.json` is stored in UTC — Monday 15:00 UTC during PST, shifts to Monday 16:00 UTC during PDT (will need a daylight-saving review twice a year, or we can just leave it at 8 AM Pacific accepting one-hour drift across DST changes; either is fine).

2. **Where alerts go.** Both weekly summary and 95% out-of-band alerts go to `ALERT_TO_ADDRESS=mkoepkeci@gmail.com`. Single destination; no split inboxes.

3. **Tavily cap.** `SPEND_CAP_TAVILY=20`, derived from Tavily PAYG basic-search rate × her self-set 4k/month search cutoff = ~$20. Backed by a $30 prepaid balance with no auto-reload — triple safety net (PAYG + 4k usage cap + prepaid balance). The 80% HEADS-UP fires at $16; the 95% out-of-band fires at $19, leaving ~$11 of prepaid headroom before Tavily would actually stop responding.

4. **Vercel Cron tier.** Pro ($20/mo, already in place). Clean architecture: hourly threshold check + separate weekly summary. Worst-case alert delay: ~1 hour. No combined-cron compromise needed.

5. **`api_calls` archive strategy.** Deferred. At ~30 inserts/day, the table will hold ~11k rows after a year — tiny by Postgres standards. `TODO`: revisit when the table crosses 100k rows.

---

## 11. What I'll do next

Once you've answered Q1, Q2, Q4 (Q3 and Q5 aren't blockers):

1. **Update this doc** with your answers.
2. **Walk you through it inline** — I'll narrate the critical pieces and check that the picture lands. Per `feedback-document-everything-plainly`, this is the gate to code.
3. **Apply migration 0004** to Supabase.
4. **Write `lib/avi/llm.ts`** and refactor existing direct LLM callers to use it.
5. **Build the two cron handlers and the email templates.**
6. **Deploy, test, watch the first weekly email arrive on a Monday.**

No source files get touched until the doc is signed off.

---

**End of v0.1 draft.** This is a working document. Edit freely; we'll re-sync next time we touch it.
