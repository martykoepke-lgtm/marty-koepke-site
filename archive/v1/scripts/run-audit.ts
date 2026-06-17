/**
 * AVI Index Report — CLI orchestrator.
 *
 * Usage:
 *   npm run audit -- subjects/practicalinformatics.json
 *
 * Wires the seven services together end to end. Per D005 this is the
 * primary entry point for the AVI tool: Marty (or any operator) runs it
 * against real subjects, reads the JSON output, evaluates whether the
 * rubric produces defensible findings.
 *
 * Sequence:
 *   1. Read + validate the subject JSON
 *   2. Upsert a submissions row, create an audits row
 *   3. Run Crawler + Corroboration in parallel
 *   4. Run QueryGrid (10 × 4 × 2 = 80 cells; persists rows)
 *   5. Run Extraction (one cheap LLM call per response; updates rows in place)
 *   6. Run Aggregation (pure math; computes Visibility; writes audits row)
 *   7. Run Scoring (7 LLM-as-judge calls; persists dim rows; writes audits row)
 *   8. Compute Composite + Tier, sum total spend, write final audits row
 *   9. Emit reports/<audit_id>.json
 *
 * Read AVI_INDEX_REPORT.md for the full design.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env.local the same way `next dev` does, before anything imports
// process.env. Without this, tsx-only scripts can't find SUPABASE_URL etc.
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { supabaseAdmin } from "@/lib/supabase";
import { runCrawler, normalizeUrl } from "@/lib/avi/crawler";
import { runCorroboration } from "@/lib/avi/corroboration";
import {
  runQueryGrid,
  type QueryGridSubject,
} from "@/lib/avi/query";
import { runExtraction } from "@/lib/avi/extraction";
import { runAggregation } from "@/lib/avi/aggregation";
import { runScoring, type SubjectType } from "@/lib/avi/scoring";

// ============================================================================
// Constants
// ============================================================================

const RUBRIC_VERSION = "v2.0";
const COMPOSITE_WEIGHTS = { readiness: 0.4, visibility: 0.6 };

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ============================================================================
// Subject input
// ============================================================================

type SubjectInput = {
  name: string;
  industry: string;
  subject_type: SubjectType;
  url?: string | null;
  location?: string | null;
  competitor_urls?: string[];
  target_query?: string | null;

  // Optional QueryGrid slot fills — see AVI_INDEX_REPORT.md §4.3.
  buyer_descriptor?: string | null;
  pain_point?: string | null;
  scenario?: string | null;
  distinctive_term?: string | null;
};

function readSubject(path: string): SubjectInput {
  const abs = isAbsolute(path) ? path : resolve(PROJECT_ROOT, path);
  if (!existsSync(abs)) {
    throw new Error(`Subject file not found: ${abs}`);
  }
  const raw = readFileSync(abs, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Subject file is not valid JSON: ${(e as Error).message}`
    );
  }
  return validateSubject(parsed);
}

function validateSubject(s: unknown): SubjectInput {
  if (typeof s !== "object" || s === null) {
    throw new Error("Subject must be a JSON object.");
  }
  const o = s as Record<string, unknown>;

  if (typeof o.name !== "string" || !o.name.trim()) {
    throw new Error('Subject "name" is required.');
  }
  if (typeof o.industry !== "string" || !o.industry.trim()) {
    throw new Error('Subject "industry" is required.');
  }
  if (
    typeof o.subject_type !== "string" ||
    (o.subject_type !== "personal_brand" && o.subject_type !== "company")
  ) {
    throw new Error(
      'Subject "subject_type" must be either "personal_brand" or "company".'
    );
  }

  const competitorUrls = Array.isArray(o.competitor_urls)
    ? o.competitor_urls.filter((s): s is string => typeof s === "string")
    : undefined;

  return {
    name: o.name.trim(),
    industry: o.industry.trim(),
    subject_type: o.subject_type,
    url: typeof o.url === "string" ? o.url.trim() : null,
    location: typeof o.location === "string" ? o.location.trim() : null,
    competitor_urls: competitorUrls,
    target_query:
      typeof o.target_query === "string" ? o.target_query.trim() : null,
    buyer_descriptor:
      typeof o.buyer_descriptor === "string"
        ? o.buyer_descriptor.trim()
        : null,
    pain_point:
      typeof o.pain_point === "string" ? o.pain_point.trim() : null,
    scenario:
      typeof o.scenario === "string" ? o.scenario.trim() : null,
    distinctive_term:
      typeof o.distinctive_term === "string"
        ? o.distinctive_term.trim()
        : null,
  };
}

// ============================================================================
// DB helpers
// ============================================================================

async function upsertSubmission(subject: SubjectInput): Promise<string> {
  const supabase = supabaseAdmin();
  const normalizedUrl = subject.url ? normalizeUrl(subject.url) : null;

  // Find an existing submission for this (name, url) so re-running the same
  // subject doesn't accumulate duplicate rows.
  let query = supabase.from("submissions").select("id");
  if (normalizedUrl) {
    query = query.eq("url", normalizedUrl);
  } else {
    query = query.is("url", null);
  }
  const { data: existing, error: findErr } = await query.eq(
    "company_name",
    subject.name
  );
  if (findErr) {
    throw new Error(`Failed to find submission: ${findErr.message}`);
  }
  if (existing && existing.length > 0) {
    return existing[0].id as string;
  }

  // No existing submission → insert one. Email is required by the schema —
  // for tool-driven audits we stamp the operator's address from
  // ALERT_TO_ADDRESS (already in .env.local).
  const operatorEmail =
    process.env.ALERT_TO_ADDRESS ?? "operator@local";

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      url: normalizedUrl,
      email: operatorEmail,
      first_name: "Operator",
      last_name: "(CLI)",
      company_name: subject.name,
      industry: subject.industry,
      location: subject.location,
      competitor_urls: subject.competitor_urls?.length
        ? subject.competitor_urls.map(normalizeUrl)
        : null,
      find_competitors_for_me: false,
      target_query: subject.target_query,
      subject_type: subject.subject_type,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to insert submission: ${error?.message ?? "(no data)"}`
    );
  }
  return data.id as string;
}

async function createAudit(
  submissionId: string,
  subject: SubjectInput
): Promise<string> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("audits")
    .insert({
      submission_id: submissionId,
      rubric_version: RUBRIC_VERSION,
      subject_type: subject.subject_type,
      review_status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to insert audit: ${error?.message ?? "(no data)"}`
    );
  }
  return data.id as string;
}

async function sumApiSpend(submissionId: string): Promise<number> {
  const { data, error } = await supabaseAdmin()
    .from("api_calls")
    .select("cost_estimated_usd")
    .eq("submission_id", submissionId);
  if (error) return 0;
  return (data ?? []).reduce(
    (sum, r) => sum + ((r.cost_estimated_usd as number | null) ?? 0),
    0
  );
}

// ============================================================================
// Composite + tier
// ============================================================================

function tierFor(score: number): string {
  if (score < 0.2) return "Invisible";
  if (score < 0.4) return "Hidden";
  if (score < 0.6) return "Faintly Visible";
  if (score < 0.8) return "Discoverable";
  return "Agent-Ready";
}

// ============================================================================
// Subject → QueryGridSubject mapping
// ============================================================================

function asGridSubject(s: SubjectInput): QueryGridSubject {
  return {
    name: s.name,
    industry: s.industry,
    subject_type: s.subject_type,
    url: s.url ?? null,
    location: s.location ?? null,
    competitor_urls: s.competitor_urls ?? null,
    target_query: s.target_query ?? null,
    buyer_descriptor: s.buyer_descriptor ?? null,
    pain_point: s.pain_point ?? null,
    scenario: s.scenario ?? null,
    distinctive_term: s.distinctive_term ?? null,
  };
}

// ============================================================================
// Report writer
// ============================================================================

type ReportPayload = {
  audit_id: string;
  rubric_version: string;
  subject: SubjectInput;
  scores: {
    composite: number | null;
    readiness: number | null;
    visibility: number | null;
    tier: string | null;
  };
  visibility_breakdown: unknown;
  dimension_scores: unknown;
  query_responses: unknown;
  crawler: unknown;
  corroboration: unknown;
  total_spend_usd: number;
};

async function emitReport(
  auditId: string,
  subject: SubjectInput,
  composite: number | null,
  readiness: number | null,
  visibility: number | null,
  tier: string | null,
  visibilityBreakdown: unknown,
  totalSpendUsd: number,
  crawler: unknown,
  corroboration: unknown
): Promise<string> {
  const supabase = supabaseAdmin();

  const [dimRowsRes, queryRowsRes] = await Promise.all([
    supabase
      .from("audit_dimension_scores")
      .select("dimension_id, dimension_name, score, justification, evidence_pointers")
      .eq("audit_id", auditId),
    supabase
      .from("audit_query_responses")
      .select(
        "query_id, query_category, query_text, engine, rep_index, response_text, mentioned, cited_with_link, position_band, competitors_mentioned, evidence_text, status"
      )
      .eq("audit_id", auditId),
  ]);

  const payload: ReportPayload = {
    audit_id: auditId,
    rubric_version: RUBRIC_VERSION,
    subject,
    scores: {
      composite,
      readiness,
      visibility,
      tier,
    },
    visibility_breakdown: visibilityBreakdown,
    dimension_scores: dimRowsRes.data ?? [],
    query_responses: queryRowsRes.data ?? [],
    crawler,
    corroboration,
    total_spend_usd: round6(totalSpendUsd),
  };

  const reportsDir = resolve(PROJECT_ROOT, "reports");
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const outPath = join(reportsDir, `${auditId}.json`);
  writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
  return outPath;
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error(
      "Usage: npm run audit -- <path-to-subject.json>"
    );
    process.exit(1);
  }

  console.log(`[audit] reading subject from ${inputPath}`);
  const subject = readSubject(inputPath);

  console.log(`[audit] subject: ${subject.name} (${subject.subject_type})`);

  // ---- Database setup ----
  const submissionId = await upsertSubmission(subject);
  const auditId = await createAudit(submissionId, subject);
  console.log(`[audit] submission_id=${submissionId} audit_id=${auditId}`);

  // ---- Crawler + Corroboration in parallel ----
  console.log(`[audit] Crawler + Corroboration starting...`);
  const [crawlerOut, corroborationOut] = await Promise.all([
    subject.url
      ? runCrawler(subject.url)
      : Promise.resolve(null),
    runCorroboration(
      { name: subject.name, industry: subject.industry },
      { submissionId, ip: null }
    ),
  ]);
  console.log(
    `[audit]   Crawler ${
      subject.url ? (crawlerOut?.reachable ? "ok" : "unreachable") : "skipped (no url)"
    }, Corroboration domains=${corroborationOut.totalCorroboratingDomains}${
      corroborationOut.degraded ? " (DEGRADED)" : ""
    }`
  );

  // Stash crawler + corroboration to audits.crawler_output and a temporary
  // jsonb spot. corroboration goes into scoring_output until aggregation runs.
  await supabaseAdmin()
    .from("audits")
    .update({
      crawler_output: crawlerOut ?? null,
      scoring_output: { corroboration: corroborationOut },
    })
    .eq("id", auditId);

  // ---- QueryGrid ----
  console.log(`[audit] QueryGrid running (10 × 4 × 2 = 80 cells)...`);
  const gridResult = await runQueryGrid(
    asGridSubject(subject),
    { auditId, submissionId, ip: null }
  );
  console.log(
    `[audit]   QueryGrid: ${gridResult.successCount}/${gridResult.totalCells} ok, ${gridResult.errorCount} errors, $${gridResult.totalCostUsd.toFixed(3)} in ${(gridResult.totalDurationMs / 1000).toFixed(1)}s`
  );

  // ---- Extraction ----
  console.log(`[audit] Extraction running...`);
  const extractionResult = await runExtraction(
    {
      subjectName: subject.name,
      subjectUrl: subject.url ?? null,
      competitorUrls: subject.competitor_urls ?? null,
    },
    { auditId, submissionId, ip: null }
  );
  console.log(
    `[audit]   Extraction: ${extractionResult.rowsUpdated} updated / ${extractionResult.rowsProcessed} processed (${extractionResult.rowsFailed} failed), $${extractionResult.totalCostUsd.toFixed(3)}`
  );

  // ---- Aggregation ----
  console.log(`[audit] Aggregation running...`);
  const aggregationResult = await runAggregation({ auditId });
  console.log(
    `[audit]   Visibility: ${aggregationResult.visibility.toFixed(3)} (P=${aggregationResult.presence.toFixed(2)} C=${aggregationResult.citation.toFixed(2)} SoV=${aggregationResult.shareOfVoice.toFixed(2)} Prom=${aggregationResult.prominence.toFixed(2)})`
  );

  // ---- Scoring ----
  console.log(`[audit] Scoring 7 dimensions...`);
  const scoringResult = await runScoring(
    {
      subjectName: subject.name,
      subjectUrl: subject.url ?? null,
      subjectType: subject.subject_type,
      crawler: crawlerOut ?? undefined,
      corroboration: corroborationOut,
      visibility: {
        presence: aggregationResult.presence,
        citation: aggregationResult.citation,
        shareOfVoice: aggregationResult.shareOfVoice,
        prominence: aggregationResult.prominence,
      },
    },
    { auditId, submissionId, ip: null, rubricVersion: RUBRIC_VERSION }
  );
  console.log(
    `[audit]   Readiness: ${scoringResult.readinessScore?.toFixed(3) ?? "(null)"} (${scoringResult.dimensionsScored}/7 scored, ${scoringResult.dimensionsFailed} failed), $${scoringResult.totalCostUsd.toFixed(3)}`
  );

  // ---- Composite + tier + spend ----
  let composite: number | null = null;
  if (scoringResult.readinessScore !== null) {
    composite =
      COMPOSITE_WEIGHTS.readiness * scoringResult.readinessScore +
      COMPOSITE_WEIGHTS.visibility * aggregationResult.visibility;
    composite = round3(composite);
  }
  const tier = composite === null ? null : tierFor(composite);
  const totalSpend = await sumApiSpend(submissionId);

  await supabaseAdmin()
    .from("audits")
    .update({
      composite_score: composite,
      tier,
      total_score: composite === null ? null : Math.round(composite * 100),
      total_spend_usd: round6(totalSpend),
    })
    .eq("id", auditId);

  console.log(
    `[audit] COMPOSITE: ${composite?.toFixed(3) ?? "(null)"} → ${tier ?? "(no tier)"} | spend: $${totalSpend.toFixed(3)}`
  );

  // ---- Emit JSON report ----
  const reportPath = await emitReport(
    auditId,
    subject,
    composite,
    scoringResult.readinessScore,
    aggregationResult.visibility,
    tier,
    {
      presence: aggregationResult.presence,
      citation: aggregationResult.citation,
      shareOfVoice: aggregationResult.shareOfVoice,
      prominence: aggregationResult.prominence,
    },
    totalSpend,
    crawlerOut,
    corroborationOut
  );

  console.log(`\n[audit] Audit complete. Report at ${reportPath}\n`);
}

main().catch((e) => {
  console.error("[audit] fatal:", e);
  process.exit(1);
});

// ============================================================================
// Helpers
// ============================================================================

function round3(n: number): number {
  return Math.round(n * 1_000) / 1_000;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
