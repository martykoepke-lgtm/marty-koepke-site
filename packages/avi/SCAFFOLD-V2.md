# AVI v2 scaffold — what's here and how to run it

**Status:** Scaffold complete. Architecture wired end-to-end. Ready for smoke test on a real subject when API keys are configured.

**Canon authority:** `AVI_OPERATING_STANDARD.md`, `public/AI-Visibility-Index-Rubric-and-Protocol.md` (v0.2). When code disagrees with canon, canon wins.

---

## What's in this folder

### New v2 files (this scaffold)

| File | Role | LLM? |
|---|---|---|
| `types.ts` | Shared types, weights, tier cutoffs | no |
| `subject-loader.ts` | Reads subject JSON (new and legacy shape) | no |
| `crawler-v2.ts` | Fetches subject URL, extracts schema + structure + stuffing detection | no |
| `corroboration-v2.ts` | Tavily general + platform-filtered (Reddit, LinkedIn, Wikipedia, YouTube, G2, Gartner) | no |
| `queries.ts` | Loads templates from `/queries/*.md`, applies 80/10/10 sampling, substitutes placeholders | no |
| `engine-clients.ts` | Sends prompts to ChatGPT, Claude, Perplexity, Gemini | yes (audited as subjects) |
| `extractor-v2.ts` | Parses each engine response into ExtractorOutput; verifies cited URLs | yes (LLM role) |
| `aggregator-v2.ts` | Computes Presence, Citation, Share-of-Voice, Prominence | no |
| `judge-v2.ts` | 5 LLM calls — one per driver dimension (D1, D2, D3, D4, D6) | yes (LLM role) |
| `composite-v2.ts` | Computes Readiness, Visibility, Composite, Tier | no |
| `recommender-v2.ts` | One LLM call — top 2–3 fixes with patent-derived framing | yes (LLM role) |
| `render-v2.ts` | HTML report renderer + comparison table renderer | no |
| `orchestrator-v2.ts` | The deterministic pipeline — wires everything together | no |

### Reused from existing code (NOT touched by this scaffold)

- `llm.ts` — provider abstraction with logging
- `llm-providers/*` — Anthropic, OpenAI, Gemini, Perplexity adapters
- `tavily.ts` — Tavily wrapper
- `logging.ts` — api_calls logger (Supabase-coupled; CLI runs may log silently if no DB)
- `crawler.ts`, `corroboration.ts`, `extraction.ts`, `scoring.ts`, `recommendations.ts` — the v1 pipeline serving the public `/scan` flow. Left intact.

### CLI runners

- `scripts/audit.mts` — single subject audit
- `scripts/compare.mts` — multi-subject comparison table

### Output

- `audits/<audit_id>.json` — full audit record
- `audits/<audit_id>.html` — readable single-page report
- `audits/comparison-<timestamp>.html` — comparison table (from `compare.mts`)

---

## Environment variables required

Add to `.env.local` (do NOT commit):

```
ANTHROPIC_API_KEY=sk-ant-...      # Claude (judge, recommender, queries to Claude)
OPENAI_API_KEY=sk-...              # GPT-4o-mini (extractor), GPT-4o (queries to ChatGPT)
PERPLEXITY_API_KEY=pplx-...        # Perplexity Sonar (queries to Perplexity)
GOOGLE_API_KEY=...                 # Gemini 2.5 Flash (queries to Gemini)
TAVILY_API_KEY=tvly-...            # Corroboration searches
```

These same keys are used by the existing v1 pipeline — if `/scan` works locally, the v2 scaffold has everything it needs.

## Smoke test — one subject

```bash
# 1. Make sure env vars are set
source .env.local

# 2. Run an audit on Practical Informatics
npx tsx scripts/audit.mts subjects/practicalinformatics.json --mode=paid

# 3. Open the generated report in your browser
# (path printed at the end of the run)
```

Expected output: terminal logs the pipeline steps, writes `audits/<uuid>.json` and `audits/<uuid>.html`. Open the HTML in any browser.

## Comparison test — competitor cohort

```bash
# Create a directory of just the subjects you want to compare
mkdir -p subjects/competitors
cp subjects/practicalinformatics.json subjects/competitors/
cp subjects/brightedge.json subjects/competitors/
cp subjects/profound.json subjects/competitors/ 2>/dev/null || true  # may not exist
cp subjects/evertune.json subjects/competitors/
cp subjects/otterly.json subjects/competitors/
cp subjects/peec.json subjects/competitors/
cp subjects/semrush.json subjects/competitors/
cp subjects/visibly-ai.json subjects/competitors/
cp subjects/ziptie.json subjects/competitors/

# Run the comparison
npx tsx scripts/compare.mts subjects/competitors

# Open audits/comparison-<timestamp>.html in your browser
```

Estimated total cost for 9 subjects × 16 query calls + 5 judge calls + 1 recommender = ~$0.20–$0.60 per subject in LLM costs, plus Tavily ~$0.05 per subject. Whole comparison test: under $5.

## What's known NOT to be production-ready

This is a scaffold. Production hardening still needed:

1. **Error handling.** Individual step failures log but don't always degrade gracefully end-to-end. A network blip mid-audit can produce a partial JSON.
2. **Rate limiting.** No backoff/retry on engine rate limits. If Anthropic rate-limits, the call fails and the audit continues without that engine's responses.
3. **Concurrency.** Pipeline is fully sequential. A real audit takes 1–3 minutes; concurrent extraction would shave most of it.
4. **Citation verification timeout.** 8s per URL. A subject's response with 10 cited URLs could add 80 seconds to the audit.
5. **No Supabase persistence in CLI mode.** `llm.ts` tries to log to api_calls via Supabase; in CLI mode without Supabase config it logs to nothing. Audit JSON is the only record.
6. **Driver Judge tone.** May still produce verbose justifications in some cases. Tighten the system prompt if you see drift.
7. **Cross-judge not wired.** The CROSS_JUDGE role file exists; the pipeline doesn't call it yet. Add when calibrating against 30+ subjects.

## Architecture invariants — do not violate

These are the rules from `AVI_OPERATING_STANDARD.md` that the scaffold encodes:

- No LLM decides what to do next. Code controls order.
- Every LLM call: temperature 0, JSON mode where supported, schema-validated output.
- "Insufficient evidence" is always a valid answer.
- Every cited URL is verified before counting toward Citation sub-metric.
- D3 hard cap at band 2 if keyword stuffing detected, band 3 if differentiation below the fold.
- Recommender refuses negative-evidence tactics: keyword stuffing, authoritative-tone changes, synonym padding, "more comprehensive."

When you encounter a case where the pipeline wants to violate one of these, update the canon FIRST, then the code.
