/**
 * V3 free readiness scan.
 *
 * Compatibility wrapper around the live legacy free scan infrastructure.
 * It keeps the public API stable while translating the returned scorecard
 * into V3 readiness drivers. The underlying persistence still writes to the
 * legacy `audits` and `audit_dimension_scores` tables until the V3 Supabase
 * schema is wired.
 */

import {
  FREE_SCAN_RUBRIC_VERSION as LEGACY_FREE_SCAN_RUBRIC_VERSION,
  runFreeScan as runLegacyFreeScan,
  tierFor,
  type FreeScanInput,
  type FreeScanResult,
  type Tier,
} from '../free-scan';
import { supabaseAdmin } from '../supabase-client';
import { AVI_V3_RUBRIC_VERSION } from './rubric';
import { V3_READINESS_DRIVER_DEFINITIONS } from './rubric';
import type { V3FreeScanResult, V3ReadinessDriverId } from './types';

export const FREE_SCAN_RUBRIC_VERSION = AVI_V3_RUBRIC_VERSION;

const LEGACY_TO_V3: Record<string, V3ReadinessDriverId[]> = {
  D1: ['business_clarity'],
  D2: ['source_support'],
  D3: ['ai_readability'],
  D4: ['distinctive_point_of_view'],
  D5: ['source_support'],
  D6: ['source_support', 'recommendation_fit'],
  D7: ['distinctive_point_of_view', 'recommendation_fit'],
};

export async function runFreeScan(input: FreeScanInput): Promise<FreeScanResult> {
  const legacy = await runLegacyFreeScan(input);
  if (!legacy.ok) return legacy;

  const v3 = translateLegacyFreeScanToV3(legacy);
  await persistV3FreeScanResult(v3);
  return {
    ...legacy,
    readinessScore: v3.readinessScore,
    tier: v3.tier,
    dimensions: v3.dimensions,
    findings: v3.findings,
  };
}

export function translateLegacyFreeScanToV3(
  legacy: Extract<FreeScanResult, { ok: true }>
): V3FreeScanResult {
  const grouped = new Map<V3ReadinessDriverId, number[]>();
  const summaries = new Map<V3ReadinessDriverId, string[]>();

  for (const dimension of legacy.dimensions) {
    const targets = LEGACY_TO_V3[dimension.id] ?? [];
    for (const target of targets) {
      if (!grouped.has(target)) grouped.set(target, []);
      if (!summaries.has(target)) summaries.set(target, []);
      if (typeof dimension.score === 'number') grouped.get(target)?.push(dimension.score);
    }
  }

  for (const finding of legacy.findings) {
    const targets = LEGACY_TO_V3[finding.dimensionId] ?? [];
    for (const target of targets) {
      if (!summaries.has(target)) summaries.set(target, []);
      summaries.get(target)?.push(finding.summary);
    }
  }

  const dimensions = Object.values(V3_READINESS_DRIVER_DEFINITIONS).map((driver) => {
    const scores = grouped.get(driver.id) ?? [];
    const score =
      scores.length === 0
        ? null
        : Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10;
    return {
      id: driver.id,
      name: driver.name,
      score,
    };
  });

  const scored = dimensions.filter(
    (dimension): dimension is typeof dimension & { score: number } =>
      typeof dimension.score === 'number'
  );
  const readinessScore =
    scored.length === 0
      ? 0
      : Math.round(
          (scored.reduce((sum, dimension) => sum + dimension.score, 0) /
            scored.length /
            5) *
            1000
        ) / 1000;

  const findings = scored
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((dimension) => {
      const driver = V3_READINESS_DRIVER_DEFINITIONS[dimension.id];
      const summary =
        summaries.get(dimension.id)?.find((item) => item.trim().length > 0) ??
        `${driver.name}: ${driver.plain_question}`;
      return {
        dimensionId: dimension.id,
        dimensionName: driver.name,
        score: dimension.score,
        summary,
      };
    });

  return {
    ...legacy,
    readinessScore,
    tier: tierFor(readinessScore),
    dimensions,
    findings,
  };
}

export const LEGACY_FREE_SCAN_VERSION = LEGACY_FREE_SCAN_RUBRIC_VERSION;
export { tierFor };
export type { FreeScanInput, FreeScanResult, Tier };

async function persistV3FreeScanResult(result: V3FreeScanResult): Promise<void> {
  const supabase = supabaseAdmin();

  await supabase
    .from('audits')
    .update({
      rubric_version: AVI_V3_RUBRIC_VERSION,
      readiness_score: result.readinessScore,
      tier: result.tier,
      scoring_output: {
        findings: result.findings,
        v3: true,
        legacy_free_scan_version: LEGACY_FREE_SCAN_RUBRIC_VERSION,
      },
    })
    .eq('id', result.auditId);

  await supabase.from('audit_dimension_scores').delete().eq('audit_id', result.auditId);

  const rows = result.dimensions.map((dimension) => ({
    audit_id: result.auditId,
    dimension_id: dimension.id,
    dimension_name: dimension.name,
    score: dimension.score,
    justification:
      result.findings.find((finding) => finding.dimensionId === dimension.id)?.summary ??
      V3_READINESS_DRIVER_DEFINITIONS[dimension.id].plain_question,
    evidence_pointers: [],
    rubric_version: AVI_V3_RUBRIC_VERSION,
  }));

  if (rows.length > 0) {
    await supabase.from('audit_dimension_scores').insert(rows);
  }
}
