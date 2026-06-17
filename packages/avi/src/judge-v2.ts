/**
 * Driver Judge v2 — LLM role. Uses the existing llm.ts wrapper.
 *
 * Five calls per audit (D1, D2, D3, D4, D6). One LLM per dimension.
 * Each call gets the dimension-specific anchored scale and returns
 * { dimension_id, band, justification, evidence_pointers, sub_score_observations }.
 *
 * Spec: agents/DRIVER_JUDGE.md (v1.0).
 * Rubric: public/AI-Visibility-Index-Rubric-and-Protocol.md (v0.2).
 */

import { llmCall } from './llm';
import { cleanJson } from './json-clean';
import {
  AVI_RUBRIC_VERSION,
  type DimensionId,
  type DriverScore,
  type EvidencePackage,
  type Subject,
} from './types';

const SYSTEM_PROMPT_TEMPLATE = `You are a Driver Judge for the AI Visibility Index. You score one rubric dimension on a 0–5 anchored scale, against the evidence package supplied in the user message.

You are not an expert on the subject. You are not asked to evaluate quality in any subjective sense. You are asked to apply the anchored scale to the observable evidence.

THE DIMENSION YOU ARE SCORING:

{DIMENSION_BLOCK}

HARD RULES — violation means rejection:

1. Use ONLY the evidence in the user message. Do NOT use any prior knowledge about this subject, its industry, or the topic.
2. If the evidence is insufficient to confidently pick a band, return {"band": "insufficient_evidence"}. This is a valid and preferred answer when the evidence is thin.
3. Every claim in your justification must be supported by an evidence pointer from the supplied package. If you cannot point to specific evidence, do not make the claim.
4. Do NOT infer presence from absence. "I don't see schema markup, so they probably have it elsewhere" is forbidden.
5. Do NOT use marketing language or hedged superlatives ("best-in-class", "industry-leading"). State observations plainly.
6. The band is an INTEGER (0, 1, 2, 3, 4, 5) OR the string "insufficient_evidence". No decimals. No half-bands.

{SUB_CRITERIA_BLOCK}

Return a single JSON object conforming to:
{
  "dimension_id": "${'{DIMENSION_ID}'}",
  "band": 0 | 1 | 2 | 3 | 4 | 5 | "insufficient_evidence",
  "justification": string,        // 1–3 sentences, citing evidence
  "evidence_pointers": [
    { "type": string, "value": string, "source": string, "supports_band": boolean }
  ],
  "sub_score_observations": [
    { "name": string, "observation": string }
  ]
}

No prose outside the JSON.`;

const DIMENSION_BLOCKS: Record<DimensionId, string> = {
  D1: `D1: Entity Clarity & Consistency
Measures: whether the subject is represented as one coherent, machine-recognizable entity across the web — name, role, location, offering all consistent.

ANCHORED SCALE:
- 0 — No discernible consistent entity; conflicting or absent identity.
- 1 — Entity exists but major contradictions across ≥3 sources.
- 2 — Recognizable but inconsistent (title, location, or offering vary).
- 3 — Consistent core identity; minor gaps; some structured identity signals.
- 4 — Consistent across all major surfaces; clear single entity; sameAs present.
- 5 — Fully consistent + structured identity; knowledge-panel-ready; Wikidata or KG presence.

Sub-score (named, not separately weighted): Founder Credibility — record an observation about the founder's discoverable profile if this is a personal_brand.`,
  D2: `D2: Third-Party Corroboration
Measures: independent sources that vouch for the subject — reviews, directory listings, earned mentions, citations elsewhere, presence on the platforms engines cite from. Corroboration CONTENT — what third parties say about the subject.

Engines disproportionately cite third-party platforms over the subject's own site — Reddit (40.1%), Wikipedia (26.3%), YouTube (23.5%). Corroboration is the primary citation surface.

ANCHORED SCALE:
- 0 — None. Only the entity's own website mentions it.
- 1 — 1–2 thin listings, no reviews, no community discussion.
- 2 — A few listings; sparse or stale reviews; no platform-specific presence.
- 3 — Solid listings + active reviews on ≥1 platform; some platform-specific corroboration.
- 4 — Multiple independent corroborators including reviews and earned mentions; presence visible on 2+ engine-favored platforms.
- 5 — Broad, current corroboration including earned media and community discussion; visible across multiple platforms each engine favors.

Flag any uncorroborated outlier claims on the subject's OWN site as a risk in observations.`,
  D3: `D3: Machine-Readability & Structure
Measures: how easily an AI can parse the subject's owned content — direct-answer passages, clean HTML, schema, exact-term presence, and metadata scent quality.

SUB-CRITERIA (mandatory):
- Canonical exact-term presence — subject's canonical name appears in <title>, <h1>, and structured-data identifier fields.
- Above-the-fold differentiation — the subject's distinctive content (D4 candidates) appears in the first third of the page. If NOT, D3 caps at band 3.
- Keyword stuffing — if detected, D3 hard caps at band 2 regardless of other criteria.
- Metadata scent — the <meta name="description"> must be ≥ 50 characters AND contain at least one action verb AND name the subject's category. If NOT (any one missing), D3 caps at band 3.

ANCHORED SCALE:
- 0 — Unparseable (image-only, no structure, JS-walled, schema absent).
- 1 — Wall-of-text, no headings, no schema.
- 2 — Some structure; no direct-answer passages or schema. (Cap if keyword stuffing detected.)
- 3 — Good headings + some direct-answer passages; canonical exact terms in <title> and <h1>. (Cap if differentiation below-the-fold OR metadata scent inadequate.)
- 4 — Direct-answer passages + basic schema (Organization/Person/FAQ); differentiation above the fold; clean HTML; scent-rich metadata description.
- 5 — Fully structured, schema-rich, passage-optimized throughout; chunk-friendly; differentiation leads the page; metadata description names category and action.`,
  D4: `D4: Differentiation from Consensus
Measures: whether the subject's content adds non-redundant information to the topic-level pool that AI engines aggregate. What does this subject know, have, or say that the topic's consensus doesn't, and is it structured for engines to extract?

This is the highest-weighted dimension (0.30). Per US Patent US20200349181A1, engines filter for non-redundancy and exclude redundant sources. Per Aggarwal 2024, citations, statistics, and quotations boost visibility 30–40%.

ANCHORED SCALE:
- 0 — Pure consensus restatement. No proprietary data, no unique angle.
- 1 — Some specifics, but nothing that distinguishes from category peers.
- 2 — One identifiable differentiation candidate (proprietary data, signature method, geographic specificity, distinctive case study), but not surfaced in extractable form.
- 3 — One differentiation candidate surfaced in extractable form (direct-answer passage, schema, citation).
- 4 — Multiple differentiation candidates; at least one with empirical support (data, statistics, named sources).
- 5 — Consistent pattern of differentiated, cited content across multiple pages.

Sub-score (named, not separately weighted): Methodology Depth — record an observation about the subject's signature methodology, framework, or offer definition.`,
  D6: `D6: Platform-Native Fit
Measures: whether the subject has credible PRESENCE on the source platforms that feed the buyer's most likely engines. Channel presence — the subject's own profile/presence on the platforms themselves (distinct from D2 corroboration content).

ENGINE-PLATFORM MAPPING (apply this):
- ChatGPT favors: Wikipedia, Forbes, G2, Reuters, established news
- Claude (Anthropic) favors: academic/government, vendor-neutral analyst coverage (Gartner-style), niche SaaS/practitioner blogs, technical documentation
- Perplexity favors: Reddit, YouTube, Gartner, Yelp, TripAdvisor

ANCHORED SCALE:
- 0 — Presence only on platforms irrelevant to the buyer's engines.
- 1 — Minimal presence on one relevant platform.
- 2 — Present on one relevant platform, weak engagement.
- 3 — Solid presence on the single most relevant platform.
- 4 — Strong presence across the two most relevant platforms.
- 5 — Strong, native, active presence across all relevant feeder platforms.`,
};

const SUB_CRITERIA_BLOCKS: Partial<Record<DimensionId, string>> = {
  D3: `HARD CAPS (apply BEFORE returning):
- If the evidence shows keyword_stuffing_detected = true, cap at band 2.
- If differentiation_above_fold = false, cap at band 3.
- If metadata-scent is inadequate (any of: meta_description_chars < 50 OR meta_description_has_action_verb = false OR meta_description_names_category = false), cap at band 3.

When you apply a cap, note the trigger in the justification (e.g., "D3 capped at 3 because meta description is only 12 characters and contains no action verb"). Caps are enforced; you cannot exceed them even if other signals are strong.`,
};

export async function judge(
  dimension_id: DimensionId,
  subject: Subject,
  evidence_package: EvidencePackage
): Promise<DriverScore> {
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{DIMENSION_BLOCK}', DIMENSION_BLOCKS[dimension_id])
    .replace('{SUB_CRITERIA_BLOCK}', SUB_CRITERIA_BLOCKS[dimension_id] ?? '')
    .replace('{DIMENSION_ID}', dimension_id);

  const userPrompt = buildEvidencePrompt(dimension_id, subject, evidence_package);

  const llmResponse = await llmCall(
    'anthropic',
    `${systemPrompt}\n\n${userPrompt}`,
    { endpoint: 'paid_pipeline_score', submissionId: null, ip: null },
    { maxTokens: 1500 }
  );

  if (!llmResponse.ok || !llmResponse.text) {
    return insufficientEvidence(dimension_id, 'LLM call failed');
  }

  try {
    const parsed = JSON.parse(cleanJson(llmResponse.text));
    return {
      dimension_id,
      band: parsed.band,
      justification: parsed.justification ?? '',
      evidence_pointers: parsed.evidence_pointers ?? [],
      sub_score_observations: parsed.sub_score_observations ?? [],
      rubric_version: AVI_RUBRIC_VERSION,
    };
  } catch {
    return insufficientEvidence(dimension_id, 'JSON parse failed');
  }
}

function insufficientEvidence(dimension_id: DimensionId, reason: string): DriverScore {
  return {
    dimension_id,
    band: 'insufficient_evidence',
    justification: `Insufficient evidence: ${reason}.`,
    evidence_pointers: [],
    sub_score_observations: [],
    rubric_version: AVI_RUBRIC_VERSION,
  };
}

function buildEvidencePrompt(
  dimension_id: DimensionId,
  subject: Subject,
  evidence: EvidencePackage
): string {
  const subjectBlock = `SUBJECT:
- canonical_name: ${JSON.stringify(subject.canonical_name)}
- industry: ${JSON.stringify(subject.industry)}
- subject_type: ${JSON.stringify(subject.subject_type)}
- url: ${JSON.stringify(subject.url)}`;

  const c = evidence.crawler;
  const crawlerBlock = `CRAWLER EVIDENCE:
- url: ${c.url}
- status: ${c.status}
- title: ${JSON.stringify(c.title)}
- meta_description: ${JSON.stringify(c.meta_description)}
- h1: ${JSON.stringify(c.h1)}
- schema_types: ${JSON.stringify(c.schema_blocks.map((b: any) => b['@type']).filter(Boolean))}
- sameAs_links: ${JSON.stringify(c.same_as_links)}
- has_faq_schema: ${c.has_faq_schema}
- has_person_schema: ${c.has_person_schema}
- has_organization_schema: ${c.has_organization_schema}
- keyword_stuffing_detected: ${c.keyword_stuffing_detected}
- differentiation_above_fold: ${c.differentiation_above_fold}
- meta_description_chars: ${c.meta_description_chars}
- meta_description_has_action_verb: ${c.meta_description_has_action_verb}
- meta_description_names_category: ${c.meta_description_names_category}
- og_description_present: ${c.og_description_present}
- title_has_descriptor: ${c.title_has_descriptor}
- word_count: ${c.word_count}
- raw_text_sample (first 2000 chars):
"""
${c.raw_text_sample}
"""`;

  const cor = evidence.corroboration;
  const corroborationBlock = `CORROBORATION EVIDENCE:

General web search (${cor.general_search.length} results):
${cor.general_search.slice(0, 6).map((r) => `- ${r.url} | ${r.title}`).join('\n') || '  (none)'}

Platform-filtered searches:
${cor.platform_filtered
  .map(
    (p) =>
      `- ${p.platform}: ${p.results.length} results${
        p.results.length > 0
          ? '\n' + p.results.slice(0, 3).map((r) => `    · ${r.url}`).join('\n')
          : ''
      }`
  )
  .join('\n')}`;

  return `${subjectBlock}\n\n${crawlerBlock}\n\n${corroborationBlock}\n\nApply the anchored scale to this evidence and return the JSON object specified above.`;
}
