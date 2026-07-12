/**
 * Master-key presence checker.
 *
 * Different kinds of businesses are represented in AI answers through
 * completely different structured sources:
 *
 *   local           → Google Business Profile, Bing Places, Yelp
 *   online_b2b      → LinkedIn (company page), a vertical directory
 *                     (Clutch / G2 / Capterra / Avvo / Trustpilot),
 *                     and current-year "best of" listicles
 *
 * This module runs targeted Tavily searches to check whether the subject
 * is present on each master key for its lane. The result is a plain-
 * English report of what's found and what's missing.
 *
 * Boundary rule: this reports PRESENCE, not visibility. It is safe to run
 * inside the free scan — see AI_BUSINESS_ACCURACY_V3_RUBRIC.md §Free Vs
 * Paid Boundary. It does not claim that AI recommends the business, only
 * that (or whether) the business appears in the profiles AI reads.
 */
import { tavilySearch } from '../tavily';
import type { AudienceLane, Subject } from '../types';

export type MasterKeyId =
  | 'google_business_profile'
  | 'bing_places'
  | 'yelp'
  | 'linkedin_company'
  | 'vertical_directory'
  | 'current_year_listicle';

export type MasterKeyConfidence = 'high' | 'medium' | 'low' | 'none';

export interface MasterKeyCheck {
  id: MasterKeyId;
  label: string;
  lane: AudienceLane;
  found: boolean;
  confidence: MasterKeyConfidence;
  evidenceUrl?: string;
  evidenceTitle?: string;
  notes?: string;
}

export interface MasterKeyReport {
  lane: AudienceLane;
  checks: MasterKeyCheck[];
  presentCount: number;
  totalChecks: number;
  /** One-sentence plain-English summary suitable for the free-scan report. */
  headline: string;
}

export interface CheckMasterKeysOptions {
  submissionId?: string | null;
  ip?: string | null;
  /** Override the year injected into listicle searches (defaults to
   *  current calendar year). Deterministic tests set this. */
  listicleYear?: number;
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Check every master key that matters for this subject's audience lane.
 *
 * Runs the checks in parallel. Cost per scan: roughly $0.015 (3 basic
 * Tavily searches). Latency: 2-3 seconds.
 */
export async function checkMasterKeys(
  subject: Subject,
  opts: CheckMasterKeysOptions = {}
): Promise<MasterKeyReport> {
  const lane: AudienceLane = subject.audience_lane ?? 'local';
  const checks =
    lane === 'local'
      ? await runLocalChecks(subject, opts)
      : await runOnlineB2BChecks(subject, opts);
  const presentCount = checks.filter((c) => c.found).length;
  return {
    lane,
    checks,
    presentCount,
    totalChecks: checks.length,
    headline: buildHeadline(lane, checks),
  };
}

/* ---------------------------------------------------------------------- */

async function runLocalChecks(
  subject: Subject,
  opts: CheckMasterKeysOptions
): Promise<MasterKeyCheck[]> {
  const name = subject.canonical_name;
  const loc = subject.location ? ` ${subject.location}` : '';

  return Promise.all([
    checkPresence({
      id: 'google_business_profile',
      label: 'Google Business Profile',
      lane: 'local',
      query: `"${name}"${loc} google maps`,
      expectDomains: ['maps.google.', 'google.com/maps', 'google.com/search'],
      opts,
    }),
    checkPresence({
      id: 'bing_places',
      label: 'Bing Places',
      lane: 'local',
      query: `"${name}"${loc} site:bing.com`,
      expectDomains: ['bing.com/maps', 'bing.com/places', 'bing.com/local'],
      opts,
    }),
    checkPresence({
      id: 'yelp',
      label: 'Yelp',
      lane: 'local',
      query: `"${name}"${loc} site:yelp.com`,
      expectDomains: ['yelp.com'],
      opts,
    }),
  ]);
}

async function runOnlineB2BChecks(
  subject: Subject,
  opts: CheckMasterKeysOptions
): Promise<MasterKeyCheck[]> {
  const name = subject.canonical_name;
  const industry = subject.industry || 'company';
  const year = opts.listicleYear ?? CURRENT_YEAR;

  return Promise.all([
    checkPresence({
      id: 'linkedin_company',
      label: 'LinkedIn (company page)',
      lane: 'online_b2b',
      query: `"${name}" site:linkedin.com/company`,
      expectDomains: ['linkedin.com/company', 'linkedin.com/in/'],
      opts,
    }),
    checkPresence({
      id: 'vertical_directory',
      label: 'Vertical directory',
      lane: 'online_b2b',
      query: `"${name}" (site:clutch.co OR site:g2.com OR site:capterra.com OR site:trustpilot.com OR site:avvo.com)`,
      expectDomains: [
        'clutch.co',
        'g2.com',
        'capterra.com',
        'trustpilot.com',
        'avvo.com',
        'superlawyers.com',
        'martindale.com',
      ],
      opts,
    }),
    checkPresence({
      id: 'current_year_listicle',
      label: `${year} "best of" listicle`,
      lane: 'online_b2b',
      query: `"best ${industry}" ${year} "${name}"`,
      // Listicles can live anywhere — no domain filter; matched by title
      // language and body containing the subject name instead.
      expectDomains: [],
      matchBy: 'body',
      opts,
    }),
  ]);
}

/* ---------------------------------------------------------------------- */

interface CheckArgs {
  id: MasterKeyId;
  label: string;
  lane: AudienceLane;
  query: string;
  /** Domains the top result should match to count as "found." Empty means
   *  domain isn't a filter (see matchBy). */
  expectDomains: string[];
  /** How to decide a match:
   *   'domain' — top result URL must contain one of expectDomains (default)
   *   'body'   — top result body must contain the subject name (listicles) */
  matchBy?: 'domain' | 'body';
  opts: CheckMasterKeysOptions;
}

async function checkPresence(args: CheckArgs): Promise<MasterKeyCheck> {
  const matchBy = args.matchBy ?? 'domain';
  const response = await tavilySearch(
    { query: args.query, searchDepth: 'basic', maxResults: 5 },
    {
      endpoint: `master_keys_${args.id}`,
      submissionId: args.opts.submissionId,
      ip: args.opts.ip,
    }
  );

  if (!response.ok || response.results.length === 0) {
    return {
      id: args.id,
      label: args.label,
      lane: args.lane,
      found: false,
      confidence: 'none',
      notes: response.error,
    };
  }

  let match =
    matchBy === 'body'
      ? response.results.find((r) => {
          const subjectFragment = args.query.match(/"([^"]+)"/)?.[1] ?? '';
          return (
            (r.title || '').toLowerCase().includes('best') ||
            (r.content || '').toLowerCase().includes(subjectFragment.toLowerCase())
          );
        })
      : response.results.find((r) =>
          args.expectDomains.some((d) => (r.url || '').toLowerCase().includes(d))
        );

  if (!match) {
    return {
      id: args.id,
      label: args.label,
      lane: args.lane,
      found: false,
      confidence: 'none',
    };
  }

  const confidence: MasterKeyConfidence =
    match.score >= 0.6 ? 'high' : match.score >= 0.3 ? 'medium' : 'low';

  return {
    id: args.id,
    label: args.label,
    lane: args.lane,
    found: true,
    confidence,
    evidenceUrl: match.url,
    evidenceTitle: match.title,
  };
}

/* ---------------------------------------------------------------------- */

function buildHeadline(lane: AudienceLane, checks: MasterKeyCheck[]): string {
  const present = checks.filter((c) => c.found);
  const total = checks.length;

  if (present.length === 0) {
    return lane === 'local'
      ? "We couldn't find your business on any of the three profiles AI reads for local recommendations. That's the biggest fix to start with."
      : "We couldn't find your business on any of the three sources AI reads for online B2B recommendations. That's the biggest fix to start with.";
  }
  if (present.length === total) {
    return lane === 'local'
      ? "You're present on all three profiles AI reads for local recommendations. The next work is making sure each one describes you accurately."
      : "You're present on all three sources AI reads for online B2B recommendations. The next work is making sure the picture is consistent across them.";
  }
  const missing = checks
    .filter((c) => !c.found)
    .map((c) => c.label)
    .join(', ');
  return `You're on ${present.length} of ${total}. Missing: ${missing}.`;
}
