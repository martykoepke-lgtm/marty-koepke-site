import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/Shell";
import { Card } from "@/components/Card";
import { getSubject } from "@/lib/data/subjects";
import { updateSubjectAction } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function EditSubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const subject = await getSubject(id);
  if (!subject) notFound();

  const competitorsText = (subject.competitors ?? [])
    .map((c) => {
      const aliases = c.aliases?.length ? ` | ${c.aliases.join(", ")}` : "";
      return `${c.canonical_name}${aliases}`;
    })
    .join("\n");
  const aliasesText = (subject.aliases ?? []).join("\n");
  const diffText = (subject.known_differentiation_terms ?? []).join("\n");

  return (
    <>
      <div className="mb-3">
        <Link href={`/subjects/${id}`} className="text-xs text-muted hover:text-charcoal">
          Back to {subject.canonical_name}
        </Link>
      </div>

      <PageHeader
        title="Edit business"
        description={`Update the plain-language business details used for future assessments of ${subject.canonical_name}. Past audits keep their frozen snapshot.`}
      />

      {sp.error && (
        <div className="mb-6 border border-red-200 bg-red-50 rounded-md p-3 text-sm text-red-900">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      {sp.saved && (
        <div className="mb-6 border border-forest/30 bg-forest/5 rounded-md p-3 text-sm text-forest-dark">
          Saved.
        </div>
      )}

      <form action={updateSubjectAction} className="space-y-6">
        <input type="hidden" name="subjectId" value={id} />

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
                  placeholder="One per line"
                  className="form-input font-mono text-xs"
                />
              </Field>
              <Field
                label="Competitors"
                full
                hint={'Optional. One per line. You can use "Name" or "Name | other name".'}
              >
                <textarea
                  name="competitors"
                  defaultValue={competitorsText}
                  rows={4}
                  placeholder="One per line"
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
                  placeholder="One per line"
                  className="form-input font-mono text-xs"
                />
              </Field>
            </div>
          </Card>
        </section>

        <div className="flex items-center justify-between pt-4 border-t border-rule">
          <Link
            href={`/subjects/${id}`}
            className="text-sm text-muted hover:text-charcoal"
          >
            Cancel
          </Link>
          <div className="flex gap-3">
            <button
              type="submit"
              name="action"
              value="save"
              className="px-5 py-2.5 rounded-md text-sm font-semibold bg-forest text-white border border-forest hover:bg-forest-dark transition-colors"
            >
              Save changes
            </button>
            <button
              type="submit"
              name="action"
              value="save_and_run_free"
              className="px-5 py-2.5 rounded-md text-sm font-semibold bg-paper text-charcoal border border-rule-strong hover:bg-cream-dim transition-colors"
            >
              Save + run free scan
            </button>
          </div>
        </div>
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
      <label className="block text-xs text-muted uppercase tracking-wider mb-1.5 font-medium">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      {children}
      {hint && <div className="text-xs text-muted mt-1.5 leading-relaxed">{hint}</div>}
    </div>
  );
}
