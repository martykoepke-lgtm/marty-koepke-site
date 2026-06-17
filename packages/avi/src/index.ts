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

// V1 free-scan (live, used by /scan route)
export { runFreeScan, tierFor } from './free-scan';
export type { Tier } from './free-scan';

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
