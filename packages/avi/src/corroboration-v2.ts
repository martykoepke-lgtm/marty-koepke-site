/**
 * Corroborator v2 — pure code, CLI-friendly. Uses the existing tavily.ts wrapper.
 *
 * Runs general corroboration + platform-filtered searches for the platforms
 * each audited engine favors (per rubric §A.6, footnote [3], [10]).
 *
 * Two guards against wrong-entity noise:
 *   1. Each query is anchored with the subject's URL host so Tavily
 *      prioritizes results that link to or mention the subject's domain.
 *   2. Every returned result is post-filtered — kept only if its title,
 *      snippet, or URL mentions the canonical name, an alias, the URL
 *      host, or a supplied differentiation term. Otherwise dropped.
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

type RawResult = { title: string; url: string; snippet: string };

export async function corroborate(
  subject: Subject,
  platforms: Platform[] = DEFAULT_PLATFORMS
): Promise<CorroborationEvidence> {
  const subjectQuery = quote(subject.canonical_name);
  const urlHost = extractHost(subject.url);
  const needles = buildNeedles(subject);

  // General search — anchor with the URL host so Tavily prefers pages
  // linked to or discussing the subject's domain. Widen the initial
  // pull (10 → filter down) so the post-filter still leaves useful evidence.
  const generalQuery = urlHost
    ? `${subjectQuery} ${subject.industry ?? ''} ${urlHost}`.trim()
    : `${subjectQuery} ${subject.industry ?? ''}`.trim();

  let general: RawResult[] = [];
  try {
    const result = await tavilySearch(
      { query: generalQuery, maxResults: 10 },
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
  const generalBeforeCount = general.length;
  general = filterRelevance(general, needles).slice(0, 8);
  console.log(
    `[corroborate] general: ${generalBeforeCount} → ${general.length} after relevance filter`
  );

  // Platform-filtered searches — same treatment.
  const platform_filtered: PlatformSearchResults[] = [];
  for (const p of platforms) {
    try {
      const query = urlHost
        ? `${subjectQuery} site:${PLATFORM_DOMAINS[p]} ${urlHost}`
        : `${subjectQuery} site:${PLATFORM_DOMAINS[p]}`;

      const result = await tavilySearch(
        { query, maxResults: 8 },
        { endpoint: `corroboration_${p}`, submissionId: null, ip: null }
      );
      const raw: RawResult[] = (result.results ?? []).map((r) => ({
        title: r.title ?? '',
        url: r.url ?? '',
        snippet: r.content ?? '',
      }));
      const beforeCount = raw.length;
      const filtered = filterRelevance(raw, needles).slice(0, 5);
      console.log(
        `[corroborate] ${p}: ${beforeCount} → ${filtered.length} after relevance filter`
      );
      platform_filtered.push({ platform: p, results: filtered });
    } catch {
      platform_filtered.push({ platform: p, results: [] });
    }
  }

  return { general_search: general, platform_filtered };
}

/**
 * Build the list of substrings a result must contain (in title, snippet, or URL)
 * to be considered a real match for the subject. Case-insensitive.
 */
function buildNeedles(subject: Subject): string[] {
  const raw = [
    subject.canonical_name,
    ...(subject.aliases ?? []),
    ...(subject.known_differentiation_terms ?? []),
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  const urlHost = extractHost(subject.url);
  if (urlHost) raw.push(urlHost.toLowerCase());
  return Array.from(new Set(raw));
}

/**
 * Keep a result only if any needle appears (as a substring) in the
 * concatenated title + snippet + url text. If needles is empty (no
 * canonical name — should never happen in practice), pass everything
 * through unchanged.
 */
function filterRelevance(results: RawResult[], needles: string[]): RawResult[] {
  if (needles.length === 0) return results;
  return results.filter((r) => {
    const hay = `${r.title} ${r.snippet} ${r.url}`.toLowerCase();
    return needles.some((n) => hay.includes(n));
  });
}

function extractHost(url: string | undefined): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function quote(s: string): string {
  return s.includes(' ') ? `"${s}"` : s;
}
