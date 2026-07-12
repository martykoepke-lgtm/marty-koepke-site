import type { RecommenderOutput, Subject } from '../types';
import { AVI_V3_RUBRIC_VERSION } from './rubric';
import type {
  V3AccuracyRecommenderOutput,
  V3MeasuredOutcomes,
  V3PublicScores,
  V3Quadrant,
  V3ReadinessScore,
  V3Verdict,
} from './types';

const QUADRANT_MIDPOINT = 50;
const ACCURACY_WEAK_THRESHOLD = 40;

export interface V3SynthesizeInput {
  subject: Subject;
  publicScores: V3PublicScores;
  readinessScores: V3ReadinessScore[];
  outcomes?: V3MeasuredOutcomes;
  recommendations: RecommenderOutput;
  accuracyRecommendations?: V3AccuracyRecommenderOutput;
}

export function synthesizeV3(input: V3SynthesizeInput): V3Verdict {
  const quadrant = quadrantFor(input.publicScores);
  const accuracyIsWeak =
    input.publicScores.ai_business_accuracy_score < ACCURACY_WEAK_THRESHOLD;

  return {
    quadrant,
    verdict_sentence: verdictSentence(
      quadrant,
      input.subject.canonical_name,
      accuracyIsWeak
    ),
    fix_this_first: pickFixThisFirst(
      input.publicScores,
      input.recommendations,
      input.accuracyRecommendations
    ),
    rubric_version: AVI_V3_RUBRIC_VERSION,
    generated_at: new Date().toISOString(),
    synthesizer_model: 'deterministic-v3.1-verdict',
  };
}

function quadrantFor(scores: V3PublicScores): V3Quadrant {
  const readinessStrong = scores.ai_readiness_score >= QUADRANT_MIDPOINT;
  const visibilityStrong = scores.ai_visibility_score >= QUADRANT_MIDPOINT;
  if (readinessStrong && visibilityStrong) return 'compounding';
  if (readinessStrong) return 'undiscovered';
  if (visibilityStrong) return 'fragile';
  return 'invisible';
}

function verdictSentence(
  quadrant: V3Quadrant,
  name: string,
  accuracyIsWeak: boolean
): string {
  const base = baseVerdictFor(quadrant, name);
  if (!accuracyIsWeak) return base;
  return `${base} ${accuracyTailFor(quadrant, name)}`;
}

function baseVerdictFor(quadrant: V3Quadrant, name: string): string {
  switch (quadrant) {
    case 'invisible':
      return `AI rarely surfaces ${name}, and the foundation underneath isn't strong enough yet to change that on its own.`;
    case 'fragile':
      return `AI is finding ${name} more often than the site's foundation has earned — visibility is real, but it isn't underwritten.`;
    case 'undiscovered':
      return `${name} has done the structural work, but AI isn't surfacing the business yet — the foundation exists; the visibility hasn't caught up.`;
    case 'compounding':
      return `${name} is in the strong quadrant — AI knows the business, and the foundation is doing the work.`;
  }
}

function accuracyTailFor(quadrant: V3Quadrant, name: string): string {
  if (quadrant === 'compounding') {
    return 'The weak spot is accuracy — AI is naming the business, but not always describing it correctly.';
  }
  return `And when AI does name ${name}, it's getting the specifics wrong.`;
}

function pickFixThisFirst(
  publicScores: V3PublicScores,
  recommendations: RecommenderOutput,
  accuracyRecommendations?: V3AccuracyRecommenderOutput
): string {
  const readinessFix = recommendations.fixes[0];
  const accuracyFix = accuracyRecommendations?.fixes[0];

  const accuracyIsWeaker =
    publicScores.ai_business_accuracy_score < publicScores.ai_readiness_score;

  if (accuracyFix && accuracyIsWeaker) {
    return accuracyFix.tactic;
  }
  if (readinessFix) {
    return readinessFix.tactic;
  }
  if (accuracyFix) {
    return accuracyFix.tactic;
  }
  return 'Strengthen the readiness foundation across the five drivers — there isn\'t enough signal yet to recommend a single starting move.';
}
