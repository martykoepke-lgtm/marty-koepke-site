# Practical Informatics — Project Context

## Founder

**Marty Koepke (she/her)** — sole founder and operator of Practical Informatics LLC.
Twenty years in healthcare, fifteen-plus in enterprise informatics leadership.
System Clinical Informaticist at CommonSpirit Health. Author of *Between the
Clicks: The Hidden Work of Healthcare Informatics*. Based in Mokelumne Hill,
California. Use **she/her** pronouns throughout the site, schema, copy, and any
AI-facing documentation. Female. Do not assume otherwise based on the name "Marty."

## Strategic spine

`VISION.md` is the strategic north star. Read it when a design, copy, scope,
or pricing decision is hard. The voice rules in section 10 govern every
piece of brand-facing output (site pages, reports, emails, social copy):

- Plain English; no jargon, no buzzwords
- Sentence case headings, not Title Case
- Calm, not urgent — no countdown timers, no "only 3 spots left"
- Honest about uncertainty — "the literature suggests" beats "it is proven"
- Specific over vague — cite the number and the study
- Generous to the reader — footnote sources, link to rubric, show the work

Section 8 ("What we are deliberately not building") is a refusal list. If a
proposed feature contradicts it (a SaaS dashboard, a generalist agency
service line, a guaranteed-rankings promise), flag it before building.

`AVI_BUILD_PLAN.md` is the locked tactical sequence for the AI Visibility
Index work. `DECISIONS.md` logs architectural and product decisions in
chronological order — read it when you suspect a design choice has been
made and you want to confirm. `AVI_CUSTOMER_FLOW.md` documents the customer
journey (v1.0; supersedes pending). `AVI_FREE_FLOW.md` is the plain-English
walkthrough of the free Readiness Check — read this before touching any
code that implements the free scan. `AVI_OPS_MONITOR.md` is the plain-English
walkthrough of the AVI ops monitor (per-call logging + weekly summary email
+ 95% out-of-band spend alerts) — read this before touching anything in
`lib/avi/llm.ts`, `app/api/cron/*`, or the `api_calls` table.

**Build order is locked to monitor-first** (DECISIONS.md D004): the ops
monitor ships before any customer-facing AVI work. No exceptions.

`AVI_AGENT_DESIGN.md` is **v1.0 and superseded** — its "4 agents + orchestrator"
framing is rejected in favor of deterministic pipeline orchestration; see the
build plan §2 and DECISIONS.md D001.

## What This Is

Marketing site for **Practical Informatics LLC**, Marty Koepke's one-person local
consulting practice. The site has a single purpose: explain the **Time Back
Assessment** and convert visitors into a free 20-minute conversation.

Practical Informatics serves small businesses (typically 1–25 employees) in
**Calaveras, Amador, and Tuolumne counties** — the California foothills. Marty is
based in Mokelumne Hill. The work: bring AI and smarter process to the
information work eating a small business owner's time and revenue.

**Single offer:** the **Time Back Assessment** — $1,500 flat. An on-site visit, a
written Time Back Report within 7 business days, a follow-up call, and one
implemented quick win.

**Sole conversion goal:** book a free 20-minute conversation (Tally form).

Marty's broader healthcare-informatics, speaking, and writing work lives at a
separate site, **martykoepke.com** — cross-linked here, not featured.

**Live URL:** https://www.practicalinformatics.com

### Second offering: AI Visibility Index (added May 2026)

The site also hosts a separate productized service, the **AI Visibility Index**,
that lives under `/ai-visibility`. This is not a foothills-local offering — it
serves established small businesses, solo founders, and small practices
anywhere in the U.S. who want to be findable by AI search engines (ChatGPT,
Codex, Gemini, Perplexity). Four-tier ladder:

1. **Free AI Readiness Check** — URL-only, ~30s, lead magnet
2. **Paid AI Visibility Index Report — $1,000** — ~3–8 min async pipeline,
   8–10 page PDF + walkthrough call. Fee credits 100% toward a Sprint if
   booked within 30 days.
3. **Done-with-You Remediation Sprint — $3,000 (Foundations) / $5,000 (Expanded)**
4. **Visibility Partner — $600/mo (optional, post-Sprint only)**

See `VISION.md` for the strategic framing and `AVI_BUILD_PLAN.md` for build
sequence. Code lives in `app/ai-visibility/`, `app/api/submissions/`,
`components/ai-visibility/`, `lib/avi/`, and `supabase/`.

> Note: VISION.md positions Practical Informatics as primarily an AI
> visibility consultancy. The existing "one-person local consulting practice"
> framing above (still serving the Time Back Assessment) is in tension with
> that. The two-offer narrative isn't fully resolved yet — flag in copy or
> nav changes that depend on the answer.

## Architecture

Next.js (App Router) with TypeScript, Tailwind CSS v4, and Framer Motion.
Calm, light, foothills-local aesthetic. Deployed to **Vercel**.

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (config lives in `app/globals.css` via `@theme`, no `tailwind.config`) |
| Animations | Framer Motion |
| Fonts | Inter (`--font-inter`, body) + Lora (`--font-lora`, serif headlines) |
| Blog | Markdown files in `content/blog/`, parsed by a tiny in-repo renderer (`lib/blog.ts`) — no CMS |
| Deployment | Vercel (push to `main` auto-deploys) |

## Design Direction — "calm canvas, kinetic story"

The visual brand is calm and grounded; **motion is the storytelling layer**, not
decoration. Any new section must pass both tests: does it look calm at rest, and
does motion advance the story rather than ornament it.

**Palette** (defined in `app/globals.css` `@theme`):
- Background / cream: `#FAF6EE`; dimmer warm tan: `#F2EBDC` (`cream-dim`)
- Forest green: `#1F3A2E` (primary), `#16291F` (dark)
- Gold: `#C9A961`, `#A8893F` (`gold-dark`), `#6B5424` (`gold-darker`)
- Text: charcoal `#2C2A26`, moss `#5A6B5A`
- Tan hairline: `#D8CCB4`

**Conventions:** quiet serif (Lora) headlines, sentence case, generous
whitespace, no drop shadows, no gratuitous gradients. Sections alternate tone
bands (`cream`, `cream-dim`, `forest`) via the `Section` component. Motion is
slow (~0.6s), eased, scroll-driven — never spring/bounce. All motion honors
`prefers-reduced-motion` (enforced globally in `globals.css`).

## File Structure

```
PracticalInformatics/
├── app/
│   ├── layout.tsx              # Root layout, fonts, SEO metadata, ProfessionalService JSON-LD
│   ├── page.tsx                # Home
│   ├── globals.css             # Tailwind v4 import + @theme palette + base styles
│   ├── icon.png                # Favicon (App Router auto-discovery)
│   ├── robots.ts               # robots.txt
│   ├── sitemap.ts              # sitemap.xml
│   ├── not-found.tsx           # 404 page
│   ├── about/page.tsx          # About Marty
│   ├── time-back-assessment/page.tsx  # The single offer — full detail
│   ├── contact/page.tsx        # Contact + booking
│   ├── blog/page.tsx           # Blog index (empty-state aware)
│   ├── blog/[slug]/page.tsx    # Individual post
│   ├── privacy/page.tsx        # Policy pages (GetTerms embeds)
│   ├── terms/page.tsx
│   ├── cookies/page.tsx
│   ├── acceptable-use/page.tsx
│   └── returns/page.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx           # Top nav
│   │   ├── Footer.tsx           # Footer (cream plate behind dark logo)
│   │   └── PolicyPage.tsx       # Shared policy page wrapper
│   ├── sections/
│   │   ├── HeroBanner.tsx       # Home hero (oak / foothills background)
│   │   ├── ThePath.tsx          # Interactive 5-step Time Back Assessment journey
│   │   ├── BuiltThings.tsx      # "A few things I've built" cards → WorkModal
│   │   ├── Faq.tsx              # Expandable FAQ accordion
│   │   └── FinalCta.tsx         # Shared closing CTA (Home, About, Assessment)
│   ├── motion/
│   │   ├── Reveal.tsx           # Scroll-reveal primitives (Reveal, RevealGroup, RevealItem)
│   │   └── RouteTransition.tsx  # Page-to-page transition wrapper
│   ├── ui/
│   │   ├── Section.tsx          # Tone-banded section + SoftDivider
│   │   ├── Button.tsx           # Button variants (primary, ghost, onForest)
│   │   └── Icons.tsx            # Inline SVG icon set (Icon, ArrowRightIcon)
│   ├── modals/
│   │   └── WorkModal.tsx        # Built-thing detail modal
│   └── embeds/
│       └── GetTermsEmbed.tsx    # GetTerms policy-document embed
├── lib/
│   ├── content.ts               # All site copy as typed constants
│   ├── links.ts                 # Outbound links + CTAs (single source of truth)
│   └── blog.ts                  # Markdown blog reader/renderer (frontmatter + minimal MD)
├── content/
│   └── blog/                    # Markdown posts (zero at launch — empty state handled)
├── public/
│   ├── images/
│   │   ├── hero-bg.jpg          # Foothills oak hero / OG image
│   │   ├── headshot.jpg
│   │   ├── logo-horizontal.png  # Nav logo / JSON-LD logo
│   │   ├── logo-lockup.png
│   │   ├── logo-mark.png
│   │   ├── governiq/            # 5 screenshots
│   │   └── activiteez/          # 5 screenshots
│   ├── llms.txt                 # AI agent content file
│   └── googleefff2183f67c65a4.html  # Search Console verification
├── AGENTS.md
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Content Management

All site copy lives in `lib/content.ts` as typed constants — components never
hardcode copy. Key exports:
- `SITE` — name, legal name, URL, tagline, location, service area
- `NAV` / `POLICIES` — navigation and policy route definitions
- `META` — per-page title/description
- `HOME` — hero intro, problem prose, "what I do" columns, differentiation, "who I am"
- `ABOUT` — story, principles, credentials, `built` (things-I've-built data)
- `ASSESSMENT` — the full Time Back Assessment page: hero, what's different,
  `path` (5-step journey), report bullets, cost, who-it's-for, note on AI, FAQ
- `FINAL_CTA` / `CONTACT` / `BLOG` — shared CTA, contact copy, blog copy

All outbound links and CTAs live in `lib/links.ts` — change them there and the
whole site updates. `BOOK_CALL_HREF` is the single most important CTA.

## Pages

| Route | Purpose |
|---|---|
| `/` | Home — hero, the problem, "what I do", differentiation (anti-AI-guru), "who I am", recent posts (only when 3+ exist), final CTA |
| `/about` | Marty's story, "How I work" principles, credentials, "A few things I've built", final CTA |
| `/time-back-assessment` | The single offer in full — what's different, not-local note, **The Path** (interactive 5 steps), cost, who it's/isn't for, note on AI, FAQ, final CTA |
| `/contact` | Hero + booking band (Tally) + email fallback + service-area note |
| `/blog`, `/blog/[slug]` | Markdown blog. Zero posts at launch; UI handles the empty state. Hidden from nav until first posts ship |
| `/ai-visibility` | AI Visibility Index landing — value prop, four-tier ladder, CTA to order form |
| `/ai-visibility/order` | Form (URL + email + business info) → posts to `/api/submissions` → redirects to results teaser |
| `/ai-visibility/results/[id]` | Token-gated teaser of the free crawler scan + CTA to purchase the full Index Report |
| `/api/submissions` | POST handler: validate, crawl URL, score, persist row to Supabase, return access token |
| `/privacy`, `/terms`, `/cookies`, `/acceptable-use`, `/returns` | Policy pages — GetTerms embeds via `PolicyPage` + `GetTermsEmbed` |
| 404 | `app/not-found.tsx` |

## The Path

The Time Back Assessment's 5-step client journey, rendered as an interactive
scroll-driven component (`ThePath.tsx`): free fit call → 90-minute on-site visit
→ written Time Back Report → 30-minute follow-up call → one implemented quick
win. The assessment page also renders an always-in-DOM `<ol>` of the same five
steps below it as an SEO / no-JS / AI-readable fallback.

## External URLs

| Destination | URL | Notes |
|---|---|---|
| Book a Call (primary CTA) | `https://tally.so/r/xXVPgo` | `BOOK_CALL_HREF` in `lib/links.ts` |
| Contact email | `marty.koepke@practicalinformatics.com` | `CONTACT_EMAIL`; `mailto()` helper builds prefilled links |
| martykoepke.com | `https://martykoepke.com` | Healthcare informatics / speaking / writing — cross-linked |
| LinkedIn | `https://www.linkedin.com/in/marty-koepke` | |
| Facebook | `https://www.facebook.com/profile.php?id=61564713020344` | |
| EHR Governance Assistant demo | `https://sophiav2.vercel.app/` | Linked from "things I've built" |

> Note: `lib/links.ts` anticipates a future booking tool (Cal.com/Calendly) and
> form backend (Formspree/Resend). When those ship, change the values in
> `links.ts` only.

## SEO

- JSON-LD: `ProfessionalService` in `app/layout.tsx`; `Service` + `FAQPage` on
  the assessment page; `ContactPage` on the contact page
- Open Graph + Twitter Card meta (hero image), per-page metadata via `META`
- `app/robots.ts` + `app/sitemap.ts` generate `robots.txt` / `sitemap.xml`
- `app/icon.png` is the favicon (App Router auto-discovery)
- `/llms.txt` linked from `<head>` as an LLM-readable summary
- Google Search Console verified

## AVI app — architectural rules

The AVI implementation in `lib/avi/`, `app/api/submissions/`, and
`app/ai-visibility/` follows these locked decisions (see `AVI_BUILD_PLAN.md`):

- **No autonomous orchestrating agent.** Deterministic pipeline orchestration
  (Inngest is the planned background-job surface for the paid pipeline).
  LLM calls happen at bounded points only: structured extraction per query
  response, LLM-as-judge per driver dimension.
- **Every LLM call:** temperature 0, JSON mode where supported, schema-validated
  output, raw inputs and outputs logged. Replay against logged inputs must
  produce the same result.
- **Never disable Supabase RLS.** Every table is RLS-enabled in the same
  migration that creates it. The AVI app uses service-role-only access
  through `/api/*` — customers never authenticate to Supabase directly.
- **Never commit `.env.local`.** Set hard daily spend caps in every LLM
  vendor dashboard. `.env.example` enumerates every key the AVI runtime
  expects, with comments on which phase each one is needed for.
- **Rubric version stamped on every audit row.** Bump `AVI_RUBRIC_VERSION`
  when scoring prompts or anchored scales change.
- **Pricing source of truth:** `public/Practical-Informatics-Pricing-Structure.md`
  is canonical. On-page copy in `lib/content.ts` needs to match it. Current
  state may drift — verify before quoting numbers.

## Development

```bash
npm run dev    # Dev server at http://localhost:3000
npm run build  # Production build
npm run start  # Production server
```

## Deployment

Vercel. Push to `main` triggers auto-deploy. AVI runtime needs API keys in
Vercel env vars (Anthropic, OpenAI, Google AI, Supabase, eventually
Perplexity/Tavily/Inngest/Stripe/Resend) — add them in the Vercel dashboard
when ready to enable paid flows.
