"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

/**
 * Submit button that swaps to a clear running state via useFormStatus.
 * Must be a direct descendant of a form tag.
 */
export function RunSubmitButton({ mode }: { mode: "free" | "paid" }) {
  const { pending } = useFormStatus();
  const label = pending
    ? mode === "paid"
      ? "Running V3 assessment... don't close this tab"
      : "Running free scan..."
    : `Confirm and run ${mode === "paid" ? "V3 assessment" : "free scan"} ->`;

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-5 py-2.5 rounded-md text-sm font-semibold border transition-colors ${
        pending
          ? "bg-charcoal/40 text-white border-charcoal/40 cursor-wait"
          : "bg-forest text-white border-forest hover:bg-forest-dark"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Full-form running banner. Renders only while the form is pending.
 * Communicates expected duration so the operator knows to wait.
 */
export function RunningBanner({ mode }: { mode: "free" | "paid" }) {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div className="my-6 border border-white/80 bg-white/95 rounded-md p-5 text-charcoal shadow-sm backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <SpinnerIcon />
        <div className="flex-1">
          <div className="text-sm font-semibold text-forest-dark">
            {mode === "paid" ? "V3 assessment is running" : "Free scan is running"}
          </div>
          <div className="text-xs text-charcoal/80 mt-1 leading-relaxed">
            {mode === "paid" ? (
              <>
                The V3 AI Business Accuracy pipeline takes <strong>8-15 minutes</strong>:
                crawler, corroboration, live AI responses, claim extraction,
                source evidence, readiness scoring, measured outcomes, and persistence.
                Leave this tab open. Navigation does not stop a run after it starts.
                You will be redirected to the audit detail page when it completes.
              </>
            ) : (
              <>
                The Readiness Check takes <strong>about 30 seconds</strong>: crawler,
                corroboration, 5 driver judges, and recommender. You will be
                redirected to the audit detail page when it completes.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RunFooterActions({
  subjectId,
  mode,
}: {
  subjectId: string;
  mode: "free" | "paid";
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex items-center justify-between pt-4 border-t border-white/55">
      {pending ? (
        <span className="text-sm text-paper/86">
          Run in progress. There is no live cancel yet.
        </span>
      ) : (
        <Link
          href={`/subjects/${subjectId}`}
          className="text-sm text-muted hover:text-charcoal"
        >
          Back
        </Link>
      )}
      <RunSubmitButton mode={mode} />
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-forest shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
