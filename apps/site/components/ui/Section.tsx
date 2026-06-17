import type { ReactNode } from "react";

type Tone = "cream" | "cream-dim" | "forest";

const tones: Record<Tone, string> = {
  cream: "bg-cream text-charcoal",
  "cream-dim": "bg-cream-dim text-charcoal",
  forest: "bg-forest text-cream",
};

/**
 * Standard section: generous vertical rhythm, centered max-width content,
 * optional background tone. Sections breathe — that is the brief.
 */
export default function Section({
  children,
  id,
  tone = "cream",
  className = "",
  width = "default",
}: {
  children: ReactNode;
  id?: string;
  tone?: Tone;
  className?: string;
  width?: "default" | "narrow" | "wide";
}) {
  const max =
    width === "narrow"
      ? "max-w-2xl"
      : width === "wide"
        ? "max-w-6xl"
        : "max-w-5xl";

  return (
    <section
      id={id}
      className={`${tones[tone]} px-6 py-20 sm:py-28 ${className}`}
    >
      <div className={`mx-auto ${max}`}>{children}</div>
    </section>
  );
}

export function SoftDivider() {
  return <div className="soft-divider mx-auto max-w-5xl" aria-hidden="true" />;
}
