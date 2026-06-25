/**
 * Cross-audit analytics queries — power the Compare page.
 *
 * Pulls from `audits_v2` joined to `audit_subjects_snapshot` so the
 * subject metadata reflects what the audit actually saw (not the
 * possibly-edited live subject row).
 */

import { supabaseAdmin } from "@practical-informatics/avi";

export type ComparisonRow = {
  audit_id: string;
  subject_id: string;
  canonical_name: string;
  industry: string;
  subject_type: string;
  url: string;
  mode: "free" | "paid";
  status: string;
  rubric_version: string;
  composite_score: number | null;
  readiness_score: number | null;
  visibility_score: number | null;
  tier: string | null;
  total_cost_usd: number | null;
  started_at: string;
};

export async function listAllAudits(): Promise<ComparisonRow[]> {
  try {
    const supabase = supabaseAdmin();
    const { data } = await supabase
      .from("audits_v2")
      .select(
        `
        id,
        subject_id,
        mode,
        status,
        rubric_version,
        composite_score,
        readiness_score,
        visibility_score,
        tier,
        total_cost_usd,
        started_at,
        snapshot:audit_subjects_snapshot!inner(canonical_name, industry, subject_type, url)
      `
      )
      .eq("status", "complete")
      .order("composite_score", { ascending: false, nullsFirst: false })
      .limit(500);
    if (!data) return [];
    return data.map((row: any) => {
      const snap = Array.isArray(row.snapshot) ? row.snapshot[0] : row.snapshot;
      return {
        audit_id: row.id,
        subject_id: row.subject_id,
        canonical_name: snap?.canonical_name ?? "—",
        industry: snap?.industry ?? "—",
        subject_type: snap?.subject_type ?? "—",
        url: snap?.url ?? "",
        mode: row.mode,
        status: row.status,
        rubric_version: row.rubric_version,
        composite_score: row.composite_score,
        readiness_score: row.readiness_score,
        visibility_score: row.visibility_score,
        tier: row.tier,
        total_cost_usd: row.total_cost_usd,
        started_at: row.started_at,
      };
    });
  } catch {
    return [];
  }
}

export type IndustrySummary = {
  industry: string;
  count: number;
  avgComposite: number;
  avgReadiness: number;
  avgVisibility: number | null;
  tierCounts: Record<string, number>;
};

export function summarizeByIndustry(rows: ComparisonRow[]): IndustrySummary[] {
  const groups = new Map<string, ComparisonRow[]>();
  for (const row of rows) {
    const key = row.industry || "—";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const out: IndustrySummary[] = [];
  for (const [industry, items] of groups) {
    const composites = items.map((r) => r.composite_score ?? 0);
    const readinesses = items.map((r) => r.readiness_score ?? 0);
    const visibilities = items
      .map((r) => r.visibility_score)
      .filter((v): v is number => v != null);

    const tierCounts: Record<string, number> = {};
    for (const r of items) {
      const t = r.tier ?? "—";
      tierCounts[t] = (tierCounts[t] ?? 0) + 1;
    }

    out.push({
      industry,
      count: items.length,
      avgComposite: avg(composites),
      avgReadiness: avg(readinesses),
      avgVisibility: visibilities.length > 0 ? avg(visibilities) : null,
      tierCounts,
    });
  }
  return out.sort((a, b) => b.count - a.count);
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + Number(n), 0) / nums.length;
}

export type TierBand =
  | "Invisible"
  | "Overlooked"
  | "Emerging"
  | "Discoverable"
  | "Agent-Ready";

export const TIER_ORDER: TierBand[] = [
  "Invisible",
  "Overlooked",
  "Emerging",
  "Discoverable",
  "Agent-Ready",
];
