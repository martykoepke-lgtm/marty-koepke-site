import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@practical-informatics/avi";
import { sendEmail } from "@practical-informatics/avi";
import { kitSubscribe } from "@practical-informatics/avi";
import { renderFreeScanEmail } from "@practical-informatics/avi";
import type { Tier } from "@practical-informatics/avi";

/**
 * POST /api/scan/email
 *
 * Email gate for the free /scan flow per D006 / AVI_FREE_FLOW.md §3.4.
 *
 * Validates the access token against the submission row, updates the
 * row with the customer's email, subscribes them to Kit with a tier
 * tag, and sends the full readiness report via Resend.
 *
 * The report is delivered as a styled HTML email plus a token-gated hosted
 * report link. The hosted link is valid for 30 days from scan creation.
 */

export const runtime = "nodejs";
export const maxDuration = 30;
const REPORT_TOKEN_TTL_DAYS = 30;
const REPORT_TOKEN_TTL_MS = REPORT_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

type EmailBody = {
  scanId?: string;
  accessToken?: string;
  email?: string;
};

type SubmissionRow = {
  id: string;
  url: string | null;
  company_name: string | null;
  access_token: string | null;
  status: string;
  email: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  tier: string | null;
  readiness_score: number | null;
  scoring_output: {
    findings?: Array<{
      dimensionId: string;
      dimensionName: string;
      score: number | null;
      summary: string;
    }>;
  } | null;
};

type AuditDimensionRow = {
  dimension_id: string;
  dimension_name: string;
  score: number | null;
};

export async function POST(req: NextRequest) {
  let body: EmailBody;
  try {
    body = (await req.json()) as EmailBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const scanId = (body.scanId ?? "").trim();
  const accessToken = (body.accessToken ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();

  if (!scanId || !accessToken) {
    return NextResponse.json(
      { ok: false, error: "Missing scan identifier." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "That doesn't look like a valid email address.", field: "email" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  // ---- Token check ----
  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .select(
      "id, url, company_name, access_token, status, email, created_at"
    )
    .eq("id", scanId)
    .maybeSingle<SubmissionRow>();

  if (subErr || !submission) {
    return NextResponse.json(
      { ok: false, error: "That scan link is invalid or expired." },
      { status: 404 }
    );
  }
  if (submission.access_token !== accessToken) {
    return NextResponse.json(
      { ok: false, error: "That scan link is invalid or expired." },
      { status: 403 }
    );
  }
  if (isExpired(submission.created_at)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "That report link has expired. Please re-run the free check to generate a fresh report.",
      },
      { status: 410 }
    );
  }

  // ---- Pull the matching audit + dim scores so the email has real content ----
  const { data: audit, error: audErr } = await supabase
    .from("audits")
    .select("id, tier, readiness_score, scoring_output")
    .eq("submission_id", scanId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AuditRow>();

  if (audErr || !audit) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "We can't find the scan results for that link. Please re-run the scan.",
      },
      { status: 404 }
    );
  }

  const { data: dimRows } = await supabase
    .from("audit_dimension_scores")
    .select("dimension_id, dimension_name, score")
    .eq("audit_id", audit.id)
    .returns<AuditDimensionRow[]>();

  const tier = (audit.tier ?? "hidden") as Tier;
  const readinessScore = audit.readiness_score ?? 0;
  const findings = audit.scoring_output?.findings ?? [];
  const dimensions = (dimRows ?? []).map((d) => ({
    id: d.dimension_id,
    name: d.dimension_name,
    score: d.score,
  }));

  // ---- Update submission row with email + status ----
  await supabase
    .from("submissions")
    .update({
      email,
      status: "email_captured",
    })
    .eq("id", scanId);

  // ---- Kit subscribe (best effort) ----
  const kit = await kitSubscribe({ email, tier });
  if (!kit.ok) {
    console.warn("[/api/scan/email] Kit subscribe failed:", kit.reason);
  }

  // ---- Render + send the report email ----
  const subjectDomain = friendlyDomain(submission.url);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.martykoepke.com";
  const reportUrl = `${siteUrl}/scan/report/${submission.id}?t=${encodeURIComponent(accessToken)}`;
  const html = renderFreeScanEmail({
    tier,
    readinessScore,
    subjectName: submission.company_name ?? subjectDomain,
    subjectDomain,
    dimensions,
    findings,
    reportUrl,
  });

  const sendRes = await sendEmail(
    {
      to: email,
      subject: `Your AI Readiness report — ${subjectDomain}`,
      html,
      text: plaintextFallback({
        subjectName: submission.company_name ?? subjectDomain,
        tier,
        readinessScore,
        findings,
      }),
    },
    {
      endpoint: "free_scan_report_delivery",
      submissionId: scanId,
    }
  );

  if (!sendRes.ok) {
    await supabase
      .from("submissions")
      .update({ status: "pdf_failed" })
      .eq("id", scanId);
    return NextResponse.json(
      {
        ok: false,
        error:
          "We couldn't send your report. Please reply to your confirmation email or contact hello@martykoepke.com.",
      },
      { status: 502 }
    );
  }

  await supabase
    .from("submissions")
    .update({ status: "pdf_sent" })
    .eq("id", scanId);

  return NextResponse.json({ ok: true });
}

// ============================================================================
// Helpers
// ============================================================================

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function friendlyDomain(url: string | null): string {
  if (!url) return "your site";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return true;
  return Date.now() - created > REPORT_TOKEN_TTL_MS;
}

function plaintextFallback(opts: {
  subjectName: string;
  tier: Tier;
  readinessScore: number;
  findings: Array<{ dimensionName: string; summary: string }>;
}): string {
  const pct = Math.round(opts.readinessScore * 100);
  const tierLabel =
    opts.tier
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const findingsText = opts.findings
    .map((f, i) => `${i + 1}. ${f.dimensionName} — ${f.summary}`)
    .join("\n\n");

  return `Your AI Readiness report for ${opts.subjectName}

Tier: ${tierLabel} (${pct}/100)

What stood out:

${findingsText}

Want the full picture? The $895 AI Business Accuracy Audit tests four AI engines, captures 32 live AI responses, verifies every factual claim AI makes about you, and plots you against two competitors you name. Includes a 30-minute review call with Marty.

Read more: https://www.martykoepke.com/ai-visibility
Book a free 20-minute conversation: https://tally.so/r/xXVPgo

— Marty Koepke
Practical Informatics LLC
`;
}
