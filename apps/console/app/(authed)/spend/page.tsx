import { PageHeader } from "@/components/Shell";
import { Card, Stat, Tag } from "@/components/Card";
import {
  formatUsd,
  getMonthlySpend,
  getRecentSpendAlerts,
  relativeTime,
} from "@/lib/data/stats";
import { supabaseAdmin } from "@practical-informatics/avi";

export const dynamic = "force-dynamic";

async function getCallCounts() {
  try {
    const supabase = supabaseAdmin();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, count } = await supabase
      .from("api_calls")
      .select("status", { count: "exact" })
      .gte("created_at", since.toISOString());

    const total = count ?? 0;
    let errors = 0;
    let rateLimited = 0;
    for (const row of data ?? []) {
      if (row.status === "error" || row.status === "timeout") errors++;
      if (row.status === "rate_limited") rateLimited++;
    }
    return { total, errors, rateLimited };
  } catch {
    return { total: 0, errors: 0, rateLimited: 0 };
  }
}

export default async function SpendPage() {
  const [spend, calls, alerts] = await Promise.all([
    getMonthlySpend(),
    getCallCounts(),
    getRecentSpendAlerts(20),
  ]);

  return (
    <>
      <PageHeader
        title="Spend"
        description="Provider spend over the last 30 days. The ops monitor sends a weekly summary every Monday and an immediate alert if any provider crosses 95% of its monthly cap."
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Spend, 30d" value={formatUsd(spend.total)} />
        <Stat
          label="API calls, 30d"
          value={calls.total.toLocaleString()}
          hint={
            calls.errors > 0
              ? `${calls.errors} errors${calls.rateLimited > 0 ? ` · ${calls.rateLimited} rate-limited` : ""}`
              : "All clean"
          }
        />
        <Stat
          label="Spend alerts, 30d"
          value={alerts.length}
          hint={alerts.length === 0 ? "No threshold crossings" : "Latest below"}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
            By provider
          </h2>
          <Card>
            {Object.keys(spend.byProvider).length === 0 ? (
              <div className="text-sm text-muted">
                No API calls logged in the last 30 days.
              </div>
            ) : (
              <table className="console-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th className="text-right">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(spend.byProvider)
                    .sort(([, a], [, b]) => b - a)
                    .map(([provider, cost]) => (
                      <tr key={provider}>
                        <td className="text-charcoal">{provider}</td>
                        <td className="text-right font-medium text-forest-dark tabular-nums">
                          {formatUsd(cost)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
            Alert history
          </h2>
          <Card>
            {alerts.length === 0 ? (
              <div className="text-sm text-muted">
                No spend alerts have fired. Good news.
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {alerts.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <div>
                      <Tag tone="gold">{a.provider}</Tag>{" "}
                      <span className="text-charcoal">
                        {Number(a.pct_of_cap).toFixed(0)}% of cap
                      </span>
                    </div>
                    <div className="text-xs text-muted">
                      {relativeTime(a.triggered_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
