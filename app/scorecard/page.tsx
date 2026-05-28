import type { Metadata } from "next";
import Image from "next/image";
import { SITE } from "@/lib/content";
import { BOOK_CALL_HREF } from "@/lib/links";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "AI Visibility Self-Assessment | Practical Informatics",
  description:
    "Score your business in 5 minutes across the six dimensions that decide whether AI agents recommend you. A free scorecard from Practical Informatics.",
  alternates: { canonical: "/scorecard" },
  openGraph: {
    title: "AI Visibility Self-Assessment | Practical Informatics",
    description:
      "Score your business in 5 minutes across the six dimensions that decide whether AI agents recommend you.",
    url: `${SITE.url}/scorecard`,
  },
};

/**
 * Print stylesheet. Three jobs:
 *  1. Force background colors and accents to render (override the
 *     "background graphics OFF" default in many print dialogs).
 *  2. Tighten spacing on paper so we hit a 6-page layout.
 *  3. Hide the site chrome and the on-screen print bar.
 */
const printStyles = `
  /* Force colors to print, even when browser background-graphics is off. */
  @media print {
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    @page { size: letter; margin: 0.45in 0.5in; }
    html, body { background: #FAF6EE !important; }
    header, footer, .no-print { display: none !important; }
    main { padding: 0 !important; }
    .scorecard-shell { padding: 0 !important; margin: 0 !important; }
    .scorecard-page { page-break-after: always; break-after: page; }
    .scorecard-page:last-of-type { page-break-after: auto; break-after: auto; }
    .scorecard-avoid-break { page-break-inside: avoid; break-inside: avoid; }
    a { color: #1F3A2E !important; text-decoration: none !important; }

    /* Tighter spacing on paper. */
    .print-tight { padding: 0 !important; margin: 0 !important; }
    .print-card {
      padding: 0.9rem 1.1rem !important;
      box-shadow: none !important;
      border: 1px solid #D8CCB4 !important;
    }
    .print-q-row { padding: 0.35rem 0 !important; }

    /* Backgrounds that MUST print (CTA, total row, etc.) */
    .print-bg-forest {
      background: #1F3A2E !important;
      color: #FAF6EE !important;
    }
    .print-bg-cream-dim { background: #F2EBDC !important; }
    .print-gold { color: #A8893F !important; }
  }
`;

type Dimension = {
  number: string;
  title: string;
  subtitle: string;
  questions: string[];
};

const DIMENSIONS: Dimension[] = [
  {
    number: "01",
    title: "Founder Credibility",
    subtitle: "Does AI know who's behind the business — and trust the description?",
    questions: [
      "Is your name (or your founder's name) clearly visible on the home page?",
      "Is your LinkedIn profile linked from your website?",
      "Does your About page include credentials — degrees, certifications, prior roles, book, talks?",
      "Have you published or appeared in anything verifiable — book, articles, podcasts, conference talks?",
      "If you asked AI “Who is [your name] of [your business]?” today, would the answer be accurate and current?",
    ],
  },
  {
    number: "02",
    title: "Live AI Test",
    subtitle: "Have you asked AI what it says — and did you like the answer?",
    questions: [
      "Have you asked ChatGPT, Claude, or Gemini “Tell me about [your business]” in the last 90 days?",
      "When you ask AI “Best [your industry] in [your location],” does it ever name your business?",
      "Does AI know what services you actually offer, with at least one specific detail right?",
      "Does AI know your current pricing range or named methodology?",
      "When AI compares you to a competitor, does it accurately describe both?",
    ],
  },
  {
    number: "03",
    title: "Entity Clarity",
    subtitle: "Can AI tell exactly who and where you are — without confusion?",
    questions: [
      "Are your business name, address, and phone consistent across website, Google Business Profile, and LinkedIn?",
      "Is your business name unique enough that AI won't confuse you with similarly-named entities?",
      "Can a stranger find a clear one-sentence description of what you do on your home page, in under 3 seconds?",
      "Is your founder's identity clear (name, role, pronouns where used) without scrolling?",
      "Does your contact info appear consistently in at least three places online?",
    ],
  },
  {
    number: "04",
    title: "Methodology Depth",
    subtitle: "Does your offering have a name and a clear shape AI can repeat?",
    questions: [
      "Does your business have a named methodology, framework, or signature process (a unique 2–4 word name)?",
      "Is your pricing visible on your website — at least a range or starting point?",
      "Do you have a clear “who this is for” or “who this isn't for” section?",
      "Do you have a FAQ section answering the questions your buyers actually ask?",
      "Does your site explain your process (what happens, in what order) in plain language?",
    ],
  },
  {
    number: "05",
    title: "Structured Data",
    subtitle: "Does your site speak the machine-readable language LLMs use?",
    questions: [
      "Does your site have an llms.txt file? (Check yourdomain.com/llms.txt)",
      "Does your site have Organization JSON-LD schema? (View page source → search “application/ld+json”)",
      "Does your site have Person JSON-LD schema for the founder?",
      "Does your site have FAQPage JSON-LD schema on FAQ-type content?",
      "Does your site have OpenGraph and Twitter Card meta tags on every page?",
    ],
  },
  {
    number: "06",
    title: "Agent and Citation Graph",
    subtitle: "Does the wider web confirm what your site says about you?",
    questions: [
      "Does your robots.txt explicitly allow GPTBot, ClaudeBot, or PerplexityBot?",
      "Are you mentioned by name on at least three external websites (directories, press, podcasts) you don't own?",
      "Do you have a complete LinkedIn presence (personal profile + company page where relevant)?",
      "Are you listed in at least three industry directories or vertical-specific platforms?",
      "Do you have a Wikipedia or Wikidata entry — or at least a high-authority mention (named publication, podcast, conference)?",
    ],
  },
];

const TIERS = [
  {
    range: "26–30",
    name: "Agent-Ready",
    meaning:
      "You're in the top 5% of small businesses for AI visibility. The work now is maintenance, monitoring, and tightening any dimension under 4.",
  },
  {
    range: "19–25",
    name: "Discoverable",
    meaning:
      "AI knows you exist, but the picture is incomplete or stale. Typically 3–7 specific fixes would move you to Agent-Ready in 60 days.",
  },
  {
    range: "12–18",
    name: "Faintly Visible",
    meaning:
      "AI knows your category but doesn't reliably name you. The most common tier for established small businesses in 2026 — and the one with the highest upside.",
  },
  {
    range: "6–11",
    name: "Hidden",
    meaning:
      "AI rarely surfaces your business when asked. You're not invisible, but you're rarely the answer. The fixes are usually foundational.",
  },
  {
    range: "0–5",
    name: "Invisible",
    meaning:
      "AI does not reliably know your business exists. The path forward is concrete — structured information, entity clarity, a few external citations.",
  },
];

/** Reusable dimension card. Designed to be compact enough that two
 *  fit on one US-Letter page in print mode. */
function DimensionCard({ d }: { d: Dimension }) {
  return (
    <div className="scorecard-avoid-break print-card rounded-lg border border-tan bg-cream-dim p-5 print-bg-cream-dim">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-2xl text-gold-dark print-gold">
          {d.number}
        </span>
        <h3 className="font-serif text-xl text-forest sm:text-2xl">
          Dimension {parseInt(d.number, 10)}: {d.title}
        </h3>
      </div>
      <p className="mt-1.5 font-serif text-sm italic text-moss">{d.subtitle}</p>
      <ol className="mt-3 space-y-1">
        {d.questions.map((q, qi) => (
          <li
            key={qi}
            className="print-q-row flex items-start gap-3 border-b border-tan/60 py-1.5 last:border-b-0"
          >
            <span className="mt-0.5 min-w-[1.6rem] font-serif text-xs font-semibold text-gold-dark print-gold">
              Q{qi + 1}
            </span>
            <p className="flex-1 text-sm leading-snug text-charcoal">{q}</p>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-charcoal">
                <span className="inline-block h-3.5 w-3.5 rounded border border-charcoal/50" />
                Yes
              </span>
              <span className="inline-flex items-center gap-1 text-charcoal">
                <span className="inline-block h-3.5 w-3.5 rounded border border-charcoal/50" />
                No
              </span>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-3 rounded-md border border-gold/60 px-3 py-2 text-right">
        <span className="font-serif text-xs text-charcoal">
          Dimension {parseInt(d.number, 10)} score:{" "}
        </span>
        <span className="font-serif text-lg font-semibold text-forest">
          ___ / 5
        </span>
      </div>
    </div>
  );
}

export default function ScorecardPage() {
  // Group dimensions 2-per-page for print layout
  const pairs: Dimension[][] = [
    [DIMENSIONS[0], DIMENSIONS[1]],
    [DIMENSIONS[2], DIMENSIONS[3]],
    [DIMENSIONS[4], DIMENSIONS[5]],
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      <div className="scorecard-shell bg-cream py-12 px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {/* Screen-only print bar */}
          <div className="no-print mb-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-tan bg-cream-dim px-5 py-3 text-sm">
            <span className="text-charcoal">
              Tip: <strong>Chrome or Edge → Print → Save as PDF</strong>. In the
              dialog: turn ON <em>Background graphics</em> and turn OFF{" "}
              <em>Headers and footers</em> for the cleanest output.
            </span>
            <PrintButton />
          </div>

          {/* ============================================================
              PAGE 1: COVER — fills the page via flex
              ============================================================ */}
          <section className="scorecard-page flex min-h-[10in] flex-col justify-between border-y-4 border-gold py-10 text-center">
            <div>
              <Image
                src="/images/logo-horizontal.png"
                alt="Practical Informatics"
                width={1500}
                height={400}
                priority
                className="mx-auto h-[72px] w-auto"
              />
            </div>

            <div>
              <p className="font-serif text-sm font-semibold uppercase tracking-[0.18em] text-gold-dark print-gold">
                A free scorecard
              </p>
              <h1 className="mt-4 font-serif text-5xl leading-[1.05] text-forest sm:text-6xl">
                The AI Visibility
                <br />
                Self-Assessment
              </h1>
              <p className="mx-auto mt-8 max-w-md font-serif text-2xl italic text-moss">
                Score your business in 5 minutes.
              </p>
              <p className="mx-auto mt-10 max-w-md leading-relaxed text-charcoal">
                A six-dimension scorecard for established small businesses whose
                buyers research before they decide.
              </p>
            </div>

            <div>
              <div className="mx-auto h-px w-24 bg-gold" />
              <p className="mt-5 text-xs uppercase tracking-[0.22em] text-moss">
                practicalinformatics.com
              </p>
            </div>
          </section>

          {/* ============================================================
              PAGE 2: WHY + HOW TO USE (combined, tighter)
              ============================================================ */}
          <section className="scorecard-page pt-10">
            <div className="scorecard-avoid-break">
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark print-gold">
                Why this matters
              </p>
              <h2 className="mt-2 font-serif text-3xl text-forest">
                The discovery layer moved. Most businesses haven&apos;t noticed.
              </h2>
              <p className="mt-5 leading-relaxed text-charcoal">
                Something quietly changed in the last 18 months: a meaningful
                share of your buyers stopped Googling and started asking ChatGPT,
                Claude, Gemini, and Perplexity for recommendations.
              </p>
              <ul className="mt-4 space-y-2 leading-relaxed text-charcoal">
                <li className="flex gap-3">
                  <span className="text-gold-dark print-gold">•</span>
                  <span>
                    <strong>73% of B2B buyers</strong> now research vendors using
                    AI agents. <em className="text-moss">(Forrester, 2026)</em>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-dark print-gold">•</span>
                  <span>
                    <strong>AI search traffic grew 42.8% year-over-year</strong>{" "}
                    while Google grew 2.4%.{" "}
                    <em className="text-moss">(SimilarWeb, 2026)</em>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-dark print-gold">•</span>
                  <span>
                    Most of this happens <strong>invisibly</strong>. The customer
                    asks AI, gets a recommendation (or doesn&apos;t), and you
                    never see the visit in your analytics.
                  </span>
                </li>
              </ul>
              <p className="mt-4 leading-relaxed text-charcoal">
                When your buyer asks an AI agent for a recommendation in your
                category, you are either named — or you&apos;re not. If
                you&apos;re not, you&apos;ve lost a lead you never knew existed.
              </p>
            </div>

            <hr className="my-8 border-tan" />

            <div className="scorecard-avoid-break">
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark print-gold">
                How to use this scorecard
              </p>
              <h2 className="mt-2 font-serif text-2xl text-forest">
                30 yes / no questions. Five per dimension. One point each.
              </h2>
              <ul className="mt-5 space-y-1.5 leading-relaxed text-charcoal">
                <li>• <strong>30 yes / no questions</strong> — five per dimension</li>
                <li>• <strong>1 point per yes</strong>, <strong>5 per dimension</strong>, <strong>30 total</strong></li>
                <li>• Be honest — there&apos;s no prize for a high score, only useful information</li>
                <li>• Count your yeses in the score box at the end of each dimension</li>
                <li>• At the end, find your tier and decide what to do next</li>
              </ul>
              <p className="mt-5 italic leading-relaxed text-moss">
                A note: most established small businesses score between 8 and 18
                their first time through. If you score lower, that&apos;s not
                failure — it&apos;s a starting line.
              </p>
            </div>
          </section>

          {/* ============================================================
              PAGES 3–5: TWO DIMENSIONS PER PAGE
              ============================================================ */}
          {pairs.map((pair, pi) => (
            <section key={pi} className="scorecard-page pt-10">
              <p className="mb-4 font-serif text-sm uppercase tracking-[0.18em] text-gold-dark print-gold">
                Dimensions {pair[0].number.replace(/^0/, "")} and{" "}
                {pair[1].number.replace(/^0/, "")}
              </p>
              <div className="space-y-5">
                <DimensionCard d={pair[0]} />
                <DimensionCard d={pair[1]} />
              </div>
            </section>
          ))}

          {/* ============================================================
              PAGE 6: SCORE + TIER + CTA (single page)
              ============================================================ */}
          <section className="scorecard-page pt-10">
            {/* Score tally */}
            <div className="scorecard-avoid-break">
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark print-gold">
                Your score
              </p>
              <h2 className="mt-2 font-serif text-2xl text-forest">
                Add up your six dimensions
              </h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-tan">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-tan">
                    {DIMENSIONS.map((d) => (
                      <tr key={d.number}>
                        <td className="px-4 py-2 text-sm text-charcoal">
                          Dimension {parseInt(d.number, 10)}: {d.title}
                        </td>
                        <td className="px-4 py-2 text-right font-serif text-sm text-charcoal">
                          ___ / 5
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-forest print-bg-forest">
                      <td className="px-4 py-3 font-serif text-cream">Total</td>
                      <td className="px-4 py-3 text-right font-serif text-xl font-semibold text-gold print-gold">
                        ___ / 30
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tier mapping — compact 5-row table */}
            <div className="scorecard-avoid-break mt-6">
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark print-gold">
                Find your tier
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-tan">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-tan">
                    {TIERS.map((t) => (
                      <tr key={t.name}>
                        <td className="w-20 px-4 py-2 align-top font-serif text-xs font-semibold text-gold-dark print-gold">
                          {t.range}
                        </td>
                        <td className="w-40 px-2 py-2 align-top font-serif text-sm text-forest">
                          {t.name}
                        </td>
                        <td className="px-3 py-2 text-xs leading-snug text-charcoal">
                          {t.meaning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA — forced background via print-bg-forest */}
            <div className="scorecard-avoid-break mt-6 rounded-lg bg-forest p-6 text-center text-cream print-bg-forest">
              <p className="font-serif text-xs uppercase tracking-[0.18em] text-gold print-gold">
                What to do next
              </p>
              <h3 className="mt-2 font-serif text-xl text-cream">
                Want to know what AI is actually saying about you?
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-cream/85">
                The <strong>AI Visibility Index</strong> runs live queries
                against Claude, ChatGPT, and Gemini — three runs each — and
                gives you the top five things to fix, ranked by
                impact-per-hour-of-effort.
              </p>
              <p className="mx-auto mt-3 max-w-md font-serif text-base text-cream">
                $697 flat · Delivered in 3 business days · Includes a 30-min
                walk-through call
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a
                  href={BOOK_CALL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-forest"
                >
                  Book a free 20-minute call →
                </a>
                <a
                  href="/ai-visibility-index"
                  className="rounded-md border border-cream/40 px-5 py-2 text-sm font-medium text-cream"
                >
                  Read the full AVI page
                </a>
              </div>
            </div>

            {/* About footer */}
            <div className="scorecard-avoid-break mt-6 border-t border-tan pt-5 text-center">
              <p className="font-serif text-xs uppercase tracking-[0.18em] text-gold-dark print-gold">
                About Practical Informatics
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-xs leading-relaxed text-charcoal">
                Practical Informatics LLC is a focused consulting practice
                founded by Marty Koepke. Twenty years in healthcare informatics.
                Author of <em>Between the Clicks: The Hidden Work of Healthcare
                Informatics</em>. Process improvement, AI implementation, and
                now AI visibility for established small businesses.
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-moss">
                practicalinformatics.com · marty.koepke@practicalinformatics.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
