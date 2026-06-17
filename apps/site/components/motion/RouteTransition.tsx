import type { ReactNode } from "react";

/**
 * Passthrough wrapper around page content.
 *
 * Previously this wrapped children in an AnimatePresence + motion.div
 * that did an opacity 0 → 1 cross-fade on every route change. That made
 * content rendering depend on framer-motion's animation lifecycle, which
 * is the exact thing causing pages to occasionally land blank. With this
 * passthrough, page navigation is instant and content is always visible.
 *
 * Kept as a component (rather than removed) so the layout.tsx markup
 * stays unchanged and we can re-introduce a safer page transition later
 * without touching every page.
 */
export default function RouteTransition({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
