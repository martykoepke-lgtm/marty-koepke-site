# Decisions

Architectural and product decisions in chronological order. Newest at top.
Each entry: what we chose, why, what we considered, when we logged it.

---

## D009 — Explicit deny-all RLS policies instead of implicit "RLS on, no policy"

**Date:** 2026-06-25
**Status:** Locked. Applied in migration `0021_explicit_deny_all_policies.sql`.

**Decision.** Every table in the `public` schema now carries an explicit
restrictive policy, `deny_all_anon_authenticated`
(`as restrictive for all to anon, authenticated using (false) with check
(false)`), added across all 24 existing tables in migration `0021`. New
tables should ship the same policy in the migration that creates them.

**Why.** Since `0001` the security model has been correct but *implicit*:
RLS enabled, no policies, which denies `anon`/`authenticated` and lets the
`service_role` key (used by `/api/*` and the console's `supabaseAdmin()`)
bypass RLS. Supabase's security advisor flags every such table with the
INFO-level `rls_enabled_no_policy` lint. That's noise for a service-role-only
app, but it (a) buried any *real* future advisor finding in 24 lines of
false positives, and (b) made the schema ambiguous — a reader can't tell
"locked down on purpose" from "someone forgot the policy." An explicit
deny-all removes both problems. It is functionally identical to the prior
state: service role still bypasses RLS, so console and `/api/*` are
unaffected; only the already-denied `anon`/`authenticated` roles are now
denied *explicitly*.

**Considered.** (a) Leave it implicit and ignore the lints — rejected; the
advisor stays permanently dirty and hides real findings. (b) Add permissive
`using (true)` read policies to "satisfy" the linter — rejected outright;
that would expose customer submissions, payments, and the `api_calls` cost
log to the open internet. The linter wants *a* policy, not an *open* one.
(c) Add per-customer owner-based policies now — rejected as premature: there
is no customer-auth model in the schema (`customer_id` is an unlinked uuid,
identity is by email, `auth.users` holds only operator logins). Direct
customer access to Supabase would contradict the service-role-only standard
and needs its own ADR if it's ever pursued.

**Scope note.** This does **not** change the locked rule that customers
never authenticate to Supabase directly. It hardens and documents that
rule. See `AVI_OPERATING_STANDARD.md` and the "Never disable Supabase RLS"
bullet in `CLAUDE.md`.

---

## D008 — Split the repo into a pnpm + Turborepo monorepo

**Date:** 2026-06-17
**Status:** Locked. Migration plan in `MIGRATION_TO_MONOREPO.md`.

**Decision.** Restructure the single Next.js repo into a pnpm + Turborepo
monorepo with three workspaces:

- `apps/site/` — the marketing site and the customer-facing `/scan` flow.
  Public. Calm cream-and-forest brand. Deployed at
  `www.practicalinformatics.com`.
- `apps/console/` — Marty's internal operator console. Auth-gated.
  Different visual language. Deployed at `console.practicalinformatics.com`.
- `packages/avi/` — the AVI pipeline (`lib/avi/*-v2.ts`), agent role files,
  query templates, subject JSONs, Supabase schema, and CLI runners. Imported
  by both apps as `@practical-informatics/avi`.

Documentation (`VISION.md`, `CLAUDE.md`, `DECISIONS.md`, all AVI flow docs,
the operating standard) stays at the repo root. It governs the whole
project, not just one workspace.

The migration runs in six phases, each one PR, each reversible. No phase
commits both the structural move and a behavior change. The full plan,
including the destination tree, tooling choices (pnpm + Turborepo + TS
project references), keep-`/scan`-green strategy, and rollback at each
phase boundary, lives in `MIGRATION_TO_MONOREPO.md`.

**Why.** Three reasons, in order of weight:

1. **The AVI codebase has outgrown the marketing site.** By surface area,
   `lib/avi/` plus `agents/`, `queries/`, `subjects/`, and the CLI scripts
   are now larger than the marketing site. Treating them as "some code
   inside a marketing site" is wrong by simple measurement.
2. **The console is a different product than the marketing site.** It has
   a different audience (Marty only), a different threat model
   (auth-gated, not anonymous), a different visual language (operator
   dense, not foothills calm), and likely a different domain. Bundling
   them in one Next.js app risks pulling admin code into the public
   bundle, ties their auth perimeters together, and forces one bug to
   take down both.
3. **Deploys should be independent.** A bug in the audit pipeline must
   not break `www.practicalinformatics.com`. A site copy edit must not
   redeploy the console. Two Vercel projects on one repo, with
   Turborepo's filter-aware build hooks, gives this for free.

**Considered.** (a) Stay in one repo with a `/admin` route group inside
the existing site — rejected; ships in a day but inherits all three
problems above, and the bundle/visual/perimeter pain compounds as the
console grows charts, queues, and verification panels. (b) Separate the
console into its own repo entirely — rejected; the `/scan` route on the
marketing site and the console both need the AVI pipeline, so they share
code either way. A monorepo gives that sharing with one `pnpm install`
and zero publishing overhead. (c) Defer the migration until after the
v2 schema lands and the console has features to build — rejected; every
file added to `lib/avi/` between now and then is one more file to move
later, and the console can't be scaffolded sensibly while the AVI code is
still tangled into the site app.

**Affects.** Everything. Repo layout, build commands, deploy
configuration, import paths in `app/api/scan/route.ts` and anywhere else
that touches the AVI lib, the `.gitignore` (audits/ moves out of the
tracked tree), and `CLAUDE.md`'s file-structure section. `lib/avi/`'s v2
file additions stop accruing at the repo root once the migration starts
— new AVI code lands in `packages/avi/src/` directly. The marketing
site's behavior is unchanged end-to-end; the `/scan` route is unchanged
end-to-end. If a visitor notices anything during the migration, the
migration is wrong.

See `MIGRATION_TO_MONOREPO.md` for the plain-English plan.

---

## D006 — Build the free Readiness Check now, on top of the validated tool

**Date:** 2026-06-15
**Status:** Locked. **Reverses D005's deferral of the free flow.**

**Decision.** Build the public free `/scan` flow next, on top of the seven
AVI services that landed last week (crawler, corroboration, query, extraction,
aggregation, scoring, recommendations). The new flow is the AVI_FREE_FLOW.md
v0.1 design: URL-only form → Turnstile + Upstash → synchronous pipeline →
on-screen tier + bars + 2–3 findings → email gate → Kit subscribe + Resend
PDF delivery. The existing `/ai-visibility/order` form is retired and
replaced by `/scan` (link redirects, copy updated).

Pricing referenced by the free flow (PDF, on-page upsell, Kit nurture) is
the current canon: $697 Report / $2,997 (Foundations) + $4,997 (Expanded)
Sprint / $597/mo Visibility Partner. These supersede the legacy numbers in
`AVI_BUILD_PLAN.md` and `AVI_FREE_FLOW.md`; the docs will be reconciled
next pass.

**Why.** The seven-service pipeline has now been exercised against 60+ test
subjects across categories (healthcare, law, wineries, agencies, personal
brands). The rubric reads as defensible enough to be the engine behind a
public free check. Building the free flow is no longer building a teaser
for an unvalidated product — it's wrapping a validated tool. Also: the free
flow is the lead-magnet that feeds Sprint pipeline; the site refresh
already promises "Free AI Readiness Check — coming soon," so completing it
closes a copy claim already shipping.

**Considered.** (a) Wait longer per D005 — rejected; the test sample is
large and consistent enough to ship. (b) Skip free and launch the paid
$697 Report flow first — rejected; conversion is dramatically better when
the free tier funnels into the paid one. (c) Re-spec the rubric before
shipping the free check — rejected; calibration from real customer audits
will be more useful than another round of internal calibration.

**Affects.** Phase 3 of `AVI_BUILD_PLAN.md` is now active. New code:
`app/scan/`, `app/api/scan/`, `app/api/scan/email/`, Upstash + Turnstile
wrappers, Kit + weasyprint integration, short-form PDF template (reuse
the paid-tier renderer with a `?layout=short` flag), Supabase migration
0010 for any missing scan-flow fields. The `/ai-visibility/order` route is
retired and redirects to `/scan`.

See `AVI_FREE_FLOW.md` for the plain-English flow.

---

## D005 — Build the full AVI tool next, defer free flow

**Date:** 2026-06-06
**Status:** Locked. **Supersedes D003** ("free flow first, then paid").

**Decision.** After the ops monitor (D004), the next build is the **full AVI
scoring tool** — crawler + entity corroboration + cross-engine query grid +
structured extraction + LLM-as-judge scoring (Option 2 rubric, 7 dims) +
report generation — end-to-end. The free Readiness Check rebuild is
**deferred** until after this tool exists and Marty has used it on a real
sample of businesses across sectors.

The tool is for Marty's own use first, not customers. Triggering is via
CLI / admin script — no Stripe checkout, no `/scan` form, no Kit nurture.
She runs it against representative businesses (healthcare-adjacent
practice, regional firm, personal brand, etc.), reads the output, and
evaluates whether the rubric and scoring produce defensible findings.
Customer-facing wrapping (Stripe webhook, Inngest async, free flow, copy
updates) comes AFTER the tool has been validated on real subjects.

**Why.** Stated by Marty: "before creating any free versions. I need the
actual app built. the whole tool. I need to test out the tool on various
businesses and business sectors to see what it gives, then evaluate
findings." This is the right order for a measurement product — you can't
market a free teaser for a paid tool whose output you haven't validated.
Also aligns with VISION.md year-1 plan: "Publish at least one benchmark
study as flagship content that produces inbound leads."

**Considered.** (a) Free flow first per D003 — rejected; builds a teaser
for an unvalidated product. (b) Skip directly to launching the paid
product on customers — rejected; the rubric weights are starting
hypotheses (per VISION §9), need calibration on real subjects first.

**Affects.** Phase order. Phase 3 (free flow) is deferred indefinitely.
Phase 4 (paid pipeline) becomes the next build target, but in a stripped
form: no Stripe webhook, no Inngest async, no customer pages — just the
core pipeline plus a way to invoke it on demand. Wrapping comes later.

See `AVI_INDEX_REPORT.md` (to be written) for the plain-English flow.

---

## D004 — Build the ops monitor first, before any customer-facing AVI work

**Date:** 2026-06-06
**Status:** Locked

**Decision.** Build the AVI operations monitor (per-call logging + weekly
summary email + 95% out-of-band spend alerts) before rebuilding the free
Readiness Check (Phase 3) or the paid Index Report pipeline (Phase 4).
This supersedes the strict Phase 2 → 3 → 4 sequence in `AVI_BUILD_PLAN.md` §5.

The monitor's three jobs:
1. Log every external API call (LLM, search, email) to a new `api_calls`
   table — provider, tokens, cost estimate, status, latency, link to
   triggering submission.
2. Email a weekly summary every Monday 8:00 AM Pacific covering last week's
   spend per provider, traffic, conversion, anomalies. Calm by default;
   `[HEADS UP]` subject prefix if any provider crosses 80% of monthly cap.
3. Send an immediate out-of-band alert email when any provider crosses 95%
   of its monthly cap, regardless of cadence. Only fires when something's
   wrong.

**Why.** With $25/mo caps on Anthropic and OpenAI (no auto-reload), a single
bad-faith script or viral post could burn the monthly budget in an
afternoon. When a cap hits 100% the API key stops responding and the free
scan fails for customers. Per-call logging is also necessary infrastructure
for everything that comes after — the paid Index Report needs to know its
own per-audit cost, drift monitoring (Phase 5) reads the same data. Building
the monitor first is buying the safety rail before driving on the road.

**Considered.** (a) Build free scan first per the build plan — rejected;
unsafe to ship without logging. (b) Build a simpler logging-only layer
without the email — rejected; you'd never look at it. (c) Defer to Phase 5
when the build plan calls for monitoring — rejected; too late.

**Affects.** Build order. The monitor adds ~8.5 hours of code time and ~$0
runtime cost. It uses Vercel Cron (already on stack) and Resend (already
set up). No new vendor signups required.

See `AVI_OPS_MONITOR.md` for the plain-English flow.

---

## D003 — Build scope: free flow first, then paid

**Date:** 2026-06-06
**Status:** Locked

**Decision.** Build the free AI Readiness Check end-to-end and prove it works
before starting the paid AI Visibility Index Report pipeline. Phases 1–3 of
`AVI_BUILD_PLAN.md` go first; Phase 4 (paid) follows once the free flow is
tested and stable.

**Why.** Free flow is shorter, simpler, validates the rubric on real subjects,
and is the lead-magnet — it has to work first regardless of paid pipeline
state. Sequential build is also easier to debug: fewer moving pieces in
flight at any time. Same total effort as parallel build, less risk.

**Considered.** Parallel build (faster to single launch event but harder
to test cleanly); free flow only (defer paid until demand validates — too
narrow; the report is the core revenue driver).

**Affects.** All of Phase 2+ sequencing. No copy updates to `/ai-visibility`
until both flows work.

---

## D002 — Rubric variant: Option 2 — seven-dimension subject-adaptive

**Date:** 2026-06-06
**Status:** Locked

**Decision.** The AVI rubric uses six universal dimensions plus a seventh
that toggles by subject type — "Founder & Author Signal" for personal
brands, "Methodology & Offer Definition" for companies.

**Why.** Marketing payoff is stronger when the segmentation between
personal-brand and company subjects is named explicitly. Two distinct radar
shapes (personal vs. company) make reports more legible and the buyer hook
louder. Tracks `VISION.md` section 3, which calls out personal brands as a
named segment.

**Considered.** Option 1 (six-dimension calibrated hybrid — single radar
shape, cleaner math, brand language preserved in sub-scores). Option 1 is
the fallback if Option 2's two-shape complexity bites operationally; the
math under each is the same skeleton (drivers/outcome split, 0–5 anchored
scales, weighted composite).

**Affects.** `AVI_AGENT_DESIGN_v2.md` (rubric prompts), `lib/avi/scoring.ts`
(subject-type detection + dimension routing), report template (two layouts),
on-page copy.

---

## D001 — Pipeline architecture: deterministic orchestration, no autonomous agent

**Date:** ~2026-05-27 (originally captured in `AVI_BUILD_PLAN.md` §2)
**Status:** Locked

**Decision.** The AVI pipeline is deterministic code (Inngest functions),
not an autonomous orchestrating agent. LLM calls happen at bounded points
only: structured extraction per query response, LLM-as-judge per driver
dimension. Every LLM call: temperature 0, JSON mode where supported,
schema-validated, raw inputs and outputs logged.

**Why.** Measurement systems must be reproducible. Replay against logged
inputs must return the same result. An orchestrating agent destroys that.
Reproducibility is what makes the measurement defensible to a paying client
("two analysts converge on the same score; here's why").

**Considered.** "4 agents + 1 orchestrator" framing from `AVI_AGENT_DESIGN.md`
v1.0 — rejected.

**Affects.** All AVI code. The four modules from v1.0 (Crawler, Query,
Scoring, Report) are now plain modules, not autonomous agents. The "agent"
language is removed from internal docs (it persists in the v1.0 design doc,
now deprecated).
