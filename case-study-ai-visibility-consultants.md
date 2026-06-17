# An AI visibility audit of five AI visibility consultants

**Status:** DRAFT v0.1 — methodology section only. Hook, findings, implications, and appendix still to write.

**Working notes (delete before publishing):**

- Rubric used: AVI v2.0 (locked 2026-06-06)
- Six audits run: PI (sanity baseline) + five named subjects
- Total spend: ~$1.67 across all six audits
- All raw data lives in Supabase (`audit_query_responses`, `audit_dimension_scores`) and as JSON in `/reports/`
- Eric Schwartzman crawler-block fairness gap was raised by Marty and resolved by the AI bot probe (see Methodology §6)

---

## Methodology

This is the section that decides whether the rest of the case study is defensible. Here is exactly what we did, every choice we made, and why.

### 1. The question we asked

If five companies publicly position themselves as AI visibility experts, do they themselves show up in AI search? We ran the same audit on each one — plus on Practical Informatics, so you can see how we score on the same rubric we built.

### 2. The subjects

| | Subject | Type | Positioning |
|---|---|---|---|
| 1 | Visibly AI | company | AI visibility consulting for businesses |
| 2 | Eric Schwartzman | personal brand | AI visibility & brand protection consultant |
| 3 | The Write Direction | company | AI visibility content guides for brands |
| 4 | Guthrie Group | company | Consulting practice using AI in client work |
| 5 | BotSee | company | AI visibility reporting tool for agencies |
| 6 | Practical Informatics | company | This is us. Included for transparency, not flattery. |

Five of the six are pure-play AI visibility services. Guthrie Group and BotSee sit slightly adjacent — Guthrie is a generalist consulting firm publishing about AI use cases, BotSee is a SaaS tool for agencies — but both publicly position themselves in the AI visibility category, so they earn a slot.

### 3. The rubric

We used the AVI v2.0 rubric, locked on 2026-06-06. Seven dimensions, each anchored on a 0–5 scale with verbal anchors at each integer. Each dimension carries equal weight (1/7 each) as a starting hypothesis until we calibrate from more audits.

| Dim | Name | What it measures |
|---|---|---|
| D1 | Entity Clarity | Can AI tell who this entity is from the site itself — clean name, About page, consistent identity |
| D2 | Cross-Source Corroboration | Does the entity show up across LinkedIn, Wikidata, press, podcasts, directories — not just on its own site |
| D3 | Schema & Structured Data | JSON-LD Organization/Person, OpenGraph, FAQ schema, llms.txt, robots.txt — the machine-readable layer |
| D4 | Information Gain | Does the site offer something AI can't easily find elsewhere — proprietary data, frameworks, original research |
| D5 | Topical Authority | Sustained, deep coverage of the topic the entity claims to be an expert in |
| D6 | Distribution Surface | Where else the entity's voice lives — newsletters, YouTube, podcasts, syndication |
| D7 | Method/Founder Signal | For companies: a clear methodology and offer definition. For personal brands: founder & author signal |

D7 branches by subject type. Eric Schwartzman is scored on the "Founder & Author Signal" anchored scale; the others are scored on "Methodology & Offer Definition."

The composite score is `0.40 × Readiness + 0.60 × Visibility`. Readiness is the average of the seven Dim scores rescaled to 0–1. Visibility is computed separately (see §5). Tier bands: Invisible (0.00–0.19), Hidden (0.20–0.39), Faintly Visible (0.40–0.59), Discoverable (0.60–0.79), Agent-Ready (0.80–1.00).

### 4. The query grid

For each subject we ran 60 LLM queries. Ten question templates, three engines, two repetitions per cell:

| # | Template | Intent |
|---|---|---|
| 1 | "Best AI visibility consultant for small business owner?" | category-search |
| 2 | "Top 5 AI visibility consultant in the United States" | category-search |
| 3 | "Who helps small business owners get their brand cited by ChatGPT, Claude, and Perplexity?" | category-search (long-tail buyer) |
| 4 | "Recommend a AI visibility consultant for someone who wants their brand to be cited when buyers ask AI search engines for help" | category-search (scenario) |
| 5 | "What companies offer AI visibility audit?" | category-search (feature) |
| 6 | "Tell me about {name}. What do they do?" | name-search |
| 7 | "Is {name} reputable? Should I hire them?" | name-search |
| 8 | "What's {name}'s pricing / approach?" | name-search |
| 9 | "{name} vs {competitor}" | competitive |
| 10 | "I'm a small business owner in the United States. Should I hire {name}?" | buyer-scenario |

To make the comparison fair, we used **identical category queries across all six subjects**. Same `buyer_descriptor`, same `pain_point`, same `scenario`, same `distinctive_term`. Only the subject's name and URL changed. This means templates 1–5 — the queries that don't name the subject — are word-for-word identical for every audit. That's what makes Presence and Share-of-Voice numbers comparable across the grid.

Templates 6–10 vary by subject (they reference the name) but use the same skeleton, same intent classification, and same buyer-scenario framing.

### 5. The engines

We used three LLM engines:

- **Anthropic Claude Haiku 4.5** (`anthropic`) — primary
- **OpenAI GPT-4o-mini** (`openai`) — secondary
- **Perplexity Sonar** (`perplexity`) — web-search-grounded

We tested a fourth engine (Google Gemini Flash) in an earlier audit and dropped it. At our concurrency setting of 5 parallel calls, Gemini's free tier returned a 60% error rate (12 of 20 cells failed in the test run). Per a previously-locked decision — *if Gemini still produces a high failure rate at concurrency 5, drop it from the engine set; better to run 3 reliable engines than 4 where one fails half the time* — we removed Gemini before the formal audit run. All six audits in this case study use the same 3-engine set.

Each query was issued twice (rep 1 and rep 2) at temperature 0 to surface the engines' modal answer rather than any single sample. The output of every cell is logged in full — query text, engine, rep, raw response, tokens, cost, duration — and is available in the appendix.

### 6. Scoring: LLM-as-judge

For each dimension on each subject, we made one call to Claude Sonnet (claude-sonnet-4-6, temperature 0, JSON-mode, schema-validated). The judge received:

- The dimension's anchored 0–5 scale with 2–3 golden examples per anchor point
- The subject's evidence package: crawler output (schemas, OG tags, headings, robots.txt, llms.txt), corroboration data (Tavily searches for LinkedIn, Wikidata, press), and the relevant visibility evidence
- The subject's name and subject type

The judge returned a numeric score, a written justification, and structured evidence pointers. Each justification cites specific items from the evidence package. If you disagree with a score, you can read the justification and the underlying evidence and check.

### 7. Visibility math

Separately from the rubric, we compute four pure-math metrics from the 60 query responses:

- **Presence** = share of responses that mention the subject
- **Citation** = share of responses that link to the subject's URL
- **Share-of-Voice** = subject mentions ÷ (subject mentions + competitor mentions). For all six subjects we used the same locked competitor reference set — **Profound, Otterly, Peec, Scrunch** — so the SoV denominator is comparable across the grid.
- **Prominence** = average position of the subject in responses (top, middle, late, not named)

Visibility composite = `0.20 × Presence + 0.30 × Citation + 0.30 × SoV + 0.20 × Prominence`.

### 8. Crawling, and a fairness issue we ran into

Our crawler identifies itself as `PracticalInformaticsBot/1.0 (+https://www.practicalinformatics.com)` — an honest, identified bot UA. We do not spoof browser User-Agent strings.

Five of six sites accepted our crawler without issue. Eric Schwartzman's site returned an HTTP 403, leaving the judge with no on-site evidence for D1 (Entity Clarity), D3 (Schema), and D5 (Topical Authority). His scores on those three dimensions reflect that absence — they anchor at 0 because the rubric's 0-level definitions match "no on-site signals."

Before publishing, we had to answer: is that a fair score, or a tooling artifact? We resolved it by testing the question directly. We probed all six sites with the four major AI bot User-Agents — GPTBot, ClaudeBot, PerplexityBot, CCBot. The results:

| Site | GPTBot | ClaudeBot | PerplexityBot | CCBot |
|---|---|---|---|---|
| practicalinformatics.com | 200 | 200 | 200 | 200 |
| visibly-ai.com | 200 | 200 | 200 | 200 |
| **ericschwartzman.com** | **403** | **403** | **403** | **403** |
| thewrite-direction.com | 200 | 200 | 200 | 200 |
| guthriegroup.com | 200 | 200 | 200 | 200 |
| botsee.io | 200 | 200 | 200 | 200 |

Of the six subjects, **only Eric Schwartzman's site blocks AI bot crawlers**. The block is implemented at the WAF/hosting layer (Kinsta + Cloudflare bot management) and applies to every identified AI bot we tested. His /robots.txt is itself unreachable — it returns the same 403, with a JavaScript challenge page. The other five sites accept all four AI bot UAs, and none of them use robots.txt to explicitly opt out of AI training (no `Disallow:` rules for GPTBot, ClaudeBot, Google-Extended, or CCBot in any of the five readable files).

This reframes the fairness question. The rubric measures *AI visibility* — what AI engines can discover, parse, and surface. If AI engines genuinely cannot reach Eric's site, his on-site readiness scores being zero is the most accurate possible measurement, not a measurement error. Re-crawling with a browser User-Agent would have been the wrong move: it would have measured visibility-to-humans, not visibility-to-AI.

We kept Eric's scores as the audit produced them. The 403 is a real signal about an AI visibility consultant whose own site is configured to be invisible to the AI bots he's supposed to help optimize for. Whether that configuration is intentional or an unaware default of his hosting stack is a separate question — observable fact is that AI engines can't read his site.

### 9. Reproducibility

Every external call this audit makes — every LLM query, every Tavily search, every scoring call — goes through a wrapper that logs the inputs, the outputs, the token counts, the cost, and the timestamp. The audit JSON files in `/reports/` include the full query grid, the full judge justifications, the crawler output, and the corroboration data. The same subject file, the same rubric version, and the same engine set should produce a comparable audit on a fresh run. We confirmed this informally by running Practical Informatics twice — composite scores differed by 0.029.

The total spend across all six audits in this case study was **$1.67**. The audit code, the rubric, and the subject files are committed to the same repository as Practical Informatics's website.

### 10. What we did NOT do

A short list of things we chose not to do, so you can see the boundaries:

- We did not retry failed cells more than once. A cell that errored twice is excluded from the aggregation.
- We did not adjust scores after the fact. Every score in this case study is the score the judge returned.
- We did not show the judge the previous score for any subject. Each scoring call is independent.
- We did not contact the subjects before publishing. If a subject would like to respond, we will publish their response alongside ours.

---

## Hook

*To be drafted.*

## Findings

*To be drafted. Comparison grid, dim-by-dim narrative, the irony finding (everyone landed in Faintly Visible), the Topical Authority blind spot, the AI bot block, the Visibility uniformity.*

## Implications

*To be drafted.*

## Practical Informatics sidebar

*To be drafted. PI's own scores presented transparently, what they say about us, what we're doing about it.*

## Appendix

*To be drafted. Full per-subject reports, judge justifications, query responses, raw cell-level data.*
