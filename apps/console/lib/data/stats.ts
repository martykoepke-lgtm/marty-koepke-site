import { supabaseAdmin } from "@practical-informatics/avi";

/**
 * Server-side stat queries for the dashboard.
 *
 * Every query is wrapped in a try/catch so a missing table or a
 * misconfigured connection degrades to a zero value instead of
 * crashing the page.
 */

export async function getAuditCounts() {
  try {
    const supabase = supabaseAdmin();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [{ count: totalAudits }, { count: monthAudits }, { count: completeMonth }] =
      await Promise.all([
        supabase.from("audits_v2").select("id", { count: "exact", head: true }),
        supabase
          .from("audits_v2")
          .select("id", { count: "exact", head: true })
          .gte("started_at", since.toISOString()),
        supabase
          .from("audits_v2")
          .select("id", { count: "exact", head: true })
          .gte("started_at", since.toISOString())
          .eq("status", "complete"),
      ]);

    return {
      totalAudits: totalAudits ?? 0,
      monthAudits: monthAudits ?? 0,
      completeMonth: completeMonth ?? 0,
    };
  } catch {
    return { totalAudits: 0, monthAudits: 0, completeMonth: 0 };
  }
}

export async function getMonthlySpend() {
  try {
    const supabase = supabaseAdmin();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data } = await supabase
      .from("api_calls")
      .select("provider, cost_estimated_usd")
      .gte("created_at", since.toISOString());

    if (!data) return { total: 0, byProvider: {} as Record<string, number> };

    let total = 0;
    const byProvider: Record<string, number> = {};
    for (const row of data) {
      const cost = Number(row.cost_estimated_usd ?? 0);
      total += cost;
      const provider = row.provider ?? "unknown";
      byProvider[provider] = (byProvider[provider] ?? 0) + cost;
    }
    return { total, byProvider };
  } catch {
    return { total: 0, byProvider: {} as Record<string, number> };
  }
}

export async function getRecentAudits(limit = 5) {
  try {
    const supabase = supabaseAdmin();
    const { data } = await supabase
      .from("audits_v2")
      .select(
        "id, subject_id, mode, status, composite_score, tier, started_at, completed_at"
      )
      .order("started_at", { ascending: false })
      .limit(limit);

    return data ?? [];
  } catch {
    return [];
  }
}

export async function getSubmissionsCount() {
  try {
    const supabase = supabaseAdmin();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [{ count: total }, { count: month }] = await Promise.all([
      supabase.from("submissions").select("id", { count: "exact", head: true }),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since.toISOString()),
    ]);
    return { total: total ?? 0, month: month ?? 0 };
  } catch {
    return { total: 0, month: 0 };
  }
}

export async function getRecentSubmissions(limit = 10) {
  try {
    const supabase = supabaseAdmin();
    const { data } = await supabase
      .from("submissions")
      .select("id, url, email, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getRecentSpendAlerts(limit = 5) {
  try {
    const supabase = supabaseAdmin();
    const { data } = await supabase
      .from("spend_alerts")
      .select("provider, pct_of_cap, triggered_at, alert_email_sent_at")
      .order("triggered_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export function formatUsd(amount: number): string {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return "<$0.01";
  return `$${amount.toFixed(2)}`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
