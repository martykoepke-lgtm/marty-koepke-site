# Marty Koepke — Brand Strategy & Reference

**Purpose.** A handoff document for any designer, brand strategist, or AI assistant helping complete the visual and content system for **martykoepke.com** and its two productized offerings. This describes what has been decided, what exists in code, and what still needs to be produced.

**Status.** Positioning locked. Palette locked. Naming locked. Wordmark direction locked. Detailed brand guide (spacing, tone-of-voice rulebook, expanded typography rules) still to be produced by the next pass.

---

## 1 · The umbrella and its two children

**Marty Koepke** is the personal umbrella brand.

Marty Koepke is an applied AI consultant with twenty years in enterprise healthcare informatics. She is the sole founder and operator of Practical Informatics LLC (the legal entity behind the personal brand — customers deal with Marty; the LLC surfaces only in legal contexts). Author of *Between the Clicks: The Hidden Work of Healthcare Informatics.* Based in Mokelumne Hill, California. She/her.

Two productized offerings sit under that umbrella:

- **Daizie** — AI visibility. A rigorous, research-backed audit of whether AI systems (ChatGPT, Claude, Perplexity, Gemini) accurately find, understand, cite, and recommend a small business when its buyers ask. Free readiness check + paid Daizie AI Visibility Assessment + Optimizations + Remeasure add-on + monthly monitoring.
- **Craizie** — AI governance. An informational + lead-generation surface (no paid product yet) helping small businesses that are *using or building with* AI understand governance without drowning in enterprise-security language. Content, playbooks, framework, newsletter.

## 2 · Positioning

Tagline for the umbrella: **People · Process · Possibilities.**

The throughline: an informaticist has always been in the business of people (the humans doing the work) + process (how the work flows) + possibilities (what technology can newly enable). AI is the current possibility layer, not the point.

Elevator: *"Marty Koepke is an applied AI consultant. Twenty years of informatics behind every recommendation."*

Voice: **serious inside, playful outside.** The naming (Daizie, Craizie) is intentionally light. The methodology under it is peer-review grade. Marty writes like an owner talking to another owner — never like an agency selling a subscription.

## 3 · Voice constants

- Plain English. No jargon, no buzzwords.
- Sentence-case headings.
- Calm, not urgent. No countdown timers. No scarcity plays.
- Honest about uncertainty. *"The literature suggests"* beats *"it is proven."*
- Specific over vague. Cite the number and the study.
- Generous to the reader. Footnote sources. Show the work.
- Never uses hedged superlatives: *"best-in-class," "world-class," "industry-leading,"* *"powerful,"* *"very,"* *"extremely."*

## 4 · Visual identity

### 4.1 Shared palette

The three brands share one palette. Estimated hex values below — refine with exact source values when available.

| Token | Hex | Use |
|---|---|---|
| Forest (primary) | `#2C4A32` | Buttons, headings on light, primary marks |
| Forest dark | `#1F3822` | Hover states, deep sections |
| Sage | `#8FA684` | Secondary green — subtle backgrounds, hairlines |
| Sage light | `#B8C7A9` | Very subtle backgrounds |
| Gold (accent) | `#DBB13D` | Highlights, CTA edges, sun-arc motif |
| Gold dark | `#B8952E` | Hover on gold |
| Cream (ivory) | `#F0DFB8` | Accent surfaces — cards, tone bands |
| Teal | `#758F97` | Secondary neutral — used sparingly for variety |
| Stone | `#D0DAD8` | Pale grey-blue — subtle sections |
| Charcoal | `#1A1A1A` | Body text on light |
| Warm white | `#FAFAFA` | Body canvas |

### 4.2 Typography

- **Serif (Lora)** for wordmarks and marketing display headings. Grounded, humanist, competent.
- **Sans (Inter)** for body copy and any UI / dashboard surface.

### 4.3 Logos and marks (locked direction)

- **Marty Koepke wordmark.** A cursive "mk" monogram sitting inside a golden sun arc, above serif caps *MARTY KOEPKE* underlined with a gold accent, and the tagline *PEOPLE · PROCESS · POSSIBILITIES* beneath. Compact form for favicons is the "mk" monogram alone in a rounded-square container.
- **Daizie logo.** A stylized daisy in gold and cream with a green stem and two leaves, with three small burst rays at the top-right suggesting new bloom / first light. Warm. Hopeful. "Small business being brought to life."
- **Craizie logo.** Four green + teal crescent shapes arranged rotationally around a central gold four-pointed star, with four small cardinal dot anchors. Reads as an ordered swirl / calm compass — "the crazy made sane." Intentionally avoids locks, shields, and gears.
- **Recurring sun-arc motif** connects the family. The arc appears in the Marty Koepke wordmark, echoes in Daizie's burst rays, and is implicit in Craizie's radial composition.

### 4.4 Reference imagery

The brand uses **soft watercolor landscape imagery** as backing — foothills, oak trees, sunrise light, wisps of leaves and plants — rendered in the palette (green, gold, cream, with hints of teal and stone). See the foothills watercolor hero currently intended for `apps/site/public/images/hero-bg.jpg`. The visual register is *quiet, spacious, unhurried, gently gilt* — not stock photography, not corporate.

### 4.5 What's currently in the repo (assets)

- `apps/site/public/images/hero-bg.jpg` — hero background (foothills watercolor when swapped)
- `apps/site/public/large-tree-background.png` — immersive tree used behind customer reports
- `apps/site/public/images/headshot.jpg` — Marty's headshot
- `apps/site/public/images/logo-*.png` — **old Practical Informatics logos, to be replaced**
- `apps/site/brand-assets/` — legacy PI brand PNGs (archive)

### 4.6 What still needs to be produced

- Marty Koepke wordmark SVG (full + compact "mk" monogram)
- Daizie logo SVG
- Craizie logo SVG
- Favicons (`.ico` at 16×16 and 32×32) for each of the three
- Open Graph card images (1200×630) for each product page
- Additional watercolor scenes for section headers on Daizie and Craizie pages

## 5 · The content-over-static-background presentation pattern

**A design decision worth understanding: the site treats layout as layered, not stacked.**

A large landscape image (foothills, oak, sunrise) is fixed to the viewport at the body level. Content sections then float over the top with either translucent glass surfaces (`rgba(white, 0.92-0.96)` with `backdrop-filter: blur`), warm-ivory panes, or deep-forest reversed panes. As the user scrolls, the background image stays put; the content passes over it. The result is a sense of depth and calm movement without any heavy animation or parallax scripting.

The same pattern is already implemented in the operator console and in the customer-facing reports:

- `.report-workspace` — fixed tree background with a green-to-gold gradient overlay, content cards sitting on top
- `.scan-result-workspace` — same pattern with a slightly different overlay ratio
- `.section-paper`, `.section-cream`, `.section-forest`, `.section-sage` utility classes (new in `globals.css`) are the marketing-page equivalents

The convention is: **any surface where the user reads long content gets a legible pane; the background image is atmosphere, not decoration.**

## 6 · Web navigation structure

### 6.1 Current

`Home · About · AI Visibility · Contact`

### 6.2 New

`Home · About · Daizie · Craizie · Contact`

**The "AI Visibility" tab is retired.** Its functionality moves entirely into `/daizie`. The AI Business Accuracy pipeline, the free readiness check, the paid audit intake, the customer report renderer, the methodology page — all become subroutes of `/daizie`.

**Craizie is a new nav entry.** For now (v1), it is content-only: a landing page, a "what is AI governance" explainer, a framework page in Marty's voice, a library of playbooks / checklists (starts empty, populated over time), and a newsletter signup as the primary lead capture.

### 6.3 URL structure

```
/                            Home — personal umbrella hub
/about                       Marty's story, informatics → AI arc
/book                        Between the Clicks
/work                        Portfolio (GovernIQ, Activiteez, Sophia, VytalPath)
/contact                     Booking + email
/daizie                      Landing
/daizie/scan                 Free AI Readiness Check
/daizie/scan/report/[id]     Free report renderer
/daizie/order                Paid Daizie AI Visibility Assessment
/daizie/report/[token]       Paid report renderer (token-gated)
/daizie/methodology          Show-your-work rubric page
/daizie/framework            What we measure + why
/craizie                     Landing
/craizie/what-is-it          Plain-English governance explainer
/craizie/framework           Marty's practical approach
/craizie/library             Playbooks + checklists + articles
/craizie/newsletter          Signup (primary lead capture for Craizie)
/privacy, /terms, /cookies, /acceptable-use, /returns    (legal)
/sitemap.xml, /robots.txt, /llms.txt                     (utility)
```

## 7 · The one-paragraph brand pitch (for anyone completing the system)

Marty Koepke is a personal umbrella brand for a healthcare-informatics leader now working in applied AI. Two productized offerings live underneath — Daizie (a rigorous AI-visibility audit for small businesses, named for a daisy at first light) and Craizie (an informational surface for AI governance made sane). The visual system is warm, watercolor, quiet: forest green primary, mustard gold accent, warm ivory and cream surfaces, muted teal and stone for variety. Type is Lora serif for wordmarks and marketing, Inter sans for body and UI. Content sits over fixed landscape imagery in translucent panes, creating a sense of depth without animation. The voice is owner-to-owner, peer-review rigorous, semi-lighthearted at the surface — think Warby Parker's founder voice applied to informatics. The most visible motif is a golden sun arc, which appears in the Marty Koepke wordmark and echoes in Daizie's burst rays and Craizie's radial composition, tying the family together.
