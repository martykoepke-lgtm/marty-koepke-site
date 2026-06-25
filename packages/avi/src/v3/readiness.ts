import { judge as judgeV2 } from '../judge-v2';
import type { DriverScore, EvidencePackage, Subject } from '../types';
import { AVI_V3_RUBRIC_VERSION, V3_READINESS_DRIVER_DEFINITIONS } from './rubric';
import type { V3ReadinessDriverId, V3ReadinessScore } from './types';

const V2_TO_V3_DRIVER: Record<string, V3ReadinessDriverId[]> = {
  D1: ['business_clarity'],
  D2: ['source_support'],
  D3: ['ai_readability'],
  D4: ['distinctive_point_of_view'],
  D6: ['source_support', 'recommendation_fit'],
};

export async function scoreReadinessV3(
  subject: Subject,
  evidencePackage: EvidencePackage
): Promise<V3ReadinessScore[]> {
  const v2Scores: DriverScore[] = [];
  for (const dim of ['D1', 'D2', 'D3', 'D4', 'D6'] as const) {
    v2Scores.push(await judgeV2(dim, subject, evidencePackage));
  }
  return applyV3IntakeContext(mapV2DriverScoresToV3(v2Scores), subject);
}

export function mapV2DriverScoresToV3(v2Scores: DriverScore[]): V3ReadinessScore[] {
  const grouped = new Map<V3ReadinessDriverId, DriverScore[]>();
  for (const score of v2Scores) {
    for (const target of V2_TO_V3_DRIVER[score.dimension_id] ?? []) {
      if (!grouped.has(target)) grouped.set(target, []);
      grouped.get(target)?.push(score);
    }
  }

  return Object.values(V3_READINESS_DRIVER_DEFINITIONS).map((driver) => {
    const sources = grouped.get(driver.id) ?? [];
    const numeric = sources.filter((source) => typeof source.band === 'number');
    const score =
      numeric.length === 0
        ? null
        : Math.round(
            (numeric.reduce((sum, source) => sum + (source.band as number), 0) /
              numeric.length) *
              10
          ) / 10;

    return {
      driver_id: driver.id,
      driver_name: driver.name,
      band: score === null ? 'insufficient_evidence' : nearestBand(score),
      score,
      justification:
        sources.map((source) => source.justification).filter(Boolean).join(' ') ||
        'Insufficient evidence for this V3 readiness driver.',
      evidence_pointers: sources.flatMap((source) =>
        source.evidence_pointers.map((pointer) => ({
          type: pointer.type,
          value: pointer.value,
          source: `${source.dimension_id}:${pointer.source}`,
          supports_score: pointer.supports_band,
        }))
      ),
      rubric_version: AVI_V3_RUBRIC_VERSION,
    };
  });
}

function nearestBand(score: number): 0 | 1 | 2 | 3 | 4 | 5 {
  return Math.max(0, Math.min(5, Math.round(score))) as 0 | 1 | 2 | 3 | 4 | 5;
}

function applyV3IntakeContext(
  scores: V3ReadinessScore[],
  subject: Subject
): V3ReadinessScore[] {
  return scores.map((score) => {
    switch (score.driver_id) {
      case 'business_clarity':
        return liftFromIntake(score, businessClarityIntake(subject));
      case 'source_support':
        return liftFromIntake(score, sourceSupportIntake(subject));
      case 'distinctive_point_of_view':
        return liftFromIntake(score, pointOfViewIntake(subject));
      case 'recommendation_fit':
        return liftFromIntake(score, recommendationFitIntake(subject));
      case 'ai_readability':
      default:
        return score;
    }
  });
}

function businessClarityIntake(subject: Subject): IntakeSignal | null {
  const values = [
    subject.industry,
    subject.buyer_type,
    subject.problem,
    ...(subject.right_fit_situations ?? []),
  ].filter(Boolean);
  if (values.length >= 4) {
    return signal(4, 'The business details clearly explain what the business does, who it serves, and when it is a good fit.');
  }
  if (values.length >= 2) {
    return signal(3, 'The business details give AI enough basic context to interpret the business.');
  }
  return null;
}

function sourceSupportIntake(subject: Subject): IntakeSignal | null {
  const trusted = subject.trusted_source_urls?.length ?? 0;
  const claims = subject.approved_claims?.length ?? 0;
  const proof = subject.proof_points?.length ?? 0;
  if (trusted >= 2 && claims > 0 && proof > 0) {
    return signal(4, 'The business details include source links, claims, and proof points that help verify what AI says.');
  }
  if (trusted > 0 || proof > 0) {
    return signal(3, 'The business details include source-support context that helps check AI claims.');
  }
  if (claims > 0) {
    return signal(2, 'The business details include claims, but source support is still thin.');
  }
  return null;
}

function pointOfViewIntake(subject: Subject): IntakeSignal | null {
  const hasPov = Boolean(subject.distinctive_point_of_view);
  const terms = subject.known_differentiation_terms?.length ?? 0;
  const proof = subject.proof_points?.length ?? 0;
  if (hasPov && terms > 0 && proof > 0) {
    return signal(4, 'The business has a clear point of view, distinctive language, and proof points.');
  }
  if (hasPov || terms > 0) {
    return signal(3, 'The business has a distinctive point of view or signature language.');
  }
  return null;
}

function recommendationFitIntake(subject: Subject): IntakeSignal | null {
  const rightFit = subject.right_fit_situations?.length ?? 0;
  const wrongFit = subject.wrong_fit_situations?.length ?? 0;
  if (rightFit > 0 && wrongFit > 0) {
    return signal(4, 'The business details explain both when the business is a good fit and when it is not.');
  }
  if (rightFit > 0) {
    return signal(3, 'The business details explain when the business is a good fit.');
  }
  return null;
}

interface IntakeSignal {
  minimumScore: 0 | 1 | 2 | 3 | 4 | 5;
  justification: string;
}

function signal(minimumScore: 0 | 1 | 2 | 3 | 4 | 5, justification: string): IntakeSignal {
  return { minimumScore, justification };
}

function liftFromIntake(score: V3ReadinessScore, intake: IntakeSignal | null): V3ReadinessScore {
  if (!intake) return score;
  const current = typeof score.score === 'number' ? score.score : 0;
  const nextScore = Math.max(current, intake.minimumScore);
  return {
    ...score,
    score: nextScore,
    band: nearestBand(nextScore),
    justification: `${score.justification} ${intake.justification}`.trim(),
    evidence_pointers: [
      ...score.evidence_pointers,
      {
        type: 'v3_intake',
        value: intake.justification,
        source: 'subject_context',
        supports_score: true,
      },
    ],
  };
}
