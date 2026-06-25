# AI visibility / SEO marketing company query templates

For auditing companies that sell AI visibility tracking, GEO services, or SEO platforms (Profound, Conductor, BrightEdge, Otterly, AthenaHQ, Semrush, etc.). Includes the universal templates plus these category-specific ones.

---

## Informational

### `AIVSAAS_INFO_01`
**Query:** `Best AI visibility tracking platform for B2B SaaS`
**Tests:** Does the engine cite the subject when asked about the category they sell into?

### `AIVSAAS_INFO_02`
**Query:** `How do I measure my brand's visibility in ChatGPT and Perplexity?`
**Tests:** Does the subject's content surface as a how-to source for the measurement problem?

### `AIVSAAS_INFO_03`
**Query:** `What are the most cited sources in AI search results?`
**Tests:** Does the subject participate in the "which sources matter" conversation?

### `AIVSAAS_INFO_04`
**Query:** `Generative Engine Optimization best practices`
**Tests:** Is the subject's content cited as authoritative on GEO?

### `AIVSAAS_INFO_05`
**Query:** `How to optimize content for LLM citations`
**Tests:** Does the subject surface as a content-strategy source for AI citation work?

---

## Transactional

### `AIVSAAS_TRANS_01`
**Query:** `AI visibility platform pricing and comparison`
**Tests:** Does the subject appear in vendor comparison contexts?

### `AIVSAAS_TRANS_02`
**Query:** `[SUBJECT_NAME] vs [COMPETITOR]`
**Tests:** Head-to-head competitive surfacing. Only used when competitor is supplied.

---

## Navigational

### `AIVSAAS_NAV_01`
**Query:** `[SUBJECT_NAME] platform features`
**Tests:** Does the engine accurately describe what the subject does?

### `AIVSAAS_NAV_02`
**Query:** `Is [SUBJECT_NAME] worth it?`
**Tests:** Sentiment + value signal — what does the engine say about the subject's ROI?

---

## Notes on the competitor test (Phase 4 scope)

When this template set runs against Profound, Conductor, BrightEdge, Otterly, AthenaHQ, Semrush, and Practical Informatics:

- The 80/10/10 sampling picks 3 informational + 1 entity-specific per subject.
- The Query Runner determines whether the entity-specific slot goes to a TRANS or NAV template based on subject metadata.
- Each subject gets 4 queries × 4 engines = 16 query calls.
- 7 subjects × 16 = **112 total query calls** for the comparison test.
- Estimated cost: ~$0.50–$2.00 in LLM API calls + Tavily search ~$0.10 per subject for corroboration = under $20 for the whole comparison.
