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

// Print-only styles. Hides the site nav/footer and forces page breaks
// between scorecard sections when the page is sent to print.
const printStyles = `
  @media print {
    @page { size: letter; margin: 0.6in; }
    html, body { background: #FAF6EE !important; }
    header, footer, .no-print { display: none !important; }
    main { padding: 0 !important; }
    .scorecard-break { page-break-before: always; break-before: page; }
    .scorecard-avoid-break { page-break-inside: avoid; break-inside: avoid; }
    a { color: #1F3A2E !important; text-decoration: none !important; }
    .scorecard-shell { padding: 0 !important; }
    .scorecard-card {
      box-shadow: none !important;
      border: 1px solid #D8CCB4 !important;
    }
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
    subtitle: "Does AI know who's behind the business — and trust the description it has?",
    questions: [
      "Is your name (or your founder's name) clearly visible on the home page of your website?",
      "Is your LinkedIn profile linked from your website?",
      "Does your About page include credentials — degrees, certifications, prior roles, book, talks?",
      "Have you published or appeared in anything verifiable — book, articles, podcast appearances, conference talks?",
      "If you asked AI “Who is [your name] of [your business]?” today, would the answer be accurate and current?",
    ],
  },
  {
    number: "02",
    title: "Live AI Test",
    subtitle: "Have you asked AI what it says — and did you like the answer?",
    questions: [
      "Have you asked ChatGPT, Claude, or Gemini “Tell me about [your business]” in the last 90 days?",
      "When you ask AI “Best [your industry] in [your location or specialty],” does it ever name your business?",
      "Does AI know what services you actually offer, with at least one specific detail right?",
      "Does AI know your current pricing range or named methodology?",
      "When AI compares you to a competitor, does it accurately describe both businesses?",
    ],
  },
  {
    number: "03",
    title: "Entity Clarity",
    subtitle: "Can AI tell exactly who and where you are — without confusion?",
    questions: [
      "Are your business name, address, and phone (NAP) consistent across your website, Google Business Profile, and LinkedIn?",
      "Is your business name unique enough that AI won't confuse you with similarly-named entities?",
      "Can a stranger find a clear one-sentence description of what you do, on your home page, in under 3 seconds?",
      "Is your founder's identity clear (name, role, pronouns where used) without scrolling?",
      "Does your contact info (phone, email, address) appear consistently in at least three places online?",
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
      "Does your site have an llms.txt file? (Check at yourdomain.com/llms.txt)",
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
      "Does your robots.txt explicitly allow GPTBot, ClaudeBot, or PerplexityBot? (Check yourdomain.com/robots.txt)",
      "Are you mentioned by name on at least three external websites (directories, press, podcasts, guest posts) you don't own?",
      "Do you have a complete LinkedIn presence (personal profile + company page where relevant)?",
      "Are you listed in at least three industry directories or vertical-specific platforms?",
      "Do you have a Wikipedia or Wikidata entry — or at least a high-authority mention (named industry publication, well-known podcast, recognized conference)?",
    ],
  },
];

const TIERS = [
  {
    range: "26–30",
    name: "Agent-Ready",
    meaning:
      "You're in the top 5% of small businesses for AI visibility. AI surfaces and recommends you accurately. The work now is maintenance, monitoring, and tightening any single dimension under 4.",
  },
  {
    range: "19–25",
    name: "Discoverable",
    meaning:
      "AI knows you exist, but the picture it has is incomplete or stale. Typically 3–7 specific fixes would move you to Agent-Ready in 60 days.",
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
      "AI does not reliably know your business exists. The path forward is concrete — structured information, entity clarity, and a few external citations.",
  },
];

export default function ScorecardPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      <div className="scorecard-shell bg-cream py-12 px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {/* Print / download bar — visible on screen only */}
          <div className="no-print mb-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-tan bg-cream-dim px-5 py-3 text-sm">
            <span className="text-charcoal">
              Tip: use your browser&apos;s <strong>Print &rarr; Save as PDF</strong>{" "}
              to download this scorecard.
            </span>
            <PrintButton />
          </div>

          {/* ===== Page 1: Cover ===== */}
          <section className="scorecard-avoid-break border-y-4 border-gold py-12 text-center">
            <Image
              src="/images/logo-horizontal.png"
              alt="Practical Informatics"
              width={1500}
              height={400}
              priority
              className="mx-auto h-[80px] w-auto"
            />
            <p className="mt-10 font-serif text-sm font-semibold uppercase tracking-[0.18em] text-gold-dark">
              A free scorecard
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-forest sm:text-5xl">
              The AI Visibility
              <br />
              Self-Assessment
            </h1>
            <p className="mx-auto mt-6 max-w-md font-serif text-xl italic text-moss">
              Score your business in 5 minutes.
            </p>
            <p className="mx-auto mt-8 max-w-md text-sm text-charcoal/80">
              A six-dimension scorecard for established small businesses whose
              buyers research before they decide.
            </p>
            <p className="mt-10 text-xs uppercase tracking-[0.14em] text-moss">
              practicalinformatics.com
            </p>
          </section>

          {/* ===== Page 2: Why this matters + How to use ===== */}
          <section className="scorecard-break scorecard-avoid-break pt-12">
            <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
              Why this matters
            </p>
            <h2 className="mt-2 font-serif text-3xl text-forest">
              The discovery layer moved. Most businesses haven&apos;t noticed.
            </h2>
            <p className="mt-6 leading-relaxed text-charcoal">
              Something quietly changed in the last 18 months: a meaningful
              share of your buyers stopped Googling and started asking ChatGPT,
              Claude, Gemini, and Perplexity for recommendations.
            </p>
            <ul className="mt-6 space-y-3 leading-relaxed text-charcoal">
              <li className="flex gap-3">
                <span className="text-gold-dark">•</span>
                <span>
                  <strong>73% of B2B buyers</strong> now research vendors using
                  AI agents.{" "}
                  <em className="text-moss">(Forrester, 2026)</em>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold-dark">•</span>
                <span>
                  <strong>AI search traffic grew 42.8% year-over-year</strong>{" "}
                  while Google grew 2.4%.{" "}
                  <em className="text-moss">(SimilarWeb, 2026)</em>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gold-dark">•</span>
                <span>
                  Most of this happens <strong>invisibly</strong>. The customer
                  asks AI, gets a recommendation (or doesn&apos;t), and you never
                  see the visit in your analytics.
                </span>
              </li>
            </ul>
            <p className="mt-6 leading-relaxed text-charcoal">
              When your buyer asks an AI agent for a recommendation in your
              category, you are either named — or you&apos;re not. If you&apos;re
              not, you&apos;ve lost a lead you never knew existed.
            </p>
            <p className="mt-4 leading-relaxed text-charcoal">
              This scorecard takes about five minutes. It tells you where you
              stand across the six dimensions that determine whether AI knows,
              recommends, and accurately describes your business.
            </p>

            <hr className="my-10 border-tan" />

            <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
              How to use this scorecard
            </p>
            <h2 className="mt-2 font-serif text-2xl text-forest">
              30 yes / no questions. Five per dimension. One point each.
            </h2>
            <ul className="mt-6 space-y-2 leading-relaxed text-charcoal">
              <li>• <strong>30 yes / no questions</strong> — five per dimension</li>
              <li>• <strong>1 point per yes</strong>, <strong>5 points per dimension</strong>, <strong>30 total</strong></li>
              <li>• Be honest — there&apos;s no prize for a high score, only useful information</li>
              <li>• Count your yeses in the score box at the end of each dimension</li>
              <li>• At the end, find your tier and decide what to do next</li>
            </ul>
            <p className="mt-6 italic leading-relaxed text-moss">
              A note: most established small businesses score between 8 and 18
              their first time through. If you score lower, that&apos;s not
              failure — it&apos;s a starting line.
            </p>
          </section>

          {/* ===== Pages 3+: One dimension per visual block; print may pair them ===== */}
          {DIMENSIONS.map((d, idx) => (
            <section
              key={d.number}
              className={`${idx === 0 ? "scorecard-break" : ""} scorecard-avoid-break pt-12`}
            >
              <div className="scorecard-card rounded-lg border border-tan bg-cream-dim p-7 shadow-sm">
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-3xl text-gold-dark">
                    {d.number}
                  </span>
                  <h2 className="font-serif text-2xl text-forest sm:text-3xl">
                    Dimension {parseInt(d.number, 10)}: {d.title}
                  </h2>
                </div>
                <p className="mt-3 font-serif text-base italic text-moss">
                  {d.subtitle}
                </p>
                <ol className="mt-6 space-y-3">
                  {d.questions.map((q, qi) => (
                    <li key={qi} className="flex items-start gap-4">
                      <span className="mt-1 font-serif text-sm font-semibold text-gold-dark">
                        Q{qi + 1}
                      </span>
                      <p className="flex-1 leading-relaxed text-charcoal">{q}</p>
                      <div className="flex shrink-0 items-center gap-3 text-sm">
                        <label className="flex items-center gap-1.5 text-charcoal">
                          <span className="inline-block h-4 w-4 rounded border border-charcoal/40" />
                          Yes
                        </label>
                        <label className="flex items-center gap-1.5 text-charcoal">
                          <span className="inline-block h-4 w-4 rounded border border-charcoal/40" />
                          No
                        </label>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 rounded-md border border-gold/60 bg-cream px-4 py-3 text-right">
                  <span className="font-serif text-sm text-charcoal">
                    Dimension {parseInt(d.number, 10)} score:{" "}
                  </span>
                  <span className="font-serif text-xl font-semibold text-forest">
                    ___ / 5
                  </span>
                </div>
              </div>
            </section>
          ))}

          {/* ===== Final: Score + Tier + CTA ===== */}
          <section className="scorecard-break scorecard-avoid-break pt-12">
            <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
              Your score
            </p>
            <h2 className="mt-2 font-serif text-3xl text-forest">
              Add up your six dimensions
            </h2>
            <div className="mt-6 overflow-hidden rounded-lg border border-tan">
              <table className="w-full text-left">
                <tbody className="divide-y divide-tan">
                  {DIMENSIONS.map((d) => (
                    <tr key={d.number}>
                      <td className="px-5 py-3 text-charcoal">
                        Dimension {parseInt(d.number, 10)}: {d.title}
                      </td>
                      <td className="px-5 py-3 text-right font-serif text-charcoal">
                        ___ / 5
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-forest">
                    <td className="px-5 py-4 font-serif text-cream">
                      Total
                    </td>
                    <td className="px-5 py-4 text-right font-serif text-xl font-semibold text-gold">
                      ___ / 30
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-10 font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
              Find your tier
            </p>
            <div className="mt-3 space-y-3">
              {TIERS.map((t) => (
                <div
                  key={t.name}
                  className="scorecard-avoid-break rounded-lg border border-tan bg-cream-dim p-5"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-sm font-semibold text-gold-dark">
                      {t.range}
                    </span>
                    <h3 className="font-serif text-xl text-forest">{t.name}</h3>
                  </div>
                  <p className="mt-2 leading-relaxed text-charcoal">
                    {t.meaning}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="scorecard-break scorecard-avoid-break pt-12">
            <div className="rounded-lg bg-forest p-8 text-center text-cream">
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold">
                What to do next
              </p>
              <h2 className="mt-3 font-serif text-3xl text-cream">
                Want to know what AI is actually saying about you?
              </h2>
              <p className="mx-auto mt-5 max-w-xl leading-relaxed text-cream/85">
                This scorecard tells you what <em>you</em> can see yourself. The{" "}
                <strong>AI Visibility Index</strong> runs live queries against
                Claude, ChatGPT, and Gemini — three runs each — and gives you
                the top five things to fix, ranked by impact-per-hour-of-effort.
              </p>
              <p className="mx-auto mt-5 max-w-md font-serif text-xl text-cream">
                $697 flat. Delivered in 3 business days. Includes a 30-minute
                walk-through call.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a
                  href={BOOK_CALL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-gold px-6 py-3 font-semibold text-forest transition-colors hover:bg-gold-dark hover:text-cream"
                >
                  Book a free 20-minute call &rarr;
                </a>
                <a
                  href="/ai-visibility-index"
                  className="rounded-md border border-cream/40 px-6 py-3 font-medium text-cream transition-colors hover:bg-cream/10"
                >
                  Read the full AVI page
                </a>
              </div>
            </div>

            {/* About / footer */}
            <div className="mt-10 border-t border-tan pt-8 text-center">
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
                About Practical Informatics
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-charcoal">
                Practical Informatics LLC is a focused consulting practice
                founded by Marty Koepke. Twenty years in healthcare informatics.
                Author of <em>Between the Clicks: The Hidden Work of Healthcare
                Informatics</em>. Process improvement, AI implementation, and
                now AI visibility for established small businesses.
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.14em] text-moss">
                practicalinformatics.com · marty.koepke@practicalinformatics.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
