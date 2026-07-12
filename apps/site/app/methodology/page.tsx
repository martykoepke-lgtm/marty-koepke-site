import type { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";
import { SITE } from "@/lib/content";

/**
 * /methodology — the publish-your-work rubric page.
 *
 * Concise on purpose. Names the five readiness drivers, explains the
 * one-Index-plus-three-scores framework, and draws the line between
 * what's public (the framework) and what stays private (the extraction
 * engine + Marty's personal review). No downloadable rubric — the full
 * rubric doc is internal-only as of 2026-07-12.
 *
 * JSON-LD: Article + FAQPage so AI extractors pick this up as a
 * citable entity in the AI-visibility category.
 */

export const metadata: Metadata = {
  title: "The Daizie Methodology — how we measure AI visibility",
  description:
    "The Daizie AI Business Accuracy Rubric v3. How the paid Daizie AI Visibility Assessment measures how AI systems find, understand, cite, and recommend a small or medium business. Five readiness drivers, six measured outcomes, three lanes, published research behind every band.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    type: "article",
    title: "The Daizie Methodology — how we measure AI visibility",
    description:
      "How the paid Daizie AI Visibility Assessment measures how AI systems find, understand, cite, and recommend a small or medium business. Published rubric, published research.",
    url: `${SITE.url}/methodology`,
  },
};

const COMPARISON: Array<{ others: string; daizie: string }> = [
  {
    others: "Track brand mentions across a few engines",
    daizie:
      "Test live AI responses across four engines, then verify every factual claim against your real sources",
  },
  {
    others: "Give you a visibility number with no way to change it",
    daizie:
      "Every measurement has an anchored score tied to a specific fix",
  },
  {
    others: "Treat every business the same",
    daizie:
      "Branch by lane — a coffee shop, a coach, and a SaaS founder each get a different playbook",
  },
  {
    others: "Automated dashboard, no human in the loop",
    daizie:
      "Marty personally reviews every generated Assessment before it reaches you",
  },
  {
    others: "Publish nothing about the methodology",
    daizie: "This page",
  },
  {
    others: "Sell you a monthly subscription for tracking",
    daizie:
      "Sell you a diagnosis, an optional implementation, and optional monitoring — in that order",
  },
];

const DRIVERS: Array<{ name: string; question: string }> = [
  {
    name: "Business Clarity",
    question:
      "Can AI tell who you are, what you do, who you help, and where you work?",
  },
  {
    name: "Source Support",
    question:
      "Are your important claims backed by evidence AI can read?",
  },
  {
    name: "AI Readability",
    question:
      "Is your website structured so AI systems can actually parse it?",
  },
  {
    name: "Distinctive Point of View",
    question:
      "Do you have a supportable reason to be recommended over alternatives?",
  },
  {
    name: "Recommendation Fit",
    question:
      "Is it clear when you're the right recommendation, and when you're not?",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Daizie Methodology — how we measure AI visibility",
  description:
    "The Daizie AI Business Accuracy Rubric v3. Five readiness drivers, six measured outcomes, three lanes.",
  author: {
    "@type": "Person",
    name: "Marty Koepke",
    url: SITE.url,
  },
  publisher: {
    "@type": "Organization",
    name: "Practical Informatics LLC",
    url: SITE.url,
  },
  datePublished: "2026-07-12",
  dateModified: "2026-07-12",
  url: `${SITE.url}/methodology`,
  mainEntityOfPage: `${SITE.url}/methodology`,
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DRIVERS.map((d) => ({
    "@type": "Question",
    name: `${d.name} — ${d.question}`,
    acceptedAnswer: {
      "@type": "Answer",
      text: `Business Clarity, Source Support, AI Readability, Distinctive Point of View, and Recommendation Fit are the five readiness drivers in the Daizie AI Business Accuracy Rubric v3. ${d.name} asks: ${d.question}`,
    },
  })),
};

export default function MethodologyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <Section width="narrow">
        <Reveal>
          <article>
            <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
              Methodology
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-forest sm:text-4xl">
              How we measure AI visibility
            </h1>
            <p className="mt-3 text-base italic text-moss">
              The Daizie AI Business Accuracy Rubric — v3, effective 2026-07-12
            </p>

            <p className="mt-8 text-lg leading-relaxed text-charcoal">
              Every Daizie AI Visibility Assessment produces one headline
              number: your{" "}
              <strong>AI Business Accuracy Index</strong> (0–100). This
              page shows you the framework it comes from and why we're the
              only ones publishing this much of it.
            </p>

            {/* Section 1 — comparison table */}
            <h2 className="mt-12 text-2xl font-semibold text-forest sm:text-3xl">
              How measurement varies across the category
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal">
              Most AI-visibility tools track whether AI mentions you. Daizie
              measures whether AI is <em>getting you right</em>, whether
              you're being recommended in the right situations, and what to
              fix if not.
            </p>

            <div className="mt-6 overflow-x-auto rounded-lg border border-tan">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-cream-dim">
                    <th className="px-4 py-3 font-semibold text-forest">
                      Most AI-visibility tools
                    </th>
                    <th className="px-4 py-3 font-semibold text-forest">
                      Daizie
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2 === 0 ? "bg-white" : "bg-cream-dim/40"
                      }
                    >
                      <td className="border-t border-tan px-4 py-3 text-charcoal">
                        {row.others}
                      </td>
                      <td className="border-t border-tan px-4 py-3 text-charcoal">
                        {row.daizie}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 2 — not in a vacuum */}
            <h2 className="mt-12 text-2xl font-semibold text-forest sm:text-3xl">
              Not in a vacuum
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal">
              The rubric is grounded in the peer-reviewed and industry-published
              research on how large language models actually retrieve, rank,
              and cite content. Princeton's GEO paper, Anthropic's contextual
              retrieval work, Semrush's citation-pattern datasets, and the
              platform-behavior research from the AI-visibility field are
              baked into every driver and every band. Then — because a coffee
              shop and a SaaS founder don't buy the same way — the outputs
              are tailored to your business lane (local / services / product)
              so you get moves that matter for the queries your buyers
              actually ask.
            </p>

            {/* Section 3 — framework in one paragraph */}
            <h2 className="mt-12 text-2xl font-semibold text-forest sm:text-3xl">
              The framework, in one paragraph
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal">
              Every Assessment answers two questions in sequence.{" "}
              <strong>Readiness</strong> asks whether your public footprint
              gives AI enough evidence to describe you accurately.{" "}
              <strong>Measured outcomes</strong> ask what AI actually says
              when Daizie tests it live with the queries your buyers ask,
              across ChatGPT, Claude, Perplexity, and Gemini. Readiness is
              what you can change. Outcomes are how AI is behaving today.
              We measure both, separately, and never confuse them.
            </p>

            {/* Section 4 — five drivers */}
            <h2 className="mt-12 text-2xl font-semibold text-forest sm:text-3xl">
              The five readiness drivers
            </h2>
            <ul className="mt-6 space-y-4">
              {DRIVERS.map((d) => (
                <li
                  key={d.name}
                  className="rounded-lg border border-tan bg-cream-dim/60 p-5"
                >
                  <p className="font-serif text-lg font-medium text-forest">
                    {d.name}
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-charcoal">
                    {d.question}
                  </p>
                </li>
              ))}
            </ul>

            {/* Section 5 — the scoring */}
            <h2 className="mt-12 text-2xl font-semibold text-forest sm:text-3xl">
              The scoring
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal">
              <strong>One headline Index. Three underlying scores.</strong>
            </p>
            <ul className="mt-5 space-y-3 text-base leading-relaxed text-charcoal">
              <li>
                <strong>AI Business Accuracy Index</strong> <em>(0–100)</em> —
                the headline. Built from the three underlying scores below.
              </li>
              <li>
                <strong>AI Readiness Score</strong> — the five drivers,
                weighted, scored from public evidence. Available in the free
                check.
              </li>
              <li>
                <strong>AI Visibility Score</strong> — measured live from AI
                responses across the four engines. Assessment only.
              </li>
              <li>
                <strong>AI Business Accuracy Score</strong> — how accurately
                AI represents your business across six measured outcomes.
                Assessment only.
              </li>
            </ul>

            {/* Section 6 — what's public, what isn't */}
            <h2 className="mt-12 text-2xl font-semibold text-forest sm:text-3xl">
              What's public. What isn't.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-charcoal">
              The framework, the drivers, and the research behind them are
              on this page. The extraction engine — the exact LLM judge
              prompts, the buyer-question query wordings, the fix library,
              the calibration data, and Marty's personal review of every
              generated Assessment — stays private. The framework is
              teachable. Applying it well is the service.
            </p>

            {/* Divider */}
            <div className="soft-divider my-12" aria-hidden="true" />

            {/* Footer — offer ladder */}
            <h2 className="text-2xl font-semibold text-forest sm:text-3xl">
              Ready to see where AI has your business right now?
            </h2>
            <ul className="mt-6 space-y-4 text-base leading-relaxed text-charcoal">
              <li>
                <strong>Free Readiness Check</strong> — 30 seconds, email
                required to see your report.{" "}
                <Link
                  href="/scan"
                  className="underline decoration-gold underline-offset-4 hover:text-forest-dark"
                >
                  Run it →
                </Link>
              </li>
              <li>
                <strong>Daizie AI Visibility Assessment — $895.</strong>{" "}
                Four engines, 32 responses, every factual claim verified,
                competitor quadrant, three readiness fixes + three accuracy
                fixes, 30-minute review call with Marty.
              </li>
              <li>
                <strong>Optimizations + Remeasure — $4,100</strong>{" "}
                <em>(add-on to the Assessment; $4,995 all-in).</em> Marty
                implements or coordinates the priority fixes, re-measures
                across all four engines, delivers a delta report showing
                what moved.
              </li>
              <li>
                <strong>Monthly Monitoring — $197/month</strong>{" "}
                <em>(add-on to the Assessment).</em> Full 32-response
                protocol re-run monthly, trends dashboard, email when each
                report is ready.
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/ai-visibility"
                className="inline-flex items-center justify-center rounded bg-forest px-5 py-3 text-base font-medium text-cream hover:bg-forest-dark transition-colors"
              >
                See the Assessment →
              </Link>
              <a
                href="https://tally.so/r/xXVPgo"
                className="inline-flex items-center justify-center rounded border border-forest px-5 py-3 text-base font-medium text-forest hover:bg-forest hover:text-cream transition-colors"
              >
                Talk to Marty first
              </a>
            </div>
          </article>
        </Reveal>
      </Section>
    </>
  );
}
