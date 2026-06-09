# AI Visibility Index (AVI) — Agent System Design

> ## ⚠ DEPRECATED — v1.0 (2026-05-27), superseded
>
> This document is the **v1.0 design**. It does **not** reflect current
> architecture or product decisions. Significant differences:
>
> | v1.0 (this doc) | v2.0 (current canon) |
> |---|---|
> | "4 agents + 1 orchestrator" | Deterministic pipeline of 7 services, no autonomous agents (`DECISIONS.md` D001) |
> | Rubric A — six dimensions with archetype weights | Option 2 — seven-dim subject-adaptive (`DECISIONS.md` D002) |
> | Build free flow first, then paid | Build full tool first (CLI-driven), free flow deferred (`DECISIONS.md` D005) |
> | Pricing $497 / $2,997 / $397/mo | Pricing $1,000 / $3K–$5K / $600/mo (`VISION.md` §6) |
> | 8-field free-scan form | URL-only (when free flow is eventually rebuilt) |
> | Wizard-of-Oz MVP, Marty hand-runs first 20 | Fully automated, CLI-driven for Marty's own evaluation |
>
> **For the current architecture, read:**
> - `VISION.md` — strategic direction (2026-06-06)
> - `DECISIONS.md` — D001–D005 architectural + product decisions
> - `AVI_BUILD_PLAN.md` §6 — complete change log from this doc
> - `AVI_INDEX_REPORT.md` — full tool walkthrough (v2.0, current)
> - `AVI_OPS_MONITOR.md` — ops monitor walkthrough (shipped)
>
> Kept in the repo as historical reference. **Not safe to use as a build guide.**

---

**Document owner:** Marty Koepke, Practical Informatics LLC
**Status:** v1.0 — ready for Claude Code implementation
**Reference output:** `avi-report-practical-informatics.pdf` (the prototype report, hand-built in chat for Practical Informatics LLC — serves as the example deliverable the system must produce)

---

## 1. Executive Summary

The AI Visibility Index (AVI) is a productized service that audits a business's visibility to AI agents (ChatGPT, Claude, Perplexity, Gemini). It scores the business across six dimensions, runs live queries against real AI systems, compares them to competitors, and produces an actionable report.

The product has three stacked offerings:

- **Free AI Visibility Scan** — a 30-second lead-magnet teaser that returns an immediate preliminary score and gates an email-delivered full report behind a $497 unlock.
- **AI Visibility Report ($497)** — the full ~12-page audit + a 30-minute walk-through call.
- **Agentic Readiness Sprint ($2,997)** — two-week done-for-you implementation of the report's recommendations, plus a 60-day re-scan.
- **AI Visibility Monitoring ($397/mo)** — ongoing monthly re-scans, AI-mention tracking, schema maintenance.

The lead magnet runs on a Wizard-of-Oz architecture in the MVP: the user-facing experience is interactive (URL → instant preliminary score → "full report in 24 hours"), but the deep audit is delivered manually by Marty in the first 20–30 audits. Once the methodology is validated, the audit engine is automated.

---

## 2. The Product

### 2.1 What it is

A web application at `practicalinformatics.com/ai-visibility` that:

1. Captures a visitor's company URL and basic context (industry, competitors, location).
2. Runs a fast preliminary scan of their site (schema, llms.txt, robots.txt, basic content) and computes a teaser score in real time.
3. Captures the visitor's email and shows them the teaser score with 2–3 surface findings.
4. Emails them within 24 hours with a "full audit unlock" CTA at $497.
5. After payment, generates and delivers the full audit report — including live LLM queries, competitor comparison, prioritized fixes, projected post-fix score.
6. Schedules a 30-min walk-through call with the customer.
7. Offers the $2,997 Sprint as the upsell on the call.

### 2.2 The wedge

Most "AEO" / "AI SEO" tools either (a) score on surface-level structured data only, or (b) target enterprise. The AVI's differentiator is **the live AI test** — real, captured outputs from ChatGPT/Claude/Perplexity/Gemini queried about the business and its competitors. That's the visceral moment that closes customers.

---

## 3. Business Model & Pricing Tiers

| Tier | Price | What's included |
|---|---|---|
| Free Scan | $0 | Email-gated teaser score, 2–3 surface findings. Lead capture only. |
| AI Visibility Report | $497 | Full audit (~12 pages), live LLM queries, competitor comparison, prioritized fix list, 30-min walk-through call. |
| Agentic Readiness Sprint | $2,997 | Done-for-you implementation of the report's recommendations over 2 weeks. Includes schema work, llms.txt, GBP setup, founder dossier, Person/Service schema, Wikidata entries, agent permissions. Plus 60-day re-scan. |
| AI Visibility Monitoring | $397 / month | Monthly re-scans, AI mention tracking across LLMs, schema/llms.txt maintenance, quarterly content recommendations. |

---

## 4. User Journey (End-to-End)

```
┌──────────────────────────────────────────────────────────────────────┐
│ STAGE 1 — Discovery (LinkedIn, organic search, referral)             │
│ Visitor lands on /ai-visibility                                       │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STAGE 2 — Free Scan                                                   │
│ Visitor enters: URL, email, name, industry, location, competitors     │
│ Frontend shows 8–12 sec "scanning..." animation                       │
│ Crawler agent does live HTML check (schema, llms.txt, robots.txt)     │
│ Returns preliminary score + 2–3 surface findings                      │
│ Email captured to database; transactional email sent to visitor       │
│ Marty notified via email of new submission                            │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STAGE 3 — Full Audit (within 24 hours)                                │
│ Manual (MVP): Marty runs the deep audit (LLM queries, scoring, fixes) │
│ Automated (V2): Agent system runs the full pipeline                   │
│ Email sent to visitor with the teaser report + $497 unlock CTA        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STAGE 4 — Unlock & Pay                                                │
│ Visitor clicks the unlock CTA → Stripe Payment Link → pays $497       │
│ Confirmation page on /ai-visibility/scheduled                         │
│ Calendar booking embed (Tally or Cal.com) for the 30-min call         │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STAGE 5 — Full Report Delivery                                        │
│ Customer receives full ~12-page PDF report via email                  │
│ Plus a hosted /reports/[id] URL they can revisit                      │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STAGE 6 — Walk-through Call (30 minutes)                              │
│ Marty walks the customer through the report                           │
│ Natural upsell to the $2,997 Sprint when fit applies                  │
│ Or upsell to the $397/mo Monitoring if they want ongoing              │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ STAGE 7 — Re-scan (60 days later, free for $497 buyers)               │
│ Customer gets a follow-up email; their AVI is re-scored               │
│ Shows the lift; reinforces the value; opens door to next engagement   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. The Agent System (4 Agents + 1 Orchestrator)

The audit pipeline is decomposed into four specialist agents plus a coordinator. Each agent has clear inputs, outputs, and tool access. The orchestrator sequences them.

### 5.1 Crawler Agent

**Job:** Fetch and parse the target business's web presence.

**Inputs:**
- Target URL (e.g., `https://example.com`)
- Optional competitor URLs

**Tools:**
- Playwright (headless browser, JS-rendered content)
- `fetch` for robots.txt, llms.txt, sitemap.xml
- Schema.org JSON-LD parser
- HTML/OpenGraph meta extractor

**Outputs (JSON):**
```typescript
{
  url: string,
  fetchedAt: ISO8601,
  status: number,
  title: string,
  metaDescription: string,
  ogTags: Record<string, string>,
  schemaBlocks: JsonLd[],
  llmsTxt: string | null,
  robotsTxt: string,
  agentBotsAllowed: { gptbot: bool, claudebot: bool, perplexitybot: bool, googleExtended: bool, ccbot: bool },
  faqSchemaPresent: bool,
  personSchemaPresent: bool,
  serviceSchemaPresent: bool,
  organizationSchemaPresent: bool,
  sameAsLinks: string[],
  hasGoogleBusinessProfile: bool | "unknown",
  internalLinks: string[],
  outboundLinks: string[],
}
```

### 5.2 Query Agent

**Job:** Run live queries against AI systems and capture their responses about the business.

**Inputs:**
- Business name
- Industry
- Location
- Competitor names (optional)
- Custom queries

**Tools:**
- OpenAI API (gpt-4o or current model)
- Anthropic API (claude-sonnet-4 or current)
- Perplexity API
- Google Gemini API
- (Optional) Brave Search API for cross-reference

**Default query set** (executed for every audit):
1. "Tell me about [Business Name]."
2. "Who is [Founder Name] of [Business Name]?"
3. "Best [industry] in [location]. Who should I call?"
4. "I need help with [problem]. Who do you recommend?"
5. "Compare [Business Name] and [Competitor 1]."
6. "Is [Business Name] reputable?"
7. "What is [signature methodology, e.g., 'the Time Back Assessment']?"

**Outputs (JSON):**
```typescript
{
  queries: Array<{
    query: string,
    model: "gpt-4o" | "claude-sonnet-4" | "perplexity" | "gemini",
    response: string,
    capturedAt: ISO8601,
    businessMentioned: bool,
    competitorMentioned: { name: string, mentioned: bool }[],
    accuracy: "accurate" | "partial" | "outdated" | "missing",
    sentiment: "positive" | "neutral" | "negative" | "missing",
    rawTokenCount: number,
  }>
}
```

### 5.3 Scoring Agent

**Job:** Take the Crawler + Query outputs and compute the AVI score across the six dimensions.

**Inputs:** Outputs of Crawler Agent and Query Agent. Plus business archetype (Solo Expert / Young Practice / Established / Mature).

**Tools:** Pure computation (no external calls).

**Outputs (JSON):**
```typescript
{
  archetype: "solo-expert" | "young-practice" | "established" | "mature",
  dimensions: {
    founderCredibility: { score: number, max: number, findings: string[] },
    liveAITest: { score: number, max: number, findings: string[] },
    entityClarity: { score: number, max: number, findings: string[] },
    methodologyDepth: { score: number, max: number, findings: string[] },
    structuredData: { score: number, max: number, findings: string[] },
    agentCitationGraph: { score: number, max: number, findings: string[] },
  },
  totalScore: number,        // 0-100
  tier: "Agent-Ready" | "Discoverable" | "Faintly Visible" | "Hidden" | "Invisible",
  projectedScoreAfterFixes: number,
  topFixes: Array<{
    title: string,
    priority: "high" | "med" | "low",
    effortHours: number,
    impactPoints: number,
    description: string,
    whyItMatters: string,
  }>,
}
```

See **Section 8 — AVI Scoring Methodology** for the per-archetype weights and per-dimension rules.

### 5.4 Report Agent

**Job:** Generate the polished, branded report deliverable.

**Inputs:** Outputs of all three prior agents.

**Tools:**
- HTML template renderer (React Server Components or a templating engine)
- WeasyPrint or Puppeteer (HTML → PDF)
- Storage (Supabase Storage or S3-compatible) for the PDF

**Outputs:**
- HTML report at `/reports/[id]` (public hosted URL, signed access token)
- PDF mirror at `/reports/[id]/pdf` (downloadable)
- Email-ready summary HTML

**Report structure** (must match the reference PDF `avi-report-practical-informatics.pdf`):
1. Cover — AVI Score (big number) + tier
2. Executive Summary (1 page)
3. Live AI Test — 4–6 query result boxes with screenshots/text + analysis
4. Six Dimensions Scorecard — radar chart + 6 dimension cards
5. Competitor Comparison — table comparing target vs. 2 competitors
6. Prioritized Fix List — top 10 with effort/impact/priority pills
7. Projected Score (with visual "now → 60 days" element)
8. The Sprint upsell ($2,997) — CTA block
9. Methodology appendix

### 5.5 Orchestrator

**Job:** Sequence the agents and persist outputs.

**Sequence:**
```
[trigger: paid submission]
  → Crawler Agent (target URL, competitor URLs)  [parallel possible]
  → Query Agent (business name, industry, etc.)  [parallel with Crawler]
  → Scoring Agent (combines outputs)
  → Report Agent (renders HTML + PDF)
  → Email Service (delivers report)
  → Database write (audit complete)
```

For the **MVP**, the Orchestrator is essentially Marty. She reviews the submission, manually runs the audit, and uses the system to generate the report. For **V2**, the Orchestrator is an automated pipeline triggered by Stripe webhook.

---

## 6. Web App Surfaces

These are the pages humans see. Built in Next.js App Router, integrated into the existing `PracticalInformatics` site.

### 6.1 `/ai-visibility` — Landing Page

**Purpose:** Frame the product, capture intent, lead to the scan form.

**Sections:**
1. Hero — *"When AI agents are asked about your industry, are you visible?"* — visible scan widget (or CTA into it).
2. The problem — short explanation of why AI visibility matters now.
3. What gets measured — the 6 dimensions in approachable language.
4. Tiered pricing visible — Report / Sprint / Monitoring tiers with prices.
5. Who this is for / not for.
6. About Marty — credibility block.
7. FAQ.
8. Secondary CTA — book a call directly (for those who prefer to talk).

### 6.2 `/ai-visibility/scan` — The Free Scan Form

**Purpose:** Capture URL + email + minimal context. Trigger Crawler Agent for instant preliminary score.

**Form fields:**
- URL (required)
- Email (required)
- First name (required)
- Industry / what you do (required; one-line text or dropdown)
- Location (optional; country/state)
- Two competitor URLs (optional) OR checkbox "Find 2 for me"
- "What's the one query you wish AI would answer with you as the top result?" (optional)

**Flow:**
1. User submits form.
2. Server-side: write to database, send notification email to Marty.
3. Trigger Crawler Agent on the target URL with a 10-second timeout.
4. Show "scanning..." animation for ~8–12 seconds.
5. Redirect to `/ai-visibility/results/[id]`.

### 6.3 `/ai-visibility/results/[id]` — Teaser Results Page

**Purpose:** Show the visitor a partial score + 2–3 findings + a clear next step.

**Content:**
- Preliminary AVI Score (large, color-coded by tier)
- 2–3 detected issues from the Crawler Agent (e.g., "No FAQ schema found," "robots.txt does not allow GPTBot")
- A "What's missing from this teaser" section listing what's in the paid report: *live AI queries against ChatGPT/Claude/Perplexity/Gemini, competitor comparison, prioritized fix list, projected score, 30-min walk-through call*.
- CTA: "Your full report and 30-min walk-through call — $497. Delivered within 24 hours." → Stripe Payment Link.
- Secondary: "Or, I'll email you the teaser report by tomorrow." (no-action path; lets Marty follow up.)

### 6.4 `/ai-visibility/scheduled` — Post-Payment Confirmation

**Purpose:** Confirm payment, embed calendar for the 30-min call, manage expectations.

**Content:**
- "Payment confirmed. Your full report is on the way."
- Tally / Cal.com calendar embed for the 30-min call.
- Expected timeline: "Your full report will arrive within 24 hours. Your walk-through call can be scheduled below."
- Receipt info.

### 6.5 `/reports/[id]` — Hosted Report

**Purpose:** A permanent, shareable URL for the full report (with signed access token).

**Content:** The full HTML report (see Section 5.4 / Report Agent).
**Access:** Tokenized URL stored in DB; expires 6 months after delivery; customer can request renewal.

---

## 7. Data Model

### 7.1 Submissions

```sql
create table submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  url text not null,
  email text not null,
  first_name text not null,
  industry text not null,
  location text,
  competitor_urls text[],
  find_competitors_for_me bool default false,
  target_query text,
  preliminary_score int,
  preliminary_findings jsonb,
  status text default 'new'  -- new | teaser_sent | paid | full_report_sent | call_complete | sprint_sold | monitoring_active
);
```

### 7.2 Audits

```sql
create table audits (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id),
  created_at timestamptz default now(),
  archetype text,
  crawler_output jsonb,
  query_output jsonb,
  scoring_output jsonb,
  total_score int,
  tier text,
  projected_score int,
  fixes jsonb,
  report_html_path text,
  report_pdf_path text
);
```

### 7.3 Payments

```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id),
  created_at timestamptz default now(),
  stripe_payment_intent text,
  amount_cents int,
  product text  -- 'report' | 'sprint' | 'monitoring_first_month' | 'monitoring_recurring'
);
```

### 7.4 RLS notes

All tables should have Row Level Security enabled. Submissions and audits are only accessible to:
- The owner (matched by email or signed access token)
- The service role (server-side audit pipeline)

Never expose raw submission data via client-side queries.

---

## 8. AVI Scoring Methodology

### 8.1 Archetypes and Weights

| Dimension | Solo Expert / Pre-revenue | Young Practice (1–3 yr) | Established Local (3+ yr) | Mature / Multi-location |
|---|---|---|---|---|
| Founder Credibility | 25 | 20 | 10 | 5 |
| Live AI Test | 20 | 20 | 20 | 20 |
| Entity Clarity | 15 | 15 | 15 | 15 |
| Methodology Depth | 15 | 15 | 15 | 15 |
| Structured Data | 15 | 15 | 15 | 20 |
| Agent + Citation Graph | 10 | 15 | 25 | 25 |
| **Total** | **100** | **100** | **100** | **100** |

### 8.2 Tier mapping

- 80–100: **Agent-Ready** — AI surfaces and recommends the business accurately.
- 60–79: **Discoverable** — AI knows the business but may have outdated info.
- 40–59: **Faintly Visible** — sometimes mentioned, often missed.
- 20–39: **Hidden** — rarely surfaced.
- 0–19: **Invisible** — AI doesn't know it exists.

### 8.3 Per-dimension scoring rules

#### Founder Credibility (25 pts for Solo Expert)
- Founder named on site + LinkedIn URL in schema sameAs (5)
- Person schema with credentials, knowsAbout, hasOccupation (5)
- Verifiable employment history (3)
- Published work (book, articles, talks) findable (4)
- Quantified outcomes on site (4)
- Cross-linked personal site / Wikipedia / Wikidata entry (4)

#### Live AI Test (20 pts)
- Business correctly identified in "Tell me about X" query across 4 LLMs (5)
- Correct industry / offer description (5)
- Surfaces in "Best [industry] in [location]" query (5)
- Correctly disambiguated from similar entities (3)
- Mentioned favorably vs. competitors in comparison query (2)

#### Entity Clarity (15 pts)
- NAP consistent on site + GBP + LinkedIn (3)
- Founder identity unambiguous (gender, pronouns, role in schema) (3)
- No domain confusion (no lookalike domains in indexes) (3)
- Clear single-sentence description findable in 3 seconds (3)
- Geographic specificity (3)

#### Methodology Depth (15 pts)
- Named methodology / framework (3)
- Pricing transparency (2)
- Who-it's-for and who-it's-not-for content (3)
- FAQ depth with schema markup (3)
- Service pages with definitions (4)

#### Structured Data (15 pts)
- Organization schema present and valid (3)
- Person schema for founder, linked to Org (3)
- Service schema with offers + price (3)
- FAQPage schema (2)
- Comprehensive sameAs links (2)
- OG/Twitter cards complete (2)

#### Agent + Citation Graph (10 pts for Solo Expert)
- robots.txt allows major AI bots explicitly (2)
- llms.txt present and well-structured (2)
- LinkedIn presence + Facebook presence (2)
- External directory listings (BBB, Chamber, Yelp) (2)
- Press mentions / backlinks (2)

### 8.4 Fix prioritization formula

Each fix is rated by:
```
priority_score = (impact_points * 10) / effort_hours
```

Fixes with priority_score > 8 are **high**, 3–8 are **medium**, < 3 are **low**.

The top 10 fixes (by priority_score) appear in the report.

---

## 9. Report Specification

The report must match the structure of `avi-report-practical-informatics.pdf` (the reference output uploaded with this design doc).

### 9.1 Branding (carried from Practical Informatics site)

- Colors: `--cream: #FAF6EE`, `--forest: #1F3A2E`, `--gold: #C9A961`, `--charcoal: #2C2A26`, `--moss: #5A6B5A`, `--tan: #D8CCB4`
- Fonts: Lora (serif headlines), Inter (sans body)
- Logo: `practicalinformatics.com` horizontal logo on cover and footer
- Aesthetic: calm, warm, foothills

### 9.2 Required sections (in order)

1. **Cover** — Big AVI score, tier label, customer name, date, Practical Informatics branding.
2. **Executive Summary** — 1-page plain-English summary; headline finding; what's working; what's losing ground; top 3 moves.
3. **Live AI Test** — 4–6 boxed query results with: the query text, what AI returned (paraphrased or quoted), tagged "outdated/invisible/partial credit/entity error/missing achievement."
4. **Six Dimensions Scorecard** — Radar chart SVG; six dimension cards with score, progress bar, plain-English assessment.
5. **Competitor Comparison** — Table comparing target vs. 2 competitors across: AVI estimate, location, AI surfacing, pricing visibility, founder named, quantified outcomes, local SEO, methodology, book/published work.
6. **Prioritized Fix List** — Top 10 fixes; numbered cards with title, priority pill, effort estimate, body explaining the fix, "Why it matters" line.
7. **Projected Score** — Visual "now (X) → 60 days (Y)" comparison; bulleted "What 'Agent-Ready' looks like for you" list.
8. **Sprint Upsell** — Gold CTA block with the $2,997 Sprint pitch and a "Book a 20-min call" button.
9. **Methodology Appendix** — How the AVI is calculated, dimension weights table, tier mapping.

### 9.3 Outputs

- **HTML** (`/reports/[id]`) — branded, responsive, signed-token-protected URL.
- **PDF** (`/reports/[id]/pdf`) — rendered via WeasyPrint (used in the reference PDF) or Puppeteer.
- **Email summary** — 1-page condensed HTML version sent as the report-delivery email body, with link to full report.

---

## 10. Integrations

### 10.1 Stripe

- **MVP:** Stripe Payment Links (one for the Report, one for the Sprint, one for Monitoring). No code. Manual receipt-of-payment notification triggers the next step.
- **V2:** Stripe Checkout via API + Stripe Webhooks to automate the full-report trigger.
- Environment: `STRIPE_SECRET_KEY` (Vercel env, server-side only — never NEXT_PUBLIC_), `STRIPE_PUBLISHABLE_KEY` (browser-safe).
- Test mode for development.

### 10.2 Email

- **MVP:** Gmail templates, manually sent by Marty.
- **V2:** Resend (https://resend.com) — transactional email with React Email templates.
- Required emails:
  - Submission confirmation (instant, to visitor)
  - New submission alert (to Marty)
  - Teaser report delivery (24-hr SLA)
  - Payment confirmation (instant)
  - Full report delivery (post-payment)
  - Calendar reminder (24 hr before call)
  - Post-call follow-up
  - 60-day re-scan invitation

### 10.3 LLM APIs

| Provider | Model | SDK | Env var |
|---|---|---|---|
| OpenAI | gpt-4o | `openai` npm package | `OPENAI_API_KEY` |
| Anthropic | claude-sonnet-4 | `@anthropic-ai/sdk` | `ANTHROPIC_API_KEY` |
| Perplexity | llama-3.1-sonar-large-128k-online | OpenAI-compatible API | `PERPLEXITY_API_KEY` |
| Google | gemini-2.0-flash | `@google/generative-ai` | `GOOGLE_API_KEY` |

All keys are **server-side only** (no `NEXT_PUBLIC_` prefix). All API calls happen in Edge or Node API routes.

Budget per audit: ~$0.50–$2.00 in API costs at depth.

### 10.4 Web Crawling

- **Playwright** (https://playwright.dev) for JS-rendered content
- Run in a serverless function (Vercel) or background worker
- Timeout: 15 seconds per page
- Cache results for 7 days per URL

### 10.5 Google Sheets (MVP data store) → Supabase (V2)

- **MVP:** Apps Script webhook writes submissions to a Google Sheet. Marty manages the audit pipeline manually from the sheet.
- **V2:** Migrate to Supabase (Postgres + Storage + Auth). Submissions, audits, payments all live in Supabase.

---

## 11. MVP vs V2 Phasing

### 11.1 MVP (target: launch in 2 weeks)

| Component | MVP scope |
|---|---|
| Landing page (`/ai-visibility`) | Full design, copy, pricing visible |
| Scan form (`/ai-visibility/scan`) | Submission to Google Sheet via Apps Script |
| Preliminary scan | Real lightweight Crawler Agent runs in 10s; returns ~5 auto-detectable findings |
| Teaser results page | Real score; lists missing report sections to entice upgrade |
| $497 unlock | Stripe Payment Link (no webhook); Marty manually triggers next step |
| Full audit | Manual; Marty runs the 4 agents' work by hand, fills a template |
| Report | Templated HTML + PDF (WeasyPrint), filled in by Marty |
| Calendar | Tally (already wired) for the 30-min call |
| Email | Gmail drafts; Marty sends each manually |

### 11.2 V2 (target: after 20 paid audits validated)

| Component | V2 scope |
|---|---|
| Data store | Supabase Postgres; migrate Google Sheet rows |
| Submissions | Stored in Supabase with RLS |
| Crawler Agent | Production Playwright pipeline; cached results |
| Query Agent | Real-time LLM API calls; screenshots captured |
| Scoring Agent | Automated computation; refined rubric from 20 audits |
| Report Agent | Auto-generated HTML/PDF on Stripe webhook |
| Email | Resend + React Email templates |
| Stripe | Checkout + Webhook integration |
| Dashboard | Internal admin dashboard for Marty to monitor audits |

---

## 12. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) | Same version as parent site (currently Next 14+) |
| Language | TypeScript | strict mode |
| Styling | Tailwind CSS v4 | matches parent site config in `app/globals.css` |
| Animations | Framer Motion | matches parent site |
| Database (MVP) | Google Sheets via Apps Script | proven pattern, instant setup |
| Database (V2) | Supabase | Postgres + Auth + Storage |
| Payments | Stripe | Payment Links (MVP) → Checkout (V2) |
| Email (MVP) | Gmail | manual |
| Email (V2) | Resend + React Email | transactional |
| LLM APIs | OpenAI, Anthropic, Perplexity, Google | as above |
| Crawling | Playwright | headless browser |
| PDF | WeasyPrint (Python) or Puppeteer (Node) | match the prototype PDF rendering |
| Hosting | Vercel | already deployed, push to main triggers deploy |
| Domain | practicalinformatics.com | same as parent site |
| Calendar | Tally form | already wired |

---

## 13. File Structure (additions to existing repo)

```
PracticalInformatics/
├── app/
│   └── ai-visibility/
│       ├── page.tsx                 # /ai-visibility — landing page
│       ├── scan/
│       │   └── page.tsx             # /ai-visibility/scan — form
│       ├── results/
│       │   └── [id]/
│       │       └── page.tsx         # /ai-visibility/results/[id] — teaser
│       └── scheduled/
│           └── page.tsx             # /ai-visibility/scheduled — post-payment
├── app/
│   └── reports/
│       └── [id]/
│           ├── page.tsx             # /reports/[id] — hosted report
│           └── pdf/
│               └── route.ts         # /reports/[id]/pdf — PDF download
├── app/api/
│   ├── submissions/
│   │   └── route.ts                 # POST: create submission + trigger Crawler
│   ├── audits/
│   │   └── [id]/route.ts            # GET: fetch audit; POST: trigger full audit
│   ├── reports/
│   │   └── [id]/route.ts            # GET: fetch report; signed access tokens
│   └── stripe/
│       └── webhook/route.ts         # V2: Stripe webhook handler
├── lib/
│   ├── avi/
│   │   ├── crawler.ts               # Crawler Agent
│   │   ├── query.ts                 # Query Agent
│   │   ├── scoring.ts               # Scoring Agent
│   │   ├── report.ts                # Report Agent
│   │   ├── orchestrator.ts          # Sequences the four agents
│   │   ├── rubric.ts                # Per-dimension scoring rules
│   │   ├── archetypes.ts            # Weight tables per archetype
│   │   └── types.ts                 # Shared TypeScript types
│   ├── stripe.ts                    # Stripe client
│   ├── email.ts                     # Email send wrapper (Resend in V2)
│   └── db.ts                        # Supabase client (V2)
├── components/
│   └── ai-visibility/
│       ├── ScanForm.tsx             # The free-scan form
│       ├── ScanningAnimation.tsx    # 8–12 sec animated "scanning..." state
│       ├── TeaserScore.tsx          # Score display on teaser page
│       ├── RadarChart.tsx           # 6-dimension radar chart SVG
│       ├── DimensionCard.tsx        # Single dimension card
│       ├── FixCard.tsx              # Single prioritized fix card
│       └── ReportPage.tsx           # Hosted report layout
├── content/
│   └── ai-visibility/
│       ├── landing-copy.ts          # Landing page copy
│       ├── pricing-tiers.ts         # Tier definitions
│       └── faq.ts                   # AI Visibility page FAQ
└── public/
    └── reports/                     # Generated PDFs stored here (or Supabase Storage in V2)
```

---

## 14. Environment Variables

All secrets are **server-side only** unless explicitly `NEXT_PUBLIC_`.

```env
# LLM APIs (all server-side, never NEXT_PUBLIC_)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
GOOGLE_API_KEY=

# Stripe
STRIPE_SECRET_KEY=                          # server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=         # browser-safe
STRIPE_WEBHOOK_SECRET=                      # V2

# Data store
NEXT_PUBLIC_SHEET_ENDPOINT=                 # MVP — Apps Script webhook URL
NEXT_PUBLIC_SUPABASE_URL=                   # V2
NEXT_PUBLIC_SUPABASE_ANON_KEY=              # V2 (browser-safe, RLS-protected)
SUPABASE_SERVICE_ROLE_KEY=                  # V2 server-side only

# Email
RESEND_API_KEY=                             # V2

# Internal
ADMIN_EMAIL=marty.koepke@practicalinformatics.com
NEXT_PUBLIC_SITE_URL=https://www.practicalinformatics.com
```

**Never** put any of the unprefixed keys behind `NEXT_PUBLIC_`. See `secrets-placement` skill for the Four Boxes rule.

---

## 15. Implementation Phases

### Phase 1 — Landing + Form (week 1)
1. Build `/ai-visibility` landing page (copy, pricing, design)
2. Build `/ai-visibility/scan` form
3. Wire form submission to Google Sheet via Apps Script
4. Build the scanning animation
5. Build `/ai-visibility/results/[id]` teaser page (with a dumb static score for testing)
6. Build the Crawler Agent (lightweight version that runs in 10s)
7. Connect: form submit → real Crawler run → real teaser score
8. Email notification to Marty when new submission arrives
9. Confirmation email to visitor

### Phase 2 — Payment + Hosted Report (week 2)
10. Create Stripe Payment Link for the $497 Report
11. Build `/ai-visibility/scheduled` confirmation page with calendar embed
12. Build `/reports/[id]` hosted report page (template; fillable from data file)
13. Build PDF export route
14. Email templates (teaser delivery, full report delivery, call reminder, post-call follow-up)
15. Manual orchestration runbook for Marty (the audit checklist for each customer)

### Phase 3 — Automation (after 20 audits validated)
16. Migrate to Supabase
17. Build Query Agent (real LLM API calls)
18. Build Scoring Agent (automated)
19. Build Report Agent (automated rendering)
20. Stripe webhook → automated pipeline trigger
21. Resend integration
22. Internal admin dashboard for monitoring

---

## 16. Acceptance Criteria

The MVP is considered shippable when:

- [ ] A visitor can fill the form on `/ai-visibility/scan` and submit successfully
- [ ] The submission writes to the Google Sheet
- [ ] Marty receives an email notification of each new submission
- [ ] The visitor sees a real preliminary score on `/ai-visibility/results/[id]` (not a fake one)
- [ ] The preliminary score is derived from a real Crawler Agent run against their URL
- [ ] The visitor receives an automated confirmation email
- [ ] The Stripe Payment Link is accessible from the teaser page
- [ ] After payment, the visitor lands on `/ai-visibility/scheduled` and can book a call
- [ ] Marty can hand-fill the report template and generate a polished PDF + hosted URL
- [ ] The PDF/HTML matches the visual fidelity of `avi-report-practical-informatics.pdf`
- [ ] All API keys are correctly placed (none behind `NEXT_PUBLIC_` that shouldn't be)
- [ ] The Vercel deploy succeeds and the live site runs the full flow end-to-end

---

## 17. Open Decisions

Items still requiring a decision before V2:

1. **Email provider for V2** — Resend vs. Postmark vs. SendGrid. Default to Resend (best DX, modern).
2. **Background worker** — Vercel Edge Functions vs. Inngest vs. Trigger.dev for the orchestrator. Default to Inngest for the V2 (built for this pattern).
3. **Hosted report access model** — Signed token in URL vs. magic link via email vs. customer login. Default to signed token (simplest; 6-month expiry).
4. **Should the teaser-results page show a "Marty's note" video** — recorded once, re-rendered per customer with their name overlaid? Could be powerful but adds complexity. Decide after MVP.
5. **Custom-domain reports** — Should `reports.practicalinformatics.com` be a separate subdomain? Default to keeping reports at the main domain under `/reports/[id]` for simplicity.
6. **Pricing inflation** — Should the $497 price be tested against $297 and $797 on different cohorts? Defer until 30+ paid customers.

---

## 18. Notes for Claude Code

When implementing this:

- **Read CLAUDE.md first** — it has the project context, design system, and tech-stack conventions.
- **Match the existing design system** — colors, fonts, motion, section tones. The new pages should feel of-a-piece with the rest of the site.
- **Don't over-engineer the MVP** — Wizard-of-Oz is the right pattern. The first 20 audits will be hand-done. Build the surfaces, defer the automation.
- **All AI API keys are server-side only.** No `NEXT_PUBLIC_` prefix on `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_API_KEY`, `STRIPE_SECRET_KEY`. Ever.
- **Validate the form** — URL must be a valid URL; email must be valid; industry required. Show inline errors.
- **Rate-limit submissions** — one free scan per email address per 24 hours (prevent abuse).
- **Honest preliminary score** — the teaser should not lie. If we can only detect 3 issues from the lightweight crawl, show 3. Don't fabricate findings.
- **Privacy** — submissions store email + URL. Don't store anything not necessary. Don't sell. Disclose in /privacy.
- **Accessibility** — match the existing site's accessibility posture (keyboard nav, ARIA, reduced motion). The scanning animation must respect `prefers-reduced-motion`.
- **Reference output** — `avi-report-practical-informatics.pdf` shows exactly what the report should look like. Match its structure, sections, and visual treatment.

---

**End of document.**

When Claude Code receives this, the first step is: read this entire document, read `CLAUDE.md`, then read the existing `lib/content.ts` and `app/page.tsx` to understand the established conventions before writing any new code.
