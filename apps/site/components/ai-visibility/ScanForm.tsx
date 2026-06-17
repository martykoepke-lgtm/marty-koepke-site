"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/ui/Icons";

/**
 * Free AI Visibility Scan form.
 *
 * Submits to /api/submissions which runs the lightweight Crawler against
 * the entered URL, writes the row to Supabase, and returns a redirect URL
 * to the teaser results page.
 */
export default function ScanForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [findCompetitorsForMe, setFindCompetitorsForMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setErrorField(null);

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      url: formData.get("url"),
      email: formData.get("email"),
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      company_name: formData.get("company_name"),
      industry: formData.get("industry"),
      location: formData.get("location") || undefined,
      competitor_1: formData.get("competitor_1") || undefined,
      competitor_2: formData.get("competitor_2") || undefined,
      find_competitors_for_me: findCompetitorsForMe,
      target_query: formData.get("target_query") || undefined,
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        setErrorField(data.field ?? null);
        setSubmitting(false);
        return;
      }

      // Success — navigate to the teaser results page
      router.push(data.redirectTo);
    } catch {
      setErrorMsg(
        "We couldn't reach our server. Check your connection and try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-7" noValidate>
      <Field
        label="Your company name"
        name="company_name"
        type="text"
        required
        autoComplete="organization"
        placeholder="Practical Informatics LLC"
      />

      <Field
        label="Your website URL"
        name="url"
        type="url"
        placeholder="https://yourbusiness.com (or leave blank if you don't have one yet)"
        help="Optional. Without a URL we can still check whether AI surfaces you in category searches — but we can't check your website-readiness signals."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="First name"
          name="first_name"
          type="text"
          required
          autoComplete="given-name"
          placeholder="Marty"
        />
        <Field
          label="Last name"
          name="last_name"
          type="text"
          required
          autoComplete="family-name"
          placeholder="Koepke"
        />
      </div>

      <Field
        label="Your email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@yourbusiness.com"
      />

      <Field
        label="What does your business do?"
        name="industry"
        type="text"
        required
        placeholder="e.g. fractional CFO for SaaS startups"
        help="One sentence. Helps us run the right AI queries for you."
      />

      <Field
        label="Your location"
        name="location"
        type="text"
        placeholder="City, state"
        help="Optional — improves the local-visibility check."
      />

      {/* Competitors — either list two, or let us find them */}
      <div className="rounded-lg border border-tan bg-cream-dim p-5">
        <p className="font-serif text-sm font-semibold text-forest">
          Competitors (optional)
        </p>
        <p className="mt-1 text-sm text-moss">
          We&apos;ll compare your AI visibility against two businesses
          AI is recommending in your space.
        </p>

        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="find_competitors_for_me"
            checked={findCompetitorsForMe}
            onChange={(e) => setFindCompetitorsForMe(e.target.checked)}
            className="mt-1 h-4 w-4 accent-forest"
          />
          <span className="text-sm leading-relaxed text-charcoal">
            Find two for me — I&apos;ll trust your judgment
          </span>
        </label>

        {!findCompetitorsForMe && (
          <div className="mt-5 space-y-4">
            <Field
              label="Competitor 1 URL"
              name="competitor_1"
              type="url"
              placeholder="https://competitor.com"
              compact
            />
            <Field
              label="Competitor 2 URL"
              name="competitor_2"
              type="url"
              placeholder="https://anothercompetitor.com"
              compact
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="target_query" className="block font-serif text-sm font-semibold text-forest">
          What&apos;s the one query you wish AI would answer with you on top?
        </label>
        <p className="mt-1 text-sm text-moss">
          Optional. Example: <em>&ldquo;Best fractional CFO for a Series B SaaS company.&rdquo;</em>
        </p>
        <textarea
          id="target_query"
          name="target_query"
          rows={2}
          className="mt-3 w-full rounded-md border border-tan bg-cream px-4 py-3 text-charcoal placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          placeholder="Type the query a customer might ask AI..."
        />
      </div>

      <div className="border-t border-tan pt-7">
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 rounded-md border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            {errorMsg}
            {errorField && (
              <span className="ml-1 text-red-700">
                (field: <code>{errorField}</code>)
              </span>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-7 py-3.5 text-base font-semibold text-cream transition-colors duration-300 hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        >
          {submitting ? "Submitting your order..." : "Order the AVI"}
          {!submitting && <ArrowRightIcon className="h-4 w-4" />}
        </button>
        <p className="mt-3 text-xs text-moss">
          We&apos;ll email you a copy. No spam. See our{" "}
          <a href="/privacy" className="underline hover:text-forest">
            privacy policy
          </a>
          .
        </p>
      </div>
    </form>
  );
}

/* ---------- Field primitive ---------- */

function Field({
  label,
  name,
  type,
  required,
  placeholder,
  help,
  autoComplete,
  compact = false,
}: {
  label: string;
  name: string;
  type: "text" | "email" | "url";
  required?: boolean;
  placeholder?: string;
  help?: string;
  autoComplete?: string;
  compact?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className={
          compact
            ? "block text-sm font-semibold text-forest"
            : "block font-serif text-sm font-semibold text-forest"
        }
      >
        {label}
        {required && <span className="ml-1 text-gold-dark">*</span>}
      </label>
      {help && !compact && (
        <p className="mt-1 text-sm text-moss">{help}</p>
      )}
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={
          compact
            ? "mt-2 w-full rounded-md border border-tan bg-cream px-3 py-2 text-sm text-charcoal placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            : "mt-3 w-full rounded-md border border-tan bg-cream px-4 py-3 text-charcoal placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
        }
      />
    </div>
  );
}
