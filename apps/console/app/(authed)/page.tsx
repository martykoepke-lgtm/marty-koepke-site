import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Card, Stat, Tag } from "@/components/Card";
import { listSubjects } from "@/lib/data/subjects";
import {
  formatUsd,
  getAuditCounts,
  getMonthlySpend,
  getRecentAudits,
  getRecentSpendAlerts,
  getSubmissionsCount,
  relativeTime,
} from "@/lib/data/stats";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [subjects, audits, spend, submissions, recent, alerts] = await Promise.all([
    listSubjects(),
    getAuditCounts(),
    getMonthlySpend(),
    getSubmissionsCount(),
    getRecentAudits(5),
    getRecentSpendAlerts(3),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of the AI Visibility Index — subjects, audit runs, scan submissions, and provider spend over the last 30 days."
      />

      {alerts.length > 0 && (
        <div className="mb-6 border border-gold/40 bg-gold/10 rounded-md p-4">
          <div className="text-sm font-medium text-gold-dark">
            {alerts.length} spend alert{alerts.length === 1 ? "" : "s"} in the last 30 days
          </div>
          <div className="text-xs text-charcoal/80 mt-1">
            Latest: {alerts[0].provider} crossed {Number(alerts[0].pct_of_cap).toFixed(0)}% of its cap{" "}
            {relativeTime(alerts[0].triggered_at)}.{" "}
            <Link href="/spend" className="underline text-forest-dark">
              See details
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat
          label="Subjects"
          value={subjects.length}
          hint="In the v1 cohort"
        />
        <Stat
          label="Audits, 30d"
          value={audits.monthAudits}
          hint={`${audits.completeMonth} complete`}
        />
        <Stat
          label="Spend, 30d"
          value={formatUsd(spend.total)}
          hint={
            Object.keys(spend.byProvider).length > 0
              ? `${Object.keys(spend.byProvider).length} providers`
              : "No calls logged yet"
          }
        />
        <Stat
          label="Free scans, 30d"
          value={submissions.month}
          hint={`${submissions.total} all-time`}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
            Recent audits
          </h2>
          <Card className="p-0 overflow-hidden">
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted">
                No audits yet. Run one from the{" "}
                <Link href="/subjects" className="text-forest-dark underline">
                  Subjects
                </Link>{" "}
                page.
              </div>
            ) : (
              <table className="console-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Mode</th>
                    <th>Tier</th>
                    <th>Composite</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Link
                          href={`/audits/${a.id}`}
                          className="text-forest-dark font-medium hover:underline"
                        >
                          {a.subject_id ? a.subject_id.slice(0, 8) : "—"}
                        </Link>
                      </td>
                      <td>
                        <Tag tone={a.mode === "paid" ? "forest" : "muted"}>
                          {a.mode}
                        </Tag>
                      </td>
                      <td>
                        {a.tier ? (
                          <Tag tone="gold">{a.tier}</Tag>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {a.composite_score != null
                          ? Number(a.composite_score).toFixed(1)
                          : "—"}
                      </td>
                      <td className="text-muted text-xs">
                        {relativeTime(a.started_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
            Spend by provider
          </h2>
          <Card>
            {Object.keys(spend.byProvider).length === 0 ? (
              <div className="text-sm text-muted">No API calls in the last 30 days.</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(spend.byProvider)
                  .sort(([, a], [, b]) => b - a)
                  .map(([provider, cost]) => (
                    <div
                      key={provider}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-charcoal">{provider}</span>
                      <span className="font-medium text-forest-dark tabular-nums">
                        {formatUsd(cost)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
