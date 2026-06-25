import Link from "next/link";

/**
 * Run-audit launcher. Renders as a link styled like a button that
 * navigates to the parameter form at /subjects/[id]/run?mode=…
 *
 * Going through the form lets the operator confirm or override subject
 * fields before the orchestrator fires — matching the "realistic
 * scenario" you'd get from a customer-facing intake flow.
 */
export function RunAuditForm({
  subjectId,
  mode,
  variant,
}: {
  subjectId: string;
  mode: "free" | "paid";
  variant: "header" | "panel";
}) {
  const label = mode === "free" ? "Run free scan" : "Run V3 assessment";
  const href = `/subjects/${subjectId}/run?mode=${mode}`;

  if (variant === "header") {
    return (
      <Link
        href={href}
        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
          mode === "paid"
            ? "bg-forest text-white border-forest hover:bg-forest-dark"
            : "bg-paper text-charcoal border-rule-strong hover:bg-cream-dim"
        }`}
      >
        {label} →
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`block text-center w-full px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
        mode === "paid"
          ? "bg-forest text-white border-forest hover:bg-forest-dark"
          : "bg-paper text-charcoal border-rule-strong hover:bg-cream-dim"
      }`}
    >
      {label}
    </Link>
  );
}
