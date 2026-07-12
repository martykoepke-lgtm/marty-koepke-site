/**
 * V3.1 improvement library — static, research-grounded "how to improve this"
 * tactics keyed by readiness driver id or measured outcome id.
 *
 * Deterministic and replayable. No LLM call. Same library powers the inline
 * advice on the report's detail tables AND the "what good looks like" copy on
 * the methodology page.
 *
 * Source citations are real URLs already cited on the public why-page; the
 * mapping from research-finding to driver/outcome is editorial.
 */

import type { V3OutcomeId, V3ReadinessDriverId } from './types';

export interface V3ImprovementSource {
  label: string;
  url: string;
}

export interface V3Improvement {
  tactic: string;
  rationale: string;
  source: V3ImprovementSource;
}

export type V3DimensionId = V3ReadinessDriverId | V3OutcomeId;

const SOURCES = {
  googleSearch: {
    label: 'Google Search Central — How Search Works',
    url: 'https://developers.google.com/search/docs/fundamentals/how-search-works',
  },
  googleAI: {
    label: 'Google Search Central — Optimizing for Generative AI',
    url: 'https://developers.google.com/search/docs/fundamentals/ai-optimization-guide',
  },
  ragSurvey: {
    label: 'Gao et al. — Retrieval-Augmented Generation Survey',
    url: 'https://arxiv.org/abs/2312.10997',
  },
  anthropic: {
    label: 'Anthropic — Contextual Retrieval',
    url: 'https://www.anthropic.com/engineering/contextual-retrieval',
  },
  surfer: {
    label: 'Surfer — How LLM Citations Work',
    url: 'https://surferseo.com/blog/llm-citations/',
  },
  profound: {
    label: 'Profound — AI Platform Citation Patterns',
    url: 'https://www.tryprofound.com/blog/ai-platform-citation-patterns',
  },
  searchEngineLand: {
    label: 'Search Engine Land — AI Citation Sources Study',
    url: 'https://searchengineland.com/ai-search-engines-cite-reddit-youtube-and-linkedin-most-study-473138',
  },
  towCenter: {
    label: 'Columbia Journalism Review / Tow Center — AI Citation Problem',
    url: 'https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php',
  },
} as const;

const LIBRARY: Record<V3DimensionId, V3Improvement[]> = {
  business_clarity: [
    {
      tactic:
        'Put the business name, category, and "who we\'re for" in one sentence at the top of the homepage.',
      rationale:
        'AI extractors weight the first 100 characters of a page heavily when identifying what a business is and who it serves. A buried positioning sentence often never gets picked up.',
      source: SOURCES.surfer,
    },
    {
      tactic:
        'Use the same name format consistently across your site, Google Business Profile, and the top three directories your category uses.',
      rationale:
        'Cross-source name divergence ("Highland Dental" vs "Highland Dental Group") makes AI uncertain whether claims belong to the same entity, and lowers the confidence of every downstream answer.',
      source: SOURCES.profound,
    },
    {
      tactic:
        'State your industry category in plain English on the homepage, in the words buyers actually use to search.',
      rationale:
        'AI matches query language to page language. Jargon-only descriptions miss the buyer-query match even when the underlying service is identical.',
      source: SOURCES.anthropic,
    },
  ],

  source_support: [
    {
      tactic:
        'Cite a primary source for every numerical or credential claim — year founded, patient count, certification, award.',
      rationale:
        'AI is dramatically more confident citing claims that have an attached, resolvable source URL. Unsupported numbers get labeled "unsupported" in claim verification.',
      source: SOURCES.towCenter,
    },
    {
      tactic:
        'Maintain a current Google Business Profile and at least one or two industry-specific directory listings.',
      rationale:
        'AI cross-references identity claims against directory entries to validate that the business exists and matches what the site says.',
      source: SOURCES.profound,
    },
    {
      tactic:
        'Earn one or two third-party mentions on the platforms AI actually cites — Wikipedia, Reddit, YouTube, LinkedIn, industry analyst sites.',
      rationale:
        'AI weights third-party corroboration well above self-published claims. The exact platforms vary by engine; one mention on the right one is worth more than many on the wrong ones.',
      source: SOURCES.searchEngineLand,
    },
  ],

  ai_readability: [
    {
      tactic:
        'Use semantic HTML structure — H1 for the page title, H2 for major sections, descriptive paragraph tags.',
      rationale:
        'AI extractors use structural cues (headings, lists, paragraphs) to identify what each passage is about. Unstructured walls of text don\'t parse cleanly.',
      source: SOURCES.googleSearch,
    },
    {
      tactic:
        'Add JSON-LD schema markup — LocalBusiness, Organization, Service, or whichever fits your category.',
      rationale:
        'Structured data gives AI deterministic facts without parsing prose. AI can pull your hours, location, services, and offerings directly from the schema block.',
      source: SOURCES.googleAI,
    },
    {
      tactic:
        'Use stable, canonical URLs without hash-based routing or session parameters.',
      rationale:
        'AI cites URLs verbatim. A URL that resolves to different content (or doesn\'t resolve at all) gets dropped from the answer or, worse, cites the wrong content.',
      source: SOURCES.surfer,
    },
  ],

  distinctive_point_of_view: [
    {
      tactic:
        'Name your method, framework, or signature approach with a proper noun — give it a memorable handle.',
      rationale:
        'AI extracts proper nouns more reliably than generic descriptions. "The Riverbend Comfort Protocol" survives a passage extraction; "our calm approach" usually doesn\'t.',
      source: SOURCES.anthropic,
    },
    {
      tactic:
        'Publish one concrete data point or insight unique to your work — a finding, a benchmark, a percentage, an unusual outcome.',
      rationale:
        'AI strongly prefers sources that add new information vs. echo the category consensus. Non-redundant content gets cited disproportionately.',
      source: SOURCES.surfer,
    },
    {
      tactic:
        'State one tradeoff honestly — what you optimize for, and what you don\'t.',
      rationale:
        'Tradeoff signals help AI discriminate between similar businesses. Without them, AI defaults to listing everyone equally; with them, AI can pick the right business for the right context.',
      source: SOURCES.ragSurvey,
    },
  ],

  recommendation_fit: [
    {
      tactic:
        'Write explicit "best-fit" and "not-fit" language on your services page.',
      rationale:
        'When AI\'s training material lacks fit signals, it defaults to category-generic recommendations. Stating "we\'re a fit for X, not the right call for Y" gives AI the conditions to recommend you correctly — and to NOT recommend you when it shouldn\'t.',
      source: SOURCES.anthropic,
    },
    {
      tactic:
        'Name the buying situation, not just the buyer.',
      rationale:
        '"For mid-market SaaS companies replacing an enterprise contract mid-renewal" recommends better than "for SaaS companies." AI weights specific scenarios above demographic profiles when ranking right-fit answers.',
      source: SOURCES.surfer,
    },
    {
      tactic:
        'Add a short "alternatives" section pointing wrong-fit buyers elsewhere.',
      rationale:
        'Telling AI "if you need X instead, here\'s who\'s better for that" trains it to send wrong-fit cases away from you — which raises the quality of the recommendations it does make in your favor.',
      source: SOURCES.profound,
    },
  ],

  visibility: [
    {
      tactic:
        'Be present on the platforms each engine actually cites — Wikipedia for ChatGPT, Reddit for Perplexity, YouTube and LinkedIn for Gemini and AI Overviews.',
      rationale:
        'Different AI engines source from different ecosystems. Presence on the wrong platform is functionally invisible for the engines your buyer is actually using.',
      source: SOURCES.profound,
    },
    {
      tactic:
        'Earn at least one citation on a source that ranks in AI\'s preferred surfaces, even if it doesn\'t rank in Google\'s top 10.',
      rationale:
        '67.82% of AI Overview citations come from sources that don\'t rank in Google\'s top 10. AI surfaces and Google surfaces are not the same.',
      source: SOURCES.surfer,
    },
    {
      tactic:
        'Maintain content freshness on at least one third-party platform AI re-indexes regularly.',
      rationale:
        'AI engines re-weight recently updated sources more heavily for time-sensitive queries. A profile that was current two years ago may be quietly dropping out of relevance.',
      source: SOURCES.searchEngineLand,
    },
  ],

  representation_accuracy: [
    {
      tactic:
        'Lead the homepage with the most current version of your basic facts — location, primary services, hours, audience.',
      rationale:
        'AI weights first-paragraph content most heavily for factual extraction. Outdated facts in the lede become the facts AI repeats.',
      source: SOURCES.surfer,
    },
    {
      tactic:
        'Audit and update or remove any old press release, profile, or directory listing that contradicts your current site.',
      rationale:
        'AI cites sources by recency × authority. An outdated press release on a high-authority site can override a current homepage if the site has more domain authority.',
      source: SOURCES.towCenter,
    },
    {
      tactic:
        'Use the same business name format everywhere — no informal abbreviations on one source and the full name on another.',
      rationale:
        'AI conflates similar-but-different names. Consistent format prevents the AI from accidentally cross-pollinating your claims with a similarly-named business.',
      source: SOURCES.profound,
    },
  ],

  claim_support: [
    {
      tactic:
        'Cite a primary source URL alongside every numerical claim — patient counts, years in business, certifications, awards.',
      rationale:
        'AI labels a claim "supported" only when it can find an independent source backing it. Numbers without sources get labeled "unsupported" or "ai_misrepresentation" — both hurt the score.',
      source: SOURCES.towCenter,
    },
    {
      tactic:
        'Avoid superlatives without numerical backing — "best in town" without a survey, "fastest" without timing data.',
      rationale:
        'Unsupported superlatives are the most common source of AI confidently saying something wrong. They\'re also the easiest to fix — either back them up or remove them.',
      source: SOURCES.towCenter,
    },
    {
      tactic:
        'Publish credentials with verifiable dates — "board certified since 2018," "ASA member 2019-present."',
      rationale:
        'AI cross-references credential claims against industry registries. Dates anchor the claim to a verifiable timeframe and make the cross-check possible.',
      source: SOURCES.anthropic,
    },
  ],

  context_preservation: [
    {
      tactic:
        'Pair every claim with the context that makes it accurate — audience, region, timeframe, qualifying condition.',
      rationale:
        'AI loses meaning when it extracts a claim without its qualifying context. "Revenue grew 3%" is useless without which company, which year. The same applies to every claim on your site.',
      source: SOURCES.anthropic,
    },
    {
      tactic:
        'Avoid generic category language; use the specific words your buyers use.',
      rationale:
        'Generic phrasing gets blurred into competitor descriptions during retrieval. Specific phrasing preserves what makes you distinct in the AI\'s answer.',
      source: SOURCES.surfer,
    },
    {
      tactic:
        'Repeat your core differentiator near every major claim, not just on the homepage.',
      rationale:
        'AI may extract a passage from a deep page that doesn\'t reach back to your homepage context. Per-page reinforcement reduces the chance the meaning gets stripped.',
      source: SOURCES.anthropic,
    },
  ],

  recommendation_quality: [
    {
      tactic:
        'State explicitly who your service IS for and ISN\'T for.',
      rationale:
        'AI\'s "recommendation quality" score degrades when it has no signal for when you\'re a poor fit. Positive AND negative signals both inform retrieval ranking.',
      source: SOURCES.ragSurvey,
    },
    {
      tactic:
        'Add case studies or examples that show outcomes for specific buyer types in specific situations.',
      rationale:
        'AI matches buyer-context to past-customer-context when deciding fit. Generic testimonials don\'t carry that signal; situation-specific case material does.',
      source: SOURCES.profound,
    },
    {
      tactic:
        'Avoid making claims you can\'t substantiate. AI\'s recommendation quality penalizes overclaiming even when the claim is technically accurate.',
      rationale:
        'AI search systems are calibrated to penalize overconfidence. A modest claim with evidence wins over a bold claim without evidence, in the AI\'s scoring of recommendation usefulness.',
      source: SOURCES.towCenter,
    },
  ],

  stability: [
    {
      tactic:
        'Build presence on multiple platforms, not one — Google Business + LinkedIn + an industry directory at minimum.',
      rationale:
        'Single-source presence drops to zero visibility the day that platform changes its ranking or your listing gets bumped. Multi-source presence stays stable through engine drift.',
      source: SOURCES.searchEngineLand,
    },
    {
      tactic:
        'Maintain content freshness on every owned property, not just the homepage.',
      rationale:
        'AI engines rotate which sources they emphasize. Freshness on one platform doesn\'t guarantee stability across the engines and queries your buyers actually use.',
      source: SOURCES.profound,
    },
    {
      tactic:
        'Track which queries surface you consistently vs. flakily; reinforce the content underlying the flakiest ones.',
      rationale:
        'AI repeats stable patterns. Finding which queries are inconsistent identifies the structural gaps to fix — usually a missing piece of supporting evidence or a context the AI can\'t reliably reach.',
      source: SOURCES.ragSurvey,
    },
  ],
};

export function getImprovements(dimensionId: V3DimensionId): V3Improvement[] {
  return LIBRARY[dimensionId] ?? [];
}

export function listImprovementSources(): V3ImprovementSource[] {
  return Object.values(SOURCES);
}
