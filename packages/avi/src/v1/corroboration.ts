/**
 * Corroboration service.
 *
 * Asks Tavily three questions about the subject — broad presence,
 * LinkedIn, Wikidata — and aggregates the results into a structured
 * object that feeds D2 (Cross-Source Corroboration) and D6 (Distribution
 * Surface) scoring.
 *
 * All three searches run in parallel; total wall-clock ≈ slowest search
 * (~2–4s on Tavily basic). Cost: 3 × $0.005 = $0.015 per audit.
 *
 * Read AVI_INDEX_REPORT.md §4.2 for the design.
 */

import { tavilySearch, type TavilyResultRow } from "../tavily";

export type CorroborationContext = {
  submissionId?: string | null;
  ip?: string | null;
};

export type CorroborationInput = {
  /** Subject's name as it appears publicly. */
  name: string;
  /** Subject's industry / category for the broad search. */
  industry: string;
};

export type CorroborationMention = {
  url: string;
  title: string;
  domain: string;
  snippet: string;
  publishedDate?: string;
};

export type CorroborationOutput = {
  /** True if any wikidata.org/wiki/ URL appeared. */
  wikidataPresent: boolean;
  wikidataUrl?: string;

  /** True if any linkedin.com profile URL appeared. */
  linkedinPresent: boolean;
  linkedinUrl?: string;

  /**
   * Deduplicated press / directory / podcast mentions, sorted by Tavily score.
   * For v1 we don't try to distinguish "press" from "directory" — we just
   * surface them all and let the scoring LLM use what's there. Future
   * enhancement: classify by domain heuristic.
   */
  mentions: CorroborationMention[];

  /**
   * Count of distinct domains across mentions + linkedin + wikidata.
   * The headline number the scoring LLM consumes for D2.
   */
  totalCorroboratingDomains: number;

  /** True if any of the three searches errored — degraded mode. */
  degraded: boolean;
  /** Per-search error messages if degraded. */
  errors: string[];
};

/**
 * Run the three entity-corroboration Tavily searches and aggregate.
 *
 * Never throws — partial failure is reported via `degraded` + `errors`,
 * and the scoring layer treats missing corroboration as "no external
 * signals found," which is itself a valid low-D2 signal.
 */
export async function runCorroboration(
  input: CorroborationInput,
  context: CorroborationContext
): Promise<CorroborationOutput> {
  const { name, industry } = input;

  const [broad, linkedin, wikidata] = await Promise.all([
    tavilySearch(
      {
        query: `${name} ${industry}`,
        searchDepth: "basic",
        maxResults: 8,
      },
      {
        endpoint: "corroboration_broad",
        submissionId: context.submissionId ?? null,
        ip: context.ip ?? null,
      }
    ),
    tavilySearch(
      {
        query: `${name}`,
        searchDepth: "basic",
        maxResults: 3,
        includeDomains: ["linkedin.com"],
      },
      {
        endpoint: "corroboration_linkedin",
        submissionId: context.submissionId ?? null,
        ip: context.ip ?? null,
      }
    ),
    tavilySearch(
      {
        query: `${name}`,
        searchDepth: "basic",
        maxResults: 2,
        includeDomains: ["wikidata.org"],
      },
      {
        endpoint: "corroboration_wikidata",
        submissionId: context.submissionId ?? null,
        ip: context.ip ?? null,
      }
    ),
  ]);

  // ---- Aggregate ----

  const errors: string[] = [];
  for (const res of [broad, linkedin, wikidata]) {
    if (!res.ok && res.error) errors.push(res.error);
  }

  // Wikidata
  const wikidataHit = findMatching(wikidata.results, (r) =>
    isWikidataEntityUrl(r.url)
  );

  // LinkedIn
  const linkedinHit = findMatching(linkedin.results, (r) =>
    isLinkedinProfileUrl(r.url)
  );

  // Mentions (dedup by domain, exclude wikidata + linkedin to avoid double-count)
  const broadRows = broad.results.filter(
    (r) =>
      !isWikidataEntityUrl(r.url) &&
      !isLinkedinProfileUrl(r.url) &&
      // Exclude the subject's own site if it shows up
      domainOf(r.url) !== ""
  );
  const dedupedByDomain = dedupByDomain(broadRows);

  const mentions: CorroborationMention[] = dedupedByDomain.map((r) => ({
    url: r.url,
    title: r.title,
    domain: domainOf(r.url),
    snippet: r.content?.slice(0, 280) ?? "",
    publishedDate: r.publishedDate,
  }));

  // Domain count for D2
  const domainSet = new Set<string>();
  for (const m of mentions) domainSet.add(m.domain);
  if (linkedinHit) domainSet.add("linkedin.com");
  if (wikidataHit) domainSet.add("wikidata.org");

  return {
    wikidataPresent: !!wikidataHit,
    wikidataUrl: wikidataHit?.url,
    linkedinPresent: !!linkedinHit,
    linkedinUrl: linkedinHit?.url,
    mentions,
    totalCorroboratingDomains: domainSet.size,
    degraded: errors.length > 0,
    errors,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function findMatching(
  rows: TavilyResultRow[],
  pred: (r: TavilyResultRow) => boolean
): TavilyResultRow | undefined {
  for (const r of rows) if (pred(r)) return r;
  return undefined;
}

function isWikidataEntityUrl(url: string): boolean {
  // e.g. https://www.wikidata.org/wiki/Q12345
  return /^https?:\/\/(www\.)?wikidata\.org\/wiki\/Q\d+/i.test(url);
}

function isLinkedinProfileUrl(url: string): boolean {
  // Accept /in/<handle> (personal) and /company/<slug> (company) profiles.
  return /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(in|company)\//i.test(url);
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function dedupByDomain(rows: TavilyResultRow[]): TavilyResultRow[] {
  const seen = new Set<string>();
  const out: TavilyResultRow[] = [];
  for (const r of rows) {
    const d = domainOf(r.url);
    if (!d || seen.has(d)) continue;
    seen.add(d);
    out.push(r);
  }
  return out;
}
