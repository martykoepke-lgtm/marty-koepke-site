/**
 * AVI types — single source of truth for shapes flowing through the pipeline.
 *
 * Canon authority: AVI_OPERATING_STANDARD.md, public/AI-Visibility-Index-Rubric-and-Protocol.md.
 * When this file disagrees with canon, canon wins.
 */

export const AVI_RUBRIC_VERSION = 'v0.2';

export type Engine = 'chatgpt' | 'claude' | 'perplexity' | 'gemini';
export const ENGINES: Engine[] = ['chatgpt', 'claude', 'perplexity', 'gemini'];

export type DimensionId = 'D1' | 'D2' | 'D3' | 'D4' | 'D6';
export const DRIVERS: DimensionId[] = ['D1', 'D2', 'D3', 'D4', 'D6'];

export const DIMENSION_WEIGHTS: Record<DimensionId, number> = {
  D1: 0.15,
  D2: 0.25,
  D3: 0.15,
  D4: 0.30,
  D6: 0.15,
};

export type Tier =
  | 'Invisible'
  | 'Overlooked'
  | 'Emerging'
  | 'Discoverable'
  | 'Agent-Ready';

export type Band = 0 | 1 | 2 | 3 | 4 | 5 | 'insufficient_evidence';

export type QueryIntent = 'informational' | 'transactional' | 'navigational';

/**
 * Subcategory of informational intent per Alexander et al. (ORCAS-I, 2022).
 * Transactional and navigational queries do not use this field.
 */
export type IntentSubtype = 'factual' | 'instrumental' | 'exploratory';

export type Platform =
  | 'reddit'
  | 'linkedin'
  | 'youtube'
  | 'wikipedia'
  | 'quora'
  | 'yelp'
  | 'g2'
  | 'gartner';

/** Subject — the thing being audited. */
export interface Subject {
  canonical_name: string;
  aliases: string[];
  industry: string;            // buyer-language category, e.g., "AI visibility consulting"
  subject_type: 'company' | 'personal_brand';
  url: string;
  location?: string;
  buyer_type?: string;
  problem?: string;
  competitors?: { canonical_name: string; aliases: string[] }[];
  /**
   * Known differentiation terms supplied with the subject — proprietary methodology names,
   * signature framework names, distinctive vocabulary. Used ONLY for the Extractor's
   * `differentiation_named` scent check (literal string match). Optional. If absent, the
   * scent field defaults to false.
   */
  known_differentiation_terms?: string[];
  /**
   * V3 AI Business Accuracy intake.
   *
   * These fields define the business accuracy boundary: when AI should
   * recommend the subject, when it should not, what claims are approved or
   * prohibited, and which sources should be treated as high-priority evidence.
   */
  right_fit_situations?: string[];
  wrong_fit_situations?: string[];
  approved_claims?: string[];
  prohibited_claims?: string[];
  trusted_source_urls?: string[];
  distinctive_point_of_view?: string;
  proof_points?: string[];
}

/** Query template loaded from /queries/*.md */
export interface QueryTemplate {
  id: string;
  query: string;               // with placeholders
  intent: QueryIntent;
  intent_subtype?: IntentSubtype;   // only set for informational
  scope: 'universal' | string; // 'universal' or a category key
  tests: string;
  expected_response_type: string;
}

/** A query after placeholder substitution. */
export interface PreparedQuery {
  template_id: string;
  query: string;
  intent: QueryIntent;
  intent_subtype?: IntentSubtype;
}

/** Crawler output — what the Crawler service writes to the evidence package. */
export interface CrawlerEvidence {
  url: string;
  fetched_at: string;
  status: number;
  title: string;
  meta_description: string;
  h1: string[];
  schema_blocks: any[];        // JSON-LD blocks
  same_as_links: string[];
  has_faq_schema: boolean;
  has_person_schema: boolean;
  has_organization_schema: boolean;
  raw_text_sample: string;     // first ~2000 chars of body, normalized
  word_count: number;
  keyword_stuffing_detected: boolean;
  differentiation_above_fold: boolean;

  /**
   * Metadata-scent fields (per Pirolli & Card 1999, Alexander et al. 2022).
   * All deterministic from the fetched HTML — no LLM involvement.
   * Used by the Driver Judge for the D3 metadata-scent sub-criterion.
   */
  meta_description_chars: number;          // length of <meta name="description">
  meta_description_has_action_verb: boolean; // contains a verb from the canonical action-verb list
  meta_description_names_category: boolean;  // contains subject.industry string or near-paraphrase
  og_description_present: boolean;          // <meta property="og:description"> present and non-empty
  title_has_descriptor: boolean;             // <title> contains content beyond just the canonical name
}

/** Corroborator output — one platform's results. */
export interface PlatformSearchResults {
  platform: Platform | 'general';
  results: { title: string; url: string; snippet: string }[];
}

export interface CorroborationEvidence {
  general_search: { title: string; url: string; snippet: string }[];
  platform_filtered: PlatformSearchResults[];
}

/** Full evidence package fed to Driver Judge. */
export interface EvidencePackage {
  crawler: CrawlerEvidence;
  corroboration: CorroborationEvidence;
  visibility_observations?: {
    engine_responses: { engine: Engine; cited_platforms: Platform[] }[];
  };
}

/** One engine response captured by the Query Runner. */
export interface EngineResponse {
  template_id: string;
  query: string;
  engine: Engine;
  raw_response: string;
  captured_at: string;
  error?: string;              // present if engine call failed
}

/** Extractor output — the structured parse of one engine response. */
export interface ExtractorOutput {
  template_id: string;
  engine: Engine;
  query: string;
  mentioned: boolean;
  cited_with_link: boolean;
  cited_urls: string[];        // unverified
  cited_urls_verified: string[]; // populated AFTER post-extractor verification
  position: 'top' | 'middle' | 'late' | 'not_named';
  competitors_mentioned: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'missing';
  evidence_pointers: {
    type: string;
    value: string;
    char_start: number;
    char_end: number;
  }[];

  /**
   * Snippet / information-scent fields (per Pirolli & Card 1999, Alexander et al. 2022).
   * All OBSERVABLE checks against the response text + supplied metadata.
   * No "richness" judgment — see EXTRACTOR.md for verbatim rules.
   */
  scent: {
    subject_in_opening: boolean;       // subject mention within first 100 chars of response
    description_present: boolean;      // an action verb (from canonical list) appears within 200 chars after the subject mention
    description_word_count: number;    // words between subject mention and next subject/competitor mention or end of sentence
    category_named: boolean;           // supplied subject.industry string appears in the description window
    differentiation_named: boolean;    // any supplied known_differentiation_term appears in the description window
  } | null;                            // null if mentioned: false
}

/** Aggregator output — the four Visibility sub-metrics. */
export interface VisibilityOutcome {
  presence: number;
  citation: number;
  share_of_voice: number;
  prominence: number;
  composite: number;           // weighted blend, 0–1
}

/** Driver Judge output — one scored dimension. */
export interface DriverScore {
  dimension_id: DimensionId;
  band: Band;
  justification: string;
  evidence_pointers: {
    type: string;
    value: string;
    source: string;
    supports_band: boolean;
  }[];
  sub_score_observations: { name: string; observation: string }[];
  rubric_version: string;
}

/** Recommender output. */
export interface Recommendation {
  rank: number;
  dimension_id: DimensionId;
  gap: string;
  evidence_pointer: string;
  tactic: string;
  framed_as: string;
  impact_estimate: 'high' | 'medium' | 'lower-but-do-it';
  rationale: string;
}

export interface RecommenderOutput {
  differentiation_candidates_observed: {
    name: string;
    description: string;
    evidence_source: string;
  }[];
  differentiation_candidates_suggested: {
    question: string;
    rationale: string;
  }[];
  fixes: Recommendation[];
  rank_aware_note?: string;
  rubric_version: string;
}

/** Composite scoring result. */
export interface CompositeResult {
  readiness: number;           // 0–100
  visibility?: number;         // 0–100, paid only
  composite: number;           // 0–100
  tier: Tier;
}

/** Synthesis — plain-English narrative summary written after scoring. */
export interface Synthesis {
  headline: string;
  body: string;
  rubric_version: string;
  generated_at: string;
  synthesizer_model: string;
}

/** Full audit record — persisted as JSON, rendered as HTML. */
export interface Audit {
  audit_id: string;
  rubric_version: string;
  created_at: string;
  subject: Subject;
  mode: 'free' | 'paid';
  protocol: {
    query_grid: PreparedQuery[];
    engines: Engine[];
    reps_per_pair: number;
    total_calls: number;
    query_mix: { informational: number; transactional: number; navigational: number };
  };
  evidence_package: EvidencePackage;
  engine_responses: EngineResponse[];          // paid only
  extracted: ExtractorOutput[];                // paid only
  visibility_outcome?: VisibilityOutcome;      // paid only
  driver_scores: DriverScore[];
  recommendations: RecommenderOutput;
  synthesis?: Synthesis;
  composite: CompositeResult;
  api_calls_log: ApiCallLog[];
  errors: AuditError[];
}

export interface ApiCallLog {
  timestamp: string;
  provider: string;
  endpoint: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd_estimate?: number;
  status: 'ok' | 'error';
  latency_ms: number;
  related_to: string;          // which audit step
}

export interface AuditError {
  step: string;
  message: string;
  fatal: boolean;
}

/** Tier band cutoffs (composite is 0–100). */
export function tierFromComposite(composite: number): Tier {
  if (composite < 20) return 'Invisible';
  if (composite < 40) return 'Overlooked';
  if (composite < 60) return 'Emerging';
  if (composite < 80) return 'Discoverable';
  return 'Agent-Ready';
}
