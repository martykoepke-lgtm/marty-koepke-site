/**
 * Recommendations runner — generates plain-English fixes for an existing audit.
 *
 * Usage:
 *   npm run audit:recommend -- <audit_id>
 *
 * Reads the existing audit data from Supabase (no re-querying LLMs for the
 * grid), runs the Recommendations service once, persists to
 * audits.recommendations.
 *
 * Useful for backfilling recommendations onto audits that pre-date the
 * Recommendations service shipping. New audits going forward will run this
 * as part of the orchestrator.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { supabaseAdmin } from "@/lib/supabase";
import { runRecommendations } from "@/lib/avi/recommendations";

type AuditRow = {
  id: string;
  submission_id: string;
  subject_type: string | null;
  crawler_output: unknown;
  query_output: { breakdown?: {
    presence: number;
    citation: number;
    shareOfVoice: number;
    prominence: number;
  } } | null;
  scoring_output: { corroboration?: unknown } | null;
};

type SubmissionRow = {
  company_name: string;
  url: string | null;
  industry: string;
  location: string | null;
};

type DimensionRow = {
  dimension_id: string;
  dimension_name: string;
  score: number | null;
  justification: string | null;
  evidence_pointers: Array<{ type: string; value: string; found: boolean }> | null;
};

async function main(): Promise<void> {
  const auditId = process.argv[2];
  if (!auditId) {
    console.error("Usage: npm run audit:recommend -- <audit_id>");
    process.exit(1);
  }

  const supabase = supabaseAdmin();

  const { data: audit, error: auditErr } = await supabase
    .from("audits")
    .select(
      "id, submission_id, subject_type, crawler_output, query_output, scoring_output"
    )
    .eq("id", auditId)
    .single<AuditRow>();
  if (auditErr || !audit) {
    console.error(`Audit ${auditId} not found.`);
    process.exit(1);
  }

  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .select("company_name, url, industry, location")
    .eq("id", audit.submission_id)
    .single<SubmissionRow>();
  if (subErr || !submission) {
    console.error(`Submission ${audit.submission_id} not found.`);
    process.exit(1);
  }

  const { data: dims } = await supabase
    .from("audit_dimension_scores")
    .select(
      "dimension_id, dimension_name, score, justification, evidence_pointers"
    )
    .eq("audit_id", auditId)
    .returns<DimensionRow[]>();

  if (!dims || dims.length === 0) {
    console.error(
      "No audit_dimension_scores rows found for this audit. Run the scoring step first."
    );
    process.exit(1);
  }

  const subjectType =
    audit.subject_type === "personal_brand" ? "personal_brand" : "company";

  console.log(
    `[recommend] running for ${submission.company_name} (audit ${auditId.slice(
      0,
      8
    )}…)`
  );

  const result = await runRecommendations(
    {
      subjectName: submission.company_name,
      subjectUrl: submission.url,
      subjectType,
      industry: submission.industry,
      location: submission.location,
      dimensions: dims.map((d) => ({
        id: d.dimension_id,
        name: d.dimension_name,
        score: d.score,
        justification: d.justification,
        evidence_pointers: d.evidence_pointers ?? [],
      })),
      visibility: audit.query_output?.breakdown,
      crawler: audit.crawler_output,
      corroboration: audit.scoring_output?.corroboration,
    },
    {
      auditId: audit.id,
      submissionId: audit.submission_id,
      ip: null,
    }
  );

  console.log(
    `[recommend] ${result.recommendations.length} recommendations produced (parseOk=${result.parseOk}), $${result.costUsd.toFixed(
      3
    )}, ${result.durationMs}ms`
  );
  for (const r of result.recommendations) {
    console.log(
      `  ${r.priority}. [${r.category}] ${r.title}  — ${r.effort}, lifts ${r.dimensions_lifted.join(",")} by ${r.estimated_delta}`
    );
  }
}

main().catch((e) => {
  console.error("[recommend] fatal:", e);
  process.exit(1);
});
