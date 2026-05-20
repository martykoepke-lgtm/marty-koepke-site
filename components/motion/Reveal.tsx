import type { ReactNode } from "react";

/**
 * Reveal / RevealGroup / RevealItem — passthrough wrappers.
 *
 * These used to wrap content in framer-motion components that hid it
 * (opacity:0) on first render and revealed it via `whileInView`. The
 * IntersectionObserver behind `whileInView` was unreliable in some
 * browser/timing combinations: above-the-fold elements that were already
 * in view at hydration occasionally never received the observer event,
 * leaving content stuck at opacity:0 forever (whole pages went blank).
 *
 * Reliability wins. These now render their children plainly, fully
 * visible from first paint. The site still has plenty of motion —
 * HeroBanner parallax, ThePath's drawing line + morph, modal entries,
 * accordion expand — but it's no longer load-bearing for content
 * visibility. Nothing in here hides anything.
 *
 * The exports keep the original signatures so no JSX changes are needed
 * elsewhere in the app.
 */

type AsTag = "div" | "section" | "li" | "span" | "ul";

export default function Reveal({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  /** Kept for API compatibility, no longer applied. */
  delay?: number;
  /** Kept for API compatibility, no longer applied. */
  direction?: "up" | "none";
  className?: string;
  as?: AsTag;
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

export function RevealGroup({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Kept for API compatibility, no longer applied. */
  stagger?: number;
  as?: AsTag;
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: AsTag;
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}
