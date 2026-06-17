/**
 * Corroborator v2 — pure code, CLI-friendly. Uses the existing tavily.ts wrapper.
 *
 * Runs general corroboration + platform-filtered searches for the platforms
 * each audited engine favors (per rubric §A.6, footnote [3], [10]).
 *
 * Output conforms to `CorroborationEvidence` in types.ts.
 */

import { tavilySearch } from './tavily';
import type { CorroborationEvidence, PlatformSearchResults, Platform, Subject } from './types';

const PLATFORM_DOMAINS: Record<Platform, string> = {
  reddit: 'reddit.com',
  linkedin: 'linkedin.com',
  youtube: 'youtube.com',
  wikipedia: 'en.wikipedia.org',
  quora: 'quora.com',
  yelp: 'yelp.com',
  g2: 'g2.com',
  gartner: 'gartner.com',
};

const DEFAULT_PLATFORMS: Platform[] = [
  'reddit',
  'linkedin',
  'youtube',
  'wikipedia',
  'g2',
  'gartner',
];

export async function corroborate(
  subject: Subject,
  platforms: Platform[] = DEFAULT_PLATFORMS
): Promise<CorroborationEvidence> {
  const subjectQuery = quote(subject.canonical_name);

  // General search
  let general: { title: string; url: string; snippet: string }[] = [];
  try {
    const result = await tavilySearch(
      { query: `${subjectQuery} ${subject.industry}`, maxResults: 8 },
      { endpoint: 'corroboration_broad', submissionId: null, ip: null }
    );
    general = (result.results ?? []).map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      snippet: r.content ?? '',
    }));
  } catch {
    general = [];
  }

  // Platform-filtered searches
  const platform_filtered: PlatformSearchResults[] = [];
  for (const p of platforms) {
    try {
      const result = await tavilySearch(
        { query: `${subjectQuery} site:${PLATFORM_DOMAINS[p]}`, maxResults: 5 },
        { endpoint: `corroboration_${p}`, submissionId: null, ip: null }
      );
      const results = (result.results ?? []).map((r) => ({
        title: r.title ?? '',
        url: r.url ?? '',
        snippet: r.content ?? '',
      }));
      platform_filtered.push({ platform: p, results });
    } catch {
      platform_filtered.push({ platform: p, results: [] });
    }
  }

  return { general_search: general, platform_filtered };
}

function quote(s: string): string {
  return s.includes(' ') ? `"${s}"` : s;
}
