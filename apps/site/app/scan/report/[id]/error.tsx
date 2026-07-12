"use client";

/**
 * Error boundary for /scan/report/[id].
 *
 * Catches unhandled exceptions from the server component render so a
 * customer clicking their emailed report link never sees the Vercel
 * "Application error" fallback. Renders a Daizie-branded card that
 * points them at us for help.
 */

import { useEffect } from "react";

export default function ScanReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[scan/report/[id]] boundary caught:", error);
  }, [error]);

  return (
    <div className="daizie-shell">
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />
        <article className="daizie-pane daizie-hero-pane">
          <p className="daizie-eyebrow">Something went sideways</p>
          <h1>We couldn&rsquo;t load your report.</h1>
          <p className="daizie-lede">
            Your scan is still saved, and the token in your email is still
            valid for 30 days. Try refreshing the page, or reach out to
            <a
              href="mailto:hello@martykoepke.com"
              style={{
                color: "var(--dz-forest)",
                textDecoration: "underline",
                textDecorationColor: "var(--dz-gold)",
                textUnderlineOffset: 3,
                marginLeft: 4,
              }}
            >
              hello@martykoepke.com
            </a>
            {" "}and we&rsquo;ll pull the report by hand.
          </p>
          {error?.digest && (
            <p
              style={{
                marginTop: 20,
                fontSize: "0.82rem",
                color: "#56675c",
                fontStyle: "italic",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <div className="daizie-actions" style={{ marginTop: 22 }}>
            <button
              type="button"
              onClick={() => reset()}
              className="daizie-btn primary"
            >
              Try again →
            </button>
            <a href="/scan" className="plain-link">
              Or run a fresh scan
            </a>
          </div>
        </article>
      </main>
    </div>
  );
}
