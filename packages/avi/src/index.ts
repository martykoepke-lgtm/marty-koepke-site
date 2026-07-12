/**
 * @practical-informatics/avi — public surface.
 *
 * Consumers (apps/site, apps/console) import from this entry only.
 * Internal modules import each other via relative paths.
 */

// V2 pipeline (paid AVI runs)
export { runAudit } from './orchestrator-v2';
export type { RunAuditOptions } from './orchestrator-v2';
export { loadSubject } from './subject-loader';
export { renderReport, renderComparison } from './render-v2';
export { persistAudit } from './persist-audit';
export type { PersistResult } from './persist-audit';
export { synthesize, synthesizeAudit } from './synthesize-v2';
export type { Synthesis } from './synthesize-v2';

// V3 free-scan (live, used by /scan route; legacy persistence underneath until V3 DB lands)
export { runFreeScan, tierFor } from './v3/free-scan';
export type { Tier } from './v3/free-scan';
export { checkMasterKeys } from './v3/master-keys';
export type {
  MasterKeyReport,
  MasterKeyCheck,
  MasterKeyId,
  MasterKeyConfidence,
} from './v3/master-keys';
export type { AudienceLane } from './types';
export { runAuditV3 } from './v3/orchestrator';
export type { RunAuditV3Options } from './v3/orchestrator';
export { persistAuditV3 } from './v3/persist';
export type { PersistV3Result } from './v3/persist';

// V1 crawler (legacy, used by /api/submissions and /ai-visibility/results)
export { runCrawler, normalizeUrl } from './v1/crawler';
export type { CrawlerFinding } from './v1/crawler';

// Infrastructure / shared
export { sendEmail } from './email';
export { kitSubscribe } from './kit';
export { renderFreeScanEmail } from './email-templates/free-scan-report';
export { verifyTurnstile } from './turnstile';
export { checkScanRateLimit } from './rate-limit';

// Supabase admin client (shared infra)
export { supabaseAdmin } from './supabase-client';
export type { SubmissionRow } from './supabase-client';

// V2 audit types — `Tier` renamed to `AuditTier` to avoid collision with free-scan Tier
export {
  AVI_RUBRIC_VERSION,
  ENGINES,
  DRIVERS,
  DIMENSION_WEIGHTS,
  tierFromComposite,
} from './types';
export {
  AVI_V3_RUBRIC_VERSION,
  V3_READINESS_DRIVER_DEFINITIONS,
  V3_OUTCOME_DEFINITIONS,
  v3TierFromIndex,
} from './v3/rubric';
export {
  v3ReadinessScore,
  v3VisibilityScore,
  v3BusinessAccuracyScore,
  v3PublicScores,
} from './v3/composite';
export {
  v3VisibilityOutcome,
  v3ClaimSupportScore,
  v3MeasuredOutcomes,
} from './v3/outcomes';
export { classifyClaimSupport, sourceSupportsClaim } from './v3/claim-verifier';
export { synthesizeV3 } from './v3/synthesizer';
export { recommendV3 } from './v3/recommender';
export { accuracyRecommendV3 } from './v3/accuracy-recommender';
export { selectV3Quotes } from './v3/quote-selector';
export { aggregateCompetitorVisibility } from './v3/competitor-visibility';
export { runCompetitorReadinessPass } from './v3/competitor-readiness';
export { getImprovements, listImprovementSources } from './v3/improvement-library';
export type {
  V3DimensionId,
  V3Improvement,
  V3ImprovementSource,
} from './v3/improvement-library';
export type {
  Engine,
  DimensionId,
  Tier as AuditTier,
  Band,
  QueryIntent,
  IntentSubtype,
  Platform,
  Subject,
  QueryTemplate,
  PreparedQuery,
  CrawlerEvidence,
  PlatformSearchResults,
  CorroborationEvidence,
  EvidencePackage,
  EngineResponse,
  ExtractorOutput,
  VisibilityOutcome,
  DriverScore,
  Recommendation,
  RecommenderOutput,
  CompositeResult,
  Audit,
  ApiCallLog,
  AuditError,
} from './types';
export type {
  V3ReadinessDriverId,
  V3OutcomeId,
  V3Tier,
  V3ClaimSupportLabel,
  V3SourceType,
  V3Band,
  V3EvidencePointer,
  V3ReadinessScore,
  V3VisibilityOutcome,
  V3Claim,
  V3SourceEvidence,
  V3ClaimVerification,
  V3MeasuredOutcomes,
  V3PublicScores,
  V3CompositeInput,
  V3FreeScanResult,
  V3Audit,
  V3Quadrant,
  V3Verdict,
  V3ClaimType,
  V3SelectedQuote,
  V3QuoteCategory,
  V3AccuracyFix,
  V3AccuracyRecommenderOutput,
  V3CompetitorVisibility,
  V3CompetitorVisibilityOutput,
  V3CompetitorReadinessRow,
} from './v3/types';
