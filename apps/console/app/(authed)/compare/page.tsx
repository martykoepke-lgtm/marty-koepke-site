import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Card, Stat, Tag } from "@/components/Card";
import { PillSelect } from "@/components/PillSelect";
import {
  listAllAudits,
  summarizeByIndustry,
  TIER_ORDER,
} from "@/lib/data/analytics";
import { relativeTime } from "@/lib/data/stats";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  industry?: string;
  type?: string;
  mode?: string;
  tier?: string;
}>;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const all = await listAllAudits();

  const filtered = all.filter((r) => {
    if (params.industry && r.industry !== params.industry) return false;
    if (params.type && r.subject_type !== params.type) return false;
    if (params.mode && r.mode !== params.mode) return false;
    if (params.tier && r.tier !== params.tier) return false;
    return true;
  });

  const industries = Array.from(new Set(all.map((r) => r.industry))).sort();
  const industrySummaries = summarizeByIndustry(filtered);

  const tierDistribution: Record<string, number> = {};
  for (const t of TIER_ORDER) tierDistribution[t] = 0;
  for (const r of filtered) {
    if (r.tier) tierDistribution[r.tier] = (tierDistribution[r.tier] ?? 0) + 1;
  }

  const avgComposite =
    filtered.length === 0
      ? 0
      : filtered.reduce((s, r) => s + (r.composite_score ?? 0), 0) /
        filtered.length;

  return (
    <>
      <PageHeader
        title="Compare"
        description="Cross-audit analytics. Slice the cohort by industry, subject type, mode, or tier. Click any row to drill into the full audit detail."
      />

      <FilterBar
        industries={industries}
        current={params}
        totalCount={all.length}
        filteredCount={filtered.length}
      />

      {all.length === 0 ? (
        <Card>
          <div className="px-2 py-6 text-center">
            <div className="text-sm text-charcoal mb-1">No completed audits yet</div>
            <div className="text-xs text-muted max-w-md mx-auto">
              The Compare view reads from{" "}
              <code className="bg-cream-dim px-1.5 py-0.5 rounded">audits_v2</code>{" "}
              where status = complete. Run a few audits from the{" "}
              <Link href="/subjects" className="text-forest-dark underline">
                Subjects
              </Link>{" "}
              page to populate this view.
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Stat
              label="Audits in view"
              value={filtered.length}
              hint={
                filtered.length === all.length
                  ? "Showing all"
                  : `Filtered from ${all.length}`
              }
            />
            <Stat
              label="Avg composite"
              value={avgComposite.toFixed(1)}
              hint="0-100"
            />
            <Stat
              label="Industries"
              value={industrySummaries.length}
              hint="In current filter"
            />
            <Stat
              label="Top tier"
              value={topTier(tierDistribution)}
              hint={`${filtered.filter((r) => r.tier === topTier(tierDistribution)).length} subject${filtered.filter((r) => r.tier === topTier(tierDistribution)).length === 1 ? "" : "s"}`}
            />
          </div>

          {/* Tier distribution band */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
              Tier distribution
            </h2>
            <Card>
              <TierBar distribution={tierDistribution} />
            </Card>
          </section>

          {/* Industry summary */}
          {industrySummaries.length > 1 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
                By industry
              </h2>
              <Card className="p-0 overflow-hidden">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Industry</th>
                      <th className="text-right">Count</th>
                      <th className="text-right">Avg composite</th>
                      <th className="text-right">Avg readiness</th>
                      <th className="text-right">Avg visibility</th>
                      <th>Tier mix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industrySummaries.map((s) => (
                      <tr key={s.industry}>
                        <td>
                          <Link
                            href={`/compare?industry=${encodeURIComponent(s.industry)}`}
                            className="text-forest-dark font-medium hover:underline"
                          >
                            {s.industry}
                          </Link>
                        </td>
                        <td className="text-right tabular-nums">{s.count}</td>
                        <td className="text-right tabular-nums">
                          {s.avgComposite.toFixed(1)}
                        </td>
                        <td className="text-right tabular-nums">
                          {s.avgReadiness.toFixed(1)}
                        </td>
                        <td className="text-right tabular-nums">
                          {s.avgVisibility != null
                            ? s.avgVisibility.toFixed(1)
                            : "—"}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {TIER_ORDER.filter(
                              (t) => (s.tierCounts[t] ?? 0) > 0
                            ).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-cream-dim text-charcoal border border-rule"
                              >
                                {t.slice(0, 4)} ·{" "}
                                {s.tierCounts[t]}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>
          )}

          {/* Comparison grid */}
          <section>
            <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
              Comparison grid
            </h2>
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Industry</th>
                      <th>Type</th>
                      <th>Mode</th>
                      <th className="text-right">Composite</th>
                      <th className="text-right">Readiness</th>
                      <th className="text-right">Visibility</th>
                      <th>Tier</th>
                      <th className="text-right">Cost</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.audit_id}>
                        <td>
                          <Link
                            href={`/audits/${r.audit_id}`}
                            className="text-forest-dark font-medium hover:underline"
                          >
                            {r.canonical_name}
                          </Link>
                        </td>
                        <td className="text-xs text-charcoal">
                          <Link
                            href={`/compare?industry=${encodeURIComponent(r.industry)}`}
                            className="hover:text-forest-dark hover:underline"
                          >
                            {r.industry}
                          </Link>
                        </td>
                        <td>
                          <Tag tone={r.subject_type === "company" ? "forest" : "gold"}>
                            {r.subject_type === "personal_brand"
                              ? "personal"
                              : "company"}
                          </Tag>
                        </td>
                        <td>
                          <Tag tone={r.mode === "paid" ? "forest" : "muted"}>
                            {r.mode}
                          </Tag>
                        </td>
                        <td className="text-right tabular-nums font-medium text-forest-dark">
                          {fmt(r.composite_score)}
                        </td>
                        <td className="text-right tabular-nums">
                          {fmt(r.readiness_score)}
                        </td>
                        <td className="text-right tabular-nums">
                          {fmt(r.visibility_score)}
                        </td>
                        <td>
                          {r.tier ? (
                            <Tag tone="gold">{r.tier}</Tag>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="text-right tabular-nums text-xs text-muted">
                          {r.total_cost_usd != null
                            ? `$${Number(r.total_cost_usd).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="text-xs text-muted">
                          {relativeTime(r.started_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      )}
    </>
  );
}

function FilterBar({
  industries,
  current,
  totalCount,
  filteredCount,
}: {
  industries: string[];
  current: { industry?: string; type?: string; mode?: string; tier?: string };
  totalCount: number;
  filteredCount: number;
}) {
  const hasFilter =
    current.industry || current.type || current.mode || current.tier;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted uppercase tracking-wider font-medium mr-2">
        Filter
      </span>

      <PillSelect
        param="industry"
        current={current.industry}
        options={[{ value: "", label: "All industries" }, ...industries.map((i) => ({ value: i, label: i }))]}
      />
      <PillSelect
        param="type"
        current={current.type}
        options={[
          { value: "", label: "All types" },
          { value: "company", label: "Companies" },
          { value: "personal_brand", label: "Personal brands" },
        ]}
      />
      <PillSelect
        param="mode"
        current={current.mode}
        options={[
          { value: "", label: "All modes" },
          { value: "free", label: "Free" },
          { value: "paid", label: "Paid" },
        ]}
      />
      <PillSelect
        param="tier"
        current={current.tier}
        options={[
          { value: "", label: "All tiers" },
          ...TIER_ORDER.map((t) => ({ value: t, label: t })),
        ]}
      />

      {hasFilter && (
        <Link
          href="/compare"
          className="text-muted hover:text-charcoal underline ml-2"
        >
          Clear
        </Link>
      )}

      <span className="ml-auto text-muted">
        {filteredCount} of {totalCount}
      </span>
    </div>
  );
}

function TierBar({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((s, n) => s + n, 0);
  if (total === 0)
    return <div className="text-sm text-muted">No audits in view.</div>;

  const tones: Record<string, string> = {
    Invisible: "bg-charcoal/30",
    Overlooked: "bg-charcoal/50",
    Emerging: "bg-gold/60",
    Discoverable: "bg-forest/70",
    "Agent-Ready": "bg-forest",
  };

  return (
    <div>
      <div className="flex h-3 rounded-md overflow-hidden border border-rule">
        {TIER_ORDER.map((t) => {
          const n = distribution[t] ?? 0;
          if (n === 0) return null;
          const pct = (n / total) * 100;
          return (
            <div
              key={t}
              className={tones[t]}
              style={{ width: `${pct}%` }}
              title={`${t}: ${n} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {TIER_ORDER.map((t) => {
          const n = distribution[t] ?? 0;
          if (n === 0) return null;
          return (
            <div key={t} className="flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${tones[t]}`} />
              <span className="text-charcoal">{t}</span>
              <span className="text-muted tabular-nums">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt(n: number | null): string {
  if (n == null) return "—";
  return Number(n).toFixed(1);
}

function topTier(distribution: Record<string, number>): string {
  const entries = Object.entries(distribution).filter(([, n]) => n > 0);
  if (entries.length === 0) return "—";
  entries.sort(([, a], [, b]) => b - a);
  return entries[0][0];
}
