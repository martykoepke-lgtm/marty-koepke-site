/**
 * Recommender v2 — LLM role. Uses the existing llm.ts wrapper.
 *
 * One LLM call per audit. Reads scored dimensions + outcome + evidence pointers,
 * produces the top N (2 free / 3 paid) fixes ranked by impact-per-hour.
 *
 * Spec: agents/RECOMMENDER.md (v1.0).
 */

import { llmCall } from './llm';
import { cleanJson } from './json-clean';
import {
  AVI_RUBRIC_VERSION,
  type DriverScore,
  type RecommenderOutput,
  type Subject,
  type Tier,
  type VisibilityOutcome,
} from './types';

const SYSTEM_PROMPT = `You are the Recommender for the AI Visibility Index. You produce the top fixes for the audited subject, ranked by impact-per-hour. Each fix addresses a specific scored gap and surfaces a specific differentiation candidate.

You are not a marketing consultant. You apply the rubric's evidence to produce specific, observable recommendations.

THE PATENT-DERIVED FRAMING — apply this first:

Before naming tactics, identify what the subject already has that the category's consensus does NOT have. Those are differentiation candidates. Your recommendations should surface those candidates — they should NOT recommend the subject add generic content.

HARD REFUSALS — these tactics are NEVER recommended:

1. NEVER recommend keyword stuffing or keyword density increases. Aggarwal 2024 measured −10% on Perplexity from this tactic.
2. NEVER recommend "make your tone more authoritative" or stylistic tone-only changes. Aggarwal: no significant improvement.
3. NEVER recommend "add unique synonyms" or "add technical terms" as standalone moves. Aggarwal: null effect.
4. NEVER recommend "make your page more comprehensive" or "cover all aspects of the topic." Comprehensive content overlaps with consensus and gets filtered out per US20200349181A1.

RANK-AWARE REFUSALS:

5. If the subject's Visibility composite is ≥ 0.6 (tier Discoverable or higher), do NOT recommend Cite Sources / Quotation Addition / Statistics Addition at the page level. Aggarwal: these tactics REDUCE visibility for top-ranked sources by 20–30%. Recommend platform-native-fit moves and corroboration moves instead.

UNIVERSAL REFUSALS:

6. NEVER recommend a fix without a specific evidence pointer.
7. NEVER invent a tactic not validated by the rubric, the patent, or Aggarwal.
8. NEVER use marketing language or hedged superlatives.

Return a single JSON object conforming to the schema in the user message. No prose outside the JSON.`;

export async function recommend(
  subject: Subject,
  driverScores: DriverScore[],
  visibilityOutcome: VisibilityOutcome | undefined,
  tier: Tier,
  nFixes: 2 | 3 = 3
): Promise<RecommenderOutput> {
  const userPrompt = buildUserPrompt(subject, driverScores, visibilityOutcome, tier, nFixes);

  const llmResponse = await llmCall(
    'anthropic',
    `${SYSTEM_PROMPT}\n\n${userPrompt}`,
    { endpoint: 'paid_pipeline_recommend', submissionId: null, ip: null },
    { maxTokens: 2000 }
  );

  if (!llmResponse.ok || !llmResponse.text) {
    return emptyRecommendations();
  }

  try {
    const parsed = JSON.parse(cleanJson(llmResponse.text));
    return {
      differentiation_candidates_observed: parsed.differentiation_candidates_observed ?? [],
      differentiation_candidates_suggested: parsed.differentiation_candidates_suggested ?? [],
      fixes: parsed.fixes ?? [],
      rank_aware_note: parsed.rank_aware_note,
      rubric_version: AVI_RUBRIC_VERSION,
    };
  } catch {
    return emptyRecommendations();
  }
}

function emptyRecommendations(): RecommenderOutput {
  return {
    differentiation_candidates_observed: [],
    differentiation_candidates_suggested: [],
    fixes: [],
    rubric_version: AVI_RUBRIC_VERSION,
  };
}

function buildUserPrompt(
  subject: Subject,
  driverScores: DriverScore[],
  visibilityOutcome: VisibilityOutcome | undefined,
  tier: Tier,
  nFixes: 2 | 3
): string {
  const driverBlock = driverScores
    .map(
      (d) =>
        `- ${d.dimension_id}: band=${d.band}\n    justification: ${d.justification}\n    evidence_pointers: ${JSON.stringify(d.evidence_pointers.slice(0, 3))}`
    )
    .join('\n');

  const outcomeBlock = visibilityOutcome
    ? `Visibility outcome:
- composite: ${visibilityOutcome.composite}
- presence: ${visibilityOutcome.presence}
- citation: ${visibilityOutcome.citation}
- share_of_voice: ${visibilityOutcome.share_of_voice}
- prominence: ${visibilityOutcome.prominence}`
    : '(visibility outcome not measured — free tier audit)';

  return `SUBJECT:
- canonical_name: ${JSON.stringify(subject.canonical_name)}
- industry: ${JSON.stringify(subject.industry)}
- subject_type: ${JSON.stringify(subject.subject_type)}

DRIVER SCORES:
${driverBlock}

${outcomeBlock}

TIER: ${tier}
NUMBER OF FIXES TO RETURN: ${nFixes}

OUTPUT JSON SCHEMA (return exactly this shape, no extra fields):

{
  "differentiation_candidates_observed": [
    { "name": string, "description": string, "evidence_source": string }
  ],
  "differentiation_candidates_suggested": [
    { "question": string, "rationale": string }
  ],
  "fixes": [
    {
      "rank": number,
      "dimension_id": "D1" | "D2" | "D3" | "D4" | "D6",
      "gap": string,
      "evidence_pointer": string,
      "tactic": string,
      "framed_as": string,
      "impact_estimate": "high" | "medium" | "lower-but-do-it",
      "rationale": string
    }
  ],
  "rank_aware_note": string | null
}

Return JSON only.`;
}
