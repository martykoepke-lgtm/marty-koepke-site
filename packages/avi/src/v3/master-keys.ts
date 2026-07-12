/**
 * Master-key presence checker.
 *
 * Different kinds of businesses are represented in AI answers through
 * completely different structured sources. Three lanes, three playbooks:
 *
 *   local    → Google Business Profile, Bing Places, Yelp
 *              (AI answers OPINION queries — "best latte in town")
 *   services → LinkedIn (company page), a services-vertical directory
 *              (Clutch / Avvo / Super Lawyers / Chief Outsiders /
 *              Life Coach Directory), current-year "best of" listicle
 *              (AI answers ADVICE queries — "what does executive
 *              coaching cost")
 *   product  → software review platform (G2 / Capterra / TrustRadius /
 *              GetApp), SaaS directory (AlternativeTo / SaaSHub /
 *              Product Hunt), current-year comparison article
 *              (AI answers COMPARISON queries — "best CRM for a
 *              2-person team")
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
  | 'current_year_listicle'
  | 'software_review_platform'
  | 'saas_directory'
  | 'comparison_article';

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
  let checks: MasterKeyCheck[];
  switch (lane) {
    case 'local':
      checks = await runLocalChecks(subject, opts);
      break;
    case 'services':
      checks = await runServicesChecks(subject, opts);
      break;
    case 'product':
      checks = await runProductChecks(subject, opts);
      break;
  }
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

async function runServicesChecks(
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
      lane: 'services',
      query: `"${name}" site:linkedin.com/company`,
      expectDomains: ['linkedin.com/company', 'linkedin.com/in/'],
      opts,
    }),
    checkPresence({
      id: 'vertical_directory',
      label: 'Services directory',
      lane: 'services',
      // Services directories only — no software-review platforms. Product
      // lane covers G2/Capterra/TrustRadius separately.
      query: `"${name}" (site:clutch.co OR site:goodfirms.co OR site:avvo.com OR site:superlawyers.com OR site:martindale.com OR site:trustpilot.com)`,
      expectDomains: [
        'clutch.co',
        'goodfirms.co',
        'trustpilot.com',
        'avvo.com',
        'superlawyers.com',
        'martindale.com',
        'toptal.com',
        'chiefoutsiders.com',
      ],
      opts,
    }),
    checkPresence({
      id: 'current_year_listicle',
      label: `${year} "best of" listicle`,
      lane: 'services',
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

async function runProductChecks(
  subject: Subject,
  opts: CheckMasterKeysOptions
): Promise<MasterKeyCheck[]> {
  const name = subject.canonical_name;
  const industry = subject.industry || 'software';
  const year = opts.listicleYear ?? CURRENT_YEAR;

  return Promise.all([
    checkPresence({
      id: 'software_review_platform',
      label: 'Software review platform',
      lane: 'product',
      // G2, Capterra, TrustRadius, GetApp — the review platforms AI reads
      // for structured comparison queries.
      query: `"${name}" (site:g2.com OR site:capterra.com OR site:trustradius.com OR site:getapp.com)`,
      expectDomains: [
        'g2.com',
        'capterra.com',
        'trustradius.com',
        'getapp.com',
        'softwareadvice.com',
      ],
      opts,
    }),
    checkPresence({
      id: 'saas_directory',
      label: 'SaaS directory',
      lane: 'product',
      // AlternativeTo, SaaSHub, Product Hunt, Slant, SaaSworthy — the
      // "which tools are there" indexes AI reads for feature-comparison
      // and alternative-product queries.
      query: `"${name}" (site:alternativeto.net OR site:saashub.com OR site:producthunt.com OR site:slant.co OR site:saasworthy.com)`,
      expectDomains: [
        'alternativeto.net',
        'saashub.com',
        'producthunt.com',
        'slant.co',
        'saasworthy.com',
      ],
      opts,
    }),
    checkPresence({
      id: 'comparison_article',
      label: `${year} comparison article`,
      lane: 'product',
      // Comparison articles ("[category] vs [competitor]", "best [category]
      // for [use case]"). Body match required — the subject name must
      // actually appear, not just a comparison in the general category.
      query: `"best ${industry}" ${year} "${name}"`,
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
  software_review_platform: [
    "Claim your G2 profile (free) at g2.com/products — verify domain ownership and fill in every field: features, pricing, integrations, use cases, screenshots.",
    "Do the same on Capterra and TrustRadius. The three-way spread is what AI reads for comparison queries — being on one is not enough.",
    "Collect 10-15 verified reviews on G2 within the first 90 days. Ask your happiest customers within a week of a successful outcome — G2's algorithm rewards recent volume.",
    "Add feature and category tags carefully — buyers filter by these, and AI reads them as structured signals for 'best [category] for [use case]' queries.",
    "Respond to every review, positive or negative. Response rate is a public metric on all three platforms and influences buyer trust.",
  ],
  saas_directory: [
    "Submit to AlternativeTo (alternativeto.net) — the top AI-cited source for 'alternatives to [competitor]' queries. Free listing; include screenshots and a clear feature list.",
    "List on SaaSHub — good for the 'discover new tools in this category' path AI follows for buyers who don't know your name yet.",
    "Launch on Product Hunt if you haven't already. The launch itself is a spike, but the permanent page becomes a durable citation source.",
    "Add yourself to Slant.co for 'X vs Y' style comparison queries — these get pulled directly into AI comparison answers.",
    "Cross-link your directory listings from your own site's footer or 'trusted by' page. Directory backlinks reinforce entity recognition in AI knowledge graphs.",
  ],
  comparison_article: [
    "Write your own '[Your product] vs [top competitor]' page on your site with a fair, honest table. Buyers search this exact query; if you don't rank, someone else's take wins.",
    "Pitch author reach-outs on existing 'best [category]' 2026 articles that don't yet include you. Response rate ~15% — the ROI comes from the ones that do.",
    "Create a 'best [category] for [specific use case]' resource on your own domain. Even if you rank #3 for the query, being ON the page as an option is what AI reads.",
    "Sponsor or contribute to industry benchmark reports. Being a data source in a comparison piece is more durable than being a name in a listicle.",
    "Encourage happy customers to write comparison posts on their own blogs or Reddit — genuine third-party comparison content is the most AI-trusted signal.",
  ],
};

function buildHeadline(lane: AudienceLane, checks: MasterKeyCheck[]): string {
  const present = checks.filter((c) => c.found);
  const total = checks.length;

  if (present.length === 0) {
    return `${LANE_HEADLINE_ZERO[lane]} That's the biggest fix to start with.`;
  }
  if (present.length === total) {
    return `${LANE_HEADLINE_ALL[lane]} ${LANE_NEXT_STEP[lane]}`;
  }
  const missing = checks
    .filter((c) => !c.found)
    .map((c) => c.label)
    .join(', ');
  return `You're on ${present.length} of ${total}. Missing: ${missing}.`;
}

const LANE_HEADLINE_ZERO: Record<AudienceLane, string> = {
  local:
    "We couldn't find your business on any of the three profiles AI reads for local recommendations.",
  services:
    "We couldn't find your business on any of the three sources AI reads when it answers advice-driven queries.",
  product:
    "We couldn't find your product on any of the three directories AI reads when it answers comparison queries.",
};

const LANE_HEADLINE_ALL: Record<AudienceLane, string> = {
  local:
    "You're present on all three profiles AI reads for local recommendations.",
  services:
    "You're present on all three sources AI reads when it answers advice-driven queries.",
  product:
    "You're on all three directories AI reads when it answers product comparison queries.",
};

const LANE_NEXT_STEP: Record<AudienceLane, string> = {
  local:
    'The next work is making sure each one describes you accurately.',
  services:
    'The next work is making sure the picture is consistent across them.',
  product:
    'The next work is making sure your feature list, pricing, and use cases match across all three.',
};
