import { PageHeader } from "@/components/Shell";
import { Card, Tag } from "@/components/Card";
import { getRecentSubmissions, relativeTime } from "@/lib/data/stats";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const submissions = await getRecentSubmissions(50);

  return (
    <>
      <PageHeader
        title="Submissions"
        description="Free /scan submissions from the marketing site. New rows arrive whenever a visitor runs the Readiness Check."
      />

      <Card className="p-0 overflow-hidden">
        {submissions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted">
            No submissions yet.
          </div>
        ) : (
          <table className="console-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Email</th>
                <th>Source</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td className="text-sm max-w-xs truncate">
                    {s.url ?? <span className="text-muted">—</span>}
                  </td>
                  <td className="text-xs text-charcoal">
                    {s.email ?? <span className="text-muted">—</span>}
                  </td>
                  <td>
                    <Tag tone={s.source === "free_scan" ? "forest" : "muted"}>
                      {s.source}
                    </Tag>
                  </td>
                  <td>
                    <Tag
                      tone={
                        s.status === "email_captured" ||
                        s.status === "pdf_sent"
                          ? "forest"
                          : s.status === "pdf_failed"
                          ? "neutral"
                          : "muted"
                      }
                    >
                      {s.status}
                    </Tag>
                  </td>
                  <td className="text-xs text-muted">
                    {relativeTime(s.created_at)}
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
