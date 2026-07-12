# apps/console

Marty's internal operator console for Daizie. Auth-gated. Not public.

**Status:** Live. This is the working operator dashboard — subjects, audits, spend tracking, submissions inbox. Not a placeholder.

**Domain (production):** `console.daizie.ai`

## Setup — connect the console to `console.daizie.ai`

Three sides need to line up: DNS at the domain registrar, custom domain in Vercel, redirect URLs in Supabase. All three are dashboard actions — this repo has no code that hardcodes the domain; every URL is read from env vars or inferred from the request host.

### 1. DNS at daizie.ai

Add one CNAME record on the daizie.ai zone:

| Type  | Name    | Value                 | TTL |
| ----- | ------- | --------------------- | --- |
| CNAME | console | cname.vercel-dns.com  | 300 |

Propagation is usually 5–30 minutes.

### 2. Vercel custom domain

On the Vercel project that deploys `apps/console` (separate project from the marketing site):

1. Project → **Settings** → **Domains**
2. **Add domain** → enter `console.daizie.ai`
3. Vercel verifies the CNAME and issues an SSL cert automatically (5–15 min)

The apex `daizie.ai` and `www.daizie.ai` are attached to the *site* Vercel project and redirect to `/ai-visibility` — that's fine, subdomain routing wins over the wildcard so `console.daizie.ai` is not caught by those redirects.

### 3. Vercel environment variables — console project

Verify every env var below is set on the console Vercel project (Settings → Environment Variables). Turborepo's build task allowlists these in `turbo.json`; anything not on the allowlist is silently stripped from the build.

Required for the console to boot at all:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required for running V3 audits from the console:

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `PERPLEXITY_API_KEY`
- `TAVILY_API_KEY`

Optional (only if you use the relevant feature from the console):

- `RESEND_API_KEY`, `RESEND_FROM_ADDRESS` — release-report email
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — rate limiting on any public route the console exposes
- Spend-cap variables (`SPEND_CAP_*`) — only if the console reads live spend

### 4. Supabase Auth — redirect URLs

The login flow signs in via magic link or email/password; Supabase needs to know that `console.daizie.ai` is a legitimate callback host.

Supabase Studio → your project → **Authentication** → **URL Configuration**:

- **Site URL** — leave as your primary marketing URL (`https://www.martykoepke.com`)
- **Redirect URLs** — add: `https://console.daizie.ai/auth/callback`

If you want to keep the old `console.martykoepke.com` working during the migration, add both redirect URLs.

### 5. Test end-to-end

1. Open `https://console.daizie.ai/login`
2. Sign in
3. Confirm `/subjects`, `/audits`, `/submissions`, `/spend` all render
4. Try running a free-scan or paid audit from `/subjects/[id]/run`
5. Confirm the audit persists (check `/audits`)

## What's in the console

Every route under `(authed)/` requires a valid Supabase session; `middleware.ts` refreshes it on every request.

- `/subjects` — subject list + `/subjects/new` create + `/subjects/[id]` detail + `/subjects/[id]/run` run flow
- `/audits` — audit list + `/audits/[id]` detail
- `/compare` — multi-audit comparison
- `/spend` — cost dashboard (per-engine, per-day)
- `/submissions` — inbound from `/api/submissions` (paid teaser intake)
- `/account/password` — password reset
- `/login`, `/auth/callback` — auth pages (not gated)
