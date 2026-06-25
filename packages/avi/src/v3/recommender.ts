import type { RecommenderOutput } from '../types';
import { AVI_V3_RUBRIC_VERSION } from './rubric';
import type { V3MeasuredOutcomes, V3PublicScores, V3ReadinessScore } from './types';

export function recommendV3(opts: {
  readinessScores: V3ReadinessScore[];
  outcomes?: V3MeasuredOutcomes;
  publicScores: V3PublicScores;
}): RecommenderOutput {
  const sorted = [...opts.readinessScores]
    .filter((score) => typeof score.score === 'number')
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 3);

  return {
    differentiation_candidates_observed: [],
    differentiation_candidates_suggested:
      sorted.some((score) => score.driver_id === 'distinctive_point_of_view')
        ? [
            {
              question:
                'What do you know, believe, prove, or do differently than the rest of your category?',
              rationale:
                'A distinctive, supportable point of view helps AI understand when the business is a right-fit recommendation.',
            },
          ]
        : [],
    fixes: sorted.map((score, index) => ({
      rank: index + 1,
      dimension_id: legacyDimensionFor(score.driver_id),
      gap: score.justification || `${score.driver_name} needs stronger evidence.`,
      evidence_pointer: score.evidence_pointers[0]?.source ?? score.driver_id,
      tactic: tacticFor(score.driver_id),
      framed_as: framedAsFor(score.driver_id),
      impact_estimate: index === 0 ? 'high' : index === 1 ? 'medium' : 'lower-but-do-it',
      rationale: score.driver_name,
    })),
    rank_aware_note:
      opts.publicScores.tier === 'Agent-Ready'
        ? 'The business appears ready for monitoring and periodic re-measure rather than broad remediation.'
        : undefined,
    rubric_version: AVI_V3_RUBRIC_VERSION,
  };
}

function legacyDimensionFor(driverId: V3ReadinessScore['driver_id']): RecommenderOutput['fixes'][number]['dimension_id'] {
  switch (driverId) {
    case 'business_clarity':
      return 'D1';
    case 'source_support':
      return 'D2';
    case 'ai_readability':
      return 'D3';
    case 'distinctive_point_of_view':
      return 'D4';
    case 'recommendation_fit':
      return 'D6';
  }
}

function tacticFor(driverId: V3ReadinessScore['driver_id']): string {
  switch (driverId) {
    case 'business_clarity':
      return 'Clarify the business name, category, audience, location, and primary offers on the homepage and About page.';
    case 'source_support':
      return 'Add or strengthen credible source support for the claims AI should be able to repeat.';
    case 'ai_readability':
      return 'Improve page structure, headings, schema, FAQ content, and stable source URLs.';
    case 'distinctive_point_of_view':
      return 'Name the method, belief, proof point, or tradeoff that makes the business different.';
    case 'recommendation_fit':
      return 'Add clear best-fit and not-fit language so AI knows when the business is appropriate to recommend.';
  }
}

function framedAsFor(driverId: V3ReadinessScore['driver_id']): string {
  switch (driverId) {
    case 'business_clarity':
      return 'Help AI understand the business before it tries to compare it.';
    case 'source_support':
      return 'Give AI evidence it can safely cite and repeat.';
    case 'ai_readability':
      return 'Make the important information easier for AI systems to parse.';
    case 'distinctive_point_of_view':
      return 'Give AI a real reason to choose this business in right-fit situations.';
    case 'recommendation_fit':
      return 'Reduce wrong-fit recommendations and preserve the right-fit use cases.';
  }
}

