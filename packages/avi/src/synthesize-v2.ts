/**
 * Synthesizer v2 — LLM role.
 *
 * One LLM call per audit. Takes the structured audit (driver scores +
 * justifications + visibility outcomes + recommendations) and returns a
 * plain-English narrative synthesis: one headline sentence + a short body
 * that names the strongest signal, the biggest drag, and the closest
 * path to the next tier.
 *
 * Strictly aggregator, not assessor — per AVI_OPERATING_STANDARD.md §1.
 * Use ONLY the evidence in the user message. Do not invent. Voice
 * rules per VISION.md §10: calm, plain, specific, no marketing language.
 *
 * Spec: agents/SYNTHESIZER.md.
 */

import { llmCall } from "./llm";
import { cleanJson } from "./json-clean";
import {
  AVI_RUBRIC_VERSION,
  DIMENSION_WEIGHTS,
  type Audit,
  type CompositeResult,
  type DriverScore,
  type RecommenderOutput,
  type Subject,
  type VisibilityOutcome,
} from "./types";

export interface Synthesis {
  headline: string;
  body: string;
  rubric_version: string;
  generated_at: string;
  synthesizer_model: string;
}

const SYNTHESIZER_MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You synthesize a structured AI Visibility Index audit into a plain-English narrative summary. Your only job is aggregation — naming the pattern across the existing findings.

ABSOLUTE RULES:

1. Use ONLY the evidence in the user message. Do NOT invent facts about the subject. Do NOT add claims that are not in the supplied audit data.
2. No marketing language. No hedged superlatives ("best-in-class", "world-class", "industry-leading", "powerful"). No empty intensifiers ("very", "extremely", "highly").
3. Honest about uncertainty. If the data is thin, say so.
4. Specific over vague. Cite the score, the band, the platform — not "good" or "strong".
5. Plain English. No jargon-laden buzzword soup.

WHAT TO PRODUCE:

- "headline": one sentence (≤25 words) capturing the core pattern. Format: subject name + the most important thing the audit found.
- "body": 2-3 short paragraphs. Each paragraph is 2-4 sentences max.
  - Paragraph 1: What the subject HAS going for them — the strongest 1-2 signals from the audit (highest driver bands, best visibility sub-metrics). Name the dimensions and numbers.
  - Paragraph 2: What's PULLING the score down — the biggest drag (lowest band on heaviest weight, or weakest visibility sub-metric). Be specific about what the rubric measured and why it failed.
  - Paragraph 3 (optional): The closest path to the next tier band, drawn from the top recommendation. If the subject is already in the top tier, mention what would consolidate the position.

STYLE: Imagine you're a senior analyst writing the executive read for a one-page brief. Calm. Direct. The reader is technical but time-pressed.

Return a single JSON object with exactly two string keys: "headline" and "body". No prose outside the JSON.`;

export async function synthesize(
  subject: Subject,
  driverScores: DriverScore[],
  visibilityOutcome: VisibilityOutcome | undefined,
  composite: CompositeResult,
  recommendations: RecommenderOutput
): Promise<Synthesis | null> {
  const userPrompt = buildUserPrompt(
    subject,
    driverScores,
    visibilityOutcome,
    composite,
    recommendations
  );

  const llmResponse = await llmCall(
    "anthropic",
    `${SYSTEM_PROMPT}\n\n${userPrompt}`,
    { endpoint: "paid_pipeline_synthesize", submissionId: null, ip: null },
    { maxTokens: 1200 }
  );

  if (!llmResponse.ok || !llmResponse.text) {
    return null;
  }

  try {
    const parsed = JSON.parse(cleanJson(llmResponse.text));
    if (typeof parsed.headline !== "string" || typeof parsed.body !== "string") {
      return null;
    }
    return {
      headline: parsed.headline,
      body: parsed.body,
      rubric_version: AVI_RUBRIC_VERSION,
      generated_at: new Date().toISOString(),
      synthesizer_model: SYNTHESIZER_MODEL,
    };
  } catch {
    return null;
  }
}

/**
 * Convenience wrapper that synthesizes from a complete Audit record.
 * Used by the console's on-demand "regenerate" action.
 */
export async function synthesizeAudit(audit: Audit): Promise<Synthesis | null> {
  return synthesize(
    audit.subject,
    audit.driver_scores,
    audit.visibility_outcome,
    audit.composite,
    audit.recommendations
  );
}

function buildUserPrompt(
  subject: Subject,
  driverScores: DriverScore[],
  visibilityOutcome: VisibilityOutcome | undefined,
  composite: CompositeResult,
  recommendations: RecommenderOutput
): string {
  const driverLines = driverScores.map((d) => {
    const weight = DIMENSION_WEIGHTS[d.dimension_id] ?? 0;
    const bandStr =
      d.band === "insufficient_evidence" ? "insufficient_evidence" : String(d.band);
    return `${d.dimension_id} (weight ${weight}): band ${bandStr}\n  Justification: ${d.justification}`;
  });

  const visibilityLines = visibilityOutcome
    ? [
        `Presence: ${(visibilityOutcome.presence * 100).toFixed(0)}%`,
        `Citation: ${(visibilityOutcome.citation * 100).toFixed(0)}%`,
        `Share-of-Voice: ${(visibilityOutcome.share_of_voice * 100).toFixed(0)}%`,
        `Prominence: ${(visibilityOutcome.prominence * 100).toFixed(0)}%`,
        `Visibility composite: ${(visibilityOutcome.composite * 100).toFixed(0)}%`,
      ]
    : ["Visibility: not measured (free Readiness Check)"];

  const fixLines = recommendations.fixes.map(
    (f) =>
      `#${f.rank} ${f.dimension_id} (${f.impact_estimate}): ${f.tactic}\n  Rationale: ${f.rationale}`
  );

  return `AUDIT TO SYNTHESIZE:

Subject: ${subject.canonical_name} (${subject.industry}, ${subject.subject_type})
URL: ${subject.url}

Composite score: ${composite.composite.toFixed(1)} / 100
Tier: ${composite.tier}
Readiness: ${composite.readiness.toFixed(1)} / 100
${composite.visibility != null ? `Visibility: ${composite.visibility.toFixed(1)} / 100` : ""}

Driver scores (the 5 weighted dimensions, judged 0-5 against the anchored rubric):
${driverLines.join("\n\n")}

Visibility sub-metrics (paid mode — aggregated from engine queries):
${visibilityLines.join("\n")}

Top recommended fixes (in priority order):
${fixLines.join("\n\n")}

${recommendations.rank_aware_note ? `Rank-aware note: ${recommendations.rank_aware_note}` : ""}

Tier band cutoffs (composite 0-100):
- < 20: Invisible
- 20-40: Overlooked
- 40-60: Emerging
- 60-80: Discoverable
- ≥ 80: Agent-Ready

Now produce the JSON object with "headline" and "body" per the rules in the system prompt.`;
}
