import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/Shell";
import { Card, Tag } from "@/components/Card";
import { RunAuditForm } from "@/components/RunAuditForm";
import { DeleteSubjectButton } from "@/components/DeleteSubjectButton";
import { getSubject } from "@/lib/data/subjects";
import { supabaseAdmin } from "@practical-informatics/avi";
import { relativeTime } from "@/lib/data/stats";
import { deleteSubjectAction } from "./actions";

export const dynamic = "force-dynamic";

async function getAuditHistory(subjectUrl: string) {
  try {
    const supabase = supabaseAdmin();
    const { data: subj } = await supabase
      .from("subjects")
      .select("id")
      .eq("url", subjectUrl)
      .maybeSingle();
    if (!subj?.id) return [];
    const { data } = await supabase
      .from("audits_v2")
      .select(
        "id, mode, status, composite_score, tier, started_at, total_cost_usd"
      )
      .eq("subject_id", subj.id)
      .order("started_at", { ascending: false })
      .limit(20);
    return data ?? [];
  } catch {
    return [];
  }
}

type SearchParams = Promise<{ queued?: string }>;

export default async function SubjectDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: SearchParams;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const queuedMode = sp.queued === "paid" || sp.queued === "free" ? sp.queued : null;
  const subject = await getSubject(id);

  if (!subject) {
    notFound();
  }

  const history = subject.url ? await getAuditHistory(subject.url) : [];

  return (
    <>
      <div className="mb-3">
        <Link
          href="/subjects"
          className="text-xs text-muted hover:text-charcoal"
        >
          Back to businesses
        </Link>
      </div>

      {queuedMode && (
        <div className="mb-6 border border-gold/45 bg-white rounded-md p-4 text-sm text-charcoal shadow-sm">
          <div className="font-semibold text-forest-dark">
            {queuedMode === "paid"
              ? "Assessment queued"
              : "Free scan queued"}
          </div>
          <div className="mt-1 text-muted">
            {queuedMode === "paid"
              ? "Daizie is running your Assessment in the background. This typically takes 8–15 minutes for a full 32-response run — much shorter for smaller queryCounts. Refresh this page to see the audit appear in the history below once complete, or check the /audits list."
              : "The free scan was queued. Refresh in ~30 seconds to see it appear in the history."}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/subjects/${id}`}
              className="inline-flex px-3 py-1.5 rounded-md bg-forest text-white text-xs font-semibold hover:bg-forest-dark"
            >
              Refresh
            </Link>
            <Link
              href="/audits"
              className="text-xs text-muted hover:text-charcoal"
            >
              See all audits →
            </Link>
          </div>
        </div>
      )}

      <PageHeader
        title={subject.canonical_name}
        description={subject.url ?? undefined}
        action={
          <div className="flex gap-2">
            <Link
              href={`/subjects/${id}/edit`}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-rule-strong bg-paper text-charcoal hover:bg-cream-dim transition-colors"
            >
              Edit business
            </Link>
            <RunAuditForm subjectId={id} mode="free" variant="header" />
            <RunAuditForm subjectId={id} mode="paid" variant="header" />
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
              Business basics
            </h2>
            <Card>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Business type">
                  {subject.subject_type ? (
                    <Tag tone={subject.subject_type === "company" ? "forest" : "gold"}>
                      {subject.subject_type === "personal_brand"
                        ? "Person or personal brand"
                        : "Company or organization"}
                    </Tag>
                  ) : (
                    "-"
                  )}
                </Field>
                <Field label="What it sells or does">{subject.industry ?? "-"}</Field>
                <Field label="Where it serves customers">{subject.location ?? "-"}</Field>
                <Field label="Who it is for">{subject.buyer_type ?? "-"}</Field>
                <Field label="What AI should understand" full>
                  {subject.problem ?? "-"}
                </Field>
                <Field label="Other names AI might see" full>
                  {subject.aliases?.length ? subject.aliases.join(", ") : "-"}
                </Field>
              </dl>
            </Card>
          </section>

          {subject.competitors && subject.competitors.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
                Competitors
              </h2>
              <Card>
                <ul className="space-y-2 text-sm">
                  {subject.competitors.map((c, i) => (
                    <li key={i} className="flex items-baseline gap-2">
                      <span className="font-medium text-charcoal">
                        {c.canonical_name}
                      </span>
                      {c.aliases && c.aliases.length > 0 && (
                        <span className="text-xs text-muted">
                          ({c.aliases.join(", ")})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {subject.known_differentiation_terms &&
            subject.known_differentiation_terms.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
                  What makes it different
                </h2>
                <Card>
                  <div className="flex flex-wrap gap-1.5">
                    {subject.known_differentiation_terms.map((t) => (
                      <Tag key={t} tone="neutral">
                        {t}
                      </Tag>
                    ))}
                  </div>
                </Card>
              </section>
            )}

          <section>
            <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
              Audit history
            </h2>
            <Card className="p-0 overflow-hidden">
              {history.length === 0 ? (
                <div className="px-5 py-6 text-sm text-muted">
                  No audits run yet for this business. Use the buttons above to
                  start one.
                </div>
              ) : (
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Audit</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Tier</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((a) => (
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
                        <td className="tabular-nums">
                          {a.composite_score != null
                            ? Number(a.composite_score).toFixed(1)
                            : "-"}
                        </td>
                        <td>
                          {a.tier ? (
                            <Tag tone="gold">{a.tier}</Tag>
                          ) : (
                            <span className="text-muted text-xs">-</span>
                          )}
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
          </section>
        </div>

        <aside className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
              Run an assessment
            </h2>
            <Card>
              <p className="text-xs text-muted mb-4 leading-relaxed">
                Free scan checks the website basics. V3 assessment tests live AI
                answers, checks source support, and measures whether AI gets the
                business right.
              </p>
              <div className="space-y-3">
                <RunAuditForm subjectId={id} mode="free" variant="panel" />
                <RunAuditForm subjectId={id} mode="paid" variant="panel" />
              </div>
              <p className="text-xs text-muted mt-4 leading-relaxed">
                V3 assessment runs can take several minutes. Leave the tab open
                until the report loads.
              </p>
            </Card>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
              Local file
            </h2>
            <Card>
              <code className="block bg-cream-dim border border-rule rounded-md px-2.5 py-1.5 text-xs text-charcoal break-all">
                packages/avi/subjects/v1/{id}.json
              </code>
            </Card>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-3">
              Delete business
            </h2>
            <Card>
              <p className="text-xs text-muted mb-4 leading-relaxed">
                Removes this business from the active list. Past audit reports
                stay in history.
              </p>
              <form action={deleteSubjectAction}>
                <input type="hidden" name="subjectId" value={id} />
                <DeleteSubjectButton businessName={subject.canonical_name} />
              </form>
            </Card>
          </section>
        </aside>
      </div>
    </>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs text-muted uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-charcoal">{children}</dd>
    </div>
  );
}
