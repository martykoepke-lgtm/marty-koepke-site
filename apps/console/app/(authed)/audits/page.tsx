import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Card, Tag } from "@/components/Card";
import { supabaseAdmin } from "@practical-informatics/avi";
import { relativeTime } from "@/lib/data/stats";

export const dynamic = "force-dynamic";

async function listAudits() {
  try {
    const supabase = supabaseAdmin();
    const { data } = await supabase
      .from("audits_v2")
      .select(
        "id, subject_id, mode, status, rubric_version, composite_score, tier, started_at, completed_at, total_cost_usd"
      )
      .order("started_at", { ascending: false })
      .limit(100);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function AuditsPage() {
  const audits = await listAudits();

  return (
    <>
      <PageHeader
        title="Audits"
        description="Every audit run, paid or free, ordered by most recent. Click an audit to see the full evidence — driver scores, recommendations, crawler findings, corroboration. To start a new run, pick a subject."
        action={
          <Link
            href="/subjects"
            className="px-4 py-2 rounded-md text-sm font-semibold bg-forest text-white border border-forest hover:bg-forest-dark transition-colors"
          >
            + Run new audit
          </Link>
        }
      />

      <Card className="p-0 overflow-hidden">
        {audits.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-sm text-charcoal mb-1">No audits yet</div>
            <div className="text-xs text-muted max-w-md mx-auto">
              The v2 CLI currently writes to{" "}
              <code className="bg-cream-dim px-1.5 py-0.5 rounded">audits/</code>{" "}
              on disk. When DB persistence is wired in the orchestrator, runs
              will appear here automatically.
            </div>
          </div>
        ) : (
          <table className="console-table">
            <thead>
              <tr>
                <th>Audit</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Tier</th>
                <th>Composite</th>
                <th>Cost</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link
                      href={`/audits/${a.id}`}
                      className="text-forest-dark font-mono text-xs hover:underline"
                    >
                      {a.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td>
                    <Tag tone={a.mode === "paid" ? "forest" : "muted"}>
                      {a.mode}
                    </Tag>
                  </td>
                  <td>
                    <Tag
                      tone={
                        a.status === "complete"
                          ? "forest"
                          : a.status === "failed"
                          ? "neutral"
                          : "gold"
                      }
                    >
                      {a.status}
                    </Tag>
                  </td>
                  <td>
                    {a.tier ? (
                      <Tag tone="gold">{a.tier}</Tag>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="tabular-nums">
                    {a.composite_score != null
                      ? Number(a.composite_score).toFixed(1)
                      : "—"}
                  </td>
                  <td className="text-xs text-muted tabular-nums">
                    {a.total_cost_usd != null
                      ? `$${Number(a.total_cost_usd).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="text-xs text-muted">
                    {relativeTime(a.started_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
