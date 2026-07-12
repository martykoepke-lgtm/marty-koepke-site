import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Reveal from "@/components/motion/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { supabaseAdmin, type SubmissionRow } from "@practical-informatics/avi";
import type { CrawlerFinding } from "@practical-informatics/avi";
import { AVI_CHECKOUT, BOOK_CALL_HREF } from "@/lib/links";

// Don't index per-customer report URLs
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Your AI Visibility Scan | Marty Koepke",
};

type Params = { id: string };
type SearchParams = { token?: string };

/**
 * Teaser results page — shows the preliminary score and 2–3 findings,
 * with a CTA to upgrade to the paid offers.
 *
 * Token-gated: the URL must include `?token=...` matching the row's
 * access_token. This prevents anyone from enumerating submission IDs.
 */
export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .eq("access_token", token)
    .single<SubmissionRow>();

  if (error || !data) {
    notFound();
  }

  const submission = data;
  const score = submission.preliminary_score ?? 0;
  const tier = submission.preliminary_tier ?? "invisible";
  const findings = (submission.preliminary_findings as CrawlerFinding[]) ?? [];

  return (
    <>
      {/* Score block — forest band, matches the sample report cover */}
      <Section tone="forest" width="narrow" className="text-center">
        <Reveal>
          <p className="font-serif text-xs uppercase tracking-[0.18em] text-cream/60">
            Preliminary AI Readiness Check
          </p>
          <p className="mt-2 text-sm uppercase tracking-[0.14em] text-cream/80">
            Prepared for {submission.company_name}
          </p>
          <div className="mt-8 flex items-baseline justify-center gap-2">
            <span className="font-serif text-8xl text-gold sm:text-9xl">
              {score}
            </span>
            <span className="font-serif text-2xl text-cream/60">/ 100</span>
          </div>
          <p className="mt-4 font-serif text-xl italic text-cream/90">
            — {tierLabel(tier)} —
          </p>
          <p className="mx-auto mt-4 max-w-md text-cream/70">
            {tierLine(tier)}
          </p>
        </Reveal>
      </Section>

      {/* Findings */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            From the lightweight scan
          </p>
          <h2 className="mt-3 text-3xl text-forest sm:text-4xl">
            What we found in 10 seconds.
          </h2>
        </Reveal>
        <div className="mt-10 space-y-6">
          {findings.length === 0 ? (
            <p className="text-charcoal">
              The scan didn&apos;t surface any obvious issues on the surface. The
              full audit looks much deeper — see below.
            </p>
          ) : (
            findings.map((f, i) => (
              <div
                key={i}
                className={`border-l-4 pl-5 ${
                  f.severity === "high"
                    ? "border-red-500"
                    : f.severity === "medium"
                      ? "border-gold-dark"
                      : "border-tan"
                }`}
              >
                <h3 className="font-serif text-xl text-forest">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-charcoal">{f.detail}</p>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* What's NOT in this teaser */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <h2 className="text-3xl text-forest sm:text-4xl">
            What&apos;s NOT in this teaser.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-charcoal">
            The $895 AI Business Accuracy Audit adds:
          </p>
        </Reveal>
        <ul className="mt-7 space-y-3">
          {[
            "Four engines tested: ChatGPT, Claude, Perplexity, Gemini",
            "Eight buyer-question queries, 32 live AI responses captured",
            "Every factual claim AI makes about you verified against your real sources",
            "You plotted on a Readiness × Visibility chart against two competitors you name",
            "Three readiness fixes and three accuracy fixes, separated",
            "30-minute review call with Marty to walk through what matters most",
          ].map((item, i) => (
            <li
              key={i}
              className="flex gap-3 leading-relaxed text-charcoal"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-dark" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Primary CTA — pay $895 */}
      <Section tone="forest" width="narrow" className="text-center">
        <Reveal>
          <h2 className="text-3xl text-cream sm:text-4xl">
            Get the $895 Audit.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream/80">
            The full measurement protocol: four engines, every claim verified, you plotted against two named competitors.
          </p>
          <p className="mt-7 font-serif text-5xl text-gold">$895</p>
          <div className="mt-7">
            <Button href={AVI_CHECKOUT.audit} variant="onForest">
              Book the Assessment
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </Section>

      {/* Secondary CTA — talk first */}
      <Section tone="cream" width="narrow" className="text-center">
        <Reveal>
          <p className="text-lg text-charcoal">
            Prefer to talk first?{" "}
            <a
              href={BOOK_CALL_HREF}
              className="font-semibold text-forest underline decoration-gold underline-offset-4 hover:text-forest-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a free 20-minute conversation
            </a>
            .
          </p>
        </Reveal>
      </Section>
    </>
  );
}

// ============================================================================
// Tier helpers
// ============================================================================

function tierLabel(tier: string): string {
  switch (tier) {
    case "agent-ready":
      return "Agent-Ready";
    case "discoverable":
      return "Discoverable";
    case "faintly-visible":
      return "Emerging";
    case "hidden":
      return "Overlooked";
    default:
      return "Invisible";
  }
}

function tierLine(tier: string): string {
  switch (tier) {
    case "agent-ready":
      return "Your site has strong readiness signals. A paid live-AI review can test actual AI answers.";
    case "discoverable":
      return "AI agents know you exist. They don't yet know what you do today.";
    case "faintly-visible":
      return "Some signals are present, but the paid review shows what AI actually says.";
    case "hidden":
      return "Important readiness signals are weak. The paid review can identify what is holding you back.";
    default:
      return "AI may not have enough clear evidence to understand you yet. The paid review shows what to fix first.";
  }
}
