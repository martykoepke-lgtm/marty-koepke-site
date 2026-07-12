/**
 * Paid V3 orchestrator.
 *
 * Deterministic pipeline. LLM calls remain bounded to extraction/judgment
 * roles; code controls order and scoring math.
 */

import { randomUUID } from 'node:crypto';

import { aggregate } from '../aggregator-v2';
import { crawl } from '../crawler-v2';
import { corroborate } from '../corroboration-v2';
import { runQueryGrid } from '../engine-clients';
import type { AuditError, ExtractorOutput, Subject } from '../types';
import { accuracyRecommendV3 } from './accuracy-recommender';
import { classifyClaimSupport } from './claim-verifier';
import { v3PublicScores } from './composite';
import { runCompetitorReadinessPass } from './competitor-readiness';
import { aggregateCompetitorVisibility } from './competitor-visibility';
import { extractV3 } from './extractor';
import { selectV3Quotes } from './quote-selector';
import { recommendV3 } from './recommender';
import { AVI_V3_RUBRIC_VERSION } from './rubric';
import { scoreReadinessV3 } from './readiness';
import { collectSourceEvidence } from './source-evidence';
import { synthesizeV3 } from './synthesizer';
import type { V3Audit, V3Claim, V3ClaimVerification } from './types';
import { v3MeasuredOutcomes } from './outcomes';
import { buildV3QueryGrid } from './queries';

export interface RunAuditV3Options {
  mode?: 'audit' | 'monitoring';
  queryCount?: number;
}

export async function runAuditV3(
  subject: Subject,
  options: RunAuditV3Options = {}
): Promise<V3Audit> {
  const audit_id = randomUUID();
  const created_at = new Date().toISOString();
  const errors: AuditError[] = [];
  const mode = options.mode ?? 'audit';

  const crawler = await crawl(subject.url, subject.industry, subject.canonical_name);
  const corroboration = await corroborate(subject);

  const queryCount = options.queryCount ?? 8;
  const query_grid = buildV3QueryGrid(subject, queryCount);
  const engines = ['chatgpt', 'claude', 'perplexity', 'gemini'] as const;
  const engine_responses = await runQueryGrid(query_grid, [...engines]);

  const extracted: ExtractorOutput[] = [];
  const claims: V3Claim[] = [];

  for (const response of engine_responses) {
    if (response.error) {
      errors.push({
        step: 'query_runner',
        message: `${response.engine}: ${response.error}`,
        fatal: false,
      });
      continue;
    }
    const result = await extractV3(response, subject);
    extracted.push(result.verified_extraction);
    for (const claim of result.claims) {
      claims.push({
        ...claim,
        audit_id,
      });
    }
  }

  const visibility_v2 = aggregate(extracted);
  const evidence_package = { crawler, corroboration };
  const readiness_scores = await scoreReadinessV3(subject, evidence_package);
  const source_evidence = await collectSourceEvidence({ subject, extractions: extracted, corroboration });

  const materialClaims = claims.filter((claim) => isMaterialV3Claim(claim, subject));

  const claim_verifications: V3ClaimVerification[] = materialClaims.map((claim) =>
    classifyClaimSupport({ claim, evidence: source_evidence, subject })
  );

  const outcomes = v3MeasuredOutcomes({
    extractions: extracted,
    claimVerifications: claim_verifications,
    representationAccuracy: representationAccuracyFromClaims(claim_verifications, materialClaims.length),
    contextPreservation: contextPreservationFromExtractions(extracted),
    recommendationQuality: recommendationQualityFromExtractions(extracted),
    stability: mode === 'monitoring' ? undefined : visibility_v2.composite,
  });

  const public_scores = v3PublicScores({ readiness_scores, outcomes });
  const recommendations = recommendV3({ readinessScores: readiness_scores, outcomes, publicScores: public_scores });
  const accuracy_recommendations = accuracyRecommendV3({
    claims: materialClaims,
    claimVerifications: claim_verifications,
  });
  const representative_quotes = selectV3Quotes({
    engineResponses: engine_responses,
    extracted,
  });
  const competitor_visibility = aggregateCompetitorVisibility({
    extracted,
    namedCompetitors: (subject.competitors ?? []).flatMap((c) => [
      c.canonical_name,
      ...c.aliases,
    ]),
  });
  const competitor_readiness = await runCompetitorReadinessPass({
    subjectIndustry: subject.industry,
    competitors: subject.competitors ?? [],
  });
  const verdict = synthesizeV3({
    subject,
    publicScores: public_scores,
    readinessScores: readiness_scores,
    outcomes,
    recommendations,
    accuracyRecommendations: accuracy_recommendations,
  });

  return {
    audit_id,
    rubric_version: AVI_V3_RUBRIC_VERSION,
    created_at,
    subject,
    mode,
    protocol: {
      query_grid,
      engines: [...engines],
      reps_per_pair: 1,
      total_calls: query_grid.length * engines.length,
    },
    evidence_package,
    crawler,
    corroboration,
    engine_responses,
    extracted,
    readiness_scores,
    visibility_outcome: {
      presence: visibility_v2.presence,
      citation: visibility_v2.citation,
      share_of_voice: visibility_v2.share_of_voice,
      prominence: visibility_v2.prominence,
      composite: visibility_v2.composite,
    },
    claims: materialClaims,
    source_evidence,
    claim_verifications,
    outcomes,
    public_scores,
    verdict,
    accuracy_recommendations,
    representative_quotes,
    competitor_visibility,
    competitor_readiness,
    errors,
  };
}

function representationAccuracyFromClaims(
  verifications: V3ClaimVerification[],
  claimCount: number
): number {
  if (claimCount === 0) return 0;
  const negative = verifications.filter((verification) =>
    ['contradicted', 'unsupported', 'ai_misrepresentation'].includes(verification.label)
  ).length;
  return Math.max(0, Math.min(1, (claimCount - negative) / claimCount));
}

function contextPreservationFromExtractions(extractions: ExtractorOutput[]): number {
  const mentioned = extractions.filter((extraction) => extraction.mentioned && extraction.scent);
  if (mentioned.length === 0) return 0;
  const preserved = mentioned.filter(
    (extraction) =>
      extraction.scent?.description_present &&
      extraction.scent?.category_named &&
      extraction.scent?.differentiation_named
  ).length;
  return preserved / mentioned.length;
}

function recommendationQualityFromExtractions(extractions: ExtractorOutput[]): number {
  const mentioned = extractions.filter((extraction) => extraction.mentioned);
  if (mentioned.length === 0) return 0;
  const positiveOrNeutral = mentioned.filter((extraction) =>
    ['positive', 'neutral'].includes(extraction.sentiment)
  ).length;
  return positiveOrNeutral / mentioned.length;
}

function isMaterialV3Claim(claim: V3Claim, subject: Subject): boolean {
  const text = claim.claim_text.toLowerCase();
  const names = [subject.canonical_name, ...(subject.aliases ?? [])]
    .map((name) => name.toLowerCase())
    .filter(Boolean);

  if (!names.some((name) => text.includes(name))) return false;

  const speculativePatterns = [
    /\bcould\b/,
    /\bshould\b/,
    /\bwould\b/,
    /\bmay\b/,
    /\bmight\b/,
    /\bpotential\b/,
    /\bpossible\b/,
    /\bconsider\b/,
    /\bvaluable service\b/,
    /\bdifferent pricing strategies\b/,
  ];
  if (speculativePatterns.some((pattern) => pattern.test(text))) return false;

  return [
    'identity',
    'category',
    'service',
    'location',
    'audience',
    'credential',
    'pricing',
    'comparison',
    'recommendation',
  ].includes(claim.claim_type);
}
