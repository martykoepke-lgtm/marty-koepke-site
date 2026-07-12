"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Section sub-nav for the AI Visibility offering and its supporting content.
 * Sits directly under the main site Navbar so the page hero (and its CTA)
 * stays the clean focal element below.
 */
const ITEMS: Array<{ label: string; href: string; matchPrefix: string }> = [
  { label: "The offer", href: "/ai-visibility", matchPrefix: "/ai-visibility" },
  { label: "Our framework", href: "/our-framework", matchPrefix: "/our-framework" },
  {
    label: "The research",
    href: "/blog/why-ai-business-accuracy-matters",
    matchPrefix: "/blog/why-ai-business-accuracy-matters",
  },
];

export default function FrameworkSubNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-tan/40 bg-forest-dark">
      <nav
        aria-label="AI Visibility section"
        className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-2.5 text-sm"
      >
        {ITEMS.map((item) => {
          const active =
            pathname === item.matchPrefix ||
            pathname.startsWith(`${item.matchPrefix}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "text-cream underline decoration-gold decoration-2 underline-offset-8"
                  : "text-tan hover:text-cream transition-colors"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
