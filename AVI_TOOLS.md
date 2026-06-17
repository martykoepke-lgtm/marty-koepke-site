# AVI Build — Tools & Services

**Purpose:** Standalone reference of every external service the AVI build needs, with what each does, when you'll use it, and rough cost. Pulled from `AVI_BUILD_PLAN.md` Section 4.

---

## LLM providers (live queries + LLM-as-judge + extraction)

| Tool | Purpose | Pricing |
|---|---|---|
| **Anthropic API** | Claude for live cross-engine queries; also the LLM-as-judge for driver scoring and the structured-extraction passes. The default model for most calls. | Pay-as-you-go (~$3/M input, $15/M output for Sonnet; Haiku is ~5× cheaper) |
| **OpenAI API** | GPT-4o for live queries; GPT-4o-mini for cheap structured extraction. Second engine in the cross-engine protocol. | Pay-as-you-go (~$5/M input, $15/M output for 4o; 4o-mini ~10× cheaper) |
| **Google AI (Gemini)** | Gemini for live queries. Third engine in the cross-engine protocol. | Pay-as-you-go (cheap relative to Anthropic/OpenAI) |
| **Perplexity API** | Perplexity Sonar models for live queries. Fourth engine. Different sourcing pattern than the others — important for the divergence story. | Pay-as-you-go |
| **SerpAPI** *(optional)* | Only needed if you want Google AI Overviews as a fifth engine. No public API for AIO direct — SerpAPI scrapes it. Defer for v1 if budget matters. | $75/mo for 5,000 searches |

---

## Web search (driver scoring corroboration)

| Tool | Purpose | Pricing |
|---|---|---|
| **Tavily** | Web search for entity corroboration — finds LinkedIn profile, Google Business Profile, Wikipedia/Wikidata, directory listings, press mentions, podcast appearances. Feeds the Third-Party Corroboration (D2) and Platform-Native Fit (D6) driver scores. Built for AI agents — returns extracted content, not just URLs. | ~$0.005/search, 1,000 free/mo |

---

## Background jobs (the spine of automation)

| Tool | Purpose | Pricing |
|---|---|---|
| **Inngest** | Background job runner for the async paid pipeline (Stripe webhook → audit job → ~3–8 min runtime), scheduled re-scans, drift monitoring. Purpose-built for this pattern: typed events, durable functions, retries, replay. The single most important infra choice — everything async cascades from it. | Free tier covers the first ~1,000 audits/month |

---

## Payments

| Tool | Purpose | Pricing |
|---|---|---|
| **Stripe** | Payment Links (MVP) → Checkout (v2) for the $1,000 AVI Report and the $3K/$5K Sprint tiers. Webhook handler triggers the audit pipeline on `paid` status. Stripe sends Marty an alert + flips submission status. | 2.9% + $0.30 per transaction |

---

## Email infrastructure

| Tool | Purpose | Pricing |
|---|---|---|
| **Resend** | Transactional email — order confirmation, report delivery, alert-Marty-on-new-order, calendar reminders, post-call follow-ups. Modern API, React Email templates, easy to wire. | Free up to 3,000 emails/month; $20/mo for 50,000 |
| **Kit (ConvertKit)** | Lead-magnet email gate on the free `/scan` results page + tier-tagged nurture sequences. Subscribers tagged by tier (`tier-invisible`, `tier-hidden`, etc.) trigger different sequences. Separate from Resend because nurture is broadcast/sequence work, not transactional. | $25/mo Creator tier |

---

## Abuse mitigation (must be in place before free /scan goes public)

| Tool | Purpose | Pricing |
|---|---|---|
| **Cloudflare Turnstile** | Invisible CAPTCHA on the free `/scan` form. Stops scripted abuse without annoying real users. Behavioral signals (mouse, browser fingerprint, timing) — only shows a challenge when traffic looks suspicious. | Free |
| **Upstash Rate Limit** | IP-based rate limiting on `/api/scan`. Starting point: 3 scans per IP per day. Stops a bot from draining your LLM budget overnight. | Free tier covers low volume |
| **Vendor spend caps** | Hard daily spend cap configured in every LLM provider dashboard (Anthropic, OpenAI, Google, Perplexity) + Tavily. Last line of defense against runaway cost. Set during signup, not later. | Free (configuration only) |

---

## Data layer (already in place — don't rebuild)

| Tool | Purpose | Pricing |
|---|---|---|
| **Supabase** | Postgres + Storage. Three tables already exist (`submissions`, `audits`, `payments`) with Row Level Security enabled and no public policies. Service-role-only access through the `/api/*` routes. Will also host: raw LLM response logs, API spend per audit, rubric version stamped on every audit row. | Free tier sufficient at launch |

---

## Hosting (already in place)

| Tool | Purpose | Pricing |
|---|---|---|
| **Vercel** | Next.js host. Push to `main` auto-deploys. API routes run as serverless functions. Inngest functions can be deployed alongside or separately. | Free Hobby tier; Pro at $20/mo when needed |

---

## PDF generation

| Tool | Purpose | Pricing |
|---|---|---|
| **weasyprint** *(default)* | HTML/CSS → PDF for the 8–10 page AI Visibility Index Report. Already proven on the lead-magnet PDF build. Lighter than Puppeteer; better for serverless. Python; run as a Vercel Python function or a small standalone service. | Free, open source |
| **Puppeteer** *(alternative)* | Heavier (headless Chrome) but renders more complex CSS reliably. Use only if weasyprint hits a rendering wall. | Free, open source |

---

## Suggested phase-0 signup order

1. Inngest (free) — confirm choice, sign up, capture event key + signing key
2. Anthropic, OpenAI, Google AI, Perplexity — API keys, set daily spend caps in each dashboard
3. Tavily — sign up, capture API key
4. Resend — sign up, verify sending domain DNS
5. Kit (ConvertKit) — sign up, create list + tier-tag scheme stubbed out
6. Cloudflare Turnstile — site key for production domain
7. Upstash — account for rate limiting (free tier)
8. Stripe — confirm test-mode keys; create Payment Links for Report + Sprint tiers

Stripe Payment Links and the production keys come last because they depend on everything else being ready to fire.

---

**End of tools reference.**

*See `AVI_BUILD_PLAN.md` for the build sequence that uses these. See `VISION.md` for the strategic context.*
