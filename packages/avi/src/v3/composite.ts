import {
  V3_AI_BUSINESS_ACCURACY_WEIGHTS,
  V3_AI_VISIBILITY_WEIGHTS,
  V3_INDEX_WEIGHTS,
  v3TierFromIndex,
} from './rubric';
import {
  type V3CompositeInput,
  type V3MeasuredOutcomes,
  type V3PublicScores,
  type V3ReadinessScore,
} from './types';

export function v3ReadinessScore(readinessScores: V3ReadinessScore[]): number {
  const scored = readinessScores.filter(
    (score): score is V3ReadinessScore & { score: number } =>
      typeof score.score === 'number'
  );
  if (scored.length === 0) return 0;

  const totalWeight = scored.reduce((sum, score) => {
    const normalized = score.score / 5;
    return sum + normalized * scoreWeight(score);
  }, 0);
  const availableWeight = scored.reduce((sum, score) => sum + scoreWeight(score), 0);
  if (availableWeight === 0) return 0;
  return round2((totalWeight / availableWeight) * 100);
}

export function v3VisibilityScore(outcomes: Partial<V3MeasuredOutcomes> | undefined): number {
  if (!outcomes) return 0;
  const visibility = asNumber(outcomes.visibility);
  const stability = asNumber(outcomes.stability, visibility);
  return round2(
    (visibility * V3_AI_VISIBILITY_WEIGHTS.visibility +
      stability * V3_AI_VISIBILITY_WEIGHTS.stability) *
      100
  );
}

export function v3BusinessAccuracyScore(
  outcomes: Partial<V3MeasuredOutcomes> | undefined
): number {
  if (!outcomes) return 0;
  const accuracy = asNumber(outcomes.representation_accuracy);
  const claimSupport = asNumber(outcomes.claim_support);
  const context = asNumber(outcomes.context_preservation);
  const recommendation = asNumber(outcomes.recommendation_quality);
  const stability = asNumber(outcomes.stability, averageDefined([
    accuracy,
    claimSupport,
    context,
    recommendation,
  ]));

  return round2(
    (accuracy * V3_AI_BUSINESS_ACCURACY_WEIGHTS.representation_accuracy +
      claimSupport * V3_AI_BUSINESS_ACCURACY_WEIGHTS.claim_support +
      context * V3_AI_BUSINESS_ACCURACY_WEIGHTS.context_preservation +
      recommendation * V3_AI_BUSINESS_ACCURACY_WEIGHTS.recommendation_quality +
      stability * V3_AI_BUSINESS_ACCURACY_WEIGHTS.stability) *
      100
  );
}

export function v3PublicScores(input: V3CompositeInput): V3PublicScores {
  const ai_readiness_score = v3ReadinessScore(input.readiness_scores);
  const ai_visibility_score = v3VisibilityScore(input.outcomes);
  const ai_business_accuracy_score = v3BusinessAccuracyScore(input.outcomes);

  const hasOutcomes = !!input.outcomes && Object.keys(input.outcomes).length > 0;
  const ai_business_accuracy_index = hasOutcomes
    ? round2(
        ai_business_accuracy_score * V3_INDEX_WEIGHTS.ai_business_accuracy_score +
          ai_visibility_score * V3_INDEX_WEIGHTS.ai_visibility_score +
          ai_readiness_score * V3_INDEX_WEIGHTS.ai_readiness_score
      )
    : ai_readiness_score;

  return {
    ai_visibility_score,
    ai_readiness_score,
    ai_business_accuracy_score,
    ai_business_accuracy_index,
    tier: v3TierFromIndex(ai_business_accuracy_index),
  };
}

function scoreWeight(score: V3ReadinessScore): number {
  switch (score.driver_id) {
    case 'business_clarity':
      return 0.25;
    case 'source_support':
      return 0.25;
    case 'ai_readability':
      return 0.2;
    case 'distinctive_point_of_view':
      return 0.15;
    case 'recommendation_fit':
      return 0.15;
  }
}

function asNumber(value: number | undefined, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function averageDefined(values: number[]): number {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

