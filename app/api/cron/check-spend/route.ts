/**
 * GET /api/cron/check-spend
 *
 * The hourly threshold-check cron. Reads each provider's month-to-date
 * cost from api_calls, compares against the cap in SPEND_CAP_*, and
 * fires a 95% out-of-band alert email if any provider crosses the
 * urgent threshold.
 *
 * Rate-limited via spend_alerts: one alert per provider per 24 hours.
 *
 * Triggered by Vercel Cron (see vercel.json). Authorized via CRON_SECRET
 * Bearer header — set CRON_SECRET in .env.local and Vercel env vars.
 *
 * Read AVI_OPS_MONITOR.md §4.2 for the design.
 */

import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail } from "@/lib/avi/email";

export const runtime = "nodejs";
export const maxDuration = 30;

// Providers that have cost-tracked monthly caps.
// Gemini (free tier) and Resend (free tier) are intentionally excluded —
// their SPEND_CAP_* values are 0 and threshold math is undefined at 0.
const TRACKED_PROVIDERS = [
  { name: "anthropic", capEnv: "SPEND_CAP_ANTHROPIC" },
  { name: "openai", capEnv: "SPEND_CAP_OPENAI" },
  { name: "perplexity", capEnv: "SPEND_CAP_PERPLEXITY" },
  { name: "tavily", capEnv: "SPEND_CAP_TAVILY" },
] as const;

const URGENT_THRESHOLD = parseFloat(
  process.env.SPEND_ALERT_THRESHOLD_URGENT ?? "0.95"
);

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const monthStart = startOfMonthUTC().toISOString();

  const results: Array<Record<string, unknown>> = [];

  for (const { name, capEnv } of TRACKED_PROVIDERS) {
    const cap = parseFloat(process.env[capEnv] ?? "0");
    if (cap <= 0) {
      results.push({ provider: name, cap: 0, skipped: "no-cap-configured" });
      continue;
    }

    // Sum MTD spend for this provider.
    const { data, error } = await supabase
      .from("api_calls")
      .select("cost_estimated_usd")
      .eq("provider", name)
      .gte("created_at", monthStart);

    if (error) {
      console.warn(
        `[check-spend] provider=${name} query failed:`,
        error.message
      );
      results.push({ provider: name, error: error.message });
      continue;
    }

    const mtd = (data ?? []).reduce(
      (sum: number, row: { cost_estimated_usd: number | null }) =>
        sum + (row.cost_estimated_usd ?? 0),
      0
    );
    const pct = mtd / cap;

    if (pct < URGENT_THRESHOLD) {
      results.push({
        provider: name,
        mtd: round6(mtd),
        cap,
        pct: round4(pct),
      });
      continue;
    }

    // Over urgent threshold — check the 24-hour rate limit before firing.
    const alertedRecently = await wasAlertedInLast24h(supabase, name);
    if (alertedRecently) {
      results.push({
        provider: name,
        mtd: round6(mtd),
        cap,
        pct: round4(pct),
        alerted: false,
        reason: "rate_limited_24h",
      });
      continue;
    }

    await fireUrgentAlert(supabase, name, mtd, cap, pct);
    results.push({
      provider: name,
      mtd: round6(mtd),
      cap,
      pct: round4(pct),
      alerted: true,
    });
  }

  return NextResponse.json({
    ok: true,
    checked_at: new Date().toISOString(),
    urgent_threshold: URGENT_THRESHOLD,
    results,
  });
}

// ============================================================================
// Authorization
// ============================================================================

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron sends Authorization: Bearer ${CRON_SECRET}
  // (see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs)
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn(
      "[check-spend] CRON_SECRET not set — rejecting all requests"
    );
    return false;
  }
  return auth === `Bearer ${secret}`;
}

// ============================================================================
// Alert firing + rate limit
// ============================================================================

async function wasAlertedInLast24h(
  supabase: SupabaseClient,
  provider: string
): Promise<boolean> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("spend_alerts")
    .select("id")
    .eq("provider", provider)
    .gte("triggered_at", cutoff)
    .limit(1);
  if (error) {
    // Fail-open: if the rate-limit check fails, send the alert anyway.
    // Better to over-alert than miss a real one.
    console.warn(
      `[check-spend] spend_alerts query failed (will alert anyway):`,
      error.message
    );
    return false;
  }
  return (data?.length ?? 0) > 0;
}

async function fireUrgentAlert(
  supabase: SupabaseClient,
  provider: string,
  mtd: number,
  cap: number,
  pct: number
): Promise<void> {
  // Insert the spend_alerts row first so the email-send can update it
  // with success/failure tracking.
  const { data: alertRow, error: insertErr } = await supabase
    .from("spend_alerts")
    .insert({
      provider,
      pct_of_cap: Math.round(pct * 100 * 100) / 100, // numeric(5,2): e.g. 96.32
    })
    .select("id")
    .single();

  if (insertErr || !alertRow) {
    console.warn(
      `[check-spend] failed to insert spend_alerts row for ${provider}:`,
      insertErr
    );
    return;
  }

  const alertTo = process.env.ALERT_TO_ADDRESS;
  if (!alertTo) {
    console.warn(
      `[check-spend] ALERT_TO_ADDRESS not set; cannot send urgent alert for ${provider}`
    );
    return;
  }

  const subject = `[URGENT] ${displayName(provider)} spend at ${(pct * 100).toFixed(0)}% of monthly cap`;
  const html = renderUrgentAlertHtml({ provider, mtd, cap, pct });

  const result = await sendEmail(
    { to: alertTo, subject, html },
    { endpoint: "monitor_alert" }
  );

  await supabase
    .from("spend_alerts")
    .update({
      alert_email_sent_at: result.ok ? new Date().toISOString() : null,
      send_error: result.ok ? null : (result.error ?? "unknown"),
    })
    .eq("id", alertRow.id);
}

// ============================================================================
// Rendering
// ============================================================================

function renderUrgentAlertHtml(opts: {
  provider: string;
  mtd: number;
  cap: number;
  pct: number;
}): string {
  const { provider, mtd, cap, pct } = opts;
  const remaining = cap - mtd;
  const daysLeftInMonth = daysRemainingInMonth();
  const rate = daysLeftInMonth > 0 ? mtd / daysOfMonthSoFar() : 0;
  const projectedCapDate = projectCapDate(mtd, cap, rate);

  return `<!doctype html>
<html>
<body style="font-family: ui-serif, Georgia, serif; background:#FAF6EE; color:#2C2A26; padding:32px; line-height:1.6;">
  <div style="max-width:560px; margin:0 auto; background:white; border:1px solid #D8CCB4; padding:32px;">
    <p style="margin:0 0 4px; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#A8893F;">
      AVI ops monitor
    </p>
    <h1 style="margin:0 0 24px; font-size:22px; font-weight:600; color:#1F3A2E;">
      ${displayName(provider)} spend at ${(pct * 100).toFixed(0)}% of monthly cap
    </h1>

    <table style="width:100%; border-collapse:collapse; margin:0 0 24px; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px;">
      <tr>
        <td style="padding:6px 0; color:#5A6B5A;">Month-to-date spend</td>
        <td style="padding:6px 0; text-align:right; font-weight:600;">$${mtd.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#5A6B5A;">Monthly cap</td>
        <td style="padding:6px 0; text-align:right;">$${cap.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#5A6B5A;">Remaining headroom</td>
        <td style="padding:6px 0; text-align:right;">$${remaining.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#5A6B5A;">Daily run rate</td>
        <td style="padding:6px 0; text-align:right;">~$${rate.toFixed(2)}/day</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#5A6B5A;">At current rate, cap hits</td>
        <td style="padding:6px 0; text-align:right;">${projectedCapDate}</td>
      </tr>
    </table>

    <p style="margin:24px 0 12px; color:#2C2A26;">
      Three options, depending on what you're seeing:
    </p>
    <ol style="margin:0 0 24px 24px; padding:0; color:#2C2A26; font-family: ui-sans-serif, Inter, system-ui, sans-serif; font-size:14px;">
      <li style="margin:0 0 8px;">Raise the cap in the ${displayName(provider)} dashboard (you'll be billed for actual usage above the current cap).</li>
      <li style="margin:0 0 8px;">Reduce volume — temporarily disable the free scan, or tighten the rate limit from 3/IP/day to 1/IP/day.</li>
      <li style="margin:0 0 8px;">Let it ride and accept service goes dark when the cap hits.</li>
    </ol>

    <p style="margin:24px 0 0; font-size:13px; color:#5A6B5A; border-top:1px solid #D8CCB4; padding-top:16px;">
      You're receiving this because ${displayName(provider)} crossed
      ${(URGENT_THRESHOLD * 100).toFixed(0)}% of your <code style="font-family: ui-monospace, monospace;">SPEND_CAP_${provider.toUpperCase()}</code> setting.
      To change the threshold, edit <code style="font-family: ui-monospace, monospace;">SPEND_ALERT_THRESHOLD_URGENT</code> in <code>.env.local</code> and Vercel env vars.
      You'll get at most one of these per provider per 24 hours.
    </p>
  </div>
</body>
</html>`;
}

// ============================================================================
// Helpers
// ============================================================================

function startOfMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function daysOfMonthSoFar(): number {
  const now = new Date();
  return now.getUTCDate();
}

function daysRemainingInMonth(): number {
  const now = new Date();
  const last = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
  );
  return last.getUTCDate() - now.getUTCDate();
}

function projectCapDate(mtd: number, cap: number, rate: number): string {
  if (rate <= 0) return "—";
  const daysAtRate = Math.max(0, Math.ceil((cap - mtd) / rate));
  const projected = new Date();
  projected.setUTCDate(projected.getUTCDate() + daysAtRate);
  return projected.toLocaleDateString("en-US", {
    timeZone: process.env.CRON_TIMEZONE ?? "America/Los_Angeles",
    month: "short",
    day: "numeric",
  });
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
