# Marty Koepke — Project Context

## Founder

**Marty Koepke (she/her)** — sole founder and operator of Practical Informatics LLC.
Twenty years in healthcare, fifteen-plus in enterprise informatics leadership.
System Clinical Informaticist at CommonSpirit Health. Author of *Between the
Clicks: The Hidden Work of Healthcare Informatics*. Based in Mokelumne Hill,
California. Use **she/her** pronouns throughout the site, schema, copy, and any
AI-facing documentation. Female. Do not assume otherwise based on the name "Marty."

## Canon — read these first

The repo carries a lot of documentation. When canon and code disagree, canon
wins; when two canon docs disagree, the more recent one wins. The current
hierarchy:

| Doc | Role |
|---|---|
| `AI_BUSINESS_ACCURACY_V3_RUBRIC.md` | **V3 source of truth.** Drivers, outcomes, scores, public-vs-paid boundary. |
| `V3_MIGRATION_MAP.md` | The 10-phase plan moving the codebase from V1/V2 to V3. Tells you what to keep, rewrite, and archive. |
| `AVI_OPERATING_STANDARD.md` | How AI is *allowed* to work inside the pipeline. The Retrieve / Constrain / Express pattern. Every LLM-call rule. |
| `AVI_FLOW_FREE.md`, `AVI_FLOW_PAID.md` | Plain-English walkthroughs of the two scan flows. |
| `AVI_OPS_MONITOR.md` | Per-call logging, weekly summary email, 95% spend alerts. |
| `AVI_PIPELINE_REFERENCE.md` | Service-by-service map of the paid pipeline. |
| `VISION.md` | Strategic north star. Voice rules (§10) govern every brand-facing word. §8 is the refusal list. |
| `DECISIONS.md` | Chronological ADR log. Check here when you suspect a design choice already exists. |

Archived in `archive/legacy-v1-v2/` (do not restore, do not copy patterns
from): `AVI_AGENT_DESIGN.md`, `AVI_CUSTOMER_FLOW.md`, `AVI_BUILD_PLAN.md`,
`AVI_FREE_FLOW.md` (old), `AVI_INDEX_REPORT.md`, `AGENTS.md`. See
`archive/README.md` for why each was retired.

## Voice rules

Baseline rules (from VISION.md §10):

- Plain English; no jargon, no buzzwords
- Sentence case headings, not Title Case
- Calm, not urgent — no countdown timers, no "only 3 spots left"
- Honest about uncertainty — "the literature suggests" beats "it is proven"
- Specific over vague — cite the number and the study
- Generous to the reader — footnote sources, link to rubric, show the work

Daizie-specific voice rules (2026-07-11 canon):

- **Written for the operator.** The reader is a small-to-medium business
  owner without a marketing team. They are not an SEO or AI-visibility
  expert. They should never need to become one to act on Daizie's output.
- **Diagnose first, then a specific next step.** Every nudge, every
  recommendation follows the pattern: "here's what's happening → here's
  the concrete move." Never just a score.
- **Cite the mechanism when it earns credibility.** One clause of "why
  this works" earns trust without becoming a research paper. Never
  fabricate a statistic.
- **Warm and human, not automated.** The whole point is that a person —
  Marty — reads the paid report herself. The voice should feel like a
  human wrote it, even in the free scan.
- **Business-type aware.** Coaches, consultants, agencies, retail, service
  businesses, product companies, and SaaS founders all need different
  moves. Never pretend they're all the same.

## What This Is

Practical Informatics LLC's public-facing product is **Daizie** — a
research-backed, rubric-based AI visibility assessment for small and
medium businesses. The canonized positioning (as of 2026-07-11):

**Who Daizie is for.** Small-to-medium business owners — coaches,
consultants, agencies, brick-and-mortar shops, service businesses,
product companies, SaaS founders. Owners without marketing teams. Not
SEO or AI-visibility experts. Any business type, any archetype.

**What Daizie does.** Shows business owners what AI systems actually see
about their business today, then gives them specific, tangible
optimizations to help ChatGPT, Claude, Perplexity, and Gemini find them,
understand them, and recommend them accurately when someone in their
zone-of-fit searches.

**The wedge.** Not a monitoring dashboard. Not a scoring engine. Not a
template. A diagnosis and a targeted playbook — calibrated by Marty
personally on the paid tier because a coach and a SaaS company need
different moves. Every recommendation tied to a research-backed reason
it works. Personal touch, not a SaaS layer.

**The sibling product.** Craizie — practical AI governance for small
businesses using or selling AI-enabled tools. Marketing page exists;
product not yet built.

Marty's broader healthcare-informatics, speaking, and writing work lives at a
separate site, **martykoepke.com** — cross-linked here, not featured.

**Live URL:** https://www.martykoepke.com

### The AI Visibility offer ladder (current reality — 2026-07-11)

The site `/ai-visibility` page presents:

1. **Free AI Readiness Check** — $0. URL-only, ~30s. On-screen result +
   email-gated tokenized report. Reports readiness only; must never claim
   live AI mentions or recommendations.
2. **Daizie AI Visibility Assessment** — $895 one-time. The paid product.
   Four engines tested (ChatGPT, Claude, Perplexity, Gemini), eight
   buyer-question queries, 32 live AI responses captured, every claim
   verified against real sources, two named competitors plotted on a
   Readiness × Visibility quadrant. Three readiness fixes + three accuracy
   fixes, separated. Includes 30-minute review call with Marty.
3. **Optimizations + Remeasure** — $4,100 add-on to the Assessment
   ($4,995 all-in). Marty implements or coordinates the priority fixes
   from the Assessment across the customer's site, profiles, and
   third-party sources; re-runs the full 32-response measurement; and
   delivers a delta report. 4–6 week engagement. Only available as an
   add-on to the Daizie AI Visibility Assessment.
4. **Monthly Monitoring** — $197/month, available only after the
   Assessment. Full Assessment re-run monthly with trends dashboard across
   all 11 measurements.

**Product naming rule (2026-07-12 canon):**
- **Customer-facing product name — the ONE name:** "Daizie AI Visibility
  Assessment." Never call the product "AI Business Accuracy Audit" or
  "AI Business Accuracy Assessment." Those are retired.
- **Internal mechanism names — keep as-is:** "AI Business Accuracy
  Score," "AI Business Accuracy Index," "AI Business Accuracy" (as the
  scoring framework/rubric name). These describe *what happens inside*
  the Assessment, not the product itself.

**Pricing source of truth:** `apps/site/public/Marty-Koepke-Pricing-Structure.md`.
On-page copy in `apps/site/lib/content.ts` must match. Any pricing question
in a live conversation: verify before quoting.

**Superseded ladder (do not restore):** Earlier drafts named an
"AI Visibility Snapshot" at $495 and an "AI Business Accuracy Audit" at
$1,950. Both retired. Do not reintroduce.

## V3 scoring model (summary)

V3 has **two scoring layers** and **one headline Index built from three
underlying scores**. Do not collapse readiness and outcomes into a
single generic visibility score. The full rubric is in
`AI_BUSINESS_ACCURACY_V3_RUBRIC.md` (internal only — the public rubric
doc has been removed from `apps/site/public/` per the 2026-07-12
methodology decision).

**Readiness drivers** (used by free + paid):
1. Business Clarity
2. Source Support
3. AI Readability
4. Distinctive Point of View
5. Recommendation Fit

**Measured AI outcomes** (paid only — require live AI prompts + claim
verification):
1. Visibility
2. Representation Accuracy
3. Claim Support
4. Context Preservation
5. Recommendation Quality
6. Stability

**Public scores:**
- AI Visibility Score = 70% Visibility + 30% Stability
- AI Business Accuracy Score = 30/25/20/15/10 across Representation,
  Claim Support, Context, Recommendation, Stability
- AI Readiness Score = 25/25/20/15/15 across the five readiness drivers
- AI Business Accuracy Index (composite) = 45% Accuracy + 30% Visibility +
  25% Readiness

The free scan must report *readiness only*. It must not claim that AI
systems mention or recommend the business — those are live-outcome claims
that require the paid audit.

## Repository shape — monorepo

This is a turbo monorepo (`turbo.json`, npm workspaces). Three packages:

| Workspace | Path | Purpose |
|---|---|---|
| `site` | `apps/site/` | Public marketing site + `/scan` free flow + `/ai-visibility/*` + admin viewer. Next.js (App Router), Tailwind v4, Framer Motion. Deployed to Vercel on push to `main`. |
| `console` | `apps/console/` | Authed operator dashboard. Run subjects, view audits, compare, watch spend. Supabase-auth-gated. |
| `@practical-informatics/avi` | `packages/avi/` | Shared engine: crawler, corroboration, query grid, extraction, scoring, persistence. Imported by both apps. |

Top-level scripts (run from repo root):

```bash
npm run dev        # turbo dev across all workspaces
npm run build      # turbo build
npm run typecheck  # turbo tsc --noEmit across all three
npm run site:dev   # site only
npm run console:dev
npm run audit      # CLI audit runner from packages/avi
npm run compare    # CLI compare runner from packages/avi
```

## Where V3 is wired (and where it isn't yet)

V3 code lives in `packages/avi/src/v3/`. Wiring status:

| Surface | Engine | Status |
|---|---|---|
| Console **paid** run (`apps/console/.../subjects/[id]/run/actions.ts`) | `runAuditV3` + `persistAuditV3` | Fully V3 |
| Console **free** run | `runAudit` (V2) | Still legacy — flag before relying on it |
| Admin V3 audit viewer (`apps/site/app/admin/v3-audits/[id]/page.tsx`) | `runAuditV3` | V3 |
| Public `/api/scan` (free) | `runFreeScan` from `v3/free-scan.ts` | **V3 facade over legacy internals.** Calls legacy 7-dim scorer, then maps to V3 drivers by averaging. Score is a relabel, not new math. |
| Public `/api/submissions` (paid teaser) | `runCrawler` from `v1/crawler.ts` | V1 still load-bearing |

The public boundary in `packages/avi/src/index.ts` is the single import
entry for both apps — internal modules import each other via relative paths.

## Site structure (`apps/site/`)

```
apps/site/
├── app/
│   ├── layout.tsx              # Root layout, fonts, ProfessionalService JSON-LD
│   ├── page.tsx                # Home
│   ├── globals.css             # Tailwind v4 @theme palette + base styles
│   ├── icon.png, apple-icon.png
│   ├── robots.ts, sitemap.ts, not-found.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── blog/, blog/[slug]/      # Markdown blog (lib/blog.ts renderer)
│   ├── privacy/, terms/, cookies/, acceptable-use/, returns/
│   ├── ai-visibility/page.tsx          # AVI landing
│   ├── ai-visibility/order/            # Order form
│   ├── ai-visibility/results/[id]/     # Token-gated teaser
│   ├── scan/page.tsx                   # Free scan UI
│   ├── scan/report/[id]/               # Free scan report page
│   ├── admin/audits/[id]/              # V2 admin viewer
│   ├── admin/v3-audits/[id]/           # V3 admin viewer
│   └── api/
│       ├── scan/route.ts               # Free scan handler
│       ├── scan/email/route.ts         # Email-gate handler (Kit + Resend)
│       ├── submissions/route.ts        # Paid teaser intake
│       ├── admin/v3-audits/route.ts    # Run a V3 audit
│       └── cron/                       # Ops monitoring routes
├── components/
│   ├── layout/                  # Navbar, Footer, PolicyPage
│   ├── sections/                # HeroBanner, BuiltThings, Faq, FinalCta
│   ├── motion/                  # Reveal, RouteTransition
│   ├── ui/                      # Section, Button, Icons
│   ├── modals/                  # WorkModal
│   ├── embeds/                  # GetTermsEmbed
│   └── ai-visibility/           # AVI-specific UI (FreeScanFlow, ScanForm, …)
├── lib/
│   ├── content.ts               # All site copy as typed constants
│   ├── links.ts                 # Outbound links + CTAs
│   └── blog.ts                  # Markdown reader/renderer
├── content/blog/                # Markdown posts
├── public/
│   ├── images/                  # Hero, headshot, logo set, work shots
│   ├── llms.txt                 # AI-agent content file (public)
│   ├── AI-Visibility-Index-Rubric-and-Protocol.md
│   ├── AI-Visibility-Learning-and-Citation-Reference.md
│   ├── Marty-Koepke-Pricing-Structure.md   # canonical pricing
│   └── googleefff2183f67c65a4.html
├── brand-assets/
└── vercel.json
```

## Console structure (`apps/console/`)

Operator-only Next.js app. Supabase auth gates everything under `(authed)/`.

```
apps/console/
├── app/
│   ├── (authed)/
│   │   ├── audits/                     # List + detail
│   │   ├── subjects/                   # CRUD + run flow
│   │   ├── compare/                    # Multi-audit comparison
│   │   ├── spend/                      # Cost dashboard
│   │   └── submissions/                # Inbound from /api/submissions
│   ├── account/password/
│   ├── auth/callback/
│   └── login/
├── components/                  # Card, Sidebar, RunAuditForm, PillSelect, …
├── lib/
│   ├── supabase/{server,middleware}.ts
│   └── data/                    # audits, subjects, stats, analytics
└── middleware.ts                # Supabase session refresh
```

## AVI package structure (`packages/avi/`)

```
packages/avi/
├── src/
│   ├── index.ts                 # PUBLIC surface — only entry consumers import
│   ├── v3/                      # V3 modules (rubric, orchestrator, free-scan,
│   │                            # readiness, outcomes, composite, extractor,
│   │                            # claim-verifier, source-evidence, recommender,
│   │                            # persist, queries, synthesizer, types)
│   ├── v1/                      # Legacy crawler (still used by /api/submissions)
│   ├── orchestrator-v2.ts       # V2 paid pipeline (used by console free runs)
│   ├── aggregator-v2.ts, composite-v2.ts, extractor-v2.ts, judge-v2.ts,
│   ├── recommender-v2.ts, render-v2.ts, synthesize-v2.ts
│   ├── free-scan.ts             # Legacy free scan (v3/free-scan.ts wraps this)
│   ├── crawler-v2.ts, corroboration-v2.ts, engine-clients.ts
│   ├── llm.ts, llm-providers/   # Provider clients (Anthropic, OpenAI, Google, Perplexity)
│   ├── persist-audit.ts         # V2 persistence
│   ├── supabase-client.ts       # Service-role admin client
│   ├── turnstile.ts, rate-limit.ts, email.ts, kit.ts, tavily.ts
│   ├── email-templates/
│   ├── subject-loader.ts, subjects (JSON fixtures live in /subjects/v1/)
│   ├── types.ts, json-clean.ts, logging.ts, queries.ts
├── scripts/
│   ├── audit.mts, compare.mts   # CLI runners
│   ├── smoke-crawler.mts, smoke-v3-db.mts, diagnose-v3-recent.mts
├── subjects/v1/                 # Subject JSON fixtures
├── queries/                     # Query template markdown
├── agents/                      # Agent role docs (EXTRACTOR.md, V3_*, etc.)
└── supabase/
    ├── migrations/              # 0001 → 0020. V3 schema lands at 0015.
    ├── SCHEMA_V2.md
    └── SCHEMA_V3.md
```

V3 schema reference: `packages/avi/supabase/SCHEMA_V3.md`. The migration
chain through 0020 covers V3 tables (`audit_claims`,
`audit_claim_verifications`, `audit_source_evidence`,
`audit_outcome_scores`, etc.) plus the V2 → V3 compatibility shims and the
Gemini engine addition.

## Content management

All site copy lives in `apps/site/lib/content.ts` as typed constants —
components never hardcode copy. All outbound links and CTAs live in
`apps/site/lib/links.ts`. `BOOK_CALL_HREF` is the single most important CTA.

## Design direction — "calm canvas, kinetic story"

The visual brand is calm and grounded; **motion is the storytelling layer**,
not decoration. Any new section must pass both tests: does it look calm at
rest, and does motion advance the story rather than ornament it.

**Palette** (defined in `apps/site/app/globals.css` `@theme`):
- Background / cream: `#FAF6EE`; dimmer warm tan: `#F2EBDC` (`cream-dim`)
- Forest green: `#1F3A2E` (primary), `#16291F` (dark)
- Gold: `#C9A961`, `#A8893F` (`gold-dark`), `#6B5424` (`gold-darker`)
- Text: charcoal `#2C2A26`, moss `#5A6B5A`
- Tan hairline: `#D8CCB4`

**Conventions:** quiet serif (Lora) headlines, sentence case, generous
whitespace, no drop shadows, no gratuitous gradients. Sections alternate
tone bands (`cream`, `cream-dim`, `forest`) via the `Section` component.
Motion is slow (~0.6s), eased, scroll-driven — never spring/bounce. All
motion honors `prefers-reduced-motion` (enforced globally in `globals.css`).

## External URLs

| Destination | URL | Notes |
|---|---|---|
| Book a Call (primary CTA) | `https://tally.so/r/xXVPgo` | `BOOK_CALL_HREF` in `lib/links.ts` |
| Contact email | `hello@martykoepke.com` | `CONTACT_EMAIL` |
| martykoepke.com | `https://martykoepke.com` | Cross-linked |
| LinkedIn | `https://www.linkedin.com/in/marty-koepke` | |
| Facebook | `https://www.facebook.com/profile.php?id=61564713020344` | |

## SEO

- JSON-LD: `ProfessionalService` in root layout; `Service` + `FAQPage` on
  the AI Visibility / assessment pages; `ContactPage` on contact
- Open Graph + Twitter Card meta, per-page metadata via `META`
- `robots.ts` + `sitemap.ts` generate `robots.txt` / `sitemap.xml`
- `/llms.txt` linked from `<head>` as an LLM-readable summary — kept in
  sync with the V3 model (five-driver readiness + six measured outcomes)
- Google Search Console verified

## AVI architectural rules — locked

These come from `AVI_OPERATING_STANDARD.md` and DECISIONS.md. Do not
contradict them without a new ADR.

- **AI is an aggregator, not an assessor.** The pipeline never asks an LLM
  to assess. It asks the LLM to *report what was observed*, against a
  human-locked rubric, in a human-defined shape. The math is in code.
- **No autonomous orchestrating agent.** Deterministic pipeline
  orchestration in plain TypeScript. LLM calls are bounded to extraction
  per query response and LLM-as-judge per dimension.
- **Every LLM call:** temperature 0, JSON mode where supported,
  schema-validated output, one bounded job per call, every claim cites
  evidence pointers, "insufficient evidence" is always a valid answer, no
  training-data knowledge of the specific subject, all inputs and outputs
  logged to `api_calls`. Replay against logged inputs must produce the
  same result.
- **Never disable Supabase RLS.** Every table is RLS-enabled in the same
  migration that creates it, and carries an explicit restrictive
  `deny_all_anon_authenticated` policy (`using (false) with check (false)`,
  applied to all tables in migration `0021`) so the "service-role only"
  intent is self-documenting and the security advisor stays clean. The AVI
  app uses service-role-only access through `/api/*` — customers never
  authenticate to Supabase directly. The service role bypasses RLS, so the
  deny-all policies have no runtime effect on it; they only lock out the
  `anon` and `authenticated` roles.
- **Rubric version stamped on every audit row.** `AVI_RUBRIC_VERSION`
  (V2) and `AVI_V3_RUBRIC_VERSION` (V3). Bump when scoring prompts or
  anchored scales change. Old audits stay reproducible against their own
  version.
- **Cost ceilings + ops monitor.** Set hard daily caps in every LLM
  vendor dashboard. Per-call logging + weekly summary email + 95%
  spend alert run on cron — see `AVI_OPS_MONITOR.md`. Touch with care.
- **Never commit `.env.local`.** `.env.example` (root) and
  `apps/console/.env.example` enumerate the keys the runtime expects.
- **Free scan reports readiness only.** Must not claim AI mentions or
  recommends the business — those are live-outcome claims that require a
  paid audit. The boundary is defined in
  `AI_BUSINESS_ACCURACY_V3_RUBRIC.md` §Free Vs Paid Boundary.

## Deployment

Vercel. Push to `main` triggers auto-deploy of `apps/site`. The console
deploys separately. The AVI runtime needs API keys in Vercel env vars
(Anthropic, OpenAI, Google AI, Perplexity, Supabase, Resend, Kit, Tavily,
Turnstile) — add them in the Vercel dashboard when ready to enable paid
flows.
