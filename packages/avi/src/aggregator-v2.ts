/**
 * Aggregator v2 — pure code, no LLM.
 *
 * Computes the four Visibility sub-metrics from the Extractor outputs:
 *   - Presence       = mentioned / total
 *   - Citation       = cited_with_link (verified) / total
 *   - Share-of-Voice = mentioned / (mentioned OR any competitor mentioned)
 *   - Prominence     = avg position score (top=1.0, middle=0.5, late=0.25, not_named=0.0)
 *
 * Then composes them into Visibility composite per rubric §C:
 *   Visibility = 0.20×Presence + 0.30×Citation + 0.30×SoV + 0.20×Prominence
 */

import type { ExtractorOutput, VisibilityOutcome } from './types';

const POSITION_SCORE = {
  top: 1.0,
  middle: 0.5,
  late: 0.25,
  not_named: 0.0,
};

export function aggregate(extractions: ExtractorOutput[]): VisibilityOutcome {
  const total = extractions.length;
  if (total === 0) {
    return { presence: 0, citation: 0, share_of_voice: 0, prominence: 0, composite: 0 };
  }

  const mentioned = extractions.filter((e) => e.mentioned).length;
  const cited = extractions.filter((e) => e.cited_with_link && e.cited_urls_verified.length > 0).length;
  const competitorAny = extractions.filter(
    (e) => e.mentioned || (e.competitors_mentioned && e.competitors_mentioned.length > 0)
  ).length;

  const presence = mentioned / total;
  const citation = cited / total;
  const share_of_voice = competitorAny === 0 ? 0 : mentioned / competitorAny;
  const prominence =
    extractions.reduce((sum, e) => sum + POSITION_SCORE[e.position], 0) / total;

  const composite =
    0.2 * presence + 0.3 * citation + 0.3 * share_of_voice + 0.2 * prominence;

  return {
    presence: round(presence),
    citation: round(citation),
    share_of_voice: round(share_of_voice),
    prominence: round(prominence),
    composite: round(composite),
  };
}

function round(n: number, places = 3): number {
  const m = Math.pow(10, places);
  return Math.round(n * m) / m;
}
