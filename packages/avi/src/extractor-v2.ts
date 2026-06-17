/**
 * Extractor v2 — LLM role. Uses the existing llm.ts wrapper (with provider abstraction + logging).
 *
 * One LLM call per query response. Parses the engine's text into a structured
 * record of what it said about the subject.
 *
 * Spec: agents/EXTRACTOR.md (v1.0).
 */

import { llmCall } from './llm';
import { cleanJson } from './json-clean';
import type { EngineResponse, ExtractorOutput, Subject } from './types';

const SYSTEM_PROMPT = `You are an extractor. Your only job is to parse one AI engine's response to one query into a structured record. You do not judge the response. You do not assess the subject's quality. You report what was observed.

You will be given:
- The raw text of an engine response.
- The subject's canonical name, aliases, industry, and known_differentiation_terms.
- A list of known competitors.
- The query that was asked.

You must return a single JSON object that conforms exactly to the schema described in the user message. No prose, no markdown, no explanation outside the JSON.

Hard rules — violation means rejection:

1. Do NOT use any prior knowledge about the subject, the competitors, or the topic. Use ONLY the response text and the metadata in the user message.
2. Do NOT invent citations, URLs, quotes, or facts that are not present in the response text. If the engine did not cite a URL, cited_urls is an empty array.
3. Do NOT infer presence from absence. If the subject is not mentioned in the response, \`mentioned\` is false. Do not guess that the engine "probably meant" the subject.
4. If the response is empty, an error message, or off-topic, return mentioned=false and leave optional fields null. Do not fabricate.
5. Every claim you make in \`evidence_pointers\` must point to a verbatim span of the response text. If you cannot point to a span, do not make the claim.

SNIPPET / INFORMATION-SCENT FIELDS — strict guardrails:

If \`mentioned\` is true, you must also return a \`scent\` object describing HOW the engine described the subject. These are OBSERVABLE checks against literal text — NOT judgments of "richness" or "quality."

S1. scent.subject_in_opening (boolean):
    TRUE only if the subject's canonical name or one of its aliases appears within the FIRST 100 CHARACTERS of the raw response. Count characters literally.

S2. scent.description_present (boolean):
    Look at the 200 characters AFTER the first occurrence of the subject's canonical name or alias. TRUE only if that window contains at least one word (whole-word, case-insensitive) from this EXACT verb list:
    is, are, helps, help, provides, provide, offers, offer, tracks, track, measures, measure, builds, build, creates, create, sells, sell, specializes, specialize, focuses, focus, designs, design, manages, manage, delivers, deliver, supplies, supply, supports, support, enables, enable, lets, allows, allow, serves, serve, develops, develop, produces, produce.
    FALSE if no verb from the list appears. Do not substitute other verbs.

S3. scent.description_word_count (integer ≥ 0):
    Count words between the first mention and the first of: (a) next mention of subject, (b) next mention of any competitor, (c) end of the sentence containing the first mention. Whichever boundary comes first. Return 0 if no text follows the mention.

S4. scent.category_named (boolean):
    Inside the description window from S3 only. TRUE only if the exact subject.industry string appears (case-insensitive), OR if a single word longer than 3 characters from subject.industry appears (whole-word match). FALSE otherwise. Do not substitute synonyms.

S5. scent.differentiation_named (boolean):
    Inside the description window from S3 only. TRUE only if at least one string from subject.known_differentiation_terms appears (case-insensitive, whole-word for each term). FALSE if the array is empty or no term appears. Do not infer "differentiation" from any other text.

If \`mentioned\` is false, return \`scent: null\`.`;

export async function extract(
  response: EngineResponse,
  subject: Subject
): Promise<ExtractorOutput> {
  const userPrompt = buildUserPrompt(response, subject);

  const llmResponse = await llmCall(
    'openai',
    `${SYSTEM_PROMPT}\n\n${userPrompt}`,
    { endpoint: 'paid_pipeline_extract', submissionId: null, ip: null },
    { maxTokens: 1200 }
  );

  if (!llmResponse.ok || !llmResponse.text) {
    return emptyExtraction(response);
  }

  try {
    const parsed = JSON.parse(cleanJson(llmResponse.text));
    const mentioned = Boolean(parsed.mentioned);
    return {
      template_id: response.template_id,
      engine: response.engine,
      query: response.query,
      mentioned,
      cited_with_link: Boolean(parsed.cited_with_link),
      cited_urls: Array.isArray(parsed.cited_urls) ? parsed.cited_urls : [],
      cited_urls_verified: [],
      position: ['top', 'middle', 'late', 'not_named'].includes(parsed.position)
        ? parsed.position
        : 'not_named',
      competitors_mentioned: Array.isArray(parsed.competitors_mentioned)
        ? parsed.competitors_mentioned
        : [],
      sentiment: ['positive', 'neutral', 'negative', 'missing'].includes(parsed.sentiment)
        ? parsed.sentiment
        : 'missing',
      evidence_pointers: Array.isArray(parsed.evidence_pointers) ? parsed.evidence_pointers : [],
      scent: mentioned && parsed.scent && typeof parsed.scent === 'object'
        ? {
            subject_in_opening: Boolean(parsed.scent.subject_in_opening),
            description_present: Boolean(parsed.scent.description_present),
            description_word_count:
              typeof parsed.scent.description_word_count === 'number'
                ? parsed.scent.description_word_count
                : 0,
            category_named: Boolean(parsed.scent.category_named),
            differentiation_named: Boolean(parsed.scent.differentiation_named),
          }
        : null,
    };
  } catch {
    return emptyExtraction(response);
  }
}

function emptyExtraction(response: EngineResponse): ExtractorOutput {
  return {
    template_id: response.template_id,
    engine: response.engine,
    query: response.query,
    mentioned: false,
    cited_with_link: false,
    cited_urls: [],
    cited_urls_verified: [],
    position: 'not_named',
    competitors_mentioned: [],
    sentiment: 'missing',
    evidence_pointers: [],
    scent: null,
  };
}

function buildUserPrompt(response: EngineResponse, subject: Subject): string {
  const competitors = (subject.competitors ?? [])
    .map((c) => `  - "${c.canonical_name}" (aliases: ${JSON.stringify(c.aliases ?? [])})`)
    .join('\n');

  return `INPUT:

Query: ${JSON.stringify(response.query)}
Engine: ${response.engine}
Subject:
  - canonical_name: ${JSON.stringify(subject.canonical_name)}
  - aliases: ${JSON.stringify(subject.aliases ?? [])}
  - industry: ${JSON.stringify(subject.industry ?? '')}
  - known_differentiation_terms: ${JSON.stringify(subject.known_differentiation_terms ?? [])}
Competitors:
${competitors || '  (none provided)'}

Raw engine response:
"""
${response.raw_response.slice(0, 6000)}
"""

OUTPUT JSON SCHEMA (return exactly this shape, no extra fields):

{
  "mentioned": boolean,
  "cited_with_link": boolean,
  "cited_urls": [ string, ... ],
  "position": "top" | "middle" | "late" | "not_named",
  "competitors_mentioned": [ string, ... ],
  "sentiment": "positive" | "neutral" | "negative" | "missing",
  "evidence_pointers": [
    { "type": "mention" | "citation" | "competitor_mention" | "sentiment_signal",
      "value": string,
      "char_start": number,
      "char_end": number }
  ],
  "scent": {
    "subject_in_opening": boolean,
    "description_present": boolean,
    "description_word_count": number,
    "category_named": boolean,
    "differentiation_named": boolean
  } | null
}

Apply rules S1–S5 in the system prompt exactly. If \`mentioned\` is false, set \`scent\` to null.

Return JSON only.`;
}

/**
 * Citation verification — fetches each cited URL, checks (a) it resolves,
 * (b) the page mentions the subject. Hallucinated citations excluded.
 *
 * Per arxiv 2605.06635 — citation hallucination 11–57% in deployed models.
 */
export async function verifyCitations(
  extraction: ExtractorOutput,
  subject: Subject
): Promise<ExtractorOutput> {
  const verified: string[] = [];
  for (const url of extraction.cited_urls) {
    if (await urlSupportsSubject(url, subject)) {
      verified.push(url);
    }
  }
  return { ...extraction, cited_urls_verified: verified };
}

async function urlSupportsSubject(url: string, subject: Subject): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'PracticalInformatics-AVI/0.2 (citation-verify)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const text = (await res.text()).toLowerCase();
    const needles = [subject.canonical_name, ...(subject.aliases ?? [])].map((s) => s.toLowerCase());
    return needles.some((n) => text.includes(n));
  } catch {
    return false;
  }
}
