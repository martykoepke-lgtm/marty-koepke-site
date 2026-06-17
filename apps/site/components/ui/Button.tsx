"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "onForest" | "onPhoto";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-7 py-3.5 text-base font-semibold transition-colors duration-300 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-2";

const variants: Record<Variant, string> = {
  // Solid forest, darkens on hover. No shadow. No hype.
  primary: "bg-forest text-cream hover:bg-forest-dark",
  // Solid cream with a forest outline — pairs with primary in busy
  // contexts (e.g. the hero) where a transparent ghost would blend in.
  secondary:
    "bg-cream text-forest border border-forest hover:bg-cream-dim",
  // Quiet outline for secondary actions on calm cream sections.
  ghost:
    "border border-tan bg-transparent text-forest hover:border-forest hover:bg-cream-dim",
  // For use on a forest-green background (final CTA sections). Cream pill,
  // forest text — high contrast, easy to read.
  onForest: "bg-cream text-forest hover:bg-cream-dim",
  // For use over a photo (the home hero). Outlined, light text, readable.
  onPhoto:
    "border border-cream/80 bg-cream/10 text-cream backdrop-blur-sm hover:bg-cream/20",
};

function isExternal(href: string) {
  return (
    href.startsWith("mailto:") ||
    href.startsWith("http") ||
    href.startsWith("tel:")
  );
}

export default function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const cls = `${base} ${variants[variant]} ${className}`;

  if (isExternal(href)) {
    const newTab = href.startsWith("http");
    return (
      <a
        href={href}
        className={cls}
        {...(newTab
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
        {newTab && (
          <span className="sr-only"> (opens in new tab)</span>
        )}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
