/**
 * All outbound links and CTAs in one place.
 *
 * Right now every primary CTA is a mailto:. When the real booking tool
 * (Cal.com / Calendly) and form backend (Formspree / Resend) are ready,
 * change the values here and the whole site updates. Nothing else needs
 * to be touched.
 */

export const CONTACT_EMAIL = "hello@martykoepke.com";

export const MARTYKOEPKE_URL = "https://martykoepke.com";

export const SOCIAL = {
  linkedin: "https://www.linkedin.com/in/marty-koepke",
  facebook: "https://www.facebook.com/profile.php?id=61564713020344",
  substack: "https://substack.com/@martykoepke",
} as const;

export const DAIZIE_URL = "https://daizie.ai";

/** Canonical Substack URL — pulled out for reuse in schema + copy. */
export const SUBSTACK_URL = SOCIAL.substack;

/** Build a mailto: with an optional prefilled subject + body. */
export function mailto(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  return `mailto:${CONTACT_EMAIL}${query ? `?${query}` : ""}`;
}

/**
 * The single most important CTA on the site: book a free 20-minute
 * conversation. Currently a Tally scheduling form.
 */
export const BOOK_CALL_HREF = "https://tally.so/r/xXVPgo";

export const BOOK_CALL_LABEL = "Schedule a free 20-minute conversation";

/**
 * Daizie checkout links — Stripe Payment Links from env vars.
 *
 * These are NEXT_PUBLIC_ because the customer's browser navigates to them.
 * .env.local uses TEST links during development; Vercel production env vars
 * should hold the LIVE links.
 *
 * If the env var isn't set, fall back to the contact page so the button
 * still does something useful (no broken links).
 */
export const AVI_CHECKOUT = {
  audit:
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_AUDIT || "/contact",
  monitoring:
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONITORING || "/contact",
} as const;

/**
 * Resolve a pricing-tier `ctaTarget` string from content.ts into a real URL.
 * Keeps the resolution logic in one place so content can stay declarative.
 */
export function resolveTierCta(target: string): string {
  if (target === "STRIPE_LINK_AUDIT") return AVI_CHECKOUT.audit;
  if (target === "STRIPE_LINK_MONITORING") return AVI_CHECKOUT.monitoring;
  if (target === "BOOK_CALL") return BOOK_CALL_HREF;
  if (target === "SCAN") return "/scan";
  return target; // already a path/URL
}
