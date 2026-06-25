import type { ExtractorOutput } from '../types';
import {
  type V3ClaimVerification,
  type V3MeasuredOutcomes,
  type V3VisibilityOutcome,
} from './types';

const POSITION_SCORE = {
  top: 1,
  middle: 0.5,
  late: 0.25,
  not_named: 0,
};

export function v3VisibilityOutcome(extractions: ExtractorOutput[]): V3VisibilityOutcome {
  const total = extractions.length;
  if (total === 0) {
    return { presence: 0, citation: 0, share_of_voice: 0, prominence: 0, composite: 0 };
  }

  const mentioned = extractions.filter((item) => item.mentioned).length;
  const cited = extractions.filter(
    (item) => item.cited_with_link && item.cited_urls_verified.length > 0
  ).length;
  const competitorAny = extractions.filter(
    (item) => item.mentioned || item.competitors_mentioned.length > 0
  ).length;
  const presence = mentioned / total;
  const citation = cited / total;
  const share_of_voice = competitorAny === 0 ? 0 : mentioned / competitorAny;
  const prominence =
    extractions.reduce((sum, item) => sum + POSITION_SCORE[item.position], 0) / total;
  const composite =
    0.2 * presence + 0.3 * citation + 0.3 * share_of_voice + 0.2 * prominence;

  return {
    presence: round3(presence),
    citation: round3(citation),
    share_of_voice: round3(share_of_voice),
    prominence: round3(prominence),
    composite: round3(composite),
  };
}

export function v3ClaimSupportScore(verifications: V3ClaimVerification[]): number {
  if (verifications.length === 0) return 0;
  const supported = verifications.filter((verification) =>
    [
      'supported_by_owned_source',
      'supported_by_independent_source',
      'supported_by_multiple_sources',
    ].includes(verification.label)
  ).length;
  const contradicted = verifications.filter(
    (verification) =>
      verification.label === 'contradicted' ||
      verification.label === 'ai_misrepresentation'
  ).length;
  return clamp01((supported - contradicted) / verifications.length);
}

export function v3MeasuredOutcomes(opts: {
  extractions: ExtractorOutput[];
  claimVerifications?: V3ClaimVerification[];
  representationAccuracy?: number;
  contextPreservation?: number;
  recommendationQuality?: number;
  stability?: number;
}): V3MeasuredOutcomes {
  const visibility = v3VisibilityOutcome(opts.extractions).composite;
  const claim_support = v3ClaimSupportScore(opts.claimVerifications ?? []);

  return {
    visibility,
    representation_accuracy: clamp01(opts.representationAccuracy ?? 0),
    claim_support,
    context_preservation: clamp01(opts.contextPreservation ?? 0),
    recommendation_quality: clamp01(opts.recommendationQuality ?? 0),
    stability: clamp01(opts.stability ?? visibility),
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, round3(value)));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
