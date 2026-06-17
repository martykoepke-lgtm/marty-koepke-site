/**
 * GET /api/cron/weekly-summary
 *
 * The weekly ops report cron. Runs every Monday at 08:00 America/Los_Angeles
 * (set in vercel.json as UTC). Aggregates the last 7 days from api_calls
 * and submissions, computes month-to-date spend vs SPEND_CAP_*, applies a
 * `[HEADS UP]` subject prefix if any provider has crossed
 * SPEND_ALERT_THRESHOLD_HEADS_UP (default 80%), renders the HTML, and
 * sends the report via Resend to ALERT_TO_ADDRESS.
 *
 * Authorization via CRON_SECRET — same pattern as check-spend.
 *
 * Read AVI_OPS_MONITOR.md §3 (sample email), §4.3 (this cron's design).
 */

import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@practical-informatics/avi";
import { sendEmail } from "@practical-informatics/avi";

export const runtime = "nodejs";
export const maxDuration = 30;

const HEADS_UP_THRESHOLD = parseFloat(
  process.env.SPEND_ALERT_THRESHOLD_HEADS_UP ?? "0.80"
);

const TRACKED_PROVIDERS = [
  { name: "anthropic", capEnv: "SPEND_CAP_ANTHROPIC" },
  { name: "openai", capEnv: "SPEND_CAP_OPENAI" },
  { name: "perplexity", capEnv: "SPEND_CAP_PERPLEXITY" },
  { name: "tavily", capEnv: "SPEND_CAP_TAVILY" },
] as const;

// Providers we report on but don't cost-track (free tiers).
const FREE_PROVIDERS = ["gemini", "resend"] as const;

const ALL_PROVIDERS = [
  ...TRACKED_PROVIDERS.map((p) => p.name),
  ...FREE_PROVIDERS,
];

type ApiCallRow = {
  provider: string;
  model: string | null;
  endpoint: string | null;
  cost_estimated_usd: number | null;
  status: string;
  ip: string | null;
  submission_id: string | null;
  created_at: string;
};

type SubmissionRow = {
  id: string;
  email: string | null;
  created_at: string;
  status: string;
};

type ProviderSummary = {
  provider: string;
  calls: number;
  errors: number;
  spend: number;
  cap?: number;
  pct?: number;
};

type WeeklyAggregate = {
  scansStarted: number;
  scansCompleted: number;
  scansFailed: number;
  emailsCaptured: number;
  paidReports: number;
  monitorSelfRuns: number;
  providers: ProviderSummary[];
  topIps: Array<{ ip: string; scans: number }>;
  anomalies: string[];
  totalSpend: number;
};

type MTDAggregate = {
  providers: ProviderSummary[];
  anyAbove80: boolean;
};

// ============================================================================
// Handler
// ============================================================================

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  // ---- Pull data ----
  const [weekCallsRes, mtdCallsRes, weekSubsRes] = await Promise.all([
    supabase
      .from("api_calls")
      .select(
        "provider, model, endpoint, cost_estimated_usd, status, ip, submission_id, created_at"
      )
      .gte("created_at", sevenDaysAgo.toISOString())
      .returns<ApiCallRow[]>(),

    supabase
      .from("api_calls")
      .select("provider, cost_estimated_usd")
      .gte("created_at", monthStart.toISOString()),

    supabase
      .from("submissions")
      .select("id, email, created_at, status")
      .gte("created_at", sevenDaysAgo.toISOString())
      .returns<SubmissionRow[]>(),
  ]);

  if (weekCallsRes.error) {
    return NextResponse.json(
      { error: `api_calls weekly: ${weekCallsRes.error.message}` },
      { status: 500 }
    );
  }
  if (mtdCallsRes.error) {
    return NextResponse.json(
      { error: `api_calls MTD: ${mtdCallsRes.error.message}` },
      { status: 500 }
    );
  }
  if (weekSubsRes.error) {
    return NextResponse.json(
      { error: `submissions weekly: ${weekSubsRes.error.message}` },
      { status: 500 }
    );
  }

  const weekCalls = weekCallsRes.data ?? [];
  const mtdCalls = (mtdCallsRes.data ?? []) as Array<{
    provider: string;
    cost_estimated_usd: number | null;
  }>;
  const weekSubs = weekSubsRes.data ?? [];

  // ---- Aggregate ----
  const lastWeek = aggregateWeek(weekCalls, weekSubs);
  const mtd = aggregateMTD(mtdCalls);

  // ---- Compose ----
  const subjectPrefix = mtd.anyAbove80 ? "[HEADS UP] " : "";
  const dateRange = formatDateRange(sevenDaysAgo, now);
  const subject = `${subjectPrefix}AVI weekly ops report — ${dateRange}`;
  const html = renderWeeklyHtml({ now, sevenDaysAgo, lastWeek, mtd });

  // ---- Send ----
  const alertTo = process.env.ALERT_TO_ADDRESS;
  if (!alertTo) {
    return NextResponse.json(
      { error: "ALERT_TO_ADDRESS not set" },
      { status: 500 }
    );
  }

  const result = await sendEmail(
    { to: alertTo, subject, html },
    { endpoint: "monitor_weekly_summary" }
  );

  return NextResponse.json({
    ok: result.ok,
    sent_to: alertTo,
    subject,
    headsUp: mtd.anyAbove80,
    lastWeek,
    mtd,
    sendResult: result,
  });
}

// ============================================================================
// Authorization
// ============================================================================

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn(
      "[weekly-summary] CRON_SECRET not set — rejecting all requests"
    );
    return false;
  }
  return auth === `Bearer ${secret}`;
}

// ============================================================================
// Aggregation
// ============================================================================

function aggregateWeek(
  calls: ApiCallRow[],
  subs: SubmissionRow[]
): WeeklyAggregate {
  // Provider summary
  const providers: ProviderSummary[] = ALL_PROVIDERS.map((name) => {
    const subset = calls.filter((c) => c.provider === name);
    const errors = subset.filter((c) => c.status !== "success").length;
    const spend = subset.reduce(
      (s, c) => s + (c.cost_estimated_usd ?? 0),
      0
    );
    return {
      provider: name,
      calls: subset.length,
      errors,
      spend: round6(spend),
    };
  }).filter((p) => p.calls > 0); // hide providers with zero activity

  // Submission-derived counts
  const scansStarted = subs.length;
  const emailsCaptured = subs.filter(
    (s) => s.email && s.email.trim() !== ""
  ).length;

  // Scans completed/failed by joining submissions to api_calls' free-scan
  // endpoints. If a submission has any failed free_scan_* call, count it
  // as failed; otherwise (it has at least one free_scan_* call), count it
  // as completed; otherwise (no LLM calls — just crawler) count it as
  // completed (the crawler-only path is the v1 baseline).
  const freeScanCalls = calls.filter((c) =>
    (c.endpoint ?? "").startsWith("free_scan")
  );
  const submissionsWithFreeScanFails = new Set(
    freeScanCalls
      .filter((c) => c.status !== "success")
      .map((c) => c.submission_id)
      .filter((id): id is string => !!id)
  );
  const scansFailed = submissionsWithFreeScanFails.size;
  const scansCompleted = Math.max(0, scansStarted - scansFailed);

  // Paid reports (placeholder until the paid pipeline exists)
  const paidReports = calls.filter((c) =>
    (c.endpoint ?? "").startsWith("paid_pipeline")
  ).length;

  // Monitor self-runs
  const monitorSelfRuns = calls.filter((c) =>
    (c.endpoint ?? "").startsWith("monitor_")
  ).length;

  // Top IPs. Submissions don't have an IP column today; we approximate
  // from api_calls (which is populated by the LLM wrapper with context.ip
  // when the originating endpoint passed one). If we add submissions.ip
  // later, prefer that — one row per scan instead of one per LLM call.
  const ipCounts = new Map<string, number>();
  for (const call of calls) {
    if (!call.ip || !call.submission_id) continue;
    ipCounts.set(call.ip, (ipCounts.get(call.ip) ?? 0) + 1);
  }
  const topIps = Array.from(ipCounts.entries())
    .map(([ip, scans]) => ({ ip: maskIp(ip), scans }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 5);

  // Anomalies — concrete things worth surfacing
  const anomalies: string[] = [];
  if (scansFailed > 0) {
    anomalies.push(
      `${scansFailed} scan${scansFailed === 1 ? "" : "s"} failed in the last 7 days. Check Vercel logs for the submission IDs.`
    );
  }
  for (const p of providers) {
    if (p.errors > 0 && p.errors / Math.max(p.calls, 1) > 0.1) {
      anomalies.push(
        `${displayName(p.provider)} error rate ${((p.errors / p.calls) * 100).toFixed(0)}% (${p.errors}/${p.calls}). Worth checking the provider's status page.`
      );
    }
  }

  const totalSpend = providers.reduce((s, p) => s + p.spend, 0);

  return {
    scansStarted,
    scansCompleted,
    scansFailed,
    emailsCaptured,
    paidReports,
    monitorSelfRuns,
    providers,
    topIps,
    anomalies,
    totalSpend: round6(totalSpend),
  };
}

function aggregateMTD(
  calls: Array<{ provider: string; cost_estimated_usd: number | null }>
): MTDAggregate {
  const providers: ProviderSummary[] = TRACKED_PROVIDERS.map(
    ({ name, capEnv }) => {
      const cap = parseFloat(process.env[capEnv] ?? "0");
      const subset = calls.filter((c) => c.provider === name);
      const spend = subset.reduce(
        (s, c) => s + (c.cost_estimated_usd ?? 0),
        0
      );
      const pct = cap > 0 ? spend / cap : 0;
      return {
        provider: name,
        calls: subset.length,
        errors: 0, // not used in MTD section
        spend: round6(spend),
        cap,
        pct: round4(pct),
      };
    }
  );

  const anyAbove80 = providers.some(
    (p) => (p.cap ?? 0) > 0 && (p.pct ?? 0) >= HEADS_UP_THRESHOLD
  );

  return { providers, anyAbove80 };
}

// ============================================================================
// Rendering
// ============================================================================

function renderWeeklyHtml(opts: {
  now: Date;
  sevenDaysAgo: Date;
  lastWeek: WeeklyAggregate;
  mtd: MTDAggregate;
}): string {
  const { now, sevenDaysAgo, lastWeek, mtd } = opts;
  const range = formatDateRange(sevenDaysAgo, now);

  const headsUpBanner = mtd.anyAbove80
    ? `<div style="background:#FFF7E5; border-left:3px solid #C9A961; padding:16px 20px; margin:0 0 24px;">
        <strong style="display:block; color:#6B5424; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:13px; text-transform:uppercase; letter-spacing:.06em; margin:0 0 6px;">Heads up</strong>
        <span style="font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px; color:#6B5424;">
          One or more providers crossed ${(HEADS_UP_THRESHOLD * 100).toFixed(0)}% of monthly cap. Details in the month-to-date section below.
        </span>
      </div>`
    : "";

  const providerSpendRows = lastWeek.providers
    .map(
      (p) => `<tr>
        <td style="padding:6px 0; color:#5A6B5A;">${displayName(p.provider)}</td>
        <td style="padding:6px 0; text-align:right;">${p.calls} call${p.calls === 1 ? "" : "s"}</td>
        <td style="padding:6px 0; text-align:right; font-weight:600;">$${p.spend.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const mtdSpendRows = mtd.providers
    .filter((p) => (p.cap ?? 0) > 0)
    .map((p) => {
      const pct = ((p.pct ?? 0) * 100).toFixed(0);
      const flag =
        (p.pct ?? 0) >= HEADS_UP_THRESHOLD
          ? `<strong style="color:#A8893F;"> ${pct}% — flagged</strong>`
          : ` ${pct}%`;
      return `<tr>
        <td style="padding:6px 0; color:#5A6B5A;">${displayName(p.provider)}</td>
        <td style="padding:6px 0; text-align:right;">$${(p.spend ?? 0).toFixed(2)} / $${(p.cap ?? 0).toFixed(2)}</td>
        <td style="padding:6px 0; text-align:right;">${flag}</td>
      </tr>`;
    })
    .join("");

  const topIpsRows = lastWeek.topIps.length
    ? lastWeek.topIps
        .map(
          (t) => `<tr>
        <td style="padding:6px 0; color:#5A6B5A;">${t.ip}</td>
        <td style="padding:6px 0; text-align:right;">${t.scans} call${t.scans === 1 ? "" : "s"}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="2" style="padding:6px 0; color:#5A6B5A; font-style:italic;">No IP-attributed traffic this week.</td></tr>`;

  const anomaliesSection = lastWeek.anomalies.length
    ? `<ul style="margin:0 0 24px 24px; padding:0; color:#2C2A26; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px;">
        ${lastWeek.anomalies.map((a) => `<li style="margin:0 0 8px;">${a}</li>`).join("")}
      </ul>`
    : `<p style="margin:0 0 24px; color:#5A6B5A; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px; font-style:italic;">Nothing unusual to surface this week.</p>`;

  return `<!doctype html>
<html>
<body style="font-family: ui-serif, Georgia, serif; background:#FAF6EE; color:#2C2A26; padding:32px; line-height:1.6;">
  <div style="max-width:620px; margin:0 auto; background:white; border:1px solid #D8CCB4; padding:32px;">
    <p style="margin:0 0 4px; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#A8893F; font-family: ui-sans-serif, Inter, system-ui, sans-serif;">
      AVI weekly ops report
    </p>
    <h1 style="margin:0 0 24px; font-size:22px; font-weight:600; color:#1F3A2E;">
      ${range}
    </h1>

    ${headsUpBanner}

    <h2 style="margin:24px 0 12px; font-size:15px; font-weight:600; color:#1F3A2E; font-family: ui-sans-serif, Inter, system-ui, sans-serif; text-transform:uppercase; letter-spacing:.06em;">
      Last week at a glance
    </h2>
    <table style="width:100%; border-collapse:collapse; margin:0 0 24px; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px;">
      <tr><td style="padding:6px 0; color:#5A6B5A;">Free scans started</td><td style="padding:6px 0; text-align:right; font-weight:600;">${lastWeek.scansStarted}</td></tr>
      <tr><td style="padding:6px 0; color:#5A6B5A;">Free scans completed</td><td style="padding:6px 0; text-align:right;">${lastWeek.scansCompleted}${lastWeek.scansFailed > 0 ? ` <span style="color:#A8893F;">(${lastWeek.scansFailed} failed)</span>` : ""}</td></tr>
      <tr><td style="padding:6px 0; color:#5A6B5A;">Emails captured</td><td style="padding:6px 0; text-align:right;">${lastWeek.emailsCaptured}${lastWeek.scansStarted > 0 ? ` <span style="color:#5A6B5A;">(${Math.round((lastWeek.emailsCaptured / lastWeek.scansStarted) * 100)}%)</span>` : ""}</td></tr>
      <tr><td style="padding:6px 0; color:#5A6B5A;">Paid Reports run</td><td style="padding:6px 0; text-align:right;">${lastWeek.paidReports}</td></tr>
      <tr><td style="padding:6px 0; color:#5A6B5A;">Monitor self-runs</td><td style="padding:6px 0; text-align:right;">${lastWeek.monitorSelfRuns}</td></tr>
    </table>

    <h2 style="margin:24px 0 12px; font-size:15px; font-weight:600; color:#1F3A2E; font-family: ui-sans-serif, Inter, system-ui, sans-serif; text-transform:uppercase; letter-spacing:.06em;">
      Spend last week, by provider
    </h2>
    <table style="width:100%; border-collapse:collapse; margin:0 0 16px; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px;">
      ${providerSpendRows || `<tr><td colspan="3" style="padding:6px 0; color:#5A6B5A; font-style:italic;">No external API calls this week.</td></tr>`}
      <tr style="border-top:1px solid #D8CCB4;">
        <td style="padding:8px 0 4px; color:#1F3A2E; font-weight:600;">Total</td>
        <td></td>
        <td style="padding:8px 0 4px; text-align:right; color:#1F3A2E; font-weight:600;">$${lastWeek.totalSpend.toFixed(2)}</td>
      </tr>
    </table>

    <h2 style="margin:24px 0 12px; font-size:15px; font-weight:600; color:#1F3A2E; font-family: ui-sans-serif, Inter, system-ui, sans-serif; text-transform:uppercase; letter-spacing:.06em;">
      Month-to-date, vs caps
    </h2>
    <table style="width:100%; border-collapse:collapse; margin:0 0 24px; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px;">
      ${mtdSpendRows || `<tr><td colspan="3" style="padding:6px 0; color:#5A6B5A; font-style:italic;">No tracked spend yet this month.</td></tr>`}
    </table>

    <h2 style="margin:24px 0 12px; font-size:15px; font-weight:600; color:#1F3A2E; font-family: ui-sans-serif, Inter, system-ui, sans-serif; text-transform:uppercase; letter-spacing:.06em;">
      Top traffic
    </h2>
    <table style="width:100%; border-collapse:collapse; margin:0 0 24px; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px;">
      ${topIpsRows}
    </table>

    <h2 style="margin:24px 0 12px; font-size:15px; font-weight:600; color:#1F3A2E; font-family: ui-sans-serif, Inter, system-ui, sans-serif; text-transform:uppercase; letter-spacing:.06em;">
      Anomalies
    </h2>
    ${anomaliesSection}

    <p style="margin:32px 0 0; font-size:13px; color:#5A6B5A; border-top:1px solid #D8CCB4; padding-top:16px; font-family: ui-sans-serif, Inter, system-ui, sans-serif;">
      This report runs every Monday at 8:00 AM Pacific.
      You'll receive an out-of-band <code>[URGENT]</code> alert (separate email)
      if any tracked provider crosses ${(parseFloat(process.env.SPEND_ALERT_THRESHOLD_URGENT ?? "0.95") * 100).toFixed(0)}%
      of its monthly cap mid-week.
    </p>
  </div>
</body>
</html>`;
}

// ============================================================================
// Helpers
// ============================================================================

function maskIp(ip: string): string {
  // Simple obfuscation: keep the first two octets, mask the rest.
  // e.g. 71.34.123.45 → 71.34.x.x
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  // IPv6 or other — show first 8 chars then ellipsis
  return ip.length > 8 ? `${ip.slice(0, 8)}…` : ip;
}

function formatDateRange(start: Date, end: Date): string {
  const tz = process.env.CRON_TIMEZONE ?? "America/Los_Angeles";
  const fmt: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    month: "short",
    day: "numeric",
  };
  const startStr = start.toLocaleDateString("en-US", fmt);
  const endStr = end.toLocaleDateString("en-US", { ...fmt, year: "numeric" });
  return `${startStr} – ${endStr}`;
}

function displayName(provider: string): string {
  const names: Record<string, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    gemini: "Google AI",
    perplexity: "Perplexity",
    tavily: "Tavily",
    resend: "Resend",
  };
  return names[provider] ?? provider;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}
