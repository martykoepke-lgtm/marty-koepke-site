import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/Shell";
import { Card } from "@/components/Card";
import { RunningBanner, RunFooterActions } from "@/components/RunFormStatus";
import { getRecentCompletedAuditForSubjectUrl } from "@/lib/data/audits";
import { getSubject } from "@/lib/data/subjects";
import { runAuditWithParamsAction } from "./actions";

type SearchParams = Promise<{ mode?: string; error?: string }>;

export const dynamic = "force-dynamic";

export default async function RunAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const mode = (sp.mode === "paid" ? "paid" : "free") as "free" | "paid";
  const subject = await getSubject(id);
  if (!subject) notFound();
  const recentCompletedAudit =
    mode === "paid"
      ? await getRecentCompletedAuditForSubjectUrl(subject.url, 90)
      : null;

  const competitorsText = (subject.competitors ?? [])
    .map((c) => {
      const url = c.url ? ` | ${c.url}` : "";
      const aliases = c.aliases?.length ? ` | ${c.aliases.join(", ")}` : "";
      return `${c.canonical_name}${url}${aliases}`;
    })
    .join("\n");

  const aliasesText = (subject.aliases ?? []).join("\n");
  const diffText = (subject.known_differentiation_terms ?? []).join("\n");

  const costEstimate = mode === "free" ? "~$0.40" : "~$2-4";
  const timeEstimate = mode === "free" ? "~30 seconds" : "8-15 minutes";

  return (
    <>
      <div className="mb-3">
        <Link href={`/subjects/${id}`} className="text-xs text-muted hover:text-charcoal">
          Back to {subject.canonical_name}
        </Link>
      </div>

      <PageHeader
        title={mode === "paid" ? "Run V3 assessment" : "Run free scan"}
        description="Confirm the business basics before running. The tool will do the deeper accuracy, source, and recommendation checks from there."
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat
          label="Mode"
          value={mode === "paid" ? "Daizie AI Visibility Assessment" : "Free Readiness Check"}
        />
        <Stat label="Estimated runtime" value={timeEstimate} />
        <Stat label="Estimated cost" value={costEstimate} />
      </div>

      {sp.error && (
        <div className="mb-6 border border-red-200 bg-red-50 rounded-md p-3 text-sm text-red-900">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      {recentCompletedAudit && (
        <div className="mb-6 border border-gold/45 bg-white rounded-md p-4 text-sm text-charcoal shadow-sm">
          <div className="font-semibold text-forest-dark">
            A recent V3 assessment completed
          </div>
          <div className="mt-1 text-muted">
            The last paid run for this business saved successfully. If the browser
            did not redirect after the long run, open the completed report here.
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/audits/${recentCompletedAudit.id}`}
              className="inline-flex px-3 py-1.5 rounded-md bg-forest text-white text-xs font-semibold hover:bg-forest-dark"
            >
              Open completed report
            </Link>
            <span className="text-xs text-muted">
              {recentCompletedAudit.query_count ?? 0} questions x{" "}
              {recentCompletedAudit.engine_count ?? 0} AI systems
              {recentCompletedAudit.tier ? ` • ${recentCompletedAudit.tier}` : ""}
            </span>
          </div>
        </div>
      )}

      <form action={runAuditWithParamsAction} className="space-y-6">
        <input type="hidden" name="subjectId" value={id} />
        <input type="hidden" name="mode" value={mode} />

        <section>
          <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
            Business basics
          </h2>
          <Card>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Company name" required>
                <input
                  name="canonical_name"
                  defaultValue={subject.canonical_name}
                  required
                  className="form-input"
                />
              </Field>
              <Field label="Website" required>
                <input
                  name="url"
                  type="url"
                  defaultValue={subject.url ?? ""}
                  required
                  className="form-input"
                />
              </Field>
              <Field label="What does it sell or do?" required hint="Use plain words a customer would use.">
                <input
                  name="industry"
                  defaultValue={subject.industry ?? ""}
                  required
                  className="form-input"
                />
              </Field>
              <Field label="Business type" required>
                <select
                  name="subject_type"
                  defaultValue={subject.subject_type ?? "company"}
                  className="form-input"
                >
                  <option value="company">Company or organization</option>
                  <option value="personal_brand">Person or personal brand</option>
                </select>
              </Field>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
            Help AI understand the business
          </h2>
          <Card>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Where does it serve customers?">
                <input
                  name="location"
                  defaultValue={subject.location ?? ""}
                  placeholder="e.g. California, United States, online"
                  className="form-input"
                />
              </Field>
              <Field label="Who is it for?">
                <input
                  name="buyer_type"
                  defaultValue={subject.buyer_type ?? ""}
                  placeholder="e.g. small business owners"
                  className="form-input"
                />
              </Field>
              <Field label="What should AI understand about it?" full>
                <textarea
                  name="problem"
                  defaultValue={subject.problem ?? ""}
                  rows={3}
                  placeholder="What the business does, who it helps, and why it matters."
                  className="form-input"
                />
              </Field>
              <Field label="Other names AI might see" full hint="Optional. One per line.">
                <textarea
                  name="aliases"
                  defaultValue={aliasesText}
                  rows={3}
                  placeholder={"e.g.\nPI\nPractical Informatics LLC"}
                  className="form-input font-mono text-xs"
                />
              </Field>
              <Field
                label="Competitors"
                full
                hint={'One per line. Format: "Name | website.com | alias1, alias2". URL is required for paid audits if you want the competitor plotted on the Readiness × Visibility quadrant.'}
              >
                <textarea
                  name="competitors"
                  defaultValue={competitorsText}
                  rows={5}
                  placeholder={"e.g.\nHighland Dental | highland-dental.com\nMokelumne Smile Studio | mokesmile.com | MSS"}
                  className="form-input font-mono text-xs"
                />
              </Field>
              <Field
                label="What makes it different?"
                full
                hint="Optional. Include a specialty, method, point of view, or phrase AI should not flatten. One per line."
              >
                <textarea
                  name="known_differentiation_terms"
                  defaultValue={diffText}
                  rows={3}
                  placeholder={"e.g.\nAI Business Accuracy\nsignature method"}
                  className="form-input font-mono text-xs"
                />
              </Field>
            </div>
          </Card>
        </section>

        {mode === "paid" && (
          <section>
            <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
              Run settings
            </h2>
            <Card>
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Field
                  label="Prompt set"
                  hint="Uses eight company-centered questions about what the business does, services, pricing, process, competitors, differentiation, problems solved, and promised outcome."
                >
                  <select name="queryCount" defaultValue="8" className="form-input">
                    <option value="8">8-question V3 business accuracy test</option>
                  </select>
                </Field>
                <Field
                  label="AI systems"
                  hint="Runs live answers, then checks claims against source evidence."
                >
                  <div className="text-sm text-charcoal py-1.5">
                    ChatGPT, Claude, Perplexity, Gemini
                  </div>
                </Field>
              </div>
            </Card>
          </section>
        )}

        <div className="mb-4 rounded-md border border-white/70 bg-paper px-4 py-3 text-charcoal shadow-sm">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              name="save_to_subject"
              value="1"
              defaultChecked
              className="accent-forest"
            />
            <span>Save these details for next time</span>
          </label>
        </div>

        <RunningBanner mode={mode} />

        <RunFooterActions subjectId={id} mode={mode} />
      </form>

      <style>{`
        .form-input {
          width: 100%;
          background: #FAFAFA;
          border: 1px solid #D4D4D2;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #1A1A1A;
        }
        .form-input:focus {
          outline: none;
          border-color: #1F3A2E;
          background: #FFFFFF;
        }
        textarea.form-input {
          line-height: 1.5;
          resize: vertical;
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  children,
  required,
  full,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  full?: boolean;
  hint?: string;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-xs text-[#536C55] uppercase tracking-wider mb-1.5 font-medium">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      {children}
      {hint && <div className="text-xs text-[#667064] mt-1.5 leading-relaxed">{hint}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-xs text-muted uppercase tracking-wider font-medium">
        {label}
      </div>
      <div className="text-sm text-charcoal mt-1.5 font-medium">{value}</div>
    </Card>
  );
}
