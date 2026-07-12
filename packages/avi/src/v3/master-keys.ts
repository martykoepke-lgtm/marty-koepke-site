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
  /** Populated on Missing results — 3-5 specific how-to-fix options
   *  tailored to the master key. Empty when found: true. */
  remediationOptions?: string[];
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
      // Listicles can live anywhere — no domain filter. Match requires the
      // subject NAME to appear in the returned title or body, not just
      // that a listicle in the category exists.
      expectDomains: [],
      matchBy: 'body',
      subjectName: name,
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
   *   'body'   — top result title or body must contain the subject name */
  matchBy?: 'domain' | 'body';
  /** Passed through for 'body' matches so we can require the name to
   *  actually appear in the returned page — not just that a listicle
   *  exists in the general category. */
  subjectName?: string;
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
      remediationOptions: REMEDIATION[args.id],
    };
  }

  let match: (typeof response.results)[number] | undefined;
  if (matchBy === 'body') {
    // For listicles: only count as "present" if the result actually names
    // the subject. Previously this matched any listicle in the category,
    // which produced false positives for new businesses that had never
    // appeared in any 2026 listicle. Now the subject name must appear in
    // the title or body of the returned page.
    const nameLower = args.subjectName?.toLowerCase();
    match = nameLower
      ? response.results.find(
          (r) =>
            (r.title || '').toLowerCase().includes(nameLower) ||
            (r.content || '').toLowerCase().includes(nameLower)
        )
      : undefined;
  } else {
    match = response.results.find((r) =>
      args.expectDomains.some((d) => (r.url || '').toLowerCase().includes(d))
    );
  }

  if (!match) {
    return {
      id: args.id,
      label: args.label,
      lane: args.lane,
      found: false,
      confidence: 'none',
      remediationOptions: REMEDIATION[args.id],
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

/* ---- Remediation options per master key ----------------------------- */

const REMEDIATION: Record<MasterKeyId, string[]> = {
  google_business_profile: [
    "Go to google.com/business and claim your listing (or create one if it doesn't exist). Verification takes 5-14 days via postcard, phone, or video call.",
    "Fill every field: hours, service area, phone, website, primary + secondary categories, photos, services, and attributes.",
    "Add 10+ photos — exterior, interior, staff, products/services, and behind-the-scenes shots. Real photos beat stock ones for AI ranking.",
    "Ask 5 recent customers to leave a Google review. Respond to each one within a week.",
    "Post an update weekly for the first 90 days — offers, events, or announcements. Google prioritizes active profiles.",
  ],
  bing_places: [
    "Go to bingplaces.com and claim your listing (or create one). If you already have Google Business Profile set up, Bing accepts an import — start there.",
    "Verify by mail, phone, or bulk verification (if you have multiple locations).",
    "Add photos, hours, service area, categories, and payment methods.",
    "This feeds Copilot and ChatGPT (via a Bing licensing deal), so it's worth 30 minutes even if you barely use Bing yourself.",
  ],
  yelp: [
    "Go to biz.yelp.com and claim your business (or create one for free).",
    "Fill in categories, hours, photos, service area, and menu/services.",
    "Never buy fake reviews — Yelp aggressively filters them and can suspend your listing. Instead, add a 'Find us on Yelp' link on your website.",
    "Respond to every review — good or bad — within 48 hours. Yelp weights responsiveness.",
    "Post 5+ high-quality photos of your product, service, or workspace.",
  ],
  linkedin_company: [
    "Go to linkedin.com/company/setup/new and create your company page (10 minutes).",
    "Fill in tagline, About section, industry, size, website, and location. Add a logo and cover image.",
    "Post 2-3 times per week for the first 90 days — insights, case studies, updates. LinkedIn's algorithm rewards active pages.",
    "Have you and your team link personal profiles to the company page. That's how AI systems verify the company is real.",
    "Consider LinkedIn Pulse (long-form articles) — one of the most-cited sources for AI B2B recommendations, especially on Copilot.",
  ],
  vertical_directory: [
    "Identify the ONE directory your specific vertical uses (guessing wrong wastes hours): SaaS → G2 / Capterra · Agencies → Clutch / GoodFirms · Consultants → Clutch / TopTal · Law → Avvo / Justia / Super Lawyers · Coaches → BetterHelp / Life Coach Directory · Fractional exec → Chief Outsiders / TechExecs.",
    "Create a free profile. Paid tiers give you more visibility but aren't required for AI citations.",
    "Collect 3-5 verified reviews from real clients. Ask within a week of finishing a project — while your work is fresh in their mind.",
    "Keep your profile current. Recent activity signals to AI (and the directory's own ranking) that you're active.",
  ],
  current_year_listicle: [
    "Sign up for HARO (helpareporter.com) or Qwoted. Reply to 2-3 relevant queries per week — typical placement time is 2-6 weeks.",
    "Search `\"best [your category]\" 2026` on Google. For each result, find the author's contact and pitch: 'I noticed you compared X and Y in your 2026 roundup — worth considering me for the next update?' Response rate ~15%.",
    "Write your own listicle: 'Best [category] for [audience], 2026.' Include yourself honestly. If you rank in Google for the listicle query, you become the citation.",
    "Apply for niche industry awards — even small ones ('Small Business Innovation Award' type) get aggregated by listicle authors.",
    "Build one citation-worthy resource on your site — a research report, a comparison guide, an authoritative post — that listicle writers naturally want to link to.",
  ],
};

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
