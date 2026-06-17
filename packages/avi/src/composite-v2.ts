/**
 * Composite v2 — pure code, no LLM.
 *
 * Computes Readiness, Visibility, Composite, and tier from the scored dimensions.
 * Per rubric v0.2 §B.
 */

import {
  DIMENSION_WEIGHTS,
  tierFromComposite,
  type CompositeResult,
  type DriverScore,
  type VisibilityOutcome,
} from './types';

/**
 * Readiness = ( Σ (driver_band × weight) ÷ 5 ) × 100
 *
 * Skips drivers with band === "insufficient_evidence". When skipped, the
 * remaining weights are renormalized so the result still scales to 0–100.
 */
export function readinessScore(driverScores: DriverScore[]): number {
  const scored = driverScores.filter((d) => typeof d.band === 'number');
  if (scored.length === 0) return 0;

  const totalWeight = scored.reduce((sum, d) => sum + DIMENSION_WEIGHTS[d.dimension_id], 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scored.reduce(
    (sum, d) => sum + (d.band as number) * DIMENSION_WEIGHTS[d.dimension_id],
    0
  );

  // Renormalize over the weights we actually have.
  const readinessFraction = weightedSum / totalWeight / 5;
  return Math.round(readinessFraction * 10000) / 100;
}

/**
 * Visibility score (0–100). Pass through the aggregator output, scaled.
 */
export function visibilityScore(outcome: VisibilityOutcome | undefined): number | undefined {
  if (!outcome) return undefined;
  return Math.round(outcome.composite * 10000) / 100;
}

/**
 * Composite. Paid: 0.40 × Readiness + 0.60 × Visibility. Free: Readiness only.
 */
export function compositeScore(driverScores: DriverScore[], outcome?: VisibilityOutcome): CompositeResult {
  const readiness = readinessScore(driverScores);
  const visibility = visibilityScore(outcome);

  let composite: number;
  if (visibility === undefined) {
    composite = readiness;
  } else {
    composite = Math.round((0.4 * readiness + 0.6 * visibility) * 100) / 100;
  }

  return {
    readiness,
    visibility,
    composite,
    tier: tierFromComposite(composite),
  };
}
