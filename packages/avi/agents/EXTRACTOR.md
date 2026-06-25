# Agent role — Extractor

**Status:** v1.0 — ready for implementation
**Code home:** `packages/avi/src/extractor-v2.ts`
**Canon authority:** `AVI_OPERATING_STANDARD.md`. When this file disagrees with the operating standard, the operating standard wins.

---

## Contract

```
ROLE:           Extractor
INPUT:          one raw engine response + subject metadata + competitor list
OUTPUT:         strict JSON conforming to ExtractorOutput schema (see below)
RUBRIC SLICE:   n/a (Extractor does not score against the rubric)
REFUSAL RULES:  §4 of AVI_OPERATING_STANDARD.md
LOGGING:        writes to api_calls log; replayability required
MODEL:          Claude Haiku or GPT-4o-mini (cheap parser tier)
PARAMETERS:     temperature 0, JSON mode on, max_tokens 1200
```

## One-sentence job description

Parse one raw engine response (the text an AI engine — ChatGPT, Claude, Perplexity, or Gemini — returned for one query) into a structured record of what it actually said about the subject.

## When NOT to invoke this role

- The response has not yet been retrieved from the engine. Extraction runs *after* the Query Runner returns text — never as a substitute for it.
- The text being parsed is from a web crawl or a third-party platform. The Extractor reads engine outputs only; page content goes to the Crawler/Corroborator path.
- Any judgment or scoring is needed. The Extractor describes; it does not evaluate. Send observations to the Driver Judge for evaluation against the rubric.
- The caller wants summaries, paraphrases, or rewrites. The Extractor returns only verbatim-grounded structured fields.

## System prompt (verbatim)

```
You are an extractor. Your only job is to parse one AI engine's response to one
query into a structured record. You do not judge the response. You do not
assess the subject's quality. You report what was observed.

You will be given:
- The raw text of an engine response.
- The subject's canonical name and aliases.
- A list of known competitors.
- The query that was asked.

You must return a single JSON object that conforms exactly to the schema
described in the user message. No prose, no markdown, no explanation outside
the JSON.

Hard rules — violation means rejection:

1. Do NOT use any prior knowledge about the subject, the competitors, or the
   topic. Use ONLY the response text and the metadata in the user message.
2. Do NOT invent citations, URLs, quotes, or facts that are not present in the
   response text. If the engine did not cite a URL, cited_urls is an empty
   array.
3. Do NOT infer presence from absence. If the subject is not mentioned in the
   response, `mentioned` is false. Do not guess that the engine "probably
   meant" the subject.
4. If the response is empty, an error message, or off-topic, return
   mentioned=false and leave optional fields null. Do not fabricate.
5. Every claim you make in `evidence_pointers` must point to a verbatim span
   of the response text. If you cannot point to a span, do not make the claim.

Schema is enforced. If your output does not validate, it will be retried with
a stricter instruction. Two failures and the field is recorded as null.
```

## Input schema

```typescript
interface ExtractorInput {
  query: string;              // the query that was sent to the engine
  engine: "chatgpt" | "claude" | "perplexity" | "gemini";
  raw_response: string;       // the engine's response text, verbatim
  subject: {
    canonical_name: string;
    aliases: string[];
    industry: string;                            // for S4 category_named check
    known_differentiation_terms?: string[];      // for S5 differentiation_named check; may be empty
  };
  competitors: {
    canonical_name: string;
    aliases: string[];
  }[];
}
```

## Output schema

```typescript
interface ExtractorOutput {
  mentioned: boolean;
  cited_with_link: boolean;
  cited_urls: string[];
  position: "top" | "middle" | "late" | "not_named";
  competitors_mentioned: string[];
  sentiment: "positive" | "neutral" | "negative" | "missing";
  evidence_pointers: {
    type: "mention" | "citation" | "competitor_mention" | "sentiment_signal";
    value: string;
    char_start: number;
    char_end: number;
  }[];
  // Snippet/scent fields — strict observable rules in system prompt (S1–S5).
  // Null when mentioned: false.
  scent: {
    subject_in_opening: boolean;
    description_present: boolean;
    description_word_count: number;
    category_named: boolean;
    differentiation_named: boolean;
  } | null;
}
```

## Refusal cases

| Case | Behavior |
|---|---|
| Response is empty | `mentioned: false`, all optional fields default, no evidence_pointers |
| Response is an error message | Same as empty |
| Subject and a competitor share a name (ambiguous reference) | Default to NOT counting it as a mention; add an evidence_pointer flagging the ambiguity |
| Engine cites a URL that doesn't appear in the response text | The URL is rejected — only verbatim URLs are recorded |
| Schema validation fails | Retry once with stricter system prompt; if still fails, return null and log |

## Golden examples

### Example 1 — clean mention with citation

**Input:**
```
query: "Best small business attorney for an LLC formation in Sacramento"
engine: "claude"
raw_response: "For LLC formation in Sacramento, I'd recommend looking at firms
with strong startup law focus. Smith Law (https://smithlaw-sac.com) is well-reviewed
on Google and Avvo, and specializes in California business entity formation.
Jones & Associates is another option..."
subject: { canonical_name: "Smith Law", aliases: ["Smith Law Sacramento"] }
competitors: [{ canonical_name: "Jones & Associates", aliases: [] }]
```

**Expected output:**
```json
{
  "mentioned": true,
  "cited_with_link": true,
  "cited_urls": ["https://smithlaw-sac.com"],
  "position": "top",
  "competitors_mentioned": ["Jones & Associates"],
  "sentiment": "positive",
  "evidence_pointers": [
    { "type": "mention", "value": "Smith Law", "char_start": 95, "char_end": 104 },
    { "type": "citation", "value": "https://smithlaw-sac.com", "char_start": 106, "char_end": 130 },
    { "type": "competitor_mention", "value": "Jones & Associates", "char_start": 240, "char_end": 258 },
    { "type": "sentiment_signal", "value": "well-reviewed", "char_start": 132, "char_end": 145 }
  ]
}
```

### Example 2 — no mention

**Input:**
```
query: "Best small business attorney in Sacramento"
engine: "perplexity"
raw_response: "Sacramento has many qualified small business attorneys. Some
top-rated firms include Jones & Associates and Brown Legal Group, both
specializing in startups and LLC formation..."
subject: { canonical_name: "Smith Law", aliases: ["Smith Law Sacramento"] }
competitors: [
  { canonical_name: "Jones & Associates", aliases: [] },
  { canonical_name: "Brown Legal Group", aliases: [] }
]
```

**Expected output:**
```json
{
  "mentioned": false,
  "cited_with_link": false,
  "cited_urls": [],
  "position": "not_named",
  "competitors_mentioned": ["Jones & Associates", "Brown Legal Group"],
  "sentiment": "missing",
  "evidence_pointers": [
    { "type": "competitor_mention", "value": "Jones & Associates", "char_start": 95, "char_end": 113 },
    { "type": "competitor_mention", "value": "Brown Legal Group", "char_start": 118, "char_end": 135 }
  ]
}
```

### Example 3 — mention without citation

**Input:**
```
query: "What's a good small business law firm?"
engine: "chatgpt"
raw_response: "There are several options. Smith Law has been mentioned in
local business directories. You should also consider..."
subject: { canonical_name: "Smith Law", aliases: [] }
competitors: []
```

**Expected output:**
```json
{
  "mentioned": true,
  "cited_with_link": false,
  "cited_urls": [],
  "position": "middle",
  "competitors_mentioned": [],
  "sentiment": "neutral",
  "evidence_pointers": [
    { "type": "mention", "value": "Smith Law", "char_start": 33, "char_end": 42 }
  ]
}
```

## Post-extractor verification (separate pipeline step, not in this role)

After the Extractor returns, a verification step runs:

1. For each URL in `cited_urls`, fetch the URL.
2. If the URL does not resolve → flag as hallucinated, exclude from sub-metric math.
3. If the URL resolves but the page does not mention the subject → flag as hallucinated, exclude.
4. URLs that pass both checks → count toward the Citation sub-metric.

This is justified by Onweller et al. (2026), "Cited but Not Verified" (arxiv 2605.06635). Tested 14 LLMs. Even strongest frontier models keep link validity above 94% and topical relevance above 80%, but **factual accuracy — whether the source actually supports the claim — is only 39–77%**. URL working and being topically relevant is not the same as supporting the claim. Verification must close the loop on the claim, not just the link.

## Cost estimate

- ~500 input tokens (system prompt + subject metadata + response text averaged)
- ~300 output tokens (JSON output)
- Per call cost: ~$0.0001 (Haiku) to ~$0.0003 (Mini)
- Per audit: 16 calls = ~$0.001 to ~$0.006
