import Link from "next/link";
import { PageHeader } from "@/components/Shell";
import { Card } from "@/components/Card";
import { createSubjectAction } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function NewSubjectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = (await searchParams) ?? {};

  return (
    <>
      <div className="mb-3">
        <Link href="/subjects" className="text-xs text-muted hover:text-charcoal">
          Back to businesses
        </Link>
      </div>

      <PageHeader
        title="Add business"
        description="Add the basics we need to test whether AI can find, describe, and recommend the business for sensible reasons."
      />

      {params.error && (
        <div className="mb-6 border border-red-200 bg-red-50 rounded-md p-3 text-sm text-red-900">
          {decodeURIComponent(params.error)}
        </div>
      )}

      <form action={createSubjectAction} className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider mb-3">
            Business basics
          </h2>
          <Card>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Company name" required hint="Use the name customers know.">
                <input
                  name="canonical_name"
                  required
                  placeholder="e.g. Acme Corp"
                  className="form-input"
                />
              </Field>
              <Field label="Website" required hint="Use the main website or best page about the business.">
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://example.com"
                  className="form-input"
                />
              </Field>
              <Field label="What does it sell or do?" required hint="Use plain words a customer would use.">
                <input
                  name="industry"
                  required
                  placeholder="e.g. accounting firm for small businesses"
                  className="form-input"
                />
              </Field>
              <Field label="Business type" required>
                <select name="subject_type" defaultValue="company" className="form-input">
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
          <p className="text-xs text-muted mb-3 leading-relaxed">
            Keep this simple. The tool does the deeper accuracy and source-checking work.
          </p>
          <Card>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Where does it serve customers?">
                <input
                  name="location"
                  placeholder="e.g. California, United States, online"
                  className="form-input"
                />
              </Field>
              <Field label="Who is it for?">
                <input
                  name="buyer_type"
                  placeholder="e.g. small business owners"
                  className="form-input"
                />
              </Field>
              <Field label="What should AI understand about it?" full>
                <textarea
                  name="problem"
                  rows={3}
                  placeholder="e.g. We help small businesses understand whether AI describes them accurately and what to fix first."
                  className="form-input"
                />
              </Field>
              <Field label="Other names AI might see" full hint="Optional. One per line.">
                <textarea
                  name="aliases"
                  rows={3}
                  placeholder="Acme\nAcme Inc.\nACME"
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
                  rows={4}
                  placeholder="Competitor One\nCompetitor Two | alt-name"
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
                  rows={3}
                  placeholder="specialty niche\nsignature method\nplain-language point of view"
                  className="form-input font-mono text-xs"
                />
              </Field>
            </div>
          </Card>
        </section>

        <div className="flex items-center justify-between pt-4 border-t border-rule">
          <Link
            href="/subjects"
            className="text-sm text-muted hover:text-charcoal"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-md text-sm font-semibold bg-forest text-white border border-forest hover:bg-forest-dark transition-colors"
          >
            Create business
          </button>
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
