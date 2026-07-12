import type { Metadata } from "next";
import Image from "next/image";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import FreeScanFlow from "@/components/ai-visibility/FreeScanFlow";
import { SITE } from "@/lib/content";

/**
 * /scan — the free Daizie Readiness Check.
 *
 * Wrapped in the Daizie shell so it shares the dark landscape backdrop +
 * frosted cream pane with the rest of the marketing surface. The
 * interactive flow lives in FreeScanFlow.tsx so client-side state and
 * the email gate stay isolated from the server shell.
 */

export const metadata: Metadata = {
  title: "Free Daizie Readiness Check",
  description:
    "Are you built to be found by AI? Paste your URL, scan in 30 seconds, get your tier and the top fixes — no email required to start.",
  alternates: { canonical: "/scan" },
  openGraph: {
    title: "Free Daizie Readiness Check",
    description:
      "Are you built to be found by AI? Paste your URL, scan in 30 seconds, get your tier and the top fixes.",
    url: `${SITE.url}/scan`,
  },
};

export default function ScanPage() {
  return (
    <div className="daizie-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />

        <Reveal>
          <article className="daizie-pane daizie-hero-pane">
            <div className="daizie-product-lockup">
              <Image
                src="/images/brand-2026/daizie-mark.png"
                alt=""
                width={420}
                height={420}
                priority
              />
              <span className="lockup-text">
                <span className="lockup-name">Daizie</span>
                <span className="lockup-tag">AI visibility, made clear</span>
              </span>
            </div>
            <p className="daizie-eyebrow">Free Daizie Readiness Check</p>
            <h1>Are you built to be found by AI?</h1>
            <p className="daizie-lede">
              Paste your website URL and tell us how customers find you.
              In about 30 seconds we&rsquo;ll read your site, check the
              profiles AI reads for your kind of business, and score your
              readiness — no email required to start.
            </p>

            <div style={{ marginTop: 28 }}>
              <FreeScanFlow />
            </div>

            <p
              style={{
                marginTop: 28,
                fontStyle: "italic",
                fontSize: "0.92rem",
                color: "#54655a",
                maxWidth: 720,
              }}
            >
              This is the free preview. The paid{" "}
              <a
                href="/ai-visibility"
                style={{
                  color: "var(--dz-forest)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  textDecorationColor: "var(--dz-gold)",
                }}
              >
                Daizie AI Visibility Assessment
              </a>{" "}
              ($895) adds four engines, every claim verified, and you plotted
              against two named competitors — with a 30-minute review call.
            </p>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
