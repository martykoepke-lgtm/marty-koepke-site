# Decisions

Architectural and product decisions in chronological order. Newest at top.
Each entry: what we chose, why, what we considered, when we logged it.

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
