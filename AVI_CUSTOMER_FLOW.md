# AVI Customer Flow — Plain English Walkthrough

> ## ⚠ DEPRECATED — v1.0 era, superseded
>
> This document describes the **v1.0 customer journey** with the old
> 8-field form, the old $497 pricing, the old "free → paid Report → Sprint"
> ladder, and the v1.0 four-agent architecture. It is **not** the current
> customer journey.
>
> Key superseding decisions:
> - Build order changed: full AVI tool first (CLI for Marty), customer
>   journey deferred until after the rubric is validated on real subjects
>   (`DECISIONS.md` D005).
> - Architecture changed: no autonomous agents (`DECISIONS.md` D001).
> - Rubric changed: Option 2 seven-dim subject-adaptive (`DECISIONS.md` D002).
> - Pricing changed: $1,000 / $3K–$5K / $600/mo (`VISION.md` §6).
> - Free flow form: URL-only, email-gate after results (when eventually
>   rebuilt) (`AVI_BUILD_PLAN.md` §6, `AVI_FREE_FLOW.md`).
>
> Kept in the repo for historical reference. **Not safe to use as a build guide.**
> The new customer journey will be documented in a fresh `AVI_CUSTOMER_FLOW_v2.md`
> when we get back to customer-facing work after the tool is validated.

---

**Audience:** Marty. Read this before any code gets written.
**Goal:** You should be able to close your eyes and trace a customer from "saw a LinkedIn post" all the way to "paid $497 and got a report in their inbox" — knowing every page they see, every tool that runs, every email that fires, and every dollar that changes hands.

If anything in this doc is unclear, that's a bug in the doc — tell me which step and I'll rewrite it.

---

## The flow in one paragraph

A visitor lands on `practicalinformatics.com/ai-visibility`, fills a short form (URL, email, name, industry, location), and clicks **Run my free scan**. The page shows a "scanning..." animation for ~10 seconds while our server quietly fetches their website and looks at it. The page then refreshes to show them a preliminary score (0–100), the tier they fall into (Invisible / Hidden / Faintly Visible / Discoverable / Agent-Ready), and **2–3 obvious findings** ("No FAQ schema," "Founder not named on the homepage," etc.). Below those findings, a button says: **Get the full report and 30-min walk-through — $497.** They click it, pay through checkout, land on a thank-you page with a calendar link to book the 30-minute call. Within ~10 minutes of payment, the full automated audit pipeline runs (Crawler, Query Agent, Scoring Agent, Report Agent), produces a draft report, and surfaces it in an internal review queue. Marty spends 5–15 minutes reviewing and polishing it (especially the headline finding and the live AI quotes), clicks **Send**, and the customer gets the finished report by email and via a hosted URL. Systeme.io runs every email along the way (welcome, payment confirmation, report delivery, call reminder, 60-day re-scan reminder) automatically from a single branching workflow.

That's the whole product. Everything below explains how each piece works.

---

## The 7 stages, from the customer's point of view

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. Discovery — they hear about it (LinkedIn / referral / search)     │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 2. Landing page — /ai-visibility — they read what it is              │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 3. Free Scan form — they enter URL, email, basic context             │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 4. Scanning animation — 8-12 seconds, the Crawler runs server-side   │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 5. Teaser results page — preliminary score + 2-3 findings + CTA      │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
                  ┌───────────┴───────────┐
                  ↓                       ↓
       [pays $497 right away]   [bounces / does nothing]
                  ↓                       ↓
┌─────────────────────────┐    ┌──────────────────────────────────────┐
│ 6. Stripe checkout +    │    │ Their email is in the Sheet.         │
│    /scheduled page +    │    │ You / a sequence follows up later.   │
│    calendar booking     │    └──────────────────────────────────────┘
└─────────────────────────┘
                  ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 7. Full report delivered — email + hosted /reports/[id] URL + PDF    │
│    + 30-min walk-through call + optional $2,997 Sprint upsell        │
└──────────────────────────────────────────────────────────────────────┘
```

The rest of this document zooms into each stage.

---

## Stage 1 — Discovery

**What the customer does:** Sees a LinkedIn post, hears about it from a peer, or searches "AI visibility audit" and lands somewhere.

**What you do:** Marketing — LinkedIn posts about AI visibility, the occasional cold outreach, maybe Google Ads later. This stage lives outside the product.

**Tools:** LinkedIn, your email signature, your existing site. No new tools.

**Cost:** $0 (organic). If you run Google Ads later, you pay per click.

---

## Stage 2 — Landing page

**URL:** `practicalinformatics.com/ai-visibility`

**What the customer sees:**
1. **Hero** — *"When someone asks AI about your industry, are you visible?"* A short paragraph naming the problem.
2. **The problem** — 2–3 sentences on why AI visibility matters now (small businesses are losing leads to invisibility in ChatGPT/Claude/Gemini answers).
3. **What gets measured** — the 6 dimensions of the AVI in plain English, with icons (Founder Credibility, Live AI Test, Entity Clarity, Methodology Depth, Structured Data, Agent + Citation Graph).
4. **Pricing tiers visible** — three cards: Free Scan / $497 Report / $2,997 Sprint. ($397/mo Monitoring is hidden at launch until we have a real Monitoring product to deliver.)
5. **A single big CTA** — *"Run my free AI Visibility Scan →"* — scrolls them to or routes them to the scan form on `/ai-visibility/scan`.
6. **Who this is for / not for** — sets expectations.
7. **About Marty** — credibility block with your headshot and the book.
8. **FAQ** — 6–8 questions: "How long does the scan take?" "What's the difference between the free scan and the $497 report?" "Do you do refunds?" etc.

**What happens behind the scenes:** Nothing. It's a static page. No data is captured yet.

**Tools:** Next.js (the framework already running our site). Tailwind CSS (already configured). Same components as the rest of the site.

**Config:** None new.

**Cost:** $0. Same Vercel deploy as the rest of the site.

**What you change later:** Update copy, swap pricing, add testimonials. All copy lives in `lib/content.ts` (the same place the rest of the site's copy lives).

---

## Stage 3 — Free Scan form

**URL:** `practicalinformatics.com/ai-visibility/scan`

**What the customer sees:** A simple form, one column, no clutter.

| Field | Required? | What it's for |
|---|---|---|
| Your website URL | Yes | The thing we audit |
| Your email | Yes | Where we send the teaser + follow-ups |
| Your first name | Yes | So the report and emails feel human |
| What does your business do? | Yes | One line. Helps us run the right LLM queries later. |
| Your location (city, state) | Optional | Lets us check local visibility |
| Two competitor URLs | Optional | If they list two, we'll compare them in the paid report. Otherwise we pick. |
| "What's the one query you wish AI answered with you on top?" | Optional | Powerful framing prompt — many will leave it blank, but the answers are gold |

Below the form: a single button — **Run my free scan**. Below the button: small fine print — *"We'll email you a copy. No spam. See our [privacy policy](/privacy)."*

**What happens behind the scenes when they hit submit:**

1. **The form posts to our server** — specifically to `/api/submissions` (a Next.js API route — a small function that runs on Vercel's servers, not in the browser).
2. **The server validates the input** — URL looks like a URL, email looks like an email, etc. If something's wrong, the browser shows an inline error.
3. **The server writes a row to Supabase** — a new row in the `submissions` table with all the form data plus a timestamp and status `new`.
4. **The server triggers the Crawler Agent** — kicks off a function that visits the customer's URL and reads it (full detail in Stage 4).
5. **The server pushes the contact to Systeme.io** — one API call (`POST /api/v2/contacts`) creates or updates the contact with tag `submitted`. This triggers Systeme.io's workflow, which sends the welcome email automatically.
6. **The browser shows the scanning animation** — moves them to Stage 4 visually.

**Tools at this stage and what each does:**

| Tool | Plain-English purpose | Cost | Where the config lives |
|---|---|---|---|
| **Next.js API route** | A small function on our server that runs when the form submits. Validates the form, calls the other tools below, returns a response. | Free (included in the Vercel deploy) | `app/api/submissions/route.ts` |
| **Supabase** | Our database. The `submissions` table holds one row per scan. RLS-protected. | Free tier covers launch | supabase.com; credentials in Vercel env vars |
| **Systeme.io API** | One API call adds/updates the contact in your CRM and tags them `submitted` — which kicks off the email workflow. | Free | `SYSTEME_API_KEY` in Vercel env vars (server-side only) |
| **Our env file (`.env.local` for dev, Vercel env for prod)** | Where API keys and secrets live. Never in code. Never visible to the browser. | Free | Vercel dashboard → Project → Settings → Environment Variables. For local dev, a `.env.local` file in the repo (gitignored). |

**What goes wrong, and how we handle it:**

- **Their URL is broken / 404 / private** → Crawler returns "couldn't reach this URL." We show: "We couldn't reach [url]. Double-check it's spelled right, then try again." Their submission is still saved to Supabase + Systeme.io so the welcome email still goes out.
- **They submit the same email twice in one day** → We block the second submission with a friendly message ("You already submitted today — check your inbox for the result"). Prevents abuse.
- **Systeme.io API call fails** → The form still succeeds for the customer (we don't want to block them on a third-party hiccup), the submission is in Supabase, and you get an alert email so you can add the contact in Systeme.io manually.

---

## Stage 4 — Scanning animation + the Crawler Agent

**What the customer sees:** An animated screen that says "Scanning [their-domain.com]..." with a slow forest-green progress bar and rotating status lines:
- *"Reading your homepage..."*
- *"Checking for structured data..."*
- *"Looking at your AI-bot permissions..."*
- *"Comparing to similar businesses in your area..."*

Total time: 8–12 seconds. The animation honors `prefers-reduced-motion` (no flashing, no rapid spinning).

**What's actually happening behind the scenes:**

The **Crawler Agent** is the first of the four agents — the only one that runs at the *free scan* stage (the other three run after payment). It's a server-side function that:

1. **Fetches their URL** — sends an HTTP request to their homepage, gets back the HTML.
2. **Looks for structured data** — searches the HTML for `<script type="application/ld+json">` blocks (this is "schema markup" — the machine-readable version of the page).
3. **Fetches `/robots.txt`** — checks whether the site explicitly allows GPTBot, ClaudeBot, Google-Extended, etc.
4. **Fetches `/llms.txt`** — sees if the site has an LLM-friendly summary file.
5. **Parses meta tags** — pulls the OpenGraph and Twitter Card meta tags from the `<head>` of the HTML.
6. **Scans for surface signals** — does the page mention a founder by name? Does it have FAQs? Does it list a price?
7. **Returns a JSON blob** — a structured summary of what it found, which the Scoring step uses to compute the preliminary score.

**Tools at this stage:**

| Tool | What it does | Cost |
|---|---|---|
| `fetch` (built into Node.js / Next.js) | Makes HTTP requests to grab HTML, robots.txt, llms.txt | Free |
| **Puppeteer** (paid audit only) | A headless browser. For sites that need JavaScript to render their content (most React/Next.js sites), Puppeteer actually loads the page like a real browser, then we read it. Heavier; we only use it for the full paid audit, not the 10-second free scan. | Free open-source library; costs more compute on Vercel |
| **A schema parser** (built into our code) | Reads the JSON-LD schema blocks and extracts what type they are (Organization, Person, Service, FAQPage, etc.) | Free |

**Why the free scan doesn't use Puppeteer:** It's heavy and slower. Most small-business websites are simple enough that plain `fetch` + HTML parsing gets us 80% of what we need for the preliminary score. The paid audit DOES use Puppeteer to handle JavaScript-rendered sites accurately.

**What goes wrong:**
- **Slow site** → 15-second timeout; we show what we got and flag "couldn't fully scan."
- **Site blocks bots** → We catch that and show it as a finding (ironic — they're blocking AI bots, which is *exactly the kind of issue the audit surfaces*).

---

## Stage 5 — Teaser results page

**URL:** `practicalinformatics.com/ai-visibility/results/[id]` (the `[id]` is a unique identifier so each customer's result is private)

**What the customer sees:**

1. **A big number** — the preliminary AVI score, 0–100, in big gold serif (Lora), with the tier label below it ("— Discoverable —" or whichever tier applies). Same visual treatment as the cover of the sample report.
2. **One-line tier description** — "AI agents know you exist. They don't yet know what you do today." (or the appropriate tier line)
3. **2–3 obvious findings** — bulleted, plain language. Examples of what they might see:
   - *"No FAQ schema markup found — AI agents can't pull your FAQs into their answers."*
   - *"Your robots.txt doesn't explicitly allow AI crawlers (GPTBot, ClaudeBot, Google-Extended)."*
   - *"No founder named on your homepage — AI agents can't connect you, the human, to your business."*
4. **"What's NOT in this teaser"** — a list of what the paid report includes:
   - *Live queries against ChatGPT, Claude, and Gemini — what they actually say about you today*
   - *Side-by-side comparison with 2 competitors*
   - *10 prioritized fixes with effort estimates and projected score lift*
   - *Projected 60-day score if you implement the recommendations*
   - *30-minute walk-through call with Marty*
5. **The CTA** — a forest-green button: **Get the full report and walk-through — $497.** Below it: "Delivered within 24 hours. Includes a 30-min call."
6. **Secondary path** — *"Not ready? I'll email you the teaser report — no commitment."* (You'll send this manually with the goal of following up later.)

**What happens behind the scenes when they click the CTA:**

1. They land on a **Systeme.io checkout page** for the $497 Report (one of the two sales funnels you set up on day 1).
2. They enter card info on Systeme.io's hosted checkout (Stripe processes the card in the background since you connected Stripe in setup step 2).
3. Stripe charges them $497.
4. Systeme.io updates the contact tag to `paid` and redirects them to `/ai-visibility/scheduled` on our site.
5. Systeme.io's workflow detects the tag change and **fires a webhook to our `/api/audits/run` endpoint**, kicking off the full agent pipeline (Stage 7).
6. Systeme.io sends you a notification: "New sale — $497 from [email]."

**Tools at this stage:**

| Tool | What it does | Cost |
|---|---|---|
| **Systeme.io checkout** | A hosted checkout page connected to your Stripe account. Handles card collection, success/failure, post-payment tag updates, and webhook firing. | Free (free Systeme.io tier supports 1 sales funnel; Stripe takes 2.9% + $0.30 = $14.71 on a $497 charge) |
| **Our `/ai-visibility/results/[id]` page** | Reads the result data from Supabase, renders the score + findings, shows the CTA that links to Systeme.io's checkout. | Free (Vercel) |

**What goes wrong:**
- **They close the tab before paying** → No problem. Their contact is in Systeme.io with tag `submitted`. The workflow's nudge branch (4 days later) fires automatically.
- **Stripe charge fails (bad card)** → Systeme.io's checkout shows the error; the customer never gets tagged `paid`; the nudge branch will catch them.

---

## Stage 6 — Stripe checkout + scheduling

**URL:** `practicalinformatics.com/ai-visibility/scheduled` (after Stripe redirects them)

**What the customer sees:**
1. **Confirmation banner** — "✓ Payment received. Your full report is on the way."
2. **Calendar embed** — a Tally form (or Cal.com embed) where they pick a time for their 30-minute walk-through call. This is the same Tally already wired into our site.
3. **Timeline** — "Your full report will arrive within 24 hours. Your walk-through call will be scheduled below."
4. **Receipt info** — small text confirming charge of $497.

**What happens behind the scenes:**

1. Customer pays on Systeme.io's checkout → contact tagged `paid`.
2. Systeme.io fires a webhook to our `/api/audits/run` endpoint with the contact's email + URL.
3. Our **Orchestrator** function kicks off the full audit pipeline — Crawler (paid version with Puppeteer) → Query Agent (4 LLMs in parallel) → Scoring Agent → Report Agent. ~3–5 minutes end-to-end.
4. The draft report lands in your review queue at `/admin/audits/[id]`.
5. You spend 5–15 min reviewing, polish anywhere needed, click **Send**.
6. On Send: Systeme.io is told to tag the contact `report_sent`, which triggers the delivery email (PDF + hosted report URL).
7. When the customer picks a calendar time in Tally, Tally emails you and puts it on your calendar.

**Tools at this stage:**

| Tool | What it does | Cost |
|---|---|---|
| **Tally** | Calendar booking form. Already wired into our site. Customer picks a 30-min slot; you get an email and a calendar invite. | Free tier covers our use |
| **Systeme.io webhook** | When the `paid` tag is added, Systeme.io POSTs to our server. Tells us to run the full audit pipeline. | Free (Systeme.io feature) |

---

## Stage 7 — Full report delivered

**What the customer gets:**
1. **An email** — subject: "Your AI Visibility Report — [their company name]." Body: a one-page condensed summary with the AVI score, the headline finding, and 2 buttons: *Read the full report* (links to `/reports/[id]`) and *Download PDF*.
2. **A hosted URL** — `practicalinformatics.com/reports/[id]?token=abc123` — they can revisit anytime for 6 months. Token-protected so only they can see it.
3. **A PDF attachment** (or link to download) — the same content as the hosted URL, formatted exactly like the sample report you've already seen. 22 pages, on-brand, polished.
4. **Their scheduled call** — they show up to the Tally-booked 30-min call. You walk them through the report.
5. **The Sprint upsell** — at the end of the report, the gold $2,997 Sprint card. You can also pitch it on the call.

**How the report gets built (automated, with a quick human review step):**

The audit pipeline runs end-to-end the moment payment is confirmed. Here's the literal sequence:

1. **Systeme.io tags the contact `paid`** (either via its own checkout, or because our Stripe webhook tells it to).
2. **Systeme.io fires a webhook to our server** at `/api/audits/run` with the contact's email + URL.
3. **The Orchestrator function starts** — a server-side function that calls the four agents in sequence.
4. **Crawler Agent runs** — fetches the customer's website, parses schema/robots.txt/llms.txt, returns JSON. ~5–15 seconds.
5. **Query Agent runs in parallel** — calls OpenAI (ChatGPT), Anthropic (Claude), and Google (Gemini) APIs. Runs the 5 default prompts against each. Captures responses, classifies each as accurate/outdated/invisible/partial/entity-error. ~60–120 seconds. Costs ~$0.15–$0.50 in API fees.
6. **Scoring Agent runs** — pure computation. Applies the rubric to the Crawler + Query outputs. Produces 6 dimension scores, total AVI, tier, and the ranked fix list. ~1 second.
7. **Report Agent renders the HTML report** at `/reports/[id]` — fills in every section from the scored data: cover, executive summary, query cards, dimension scorecard with radar chart, competitor table, fix list, projected score, Sprint upsell, appendix. ~5 seconds.
8. **PDF is generated** from that HTML via Puppeteer. ~10 seconds.
9. **The draft lands in your internal review queue** at `/admin/audits/[id]` (a private page only you can see). Total time from payment to draft: ~3–5 minutes.
10. **You review for 5–15 minutes.** Polish the executive summary's headline finding. Spot-check the "What AI returned" quotes for accuracy. Verify the competitor picks make sense. Tweak anything that sounds robotic. Click **Send**.
11. **On Send**: the report PDF is emailed via Systeme.io to the customer, the hosted `/reports/[id]` URL is unlocked with a signed access token, and the Systeme.io contact is tagged `report_sent` — which triggers the post-delivery email sequence (call reminder, post-call follow-up, 60-day re-scan reminder).

**Why a 10-minute review step instead of fully hands-off:**

- LLM queries return unpredictable text. The "What AI returned" quotes in the report are real LLM outputs — sometimes funny, sometimes wrong, sometimes phrased in ways that need light editing.
- The headline finding is the single most important paragraph in the report. A model can draft it from the scored data; your hand on it makes it sing.
- The competitor picks need a sanity check — the Query Agent may surface plausible competitors that aren't actually a good fit.
- After ~10 well-reviewed audits, the agents will be tuned enough that you can switch to "auto-send" mode if you want. Until then, the review is cheap insurance.

**Tools used to deliver the report:**

| Tool | Role | Cost |
|---|---|---|
| **Hosted report template** (`/reports/[id]`) | The visual report — React components matching the sample PDF exactly. Branded with our Tailwind/Lora design system. | Free |
| **Puppeteer** | Turns the HTML report into the downloadable PDF. Runs in a Node serverless function. | Free open-source |
| **Internal review page** (`/admin/audits/[id]`) | A private page where you preview the draft, edit any field, click Send. | Free |
| **Systeme.io email** | Sends the report-delivery email and all subsequent automation emails. | Free tier (3K contacts, unlimited emails) |
| **Signed access tokens** | Random string in the URL that proves the visitor owns the report. Stored in DB. Expires after 6 months. | Free |

**The four "agents" — what each one literally is:**

These aren't sci-fi AI agents. They're **server-side functions written in TypeScript** that each do one job:

1. **Crawler Agent** — a function. Input: a URL. Output: a JSON object describing what it found on the site.
2. **Query Agent** — a function. Input: business name, industry, location. Output: a JSON object with all the LLM responses, tagged with whether the business was mentioned and how accurately.
3. **Scoring Agent** — a function. Input: Crawler + Query outputs. Output: a JSON object with the six dimension scores, the tier, and the prioritized fix list.
4. **Report Agent** — a function. Input: all of the above. Output: a rendered HTML report and a PDF file.
5. **Orchestrator** — a function. Calls 1, 2, 3, 4 in sequence and handles errors.

That's it. Five functions. The word "agent" makes them sound mysterious. They aren't.

---

## Where Systeme.io fits — the final architecture

Two systems, talking to each other through APIs. Each one does what it does best.

```
┌────────────────────────────────────────────────────────────────────────┐
│  practicalinformatics.com (Next.js)                                    │
│  — your domain, your brand, your design system                         │
│                                                                         │
│   • /ai-visibility landing page                                         │
│   • /ai-visibility/scan form                                            │
│   • /api/submissions  (runs Crawler, computes prelim score)             │
│   • /ai-visibility/results/[id]  (teaser page)                          │
│   • /api/audits/run  (runs the full agent pipeline)                     │
│   • /admin/audits/[id]  (your private review page)                      │
│   • /reports/[id]  (the polished, branded hosted report)                │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │
                               │  API calls + webhooks  (both directions)
                               │
                               ↓
┌────────────────────────────────────────────────────────────────────────┐
│  Systeme.io (free plan)                                                │
│  — the marketing brain. You log in here to tweak emails and copy.      │
│                                                                         │
│   • Contacts list (everyone who's ever submitted)                       │
│   • Tags: submitted, teaser_sent, paid, report_sent, sprint_sold        │
│   • Checkout page for the $497 Report                                   │
│   • Checkout page for the $2,997 Sprint                                 │
│   • One branching workflow that handles every email automatically       │
└────────────────────────────────────────────────────────────────────────┘
```

**What lives where:**

| Lives on practicalinformatics.com (Next.js) | Lives in Systeme.io |
|---|---|
| Landing page, form, results page, hosted report | Contacts database |
| The four agents (Crawler, Query, Scoring, Report) | Email templates |
| The review page where you polish the draft | Workflow automation (drips, reminders) |
| PDF generation | Stripe-connected checkout pages |
| API routes that talk to Systeme.io | Tags that drive who gets which email when |

**How they talk to each other:**

1. **Form submit on our site → contact pushed to Systeme.io.**
   Our `/api/submissions` does two things: (a) runs the Crawler and computes the prelim score, (b) POSTs the customer's email and tags to Systeme.io's contacts API. The contact lands in Systeme.io tagged `submitted`.

2. **Tagging triggers Systeme.io's workflow.**
   Their workflow watches for tag changes and fires the right email branch.

3. **Customer pays on Systeme.io's checkout page.**
   Systeme.io's checkout (free tier supports this — 1 sales funnel) handles the card. On success, Systeme.io tags the contact `paid` and sends a webhook to our `/api/audits/run` endpoint.

4. **Our agent pipeline runs.**
   ~3–5 minutes later, the draft report is in your review queue.

5. **You click Send → contact tagged `report_sent`.**
   Our server makes one more API call to Systeme.io updating the tag. That tag change continues the workflow: the customer gets the delivery email, then the call reminder 24 hours before their booking, then a post-call follow-up.

6. **60 days later** — Systeme.io fires the "free re-scan" email automatically. No action from you needed.

---

## The single-workflow design (fits on the Free plan)

Systeme.io free gives you **1 automation rule and 1 workflow.** That sounds restrictive — but you can fit the entire AVI marketing automation into a single branching workflow. Here's the shape:

```
TRIGGER: contact tagged "submitted"
    │
    ↓
SEND: Welcome email — "Your scan is running. Here's what to expect."
    │
    ↓
WAIT 5 minutes
    │
    ↓
SEND: Teaser email — "Your preliminary score is [X]. See the full report below."
    │     (link goes to /ai-visibility/results/[id] on our site)
    │
    ↓
WAIT 24 hours
    │
    ↓
DECISION: Is contact tagged "paid"?
    │
    ├── YES ────────────────────────────────────────────────────────┐
    │                                                                │
    │                                                                ↓
    │                                                  WAIT for "report_sent" tag
    │                                                                │
    │                                                                ↓
    │                                                  SEND: "Your full report is ready"
    │                                                  with PDF + hosted link
    │                                                                │
    │                                                                ↓
    │                                                  WAIT 24 hours before scheduled call
    │                                                                │
    │                                                                ↓
    │                                                  SEND: Call reminder
    │                                                                │
    │                                                                ↓
    │                                                  WAIT 24 hours after call
    │                                                                │
    │                                                                ↓
    │                                                  SEND: Post-call follow-up
    │                                                  (mentions Sprint upsell)
    │                                                                │
    │                                                                ↓
    │                                                  WAIT 60 days
    │                                                                │
    │                                                                ↓
    │                                                  SEND: Free 60-day re-scan reminder
    │                                                                │
    │                                                                END
    │
    └── NO ─────────────────────────────────────────────┐
                                                         │
                                                         ↓
                                            SEND: Soft nudge — "Did you see your score?"
                                                         │
                                                         ↓
                                            WAIT 4 days
                                                         │
                                                         ↓
                                            DECISION: Is contact "paid" now?
                                                         │
                                                         ├── YES → join the YES branch above
                                                         │
                                                         └── NO ─────┐
                                                                     │
                                                                     ↓
                                                       SEND: Final follow-up
                                                       ("Last call — happy to talk")
                                                                     │
                                                                     END
```

One workflow, 8 emails, every customer covered.

**When to upgrade to Startup ($27/mo):** the moment you want a second separate workflow — for example, when you launch the Sprint as its own funnel with its own pre-sale sequence. For now, Free is enough.

---

## Day-1 Systeme.io setup checklist

You can start these in parallel with the code build. Each one is a few clicks, no code.

| # | Step | Where | What to do |
|---|---|---|---|
| 1 | Create your contact tags | Systeme.io → Contacts → Tags | Add: `submitted`, `teaser_sent`, `paid`, `report_sent`, `call_scheduled`, `call_complete`, `sprint_sold`, `rescan_sent` |
| 2 | Connect Stripe for checkout | Systeme.io → Settings → Payment gateways | Click "Connect Stripe," sign in, authorize. (You'll use your existing Stripe account.) |
| 3 | Create the $497 Report sales funnel | Systeme.io → Funnels → New | One-step funnel: checkout page → thank-you page. Price: $497. After payment, redirect to `https://www.practicalinformatics.com/ai-visibility/scheduled` and tag the contact `paid`. |
| 4 | Create the $2,997 Sprint sales funnel | Same | Same shape, different price. Tag the contact `sprint_sold` on success. |
| 5 | Draft the 8 emails in the workflow | Systeme.io → Emails → Templates | One template per email in the diagram above. We'll provide copy. Each one is 2–4 sentences. |
| 6 | Build the single workflow | Systeme.io → Automations → Workflows | Drag-and-drop the branching diagram above. Triggers on `submitted` tag. |
| 7 | Create a public API key | Systeme.io → Profile → Settings → Public API keys | Click Create. **Copy the key immediately** — you only see it once. We'll put this into our Vercel environment variables. |
| 8 | Share the API key with me (the dev) | Vercel dashboard (you'll add it yourself) | Project → Settings → Env Variables → add `SYSTEME_API_KEY=...` (server-side only — no `NEXT_PUBLIC_` prefix). |

If any of those is confusing as you do it, screenshot it and send — I'll write a step-by-step for that specific one.

---

## Every tool, every cost, every config — one table

| # | Tool | Plain-English role | Cost | Where the config lives |
|---|---|---|---|---|
| 1 | **Next.js** | The framework that runs our website and the agent functions. Already in use. | Free | `next.config.ts`; same as parent site |
| 2 | **Vercel** | Hosts our website. Auto-deploys when we push code. | Free tier (Hobby) covers launch; Pro is $20/mo when we outgrow it. | Vercel dashboard |
| 3 | **Systeme.io** | Contacts CRM + email automation + Stripe-connected checkout. Where every email and follow-up lives. | Free tier (2K contacts, 1 workflow). Upgrade to Startup $27/mo when you need more workflows. | systeme.io dashboard |
| 4 | **Stripe** | The card processor that powers Systeme.io's checkout pages. | 2.9% + $0.30 per transaction; no monthly fee | Connected through Systeme.io → Settings → Payment gateways |
| 5 | **Tally** | Calendar booking form for the 30-min call. Already wired into our site. | Free tier | Tally dashboard |
| 6 | **OpenAI API** | Runs the "What does ChatGPT say about this business?" query. | ~$0.10–$0.30 per audit | platform.openai.com; API key in Vercel env vars (server-side only) |
| 7 | **Anthropic API** | Same but for Claude. | ~$0.10–$0.30 per audit | console.anthropic.com; API key in Vercel env vars (server-side only) |
| 9 | **Google Gemini API** | Same but for Gemini. | Free tier covers light use, then ~$0.05–$0.20 per audit | ai.google.dev; API key in Vercel env vars (server-side only) |
| 10 | **Puppeteer** | Headless browser. Used (a) to crawl JS-heavy customer sites, (b) to render our HTML report as PDF. | Free open-source | npm install; runs in a Node serverless function |
| 11 | **Supabase** | Database for submissions and audits + file storage for the PDF reports. We'll use it from day 1 (not Google Sheets). | Free tier covers a lot; $25/mo Pro when we outgrow it | supabase.com; credentials in Vercel env vars |

**Total monthly fixed cost at launch (free Systeme.io, free Supabase, free Vercel):** ~$0. You only pay LLM API costs per audit (~$1–2) and Stripe's 2.9% on sales.

**Total monthly fixed cost at ~30 audits/month:**
- Vercel Pro $20 + Systeme.io Startup $27 + Supabase Pro $25 + LLM API costs ~$45 (≈$1.50 × 30 audits) + Stripe fees ($14.71 × 30 sales = $441 in fees on $14,910 in revenue)
- **~$117/month in fixed tooling + Stripe fees.** Net revenue per sale: ~$478.

---

## Configurations you'll need to set up (one-time)

These are the "knobs to turn" before any of this works. Most are dashboard clicks. The Systeme.io setup above is the bulk of it; this table covers everything else.

| # | Configuration | Where | What you do | When |
|---|---|---|---|---|
| 1 | All 8 Systeme.io setup steps above | systeme.io | (See "Day-1 Systeme.io setup checklist" section) | Week 1 — you can do this in parallel with my build work |
| 2 | Create Supabase project | supabase.com | New project, name it "practical-informatics-avi." Pick the US-West region. Copy URL + anon key + service role key. | Build week 1 |
| 3 | Add Supabase env vars to Vercel | Vercel dashboard → Settings → Env Variables | `NEXT_PUBLIC_SUPABASE_URL=...`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`, `SUPABASE_SERVICE_ROLE_KEY=...` | Build week 1 |
| 4 | Create OpenAI / Anthropic / Google AI API keys | Each provider's dashboard | Sign up, add billing, generate API keys, copy each to Vercel env vars. **All server-side only — no `NEXT_PUBLIC_` prefix.** | Build week 2 |
| 5 | Add Systeme.io webhook for `paid` tag | Systeme.io → Workflows → trigger on tag added | Webhook URL: `https://www.practicalinformatics.com/api/audits/run`. Method: POST. | Build week 3 |
| 6 | Add Systeme.io API key to Vercel env | Vercel dashboard | `SYSTEME_API_KEY=...` (server-side only) | Build week 1 |
| 7 | Tally form for the AVI 30-min call | Tally dashboard | Variant of existing Tally form. Embed code copied. | Build week 2 |

---

## Build phase vs operating phase, side by side

| Stage | During the 3-week build | Once we're operating |
|---|---|---|
| Landing page | Built in week 1 on our site | Live; you tweak copy in `lib/content.ts` |
| Scan form + Crawler | Built in week 1 | Customer submits → preliminary score in ~10 sec |
| Teaser results page | Built in week 1 | Renders score from Crawler output |
| Systeme.io contact sync | Wired in week 1 | Every form submit creates/updates contact with tag |
| Email automation (the workflow) | You design it in week 1; we wire triggers in week 2 | Runs automatically, you log into Systeme.io to tweak copy |
| Checkout | Set up in week 1 by you | Customer pays via Systeme.io checkout |
| Query Agent | Built in week 2 | Calls 4 LLM APIs on every paid audit |
| Scoring Agent | Built in week 2 | Computes 6 dimensions + tier + fix list |
| Report renderer | Built in week 2–3 | Auto-fills the report template from scored data |
| PDF generation | Built in week 3 | One-click generation from the hosted report |
| Internal review page | Built in week 3 | Your private workspace to polish + Send each report |
| Walk-through call | Tally booking, wired week 2 | Customer self-schedules; you show up |
| 60-day re-scan | Built into Systeme.io workflow in week 1 | Fires automatically; agent pipeline reruns; you review + Send |

---

## When something goes wrong — recovery playbook

| Problem | What the customer sees | What you do |
|---|---|---|
| Crawler can't reach their URL | "We couldn't reach [url]" with retry button | Submission is in Supabase + Systeme.io anyway; you follow up via Systeme.io email |
| Systeme.io API call fails on form submit | Form still says "success" | You get a backup notification; manually add the contact later |
| Stripe payment fails (inside Systeme.io checkout) | Stripe's error message on Systeme.io's page | Customer retries; no action needed from you |
| One of the 4 LLM APIs returns garbage | Draft report still generates; that query card is flagged in your review queue | Re-run that one query from the review page; regenerate. No customer impact. |
| Customer wants a refund | n/a | Stripe dashboard → refund. Tag contact `refunded` in Systeme.io. |
| Customer says "I never got my report" | n/a | Check Systeme.io contact tags. If `paid` but no `report_sent`, check your review queue. If `report_sent`, resend via Systeme.io. |
| Their site uses heavy JavaScript and Crawler returns nothing | Low/0 score with "site requires JS rendering — full audit will use deeper crawl" finding | Their paid audit uses the Puppeteer-powered Crawler path which handles JS. No manual workaround needed. |
| LLM API costs spike unexpectedly | n/a | Check Vercel logs for unusual activity; check rate limits in each provider dashboard. We'll set a per-audit cost cap of $5 to prevent runaway costs. |

---

## The 3-week build plan (week-by-week)

This is what the 3 weeks actually look like. After this, audits run themselves and you spend 5–15 min per report reviewing.

### Week 1 — Funnel surface and contact pipeline

**What I build:**
1. `/ai-visibility` landing page — copy in `lib/content.ts`, page in `app/ai-visibility/page.tsx`. Calm, on-brand. Pricing visible (Free Scan / $497 Report / $2,997 Sprint). FAQ. About-Marty block. (Day 1–2)
2. `/ai-visibility/scan` form page. URL, email, name, industry, location, optional competitors. Validates inputs. (Day 2)
3. `/api/submissions` API route — receives the form, validates it, kicks off the Crawler. (Day 3)
4. Supabase project + `submissions` and `audits` tables with Row Level Security. (Day 3)
5. The lightweight Crawler Agent — fetches HTML, parses schema, reads robots.txt and llms.txt, computes the prelim score. (Day 4–5)
6. `/ai-visibility/results/[id]` teaser page — renders the prelim score + 2–3 findings + checkout CTA. (Day 5)
7. Systeme.io API integration — every form submit creates/updates a contact with the `submitted` tag. (Day 5)

**What you do in parallel:**
- All 8 steps from the Day-1 Systeme.io Setup Checklist above.
- Sign up for OpenAI, Anthropic, Google AI; create API keys; share with me to add to Vercel env vars.
- Approve copy on the landing page as I draft it.

**What's working by end of week 1:**
- A visitor can submit the form, see a real preliminary score on the results page, and get the welcome email from Systeme.io.
- You can click the checkout link and pay for real (since we'll use real Stripe, but in test mode at first).

### Week 2 — The four agents and the audit pipeline

**What I build:**
8. Query Agent — calls OpenAI, Anthropic, Google APIs. Runs 5 default prompts × 3 LLMs. Classifies each response. (Day 1–3)
9. Scoring Agent — encodes the rubric in TypeScript. Computes 6 dimension scores, picks tier, ranks fixes. (Day 3)
10. Competitor discovery — uses the Query Agent to identify 2 plausible competitors and run mini-audits on them. (Day 4)
11. Orchestrator function — sequences Crawler → Query → Scoring. (Day 4)
12. `/api/audits/run` endpoint — Systeme.io's `paid` webhook hits this. Kicks off the Orchestrator. (Day 5)

**What you do in parallel:**
- Test the form + teaser flow on 3–5 real small business URLs you know. Tell me where the prelim score feels wrong.
- Tune the wording of the 8 emails in your Systeme.io workflow.

**What's working by end of week 2:**
- A test payment triggers the full agent pipeline. You can see the raw scored output in an admin page (raw JSON for now — pretty rendering comes in week 3).

### Week 3 — The report, the PDF, the review queue

**What I build:**
13. Report renderer — `/reports/[id]` page that turns the scored output into the polished HTML report matching the sample PDF exactly. Cover, executive summary, query cards, dimension scorecard with radar chart, competitor table, fix list, projected score, Sprint upsell, appendix. (Day 1–3)
14. PDF generation via Puppeteer — `/reports/[id]/pdf` route that returns a downloadable PDF. (Day 3)
15. `/admin/audits/[id]` review page — your private workspace. Shows the draft, lets you edit any field (headline finding, executive summary, competitor picks, individual quotes), then a **Send** button. (Day 4)
16. The Send action — fires Systeme.io webhook updating the contact tag to `report_sent`, which triggers Systeme.io to send the customer the delivery email with PDF + hosted URL. (Day 4)
17. End-to-end testing on 3 real businesses (your friends' or yours). Tune anywhere the output isn't customer-ready. (Day 5)

**What you do in parallel:**
- Review the first 3 test reports as if you were the customer. Tell me what feels off.
- Approve final copy for the landing page, results page, and all 8 emails.

**What's working by end of week 3:**
- A customer can fill the form, see their teaser score, pay via Systeme.io checkout, and receive a polished branded report within ~10 min of payment — after you review for 5–15 min and click Send.

### What's NOT in scope for the 3-week build

I'm holding these back so we ship cleanly. We add them after we have ~5 paid audits:

- **Auto-send mode** (skip the review step). We earn this once the agents are proven on real customers.
- **The $397/mo Monitoring tier.** Hidden in copy until we know we can deliver it cleanly.
- **Admin dashboard with audit list / search / metrics.** For now, you'll have a single review-queue page that lists pending audits.
- **Wikidata entity creation flow.** Mentioned in the Sprint deliverables but not part of the Report product.
- **Custom domains for hosted reports.** Reports live at `practicalinformatics.com/reports/[id]` for now.

---

## Decisions made (so you don't have to re-litigate)

These are settled — they came up earlier and we picked. Listed here so the doc has a single source of truth.

| Decision | Choice | Why |
|---|---|---|
| Manual MVP vs full automation | **Full automation from day 1** | You explicitly rejected manual. Worth ~3 weeks of build time to avoid 70–120 hours of data-entry per 20 audits. |
| Review step | **Yes, 5–15 min review before Send** for the first ~10 audits | LLM outputs are unpredictable; a light human pass keeps customer-facing quality high. Earn auto-send after the agents are proven. |
| Email + CRM + checkout | **Systeme.io** (free tier to start) | Already paid for. Visual workflow editor means you can tweak emails without me. Upgrade to Startup ($27/mo) when you need a second workflow. |
| Database | **Supabase from day 1** (skip Google Sheets entirely) | Going to need it anyway for automated audits. Free tier covers launch. No migration later. |
| PDF tool | **Puppeteer** | Native to our Node stack; runs cleanly on Vercel. We verify the output matches the sample PDF before launch. |
| Calendar | **Tally** (existing) | Already wired. No reason to add Cal.com. |
| Email sender domain | **`marty@practicalinformatics.com`** (replies go to you) | Personal-feeling emails convert better. Reply mess is a real cost but worth it for a $497–$2,997 product. |
| Landing page location | **`practicalinformatics.com/ai-visibility`** (our site, not Systeme.io) | Brand consistency. The whole funnel feels like one company. |
| Hide $397/mo Monitoring at launch | **Yes** | Don't sell what we can't deliver cleanly. Add to landing page when we have a real Monitoring product. |

---

## What I need from you to start week 1

Two things. Both are quick.

1. **Confirm this doc is clear enough.** If anything's confusing, point at the section and I'll rewrite. If you're ready, say "go."
2. **Start the 8-step Systeme.io setup checklist above** — you can do this in parallel with my code work. Steps 1–4 (tags, Stripe connection, the two sales funnels) are the most important; the workflow and emails (steps 5–6) we'll iterate on together in week 2.

Once you say "go," I'll start with the landing page and check in with you when there's something to look at locally.

---

**End of doc.**
