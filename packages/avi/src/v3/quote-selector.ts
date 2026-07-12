import type { EngineResponse, ExtractorOutput } from '../types';
import type { V3QuoteCategory, V3SelectedQuote } from './types';

export type { V3QuoteCategory, V3SelectedQuote };

export interface V3QuoteSelectorInput {
  engineResponses: EngineResponse[];
  extracted: ExtractorOutput[];
}

interface Pair {
  response: EngineResponse;
  extraction: ExtractorOutput;
}

const POSITION_PRIORITY: Record<ExtractorOutput['position'], number> = {
  top: 3,
  middle: 2,
  late: 1,
  not_named: 0,
};

export function selectV3Quotes(
  input: V3QuoteSelectorInput,
  limit = 3
): V3SelectedQuote[] {
  const responsesByKey = new Map<string, EngineResponse>();
  for (const response of input.engineResponses) {
    responsesByKey.set(keyFor(response.template_id, response.engine), response);
  }

  const pairs: Pair[] = [];
  for (const extraction of input.extracted) {
    const response = responsesByKey.get(
      keyFor(extraction.template_id, extraction.engine)
    );
    if (!response || response.error || !response.raw_response) continue;
    pairs.push({ response, extraction });
  }

  const usedKeys = new Set<string>();
  const selected: V3SelectedQuote[] = [];

  const missedPick = pickMissed(pairs, usedKeys);
  if (missedPick) selected.push(missedPick);

  const issuesPick = pickNamedWithIssues(pairs, usedKeys);
  if (issuesPick) selected.push(issuesPick);

  const cleanPick = pickNamedCleanly(pairs, usedKeys);
  if (cleanPick) selected.push(cleanPick);

  return selected.slice(0, limit);
}

function pickMissed(pairs: Pair[], usedKeys: Set<string>): V3SelectedQuote | null {
  const available = pairs.filter(
    (p) =>
      !p.extraction.mentioned &&
      !usedKeys.has(keyFor(p.response.template_id, p.response.engine))
  );
  if (available.length === 0) return null;

  const competitorRich = available.filter(
    (p) => p.extraction.competitors_mentioned.length > 0
  );
  const pool = competitorRich.length > 0 ? competitorRich : available;
  const pick = pool[0];

  return finalize(pick, usedKeys, 'missed', annotationMissed(pick.extraction));
}

function pickNamedWithIssues(
  pairs: Pair[],
  usedKeys: Set<string>
): V3SelectedQuote | null {
  const available = pairs.filter(
    (p) =>
      p.extraction.mentioned &&
      !usedKeys.has(keyFor(p.response.template_id, p.response.engine)) &&
      (p.extraction.sentiment === 'negative' ||
        p.extraction.position === 'late' ||
        p.extraction.position === 'middle')
  );
  if (available.length === 0) return null;

  available.sort((a, b) => {
    const aIssue = issueScore(a.extraction);
    const bIssue = issueScore(b.extraction);
    return bIssue - aIssue;
  });
  const pick = available[0];

  return finalize(pick, usedKeys, 'named_with_issues', annotationIssues(pick.extraction));
}

function pickNamedCleanly(
  pairs: Pair[],
  usedKeys: Set<string>
): V3SelectedQuote | null {
  const available = pairs.filter(
    (p) =>
      p.extraction.mentioned &&
      !usedKeys.has(keyFor(p.response.template_id, p.response.engine)) &&
      (p.extraction.sentiment === 'positive' || p.extraction.sentiment === 'neutral') &&
      (p.extraction.position === 'top' || p.extraction.position === 'middle')
  );
  if (available.length === 0) return null;

  available.sort((a, b) => {
    const aScore =
      POSITION_PRIORITY[a.extraction.position] +
      (a.extraction.sentiment === 'positive' ? 1 : 0);
    const bScore =
      POSITION_PRIORITY[b.extraction.position] +
      (b.extraction.sentiment === 'positive' ? 1 : 0);
    return bScore - aScore;
  });
  const pick = available[0];

  return finalize(pick, usedKeys, 'named_cleanly', annotationCleanly(pick.extraction));
}

function issueScore(extraction: ExtractorOutput): number {
  let score = 0;
  if (extraction.sentiment === 'negative') score += 3;
  if (extraction.position === 'late') score += 2;
  if (extraction.position === 'middle') score += 1;
  return score;
}

function annotationMissed(extraction: ExtractorOutput): string {
  if (extraction.competitors_mentioned.length > 0) {
    const named = extraction.competitors_mentioned.slice(0, 2).join(', ');
    return `you were not named — AI named ${named} instead`;
  }
  return 'you were not named';
}

function annotationIssues(extraction: ExtractorOutput): string {
  const parts: string[] = [];
  if (extraction.sentiment === 'negative') parts.push('negative tone');
  if (extraction.position === 'late') parts.push('buried at the end');
  else if (extraction.position === 'middle') parts.push('not the first named');
  return parts.length > 0 ? parts.join(' · ') : 'named, but not at the top';
}

function annotationCleanly(extraction: ExtractorOutput): string {
  const parts: string[] = [];
  if (extraction.position === 'top') parts.push('named first');
  else parts.push('named in the answer');
  if (extraction.sentiment === 'positive') parts.push('positive tone');
  return parts.join(' · ');
}

function finalize(
  pair: Pair,
  usedKeys: Set<string>,
  category: V3QuoteCategory,
  annotation: string
): V3SelectedQuote {
  const key = keyFor(pair.response.template_id, pair.response.engine);
  usedKeys.add(key);
  return {
    category,
    template_id: pair.response.template_id,
    engine: pair.response.engine,
    query: pair.response.query,
    response_excerpt: excerpt(pair.response.raw_response ?? ''),
    annotation,
    evidence: {
      mentioned: pair.extraction.mentioned,
      position: pair.extraction.position,
      sentiment: pair.extraction.sentiment,
      competitors_mentioned: pair.extraction.competitors_mentioned,
    },
  };
}

function keyFor(template_id: string, engine: string): string {
  return `${template_id}:${engine}`;
}

function excerpt(raw: string, maxLen = 280): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLen) return cleaned;
  const sentenceEnd = cleaned.slice(0, maxLen).lastIndexOf('. ');
  if (sentenceEnd > maxLen * 0.5) return cleaned.slice(0, sentenceEnd + 1);
  return cleaned.slice(0, maxLen).trimEnd() + '…';
}
