/**
 * AVI V3 types.
 *
 * V3 positioning:
 * - AI Visibility is the market doorway.
 * - AI Business Accuracy is the operating framework.
 * - Promise: We help AI get your business right.
 *
 * Agent strategy:
 * LLM-bearing roles must remain narrow, evidence-bound, JSON-only, and
 * replayable. Pure-code scoring lives here and in sibling V3 modules.
 */

import type {
  AuditError,
  CorroborationEvidence,
  CrawlerEvidence,
  Engine,
  EngineResponse,
  EvidencePackage,
  ExtractorOutput,
  PreparedQuery,
  Subject,
} from '../types';
import type { CrawlerOutput } from '../v1/crawler';
import type { CorroborationOutput } from '../v1/corroboration';

export const AVI_V3_RUBRIC_VERSION = 'v3.1';

export type V3ReadinessDriverId =
  | 'business_clarity'
  | 'source_support'
  | 'ai_readability'
  | 'distinctive_point_of_view'
  | 'recommendation_fit';

export const V3_READINESS_DRIVERS: V3ReadinessDriverId[] = [
  'business_clarity',
  'source_support',
  'ai_readability',
  'distinctive_point_of_view',
  'recommendation_fit',
];

export type V3OutcomeId =
  | 'visibility'
  | 'representation_accuracy'
  | 'claim_support'
  | 'context_preservation'
  | 'recommendation_quality'
  | 'stability';

export const V3_OUTCOMES: V3OutcomeId[] = [
  'visibility',
  'representation_accuracy',
  'claim_support',
  'context_preservation',
  'recommendation_quality',
  'stability',
];

export type V3Tier =
  | 'Invisible'
  | 'Overlooked'
  | 'Emerging'
  | 'Discoverable'
  | 'Agent-Ready';

export type V3ClaimSupportLabel =
  | 'supported_by_owned_source'
  | 'supported_by_independent_source'
  | 'supported_by_multiple_sources'
  | 'ai_misrepresentation'
  | 'unsupported'
  | 'contradicted'
  | 'stale'
  | 'ambiguous'
  | 'not_verifiable';

export type V3SourceType =
  | 'owned_site'
  | 'google_business_profile'
  | 'directory'
  | 'review'
  | 'article'
  | 'profile'
  | 'podcast'
  | 'social'
  | 'official_registry'
  | 'other';

export type V3Band = 0 | 1 | 2 | 3 | 4 | 5 | 'insufficient_evidence';

export interface V3EvidencePointer {
  type: string;
  value: string;
  source: string;
  supports_score: boolean;
}

export interface V3ReadinessScore {
  driver_id: V3ReadinessDriverId;
  driver_name: string;
  band: V3Band;
  score: number | null;
  justification: string;
  evidence_pointers: V3EvidencePointer[];
  rubric_version: string;
}

export interface V3VisibilityOutcome {
  presence: number;
  citation: number;
  share_of_voice: number;
  prominence: number;
  composite: number;
}

export interface V3Claim {
  id: string;
  audit_id?: string;
  engine_response_id?: string;
  claim_text: string;
  claim_type:
    | 'identity'
    | 'category'
    | 'service'
    | 'location'
    | 'audience'
    | 'credential'
    | 'pricing'
    | 'comparison'
    | 'recommendation'
    | 'other';
  subject_name?: string;
  source_response_excerpt?: string;
  confidence?: number;
}

export interface V3SourceEvidence {
  url: string;
  source_type: V3SourceType;
  fetched_at?: string;
  fetch_status?: number;
  title?: string;
  excerpt?: string;
  mentions_subject?: boolean;
  content_hash?: string;
}

export interface V3ClaimVerification {
  claim_id: string;
  label: V3ClaimSupportLabel;
  source_url?: string;
  source_type?: V3SourceType;
  evidence_quote?: string;
  rationale: string;
  verifier: 'code' | 'llm' | 'human';
  verified_at: string;
}

export interface V3MeasuredOutcomes {
  visibility: number;
  representation_accuracy: number;
  claim_support: number;
  context_preservation: number;
  recommendation_quality: number;
  stability: number;
}

export interface V3PublicScores {
  ai_visibility_score: number;
  ai_readiness_score: number;
  ai_business_accuracy_score: number;
  ai_business_accuracy_index: number;
  tier: V3Tier;
}

export type V3Quadrant = 'invisible' | 'fragile' | 'undiscovered' | 'compounding';

export interface V3Verdict {
  quadrant: V3Quadrant;
  verdict_sentence: string;
  fix_this_first: string;
  rubric_version: string;
  generated_at: string;
  synthesizer_model: string;
}

export type V3ClaimType = V3Claim['claim_type'];

export interface V3CompetitorReadinessRow {
  canonical_name: string;
  url: string;
  readiness_score: number | null;
  driver_scores: V3ReadinessScore[];
  crawled_at: string | null;
  errors: AuditError[];
}

export interface V3CompetitorVisibility {
  display_name: string;
  raw_names_observed: string[];
  mention_count: number;
  first_named_count: number;
  coverage: number;
  engines_seen: string[];
}

export interface V3CompetitorVisibilityOutput {
  total_responses: number;
  subject_named_count: number;
  subject_first_named_count: number;
  competitors: V3CompetitorVisibility[];
}

export type V3QuoteCategory = 'missed' | 'named_with_issues' | 'named_cleanly';

export interface V3SelectedQuote {
  category: V3QuoteCategory;
  template_id: string;
  engine: string;
  query: string;
  response_excerpt: string;
  annotation: string;
  evidence: {
    mentioned: boolean;
    position: 'top' | 'middle' | 'late' | 'not_named';
    sentiment: 'positive' | 'neutral' | 'negative' | 'missing';
    competitors_mentioned: string[];
  };
}

export interface V3AccuracyFix {
  rank: 1 | 2 | 3;
  claim_type: V3ClaimType;
  dominant_failure: V3ClaimSupportLabel;
  affected_claim_count: number;
  gap: string;
  tactic: string;
  framed_as: string;
}

export interface V3AccuracyRecommenderOutput {
  fixes: V3AccuracyFix[];
  rubric_version: string;
}

export interface V3CompositeInput {
  readiness_scores: V3ReadinessScore[];
  outcomes?: Partial<V3MeasuredOutcomes>;
}

export interface V3FreeScanResult {
  ok: true;
  submissionId: string;
  auditId: string;
  accessToken: string;
  url: string;
  subjectName: string;
  subjectType: 'personal_brand' | 'company';
  readinessScore: number;
  tier: 'invisible' | 'hidden' | 'faintly-visible' | 'discoverable' | 'agent-ready';
  dimensions: Array<{
    id: V3ReadinessDriverId;
    name: string;
    score: number | null;
  }>;
  findings: Array<{
    dimensionId: V3ReadinessDriverId;
    dimensionName: string;
    score: number | null;
    summary: string;
  }>;
  crawler: CrawlerOutput;
  corroboration: CorroborationOutput;
  crawlerReachable: boolean;
  durationMs: number;
}

export interface V3Audit {
  audit_id: string;
  rubric_version: string;
  created_at: string;
  subject: Subject;
  mode: 'free' | 'audit' | 'monitoring';
  protocol: {
    query_grid: PreparedQuery[];
    engines: Engine[];
    reps_per_pair: number;
    total_calls: number;
  };
  evidence_package: EvidencePackage;
  crawler?: CrawlerEvidence;
  corroboration?: CorroborationEvidence;
  engine_responses: EngineResponse[];
  extracted: ExtractorOutput[];
  readiness_scores: V3ReadinessScore[];
  visibility_outcome?: V3VisibilityOutcome;
  claims: V3Claim[];
  source_evidence: V3SourceEvidence[];
  claim_verifications: V3ClaimVerification[];
  outcomes?: V3MeasuredOutcomes;
  public_scores: V3PublicScores;
  verdict?: V3Verdict;
  accuracy_recommendations?: V3AccuracyRecommenderOutput;
  representative_quotes?: V3SelectedQuote[];
  competitor_visibility?: V3CompetitorVisibilityOutput;
  competitor_readiness?: V3CompetitorReadinessRow[];
  errors: AuditError[];
}
