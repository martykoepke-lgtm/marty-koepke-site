import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Card, Tag } from "@/components/Card";
import { RunAuditForm } from "@/components/RunAuditForm";
import { listSubjects } from "@/lib/data/subjects";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ deleted?: string; missing?: string }>;

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const subjects = await listSubjects();

  return (
    <>
      <PageHeader
        title="Businesses"
        description="Businesses you can run through the free scan or V3 assessment. Add a new one with the button on the right, or click an existing row to open its detail page."
        action={
          <Link
            href="/subjects/new"
            className="px-4 py-2 rounded-md text-sm font-semibold bg-forest text-white border border-forest hover:bg-forest-dark transition-colors"
          >
            + Add business
          </Link>
        }
      />

      {params.deleted && (
        <div className="mb-4 border border-forest/30 bg-forest/5 rounded-md p-3 text-sm text-forest-dark">
          {params.missing
            ? "That business file was already missing."
            : "Business deleted."}
        </div>
      )}

      <div className="mb-4 text-xs text-muted">
        Source: <code className="bg-cream-dim px-1.5 py-0.5 rounded">packages/avi/subjects/v1/</code>
        {" - "}
        {subjects.length} business{subjects.length === 1 ? "" : "es"}
      </div>

      <Card className="p-0 overflow-hidden">
        {subjects.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">
            No business JSON files found under{" "}
            <code className="bg-cream-dim px-1.5 py-0.5 rounded">packages/avi/subjects/v1/</code>.
          </div>
        ) : (
          <table className="console-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>What it sells or does</th>
                <th>Website</th>
                <th className="text-right">Run</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link
                      href={`/subjects/${s.id}`}
                      className="text-forest-dark font-medium hover:underline"
                    >
                      {s.canonical_name}
                    </Link>
                  </td>
                  <td>
                    {s.subject_type ? (
                      <Tag tone={s.subject_type === "company" ? "forest" : "gold"}>
                        {s.subject_type === "personal_brand"
                          ? "personal"
                          : "company"}
                      </Tag>
                    ) : (
                      <span className="text-muted text-xs">-</span>
                    )}
                  </td>
                  <td className="text-sm text-charcoal">
                    {s.industry ?? <span className="text-muted">-</span>}
                  </td>
                  <td className="text-xs text-muted max-w-xs truncate">
                    {s.url ?? "-"}
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-1.5">
                      <RunAuditForm subjectId={s.id} mode="free" variant="header" />
                      <RunAuditForm subjectId={s.id} mode="paid" variant="header" />
                    </div>
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
