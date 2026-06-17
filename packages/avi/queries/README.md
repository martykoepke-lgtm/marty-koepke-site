# Query template library

Templates the Query Runner uses to build each audit's query grid. Each template is human-written, parameterized with placeholders, and tagged with intent + scope.

## How it's used

At audit time, `lib/avi/queries.ts` loads the templates, applies the 80/10/10 sampling rule, substitutes the subject's metadata into the placeholders, and produces 4 queries that get sent to each engine. No LLM makes these decisions — code does.

## Placeholder vocabulary

| Placeholder | Filled with |
|---|---|
| `[SUBJECT_NAME]` | Subject's canonical name |
| `[CATEGORY]` | Industry / niche in buyer language |
| `[LOCATION]` | Where they serve, or "near me" |
| `[BUYER_TYPE]` | Their primary buyer ("small business owner", etc.) |
| `[PROBLEM]` | Problem they solve ("start an LLC", "improve AI visibility") |
| `[COMPETITOR]` | Known competitor name (optional) |

## Sampling rule

| Query count | Mix |
|---|---|
| 4 | 3 informational + 1 entity-specific |
| 5–6 | 4 informational + 1 transactional + 1 navigational |
| 10 | 8/1/1 |
| 12+ | 80/10/10 within rounding |

Per Aggarwal 2024 GEO-bench distribution.

## Files in this folder

- `UNIVERSAL.md` — templates that work for any subject (always loaded)
- `AI-VISIBILITY-SAAS.md` — templates for AI visibility / SEO marketing companies (the competitor test set)
- *(future)* `LAW.md`, `HEALTHCARE.md`, `WINERY.md`, `AGENCY.md`, `PERSONAL-BRAND.md` — added as new categories are encountered

## Adding a new template

1. Write the template with placeholders.
2. Tag with intent (informational, transactional, navigational), scope (universal or category-specific), and what it tests.
3. Add a one-line description of expected response type.
4. Drop into the right file. The Query Runner picks it up automatically.

## Refusal rules — what the library cannot include

- Queries that test competitors negatively ("Why is [COMPETITOR] bad?")
- Queries that test sensitive topics outside the subject's domain
- Queries that try to elicit hallucinations (asking about specific events that may not exist)

## Caveats from the research

Per Alexander et al. (ORCAS-I, 2022) and Liu et al. (2023):

- **25–40% of short queries are intrinsically ambiguous** without session context. Our test set unavoidably includes some — e.g., "Is [SUBJECT_NAME] reputable?" can be read as navigational, evaluative, or informational. Engine responses to those queries should be interpreted as signal-with-noise.
- **LLM intent disambiguation is only ~30% accurate** even for GPT-4 on short queries (Liu et al. 2023). The Query Runner does not ask an LLM to classify intent — the `intent` and `intent_subtype` fields come from the template metadata in this folder, not from runtime classification.
- **Exploratory queries (36% of informational behavior) are not fully testable in single-query mode.** Per Alexander et al., the "abstain" / exploratory category has no reliable automatic signal in single-query data and depends on session context. The audit measures the *output* of exploratory queries but cannot model the multi-turn refinement that drives them in reality. This is acknowledged on every report's methodology page.
