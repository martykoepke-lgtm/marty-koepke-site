import type { Metadata } from "next";
import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";
import FreeScanFlow from "@/components/ai-visibility/FreeScanFlow";
import { SITE } from "@/lib/content";

/**
 * /scan — the free AI Readiness Check.
 *
 * URL-only form, ~30s synchronous scan, on-screen tier + 7-dim bars +
 * 2–3 plain-English findings, email gate for the full PDF.
 *
 * Replaces /ai-visibility/order per D006. The page itself is a thin
 * server shell — the interactive flow lives in FreeScanFlow.tsx so the
 * client component can manage submit state, render the result, and
 * gate the email submit without a page navigation.
 */

export const metadata: Metadata = {
  title: "Free AI Readiness Check | Practical Informatics",
  description:
    "Are you built to be found by AI? Paste your URL, scan in 30 seconds, get your tier and the top fixes — no email required to start.",
  alternates: { canonical: "/scan" },
  openGraph: {
    title: "Free AI Readiness Check | Practical Informatics",
    description:
      "Are you built to be found by AI? Paste your URL, scan in 30 seconds, get your tier and the top fixes.",
    url: `${SITE.url}/scan`,
  },
};

export default function ScanPage() {
  return (
    <main>
      <Section tone="cream" width="narrow" className="pt-16 sm:pt-24">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            Free AI Readiness Check
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-forest sm:text-5xl">
            Are you built to be found by AI?
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-charcoal">
            Paste your website URL. In about 30 seconds we&apos;ll read your
            site, cross-check what the web says about you, and score you on
            the seven things that determine whether AI tools recommend you
            when buyers ask. You&apos;ll see your tier and the top fixes on
            screen — no email required to start.
          </p>
        </Reveal>

        <div className="mt-10">
          <FreeScanFlow />
        </div>

        <Reveal>
          <p className="mt-10 text-sm text-moss">
            This is the free preview. The paid{" "}
            <a
              href="/ai-visibility"
              className="underline underline-offset-4 hover:text-forest"
            >
              AI Visibility Index Report
            </a>{" "}
            ($697) adds cross-engine measurement against ChatGPT, Claude,
            Gemini, and Perplexity, plus a 45-minute walkthrough call.
            Fee credits 100% toward a Sprint within 30 days.
          </p>
        </Reveal>
      </Section>
    </main>
  );
}
