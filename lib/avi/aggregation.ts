/**
 * Aggregation service.
 *
 * Reads the extracted fields from `audit_query_responses` and computes
 * the four Visibility sub-metrics plus the Visibility composite. Pure
 * math, no LLM calls.
 *
 * Per AVI_INDEX_REPORT.md §4.5:
 *
 *   Presence       = (mentioned cells) / (total cells)
 *   Citation       = (cited_with_link cells) / (total cells)
 *   Share-of-Voice = (mentioned cells) / (mentioned cells + competitor-mention cells)
 *   Prominence     = average position score
 *                    (top=1.0, middle=0.5, late=0.25, not_named=0)
 *
 *   Visibility = 0.20 × Presence
 *              + 0.30 × Citation
 *              + 0.30 × Share-of-Voice
 *              + 0.20 × Prominence
 *
 * Writes Visibility composite to audits.visibility_score and the
 * per-sub-metric breakdown to audits.query_output (jsonb).
 *
 * Cells that were never extracted (mentioned IS NULL) are excluded
 * from the denominators — we don't pretend a not-extracted cell is a
 * not-mentioned cell.
 */

import { supabaseAdmin } from "@/lib/supabase";

// ============================================================================
// Types
// ============================================================================

export type AggregationContext = {
  auditId: string;
};

export type AggregationResult = {
  totalCells: number;
  extractedCells: number;
  unextractedCells: number;

  presence: number;
  citation: number;
  shareOfVoice: number;
  prominence: number;

  visibility: number;

  /** Counts behind the scores, for debug/report. */
  raw: {
    mentionedCells: number;
    citedWithLinkCells: number;
    competitorOnlyMentionCells: number;
    bothMentionedCells: number;
    positionBandCounts: Record<string, number>;
  };
};

type ExtractedRow = {
  mentioned: boolean | null;
  cited_with_link: boolean | null;
  position_band: string | null;
  competitors_mentioned: string[] | null;
};

// ============================================================================
// Weights (kept here so they can be reviewed without code-diving)
// ============================================================================

const VISIBILITY_WEIGHTS = {
  presence: 0.2,
  citation: 0.3,
  shareOfVoice: 0.3,
  prominence: 0.2,
} as const;

const POSITION_SCORE: Record<string, number> = {
  top: 1.0,
  middle: 0.5,
  late: 0.25,
  not_named: 0,
};

// ============================================================================
// Entry point
// ============================================================================

export async function runAggregation(
  context: AggregationContext
): Promise<AggregationResult> {
  const supabase = supabaseAdmin();

  // Pull every cell, including unextracted ones, so we can report on
  // coverage (extracted vs. total).
  const { data, error } = await supabase
    .from("audit_query_responses")
    .select("mentioned, cited_with_link, position_band, competitors_mentioned")
    .eq("audit_id", context.auditId)
    .returns<ExtractedRow[]>();

  if (error) {
    throw new Error(
      `[aggregation] failed to read audit_query_responses: ${error.message}`
    );
  }

  const rows = data ?? [];
  const totalCells = rows.length;
  const extractedRows = rows.filter((r) => r.mentioned !== null);
  const extractedCells = extractedRows.length;
  const unextractedCells = totalCells - extractedCells;

  // ---- Presence ----
  const mentionedCells = extractedRows.filter((r) => r.mentioned === true)
    .length;
  const presence =
    extractedCells === 0 ? 0 : mentionedCells / extractedCells;

  // ---- Citation ----
  const citedWithLinkCells = extractedRows.filter(
    (r) => r.cited_with_link === true
  ).length;
  const citation =
    extractedCells === 0 ? 0 : citedWithLinkCells / extractedCells;

  // ---- Share-of-Voice ----
  //
  // SoV = subject mentions ÷ (subject mentions + cells where ONLY a
  // competitor was named).
  //
  // A cell where BOTH the subject AND a competitor are named contributes
  // to "subject mentioned" only — we don't double-discount the subject.
  // A cell where NEITHER the subject NOR any competitor is named is
  // excluded from the SoV denominator entirely (it's neutral on the
  // share-of-voice dimension, not a competitive loss).
  let competitorOnlyMentionCells = 0;
  let bothMentionedCells = 0;
  for (const r of extractedRows) {
    const hasCompetitor =
      Array.isArray(r.competitors_mentioned) &&
      r.competitors_mentioned.length > 0;
    if (r.mentioned && hasCompetitor) bothMentionedCells++;
    else if (!r.mentioned && hasCompetitor) competitorOnlyMentionCells++;
  }
  const sovDenominator = mentionedCells + competitorOnlyMentionCells;
  const shareOfVoice =
    sovDenominator === 0 ? 0 : mentionedCells / sovDenominator;

  // ---- Prominence ----
  //
  // Average position score over the EXTRACTED cells (including
  // not_named). A subject that's never named has a prominence floor of
  // 0; that's intentional — the metric blends "how often" and "how
  // visibly" into one number.
  let prominenceSum = 0;
  const positionBandCounts: Record<string, number> = {
    top: 0,
    middle: 0,
    late: 0,
    not_named: 0,
  };
  for (const r of extractedRows) {
    const band = r.position_band ?? "not_named";
    prominenceSum += POSITION_SCORE[band] ?? 0;
    if (band in positionBandCounts) positionBandCounts[band]++;
  }
  const prominence =
    extractedCells === 0 ? 0 : prominenceSum / extractedCells;

  // ---- Visibility composite ----
  const visibility =
    VISIBILITY_WEIGHTS.presence * presence +
    VISIBILITY_WEIGHTS.citation * citation +
    VISIBILITY_WEIGHTS.shareOfVoice * shareOfVoice +
    VISIBILITY_WEIGHTS.prominence * prominence;

  const result: AggregationResult = {
    totalCells,
    extractedCells,
    unextractedCells,
    presence: round3(presence),
    citation: round3(citation),
    shareOfVoice: round3(shareOfVoice),
    prominence: round3(prominence),
    visibility: round3(visibility),
    raw: {
      mentionedCells,
      citedWithLinkCells,
      competitorOnlyMentionCells,
      bothMentionedCells,
      positionBandCounts,
    },
  };

  // ---- Persist ----
  await persistAggregation(context.auditId, result);

  return result;
}

// ============================================================================
// Persistence
// ============================================================================

async function persistAggregation(
  auditId: string,
  result: AggregationResult
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("audits")
    .update({
      visibility_score: result.visibility,
      query_output: {
        breakdown: {
          presence: result.presence,
          citation: result.citation,
          shareOfVoice: result.shareOfVoice,
          prominence: result.prominence,
        },
        weights: VISIBILITY_WEIGHTS,
        coverage: {
          totalCells: result.totalCells,
          extractedCells: result.extractedCells,
          unextractedCells: result.unextractedCells,
        },
        raw: result.raw,
      },
    })
    .eq("id", auditId);

  if (error) {
    // Hard failure: the composite step downstream relies on
    // audits.visibility_score being populated.
    throw new Error(
      `[aggregation] failed to update audits row ${auditId}: ${error.message}`
    );
  }
}

// ============================================================================
// Helpers
// ============================================================================

function round3(n: number): number {
  return Math.round(n * 1_000) / 1_000;
}
