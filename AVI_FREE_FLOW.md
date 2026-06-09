# The free AI Readiness Check — plain-English flow

> ## ⓘ DEFERRED — build order changed per D005
>
> The **design here is still current**, but the build order changed.
> Per `DECISIONS.md` D005 (2026-06-06), the full AVI Index Report tool
> (see `AVI_INDEX_REPORT.md`) is being built first — used by Marty
> (CLI-driven) to evaluate the rubric on a real sample of businesses
> across sectors. The free flow rebuild this doc describes is **deferred
> until after that evaluation phase**.
>
> Nothing has technically changed about the free flow itself — just the
> order. When we return to free-flow work, this doc is the starting point.

---

**Status:** Draft v0.1 — read this before any source files get touched.
**Scope:** The free tier of the AI Visibility Index — URL-only, ~30 seconds, on-screen tier and a few findings, email gate for the full PDF.
**Out of scope:** The paid Index Report ($1,000), the Remediation Sprint, the ongoing Partner tier. Those get their own flow docs when we build them.

This doc answers, in plain English: what does the customer see, what does the system do behind the curtain, every tool involved, every cost, every place this can fail, and how it's different from the form that lives at `/ai-visibility/order` today.

---

## 1. At a glance

```
                    ┌──────────────────────────────────┐
                    │  Customer lands on /scan         │
                    │  (linked from home page + nav)   │
                    └──────────────┬───────────────────┘
                                   │
                                   │  enters URL, ticks Turnstile
                                   ▼
                    ┌──────────────────────────────────┐
                    │  POST /api/scan                  │
                    │  (synchronous, ~25–35 seconds)   │
                    └──────────────┬───────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
   rate-limit check         Turnstile verify              parse URL
   (Upstash, IP key)        (Cloudflare)                  (normalize)
        │                          │                          │
        └──────────┬───────────────┴──────────────────────────┘
                   │  (3 checks pass)
                   ▼
        ┌────────────────────────────┐
        │  Crawler (lib/avi/crawler) │   ── fetch HTML, llms.txt, robots.txt,
        │                            │     parse schema, OG, meta, headings
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Tavily corroboration      │   ── 1–3 web searches:
        │  (lib/avi/tavily)          │     LinkedIn, Wikidata, directories
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Detect subject type       │   ── personal brand vs company,
        │  (heuristic + signals)     │     drives D7 rubric branch
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Score 7 dimensions        │   ── 7 LLM-as-judge calls in parallel,
        │  (lib/avi/scoring)         │     temp 0, JSON mode, schema-valid
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Compose result, persist   │   ── tier, top 2–3 findings,
        │  submission row (Supabase) │     access_token, raw logs
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Return JSON to browser    │   ── tier, findings, scanId, token
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  /scan results page renders│
        │  on-screen; CTA: enter     │
        │  email to unlock full PDF  │
        └────────────┬───────────────┘
                     │
                     │  email submitted
                     ▼
        ┌────────────────────────────┐
        │  POST /api/scan/email      │
        │  (synchronous, ~5–10 sec)  │
        └────────────┬───────────────┘
                     │
        ┌────────────┼──────────────────────────────┐
        ▼            ▼                              ▼
   subscribe to    generate PDF                  send email
   Kit + tag       (weasyprint sidecar)          (Resend)
        │            │                              │
        └────────────┴──────────────┬───────────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │  Thank-you state shown;      │
                    │  PDF arrives in customer     │
                    │  inbox within ~30 seconds.   │
                    └──────────────────────────────┘
```

That whole sequence is automated. No human in the loop. Marty's role on the free flow is monitoring (look at the daily dashboard, sanity-check tiers, see what's leaking into Kit) — not labor.

---

## 2. What the customer experiences

Numbered, from their perspective. No technical detail here.

1. **Lands on `/scan`** — single page, one input: "Paste your website URL." A short paragraph above the input explains what they'll get. Below: a calm "Are you built to be found by AI? Scan in 30 seconds. No email required to start." line. A small Cloudflare CAPTCHA widget sits next to the input.

2. **Enters URL, ticks the CAPTCHA, hits Scan.** Page transitions to a loading state. A progress bar fills over ~30 seconds with three labels: "Reading your site… → Cross-checking entity signals… → Scoring against the rubric…" Each label visible for ~10 seconds.

3. **Sees the result on screen.** No email needed yet. They see:
   - Their tier: **Invisible · Hidden · Faintly Visible · Discoverable · Agent-Ready** (one of five). Big number, single sentence explaining what the tier means in plain English.
   - Their score across the 7 rubric dimensions, as small visual bars (radar comes in the PDF).
   - Two or three named findings — concrete, specific. Example: *"Your About page has no Person schema. Most AI engines won't connect 'Marty Koepke' to 'Practical Informatics' without a structured signal."*
   - One sentence: *"This is a preview. The full report names every gap, prioritizes the five highest-leverage fixes, and includes the technical patches you can hand to a developer. Enter your email to get the full report."*
   - An email input + "Send me the full report" button.

4. **Enters email, hits send.** Page shows "Thanks — check your inbox in 30 seconds." A spinner shows briefly while the system generates and sends. Then a calm thank-you state with the recipient email confirmed and a link back to the home page.

5. **Receives email.** Subject: "Your AI Readiness report — [their domain]." From: `hello@practicalinformatics.com`. Body: short, friendly, names the tier, links the PDF. Footer mentions Marty by name. The PDF attached is 4–6 pages: cover, tier explanation, the 7-dimension scorecard with radar, every finding categorized, the prioritized top-five fixes, a "what next" page that introduces the paid AI Visibility Index Report ($1,000 — credits 100% toward a Sprint) and the free 20-minute call.

6. **Lands on a nurture sequence in Kit.** Tagged by tier. Sequence is short — 3 emails over 10 days — designed to either book the call, buy the Report, or get them subscribed to occasional content. No countdown timers. No "limited time only." Calm.

That's the whole customer journey.

---

## 3. What the system does behind each step

Matched to the customer steps above.

### Step 1–2: `/scan` page renders

- Server component renders the page from `lib/content.ts` constants.
- No API call until the form submits.
- Turnstile widget loads from Cloudflare (free, no key cost) and produces a token on user interaction.

### Step 2 (submit): `POST /api/scan`

Synchronous endpoint, target latency 25–35 seconds. Sequence:

1. **Rate-limit check** — Upstash Redis Rate Limit by IP. Default: 3 scans per IP per 24 hours. If exceeded → return `429` with a friendly message ("You've reached today's free scan limit. Email hello@ if you need more.").

2. **Turnstile verify** — POST the user's token to Cloudflare's verify endpoint. If it fails → return `400` ("Bot check failed — please try again"). If it succeeds → continue.

3. **Normalize URL** — strip whitespace, add `https://` if missing, validate it parses, reject IP-only or `localhost`. If invalid → return `400` ("That URL doesn't look right — try again with a full domain like example.com").

4. **Crawler runs** (`lib/avi/crawler.ts`, exists). It does:
   - GET the URL with a User-Agent that identifies us as `PracticalInformatics-AVI/1.0`.
   - GET `/robots.txt` and `/llms.txt` (each with 3-second timeout, missing is fine).
   - Parse HTML: title, meta description, headings (h1/h2/h3), Open Graph tags, JSON-LD schema (Person, Organization, ProfessionalService, FAQ, Article), links to social profiles.
   - Return a structured object: `{ url, robots, llms, schemas, og, headings, content_excerpt, hash }`.
   - Total time: 2–5 seconds.

5. **Tavily corroboration** (`lib/avi/tavily.ts`, new). It does 1–3 web searches with the subject's name and domain:
   - `"{subject_name} {industry_or_role}"` — looks for LinkedIn, press, podcasts, directory listings.
   - `"site:wikidata.org {subject_name}"` — Wikidata entry check.
   - `"site:linkedin.com {subject_name}"` — LinkedIn profile check.
   - Returns a structured object: `{ corroboration_sources: [...], wikidata_present: bool, linkedin_present: bool, press_mentions: [...] }`.
   - Total time: 3–6 seconds. Cost: ~$0.005 × 1–3 searches = ~$0.015 max.

6. **Subject-type detection** — lightweight heuristic, not an LLM call:
   - If JSON-LD `Person` schema present → personal brand.
   - If JSON-LD `Organization` or `LocalBusiness` present → company.
   - If both → personal brand (founder-led; D7 = Founder & Author Signal).
   - If neither → guess from domain name pattern (firstname-lastname → personal; otherwise company) and log the guess as `subject_type: company_or_personal_unknown`.
   - Result: `"personal_brand"` or `"company"`.

7. **Score 7 dimensions** (`lib/avi/scoring.ts`, new) — seven LLM calls in parallel. Each call is:
   - Model: **Claude Sonnet 4.6** (best quality, defensible to clients). Fallback: GPT-4o.
   - Temperature 0, JSON mode, schema-validated output.
   - System prompt: anchored 0–5 scale for that one dimension, with golden examples baked in.
   - User prompt: the crawler + Tavily output as evidence + the URL.
   - Output JSON: `{ score: 0–5, justification: "...", evidence_pointers: [...] }`.
   - Total time per dim: 4–7 seconds. All 7 in parallel → ~7 seconds total.
   - Cost per dim: ~$0.024. Seven dims: ~$0.17 per scan.

   The seven dimensions per **rubric Option 2**:
   1. **D1 — Entity Clarity** (is the subject a clearly identifiable entity?)
   2. **D2 — Cross-Source Corroboration** (do other sites name them?)
   3. **D3 — Schema & Structured Data** (machine-readable signals present?)
   4. **D4 — Information Gain** (original ideas, statistics, frameworks?)
   5. **D5 — Topical Authority** (consistent, deep coverage of a niche?)
   6. **D6 — Distribution Surface** (linked from substantive third-party places?)
   7. **D7 — Subject-adaptive seventh dimension:**
      - If personal brand: **Founder & Author Signal** (named author, bio, credentials, voice)
      - If company: **Methodology & Offer Definition** (named methodology, clear pricing, defined deliverable)

8. **Compose result** — combine into:
   - **Composite score** = 0.40 × Readiness (driver dims) + 0.60 × Visibility (NOT applied on the free tier — Visibility requires live cross-engine queries, which only the paid tier runs. The free tier returns Readiness only.)
   - **Tier** based on Readiness score thresholds (defined in v2 spec).
   - **Top 2–3 findings** — the lowest-scoring 2–3 dimensions, paraphrased in plain English from the judge's justifications.

9. **Persist** — write a row to `submissions` in Supabase:
   - `url`, `tier`, `readiness_score`, `subject_type`, `findings_short` (JSON), `crawler_output` (full JSON), `tavily_output` (full JSON), `scoring_output` (full JSON, all 7 dim outputs raw), `access_token` (UUID), `status: scan_completed`, `email: NULL`, `created_at`.
   - The full raw outputs are logged for reproducibility. Re-running the same URL with the same rubric version must produce the same tier.

10. **Return JSON** — `{ scanId, accessToken, tier, readinessScore, dimensions: [...], findingsShort: [...] }`.

### Step 3: Results render in browser

- Client component takes the response, renders tier + score + bars + findings.
- The radar visualization can wait — bars are enough for the free preview.
- Email-input component below the findings. Button is disabled until a valid email is entered.

### Step 4 (submit email): `POST /api/scan/email`

Synchronous endpoint, target latency 5–10 seconds. Sequence:

1. **Validate** — email format check; verify `accessToken` matches the submission row.
2. **Update submission row** — set `email`, `status: email_captured`.
3. **Subscribe to Kit** — POST to Kit API with email + tags:
   - `scan-completed`
   - `tier-<theirtier>` (`tier-invisible`, `tier-hidden`, `tier-faintly-visible`, `tier-discoverable`, `tier-agent-ready`)
4. **Generate PDF** — call the weasyprint sidecar (Vercel serverless function or external service):
   - Input: a JSON payload of all the report data (subject info, score, findings, top-five fixes derived from low-scoring dims, CTAs).
   - Template: HTML page using brand tokens (cream, forest, gold), Lora headings, Inter body — matches the marketing site visually.
   - Output: a PDF byte stream, ~600 KB.
   - Total time: 3–6 seconds.
5. **Send via Resend** — email with subject `"Your AI Readiness report — {domain}"`, from `hello@practicalinformatics.com`, body referencing tier in plain text, PDF attached.
6. **Return JSON** — `{ success: true }`.

### Step 5: Email arrives

Sent by Resend. No additional system work. The PDF is the artifact.

### Step 6: Kit nurture sequence

Three emails over 10 days, varied by tier:
- **Day 0** — confirmation + report attached as a backup link (in case PDF didn't arrive).
- **Day 3** — short post, "Here's what the report doesn't measure — and why the paid version does." Soft pitch for the Index Report.
- **Day 10** — "Want to talk through your findings? 20-minute call." Books to Tally (existing `BOOK_CALL_HREF`).

All copy in Kit, no code work needed on the site for this.

---

## 4. Tools in this flow

Every tool. Every cost. Every place the config lives.

| Tool | One-sentence purpose | Cost | Config / env var |
|------|---------------------|------|------------------|
| **Cloudflare Turnstile** | CAPTCHA on the scan form to block bots. | Free. | `TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` in `.env.local` |
| **Upstash Rate Limit (Redis)** | IP rate limiting on `/api/scan` (default 3/day per IP). | Free tier covers our volume. | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Anthropic API (Claude Sonnet)** | Primary LLM for scoring all 7 rubric dimensions. | Pay-as-you-go, ~$3/M input + $15/M output. ~$0.17 per scan. | `ANTHROPIC_API_KEY` |
| **OpenAI API (GPT-4o)** | Fallback LLM for scoring if Anthropic is down or slow. | Pay-as-you-go. Similar per-scan cost. | `OPENAI_API_KEY` |
| **Google AI (Gemini)** | Secondary fallback. Currently wired but not primary path. | Pay-as-you-go. | `GOOGLE_API_KEY` |
| **Tavily** | Web search for entity corroboration (LinkedIn, Wikidata, directories). | $0.005/search × 1–3/scan = ~$0.015 max. 1k searches/mo free. | `TAVILY_API_KEY` |
| **Supabase** | Postgres for submission rows + raw output logs. | Free tier sufficient at launch. | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Project: `tfjlacjbafwqghiemwdy`. |
| **Kit (ConvertKit)** | Subscribe + tag the email-captured user, nurture sequence. | $25/mo Creator tier (paid). | `KIT_API_KEY`, `KIT_API_SECRET`, `KIT_FORM_ID` |
| **Resend** | Transactional email delivery (report PDF). | Free up to 3k emails/mo. | `RESEND_API_KEY`, `RESEND_FROM_ADDRESS` |
| **weasyprint** | HTML → PDF for the report. Runs as a sidecar — either a Vercel serverless function with the Python runtime, or an external service. | Free (compute only). | TBD: how we host it. Default: Vercel Python function in the same project. |

**Already paid-for / signed up:** Anthropic, OpenAI, Google, Stripe (not used in free flow), Resend, Kit, Supabase.

**Still needed (per Phase 0 status as of 2026-06-06):** Tavily account + key, Inngest account (not used in free flow but next phase), Cloudflare Turnstile site key, Upstash Redis Rate Limit, Perplexity (not used in free flow but next phase).

---

## 5. Where this can fail — and what we do

| Stage | Failure | What the customer sees | What we do |
|-------|---------|------------------------|------------|
| `/scan` page load | Turnstile widget fails to load | Page renders, button disabled with "Bot check unavailable — refresh to retry" | Log warning; serve a degraded form (no Turnstile) if the customer refreshes ≥ 2 times — accept slight abuse risk over total failure. |
| `POST /api/scan` | Rate-limit hit | Friendly 429: "You've reached today's free scan limit." | Suggest emailing `hello@`. Don't reset the counter — limit serves its purpose. |
| `POST /api/scan` | Turnstile token invalid | 400: "Bot check failed — please try again" | Log the verify response. If a pattern emerges, increase widget difficulty. |
| Crawler | Target URL times out, returns 5xx, or blocks our User-Agent | Show partial result with a clear note: "We couldn't read your site directly. Your tier is based on what we found through cross-source signals." | Continue with Tavily + scoring using only the corroboration data. Score reflects that. |
| Crawler | Target returns valid HTML but no schema/OG/meta | Result page shows actual finding: "Your site has no structured data signals" | Not a system failure — this is the rubric working. Tier likely Invisible or Hidden. |
| Tavily | Tavily API down | Score the rubric using crawler-only data; mark `tavily_skipped: true` in the audit row | Log it. If sustained, fall back to a simpler search via DuckDuckGo HTML scrape. |
| Scoring | One LLM dim call fails (timeout, rate limit) | Retry once with the fallback provider (OpenAI). If both fail, score that dim as `null` and exclude from composite | Log. If >10% of scans show a `null` dim, page Marty. |
| Scoring | All LLMs failing simultaneously | 503: "Our scoring service is briefly down. Try again in a few minutes." | Page Marty immediately. This blocks the whole flow. |
| Supabase write | Insert fails | 500: "Something went wrong on our end. Try again in a moment." | Log. If sustained, page Marty. The customer's scan results are lost — accept that on a free tier. |
| `/api/scan/email` | Resend send fails | Thank-you state shows "Your report is on its way. If it doesn't arrive within 5 minutes, email hello@." | Retry once; if still failing, write an in-DB queue row, page Marty. |
| `/api/scan/email` | weasyprint sidecar fails | Same friendly message; row marked `pdf_pending` | Marty hand-generates from the result data. Rare. |
| Kit subscribe | Kit API down | Email still sent; Kit subscribe queued for retry | Don't block the customer. |
| Customer | Customer enters disposable email | (No detection in v1) | Accept. The nurture sequence + tier-tag still has value if it's a real lead behind it. |

A rule of thumb: **the customer's experience must never depend on the nurture / persistence layer.** If Supabase is up, scoring is up, and Resend is up — they get what they came for. Everything else is recoverable in the background.

---

## 6. Costs per free scan

A realistic upper bound, per single scan:

| Item | Cost |
|------|------|
| Tavily (3 searches) | $0.015 |
| Anthropic Claude Sonnet × 7 dims | $0.17 |
| Supabase row | ~$0 |
| Resend email | ~$0 |
| Kit subscribe | $0 (covered by monthly $25) |
| weasyprint PDF | $0 (compute) |
| **Per scan, all in** | **~$0.20** |

At 10 scans/day: ~$2/day → ~$60/month. Comfortable inside vendor spend caps.

At 100 scans/day (abuse, or viral surge): ~$20/day → ~$600/month. Rate limit + Turnstile should prevent this getting there. If they don't, the daily spend caps in Anthropic + Tavily dashboards cut the bill off.

---

## 7. What's different from `/ai-visibility/order` today

The existing `/ai-visibility/order` form is the v1.0 design. It is **8 form fields, gates email at submit, runs the crawler synchronously, returns a teaser score, asks for $497 for the full report.** This new flow replaces it. Specifically:

| Aspect | Existing `/ai-visibility/order` (v1.0) | New `/scan` (v2) |
|--------|----------------------------------------|-------------------|
| Form fields | 8 (URL, name, email, company, industry, location, competitor URLs, notes) | 1 (URL) |
| Email gate | At submit (before any result) | After on-screen result |
| Scoring engine | Crawler + 5 prompts × 3 LLMs (mention-counting) | Crawler + Tavily + 7-dim LLM-as-judge |
| Rubric | Implicit, no anchored scale | Option 2, anchored 0–5 scale per dim |
| Bot mitigation | None visible | Turnstile + Upstash rate limit |
| Result delivery | On screen (token-gated `/ai-visibility/results/[id]`) | On screen first, PDF emailed after gate |
| Upsell offered | $497 Full Report (legacy pricing) | $1,000 Index Report (current pricing) |

**Migration plan:** Phase 3 builds `/scan` as a new route alongside `/ai-visibility/order`. Once `/scan` is tested and live, `/ai-visibility/order` is either retired or repointed at the paid Index Report checkout. The existing crawler module is **kept** and lightly extended (no `llms.txt` re-fetch; we already do this). The existing query module (`lib/avi/query.ts`) is **not used** on the free flow — its mention-counting approach is replaced by LLM-as-judge scoring in `lib/avi/scoring.ts`. It stays in place for the paid flow's cross-engine query grid in Phase 4.

---

## 8. What's NOT in this doc

- The **paid AI Visibility Index Report** ($1,000 flow). It has its own pipeline — Stripe webhook → Inngest job → 10–20 queries × 4–5 engines × 3 reps → structured extraction → full driver + outcome scoring → 8–10 page PDF. Separate doc, written before that build.
- The **Remediation Sprint** ($3K–$5K). Sold via a call or form; no automation.
- The **Visibility Partner** ($600/mo). Sold only post-Sprint.
- The **drift monitoring** Inngest cron. Phase 5 work.
- The **internal admin page** to inspect raw logs. Phase 5 work.

---

## 9. Open questions blocking implementation

Things I need answers to before I open source files. Numbered for response.

1. **Tier thresholds.** The 7-dim Readiness score is a 0–35 raw point sum (or some weighted variant). What thresholds map to Invisible / Hidden / Faintly Visible / Discoverable / Agent-Ready? Build plan says these are calibrated from real engagements — but we need starting values to ship v1. My proposal: 0–7 Invisible, 8–14 Hidden, 15–21 Faintly Visible, 22–28 Discoverable, 29–35 Agent-Ready. Acceptable to ship with these and recalibrate after 20+ scans?

2. **D7 subject-type detection — does the form ask?** Default in this doc: heuristic detection from schema + domain. Alternative: add a single radio toggle to the form: "Is this a personal brand or a company?" Picking it explicitly removes ambiguity but adds a form field. My recommendation: heuristic for v1; add the toggle only if heuristic accuracy is poor in practice.

3. **PDF generator hosting.** Default in the build plan: weasyprint (Python). It's serverless-friendly but requires a Python runtime on Vercel (separate function, slightly more complex) or an external service like docraptor ($15/mo). The alternative is Puppeteer (Node-native to Vercel, simpler deploy, heavier per-invocation cost). My recommendation: weasyprint in a Vercel Python function. If that gets fiddly, fall back to docraptor.

4. **Lead-magnet PDF — fixed template or dynamic?** The existing `AI-Visibility-Self-Assessment.pdf` in the repo (480 KB) is a static lead magnet from v1.0. For v2, every report is dynamic, per-subject. Confirm: we're replacing the static PDF with dynamic generation per scan. Yes?

5. **Where does `/scan` live in the nav?** Options: (a) replace "Time Back Assessment" as the primary CTA on the home page hero; (b) add as a second nav item alongside Time Back; (c) standalone discoverable only via direct URL (`practicalinformatics.com/scan`) and links from blog posts / LinkedIn. The two-offer narrative tension noted in CLAUDE.md applies here. My recommendation for now: option (b) — add to nav, but don't promote in hero until v2 spec is approved and the tool is tested.

6. **Cost cap per scan if Claude is down.** If we fall back to OpenAI, the per-scan cost stays similar. If we fall back to Gemini, cheaper. If both fail, we 503 the customer. Acceptable?

7. **Confirm Anthropic spend cap value.** You set daily caps — what's the number? I want to make sure the rate-limit math (3/IP/day × ~$0.20 = $0.60 per IP per day max) leaves comfortable headroom.

---

## 10. What I'll do next

Once you've responded to the open questions above, my next steps in order:

1. **Update this doc** with your answers.
2. **Write `AVI_AGENT_DESIGN_v2.md`** — the technical spec the rest of the build follows (Option 2 rubric prompts, schemas, anchored 0–5 scale anchors with golden examples for each dim).
3. **Walk you through both docs inline** before any code.
4. **Code Phase 3 (free flow rebuild)** per the build plan sequence.
5. **Test on `practicalinformatics.com`** as subject zero, then on 1–2 other real subjects.

No code happens until both docs are written and you've signed off.

---

**End of v0.1 draft.** This is a working document. Edit freely; I'll re-sync next time we touch it.
