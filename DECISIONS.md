# Decisions

Architectural and product decisions in chronological order. Newest at top.
Each entry: what we chose, why, what we considered, when we logged it.

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
