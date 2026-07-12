/**
 * Free scan orchestrator.
 *
 * The public /scan flow: URL in → tier + 7-dim readiness score + 2–3
 * findings out, in ~25–35 seconds synchronously. Reuses the same
 * Crawler + Corroboration + Scoring services the paid Index Report
 * pipeline uses, minus the QueryGrid / Extraction / Aggregation chain
 * (no Visibility outcome on the free tier — see AVI_FREE_FLOW.md §3
 * step 8 and D006).
 *
 * Persists one submission row (source='free_scan') and one audits row
 * tied to it. The audits row holds crawler_output, corroboration in
 * scoring_output.{corroboration}, the readiness_score, and the tier.
 * Per-dim rows go to audit_dimension_scores as usual.
 *
 * Subject name and type are inferred from the crawler output — no form
 * field. The scoring layer is shared with the paid pipeline, so the
 * tier mapping is the same (D005 §9 thresholds).
 *
 * Read AVI_FREE_FLOW.md before touching this file.
 */

import { supabaseAdmin } from "./supabase-client";
import { runCrawler, normalizeUrl, type CrawlerOutput } from "./v1/crawler";
import { runCorroboration, type CorroborationOutput } from "./v1/corroboration";
import { runScoring, type SubjectType } from "./v1/scoring";

// ============================================================================
// Constants
// ============================================================================

/** Rubric version stamped on every free-scan audit row. Bump when the
 *  scoring prompts or anchored scales in lib/avi/scoring.ts change. */
export const FREE_SCAN_RUBRIC_VERSION = "v2.0";

// ============================================================================
// Types
// ============================================================================

export type FreeScanInput = {
  rawUrl: string;
  ip?: string | null;
  /** Which audience lane the visitor selected on the intake form.
   *  Controls which master-key profiles (GBP/Bing/Yelp vs
   *  LinkedIn/directory/listicles) the readiness scan checks. */
  audienceLane?: 'local' | 'online_b2b';
};

export type FreeScanFinding = {
  dimensionId: string;
  dimensionName: string;
  score: number | null;
  /** Plain-English paraphrase — 1–2 sentences for the results page. */
  summary: string;
};

export type FreeScanResult =
  | {
      ok: true;
      submissionId: string;
      auditId: string;
      accessToken: string;
      url: string;
      subjectName: string;
      subjectType: SubjectType;
      readinessScore: number;
      tier: Tier;
      dimensions: Array<{
        id: string;
        name: string;
        score: number | null;
      }>;
      findings: FreeScanFinding[];
      crawler: CrawlerOutput;
      corroboration: CorroborationOutput;
      crawlerReachable: boolean;
      durationMs: number;
      /** Master-key presence report — populated only when the visitor
       *  provided an audience_lane on the intake form. Reports whether
       *  the business is present on the profiles AI reads for its lane
       *  (GBP/Bing/Yelp for local; LinkedIn/directory/listicle for online
       *  B2B). Presence only — no visibility claim. */
      masterKeys?: import('./v3/master-keys').MasterKeyReport;
    }
  | {
      ok: false;
      error: string;
      submissionId?: string;
    };

export type Tier =
  | "invisible"
  | "hidden"
  | "faintly-visible"
  | "discoverable"
  | "agent-ready";

// ============================================================================
// Entry point
// ============================================================================

export async function runFreeScan(
  input: FreeScanInput
): Promise<FreeScanResult> {
  const start = Date.now();
  const url = normalizeUrl(input.rawUrl);

  // 1. Crawler — name + subject_type get inferred from this output.
  const crawler = await runCrawler(url);

  // 2. Subject identification — pulled from crawler signals so the user
  //    doesn't have to type anything beyond the URL.
  const subjectName = inferSubjectName(crawler, url);
  const subjectType = inferSubjectType(crawler);

  // 3. Persist the submission FIRST so api_calls can attribute spend to
  //    it. submission_id is the key the ops monitor uses.
  const submissionId = await createSubmission({
    url,
    subjectName,
    subjectType,
  });
  if (!submissionId) {
    return { ok: false, error: "Failed to create submission row." };
  }

  // 4. Create the audits row up front (scoring writes per-dim rows into
  //    audit_dimension_scores keyed by audit_id).
  const auditId = await createAudit({
    submissionId,
    subjectType,
  });
  if (!auditId) {
    return {
      ok: false,
      error: "Failed to create audit row.",
      submissionId,
    };
  }

  // 5. Stash the crawler output on the audit row now so we have it even
  //    if scoring fails downstream.
  await supabaseAdmin()
    .from("audits")
    .update({ crawler_output: crawler })
    .eq("id", auditId);

  // 6. Corroboration — Tavily. Inferred industry from crawler title /
  //    meta where possible; falls back to "business" if nothing useful.
  const industry = inferIndustry(crawler);
  const corroboration = await runCorroboration(
    {
      name: subjectName,
      industry,
      urlHost: extractHost(url),
      sameAsLinks: crawler.sameAsLinks ?? [],
    },
    { submissionId, ip: input.ip ?? null }
  );

  // 7. Score the 7 dims. This persists per-dim rows itself and updates
  //    audits.readiness_score.
  const scoring = await runScoring(
    {
      subjectName,
      subjectUrl: url,
      subjectType,
      crawler,
      corroboration,
      // No visibility on the free tier — scoring honors this.
    },
    {
      auditId,
      submissionId,
      ip: input.ip ?? null,
      rubricVersion: FREE_SCAN_RUBRIC_VERSION,
      endpoint: "free_scan_score",
    }
  );

  // 8. Hard failure if every dim came back null — composite is undefined.
  if (scoring.readinessScore === null) {
    await supabaseAdmin()
      .from("submissions")
      .update({ status: "pdf_failed" })
      .eq("id", submissionId);
    return {
      ok: false,
      error:
        "Our scoring service is briefly down. Try again in a few minutes.",
      submissionId,
    };
  }

  // 9. Tier from readiness (free flow has no Visibility, so composite =
  //    readiness for the band lookup).
  const tier = tierFor(scoring.readinessScore);

  // 10. Compose the 2–3 plain-English findings from the lowest dims.
  const findings = composeFindings(
    scoring.dimensions.map((d) => ({
      id: d.id,
      name: d.name,
      score: d.score,
      justification: d.justification,
    }))
  );

  // 11. Finalize audits + submissions rows.
  await supabaseAdmin()
    .from("audits")
    .update({
      tier,
      scoring_output: {
        corroboration,
        findings,
      },
    })
    .eq("id", auditId);

  // Pull the access_token back — the front end uses it for the email gate.
  const { data: subRow, error: subErr } = await supabaseAdmin()
    .from("submissions")
    .update({ status: "scan_completed" })
    .eq("id", submissionId)
    .select("access_token")
    .single();

  const accessToken = !subErr && subRow ? (subRow.access_token as string) : "";

  return {
    ok: true,
    submissionId,
    auditId,
    accessToken,
    url,
    subjectName,
    subjectType,
    readinessScore: scoring.readinessScore,
    tier,
    dimensions: scoring.dimensions.map((d) => ({
      id: d.id,
      name: d.name,
      score: d.score,
    })),
    findings,
    crawler,
    corroboration,
    crawlerReachable: crawler.reachable,
    durationMs: Date.now() - start,
  };
}

// ============================================================================
// Tier mapping (D005 §9 thresholds, mirrored from scripts/run-audit.ts)
// ============================================================================

export function tierFor(score: number): Tier {
  if (score < 0.2) return "invisible";
  if (score < 0.4) return "hidden";
  if (score < 0.6) return "faintly-visible";
  if (score < 0.8) return "discoverable";
  return "agent-ready";
}

// ============================================================================
// Findings composer
// ============================================================================

function composeFindings(
  dims: Array<{
    id: string;
    name: string;
    score: number | null;
    justification: string | null;
  }>
): FreeScanFinding[] {
  // Findings = the 3 lowest-scoring dims. Null scores are excluded
  // (they're system failures, not subject signals — surfacing them as
  // "findings" would be misleading).
  const ranked = dims
    .filter((d): d is { id: string; name: string; score: number; justification: string | null } =>
      typeof d.score === "number"
    )
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return ranked.map((d) => ({
    dimensionId: d.id,
    dimensionName: d.name,
    score: d.score,
    // Preserve the judge's full paragraph so nothing ends mid-sentence
    // in the customer's report. Cap at 900 chars only as a safety valve
    // for pathological outputs.
    summary: trim(d.justification ?? "", 900),
  }));
}

function trim(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function extractHost(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// ============================================================================
// Subject inference from crawler output
// ============================================================================

function inferSubjectName(crawler: CrawlerOutput, url: string): string {
  // Priority: og:site_name → og:title → <title> → domain stem.
  const og = crawler.ogTags || {};
  const candidate =
    og.site_name?.trim() ||
    og.title?.trim() ||
    crawler.title?.trim() ||
    domainStem(url);
  return candidate || "this site";
}

function inferSubjectType(crawler: CrawlerOutput): SubjectType {
  // AVI_FREE_FLOW.md §3 step 6:
  //   - Person schema present → personal brand
  //   - Otherwise → company (covers Organization, LocalBusiness, no schema)
  if (crawler.personSchemaPresent) return "personal_brand";
  return "company";
}

function inferIndustry(crawler: CrawlerOutput): string {
  // We don't know the customer's industry on the free tier. Pass meta
  // description as a loose industry hint when present; falls back to a
  // generic string. Tavily corroboration will still find LinkedIn /
  // Wikidata / press regardless — the broad search uses name + industry
  // mostly as a recall booster, not a filter.
  const meta = (crawler.metaDescription ?? "").trim();
  if (meta) return meta.slice(0, 120);
  return "business";
}

function domainStem(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length >= 2) return parts[parts.length - 2];
    return host;
  } catch {
    return "";
  }
}

// ============================================================================
// DB writes
// ============================================================================

async function createSubmission(opts: {
  url: string;
  subjectName: string;
  subjectType: SubjectType;
}): Promise<string | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      url: opts.url,
      company_name: opts.subjectName,
      subject_type: opts.subjectType,
      source: "free_scan",
      status: "new",
      find_competitors_for_me: false,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[free-scan] submissions insert failed:", error);
    return null;
  }
  return data.id as string;
}

async function createAudit(opts: {
  submissionId: string;
  subjectType: SubjectType;
}): Promise<string | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("audits")
    .insert({
      submission_id: opts.submissionId,
      rubric_version: FREE_SCAN_RUBRIC_VERSION,
      subject_type: opts.subjectType,
      review_status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[free-scan] audits insert failed:", error);
    return null;
  }
  return data.id as string;
}
