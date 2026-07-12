import type { ExtractorOutput } from '../types';
import type {
  V3CompetitorVisibility,
  V3CompetitorVisibilityOutput,
} from './types';

export type { V3CompetitorVisibility, V3CompetitorVisibilityOutput };

export interface V3CompetitorVisibilityInput {
  extracted: ExtractorOutput[];
  namedCompetitors?: string[];
  topN?: number;
}

const NOISE_TOKENS = new Set([
  'group',
  'llc',
  'inc',
  'co',
  'corp',
  'corporation',
  'company',
  'ltd',
  'limited',
  'pllc',
  'pc',
  'llp',
]);

export function aggregateCompetitorVisibility(
  input: V3CompetitorVisibilityInput
): V3CompetitorVisibilityOutput {
  const total = input.extracted.length;
  const namedCompetitors = input.namedCompetitors ?? [];

  interface Bucket {
    display_name: string;
    raw_names: Set<string>;
    responses: Set<string>;
    first_named_responses: Set<string>;
    engines: Set<string>;
  }
  const buckets = new Map<string, Bucket>();

  let subject_named_count = 0;
  let subject_first_named_count = 0;

  for (const extraction of input.extracted) {
    const responseKey = `${extraction.template_id}:${extraction.engine}`;
    const subjectFirst = extraction.mentioned && extraction.position === 'top';

    if (extraction.mentioned) subject_named_count += 1;
    if (subjectFirst) subject_first_named_count += 1;

    const competitors = extraction.competitors_mentioned ?? [];
    for (let i = 0; i < competitors.length; i += 1) {
      const raw = competitors[i];
      if (!raw || !raw.trim()) continue;
      const display = matchCanonical(raw, namedCompetitors);
      const bucketKey = normalize(display);
      const bucket = buckets.get(bucketKey) ?? {
        display_name: display,
        raw_names: new Set<string>(),
        responses: new Set<string>(),
        first_named_responses: new Set<string>(),
        engines: new Set<string>(),
      };
      bucket.raw_names.add(raw);
      bucket.responses.add(responseKey);
      bucket.engines.add(extraction.engine);
      if (!subjectFirst && i === 0) {
        bucket.first_named_responses.add(responseKey);
      }
      buckets.set(bucketKey, bucket);
    }
  }

  const competitors: V3CompetitorVisibility[] = [...buckets.values()]
    .map((bucket) => ({
      display_name: bucket.display_name,
      raw_names_observed: [...bucket.raw_names].sort(),
      mention_count: bucket.responses.size,
      first_named_count: bucket.first_named_responses.size,
      coverage: total === 0 ? 0 : round3(bucket.responses.size / total),
      engines_seen: [...bucket.engines].sort(),
    }))
    .sort((a, b) => {
      if (b.mention_count !== a.mention_count) return b.mention_count - a.mention_count;
      return b.first_named_count - a.first_named_count;
    });

  const topN = input.topN ?? competitors.length;
  return {
    total_responses: total,
    subject_named_count,
    subject_first_named_count,
    competitors: competitors.slice(0, topN),
  };
}

function matchCanonical(raw: string, canonicals: string[]): string {
  const rawNorm = normalize(raw);
  if (!rawNorm) return raw.trim();
  for (const canonical of canonicals) {
    const canonNorm = normalize(canonical);
    if (!canonNorm) continue;
    if (rawNorm === canonNorm) return canonical;
    if (rawNorm.includes(canonNorm) || canonNorm.includes(rawNorm)) return canonical;
  }
  return raw.trim();
}

function normalize(name: string): string {
  const lowered = name.toLowerCase().replace(/[^\w\s]/g, ' ');
  const tokens = lowered
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !NOISE_TOKENS.has(token));
  return tokens.join(' ');
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
