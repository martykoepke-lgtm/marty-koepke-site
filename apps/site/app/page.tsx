import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { META, SITE } from "@/lib/content";
import { BOOK_CALL_HREF } from "@/lib/links";

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: META.home.title,
    description: META.home.description,
    url: SITE.url,
  },
};

/**
 * Homepage FAQPage schema — the four most load-bearing questions any
 * arriving AI agent should be able to extract without clicking through
 * to /ai-visibility. Kept short (4 items) so it doesn't compete with
 * the deeper FAQPage schema on /ai-visibility.
 */
const homeFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does Daizie do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Daizie is a service that tests whether AI systems (ChatGPT, Claude, Perplexity, Gemini) can find, understand, cite, and recommend a small business accurately. It starts with a free readiness check and offers a paid Daizie AI Visibility Assessment for $895.",
      },
    },
    {
      "@type": "Question",
      name: "What does Craizie do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Craizie helps small businesses set up practical AI governance — an inventory of what they've built with AI, clear ownership, sensible boundaries, and a plan for when something goes wrong. It's right-sized for solopreneurs and small teams, not enterprise compliance theater.",
      },
    },
    {
      "@type": "Question",
      name: "Who is Marty Koepke?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Marty Koepke is a System Clinical Informaticist with 20 years in enterprise informatics and the founder of Practical Informatics LLC. She built Daizie and Craizie to give small businesses access to the same discipline she's used across healthcare enterprise systems. She is the author of Between the Clicks: The Hidden Work of Healthcare Informatics.",
      },
    },
    {
      "@type": "Question",
      name: "How much does the paid Daizie Assessment cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Daizie AI Visibility Assessment is $895 as a one-time purchase and includes testing across four AI engines, 32 live AI responses captured, every factual claim verified against your real sources, a competitor comparison, and a 30-minute review call with Marty. Monthly Monitoring is available afterward for $149/month.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <div className="daizie-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />

        {/* ── Compact hook hero ────────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane daizie-home-hero">
            <div>
              <p className="daizie-eyebrow">AI visibility for small business</p>
              <h1>
                AI is finding your business.{" "}
                <em>And asking questions about it.</em>
              </h1>
              <p className="daizie-lede">
                I&rsquo;m Marty. I help small businesses show up accurately in
                AI systems — and set up sensible safeguards for the AI they
                build. Two questions, two brands, one accountable human.
              </p>
              <div className="daizie-actions">
                <Link className="daizie-btn primary" href="/ai-visibility">
                  See AI visibility →
                </Link>
                <Link className="daizie-btn secondary" href="/craizie">
                  See AI governance →
                </Link>
              </div>
            </div>
            <Image
              className="home-hook-photo"
              src="/images/headshot.jpg"
              alt="Marty Koepke"
              width={360}
              height={360}
              priority
            />
          </article>
        </Reveal>

        {/* ── Story / needs list ───────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <p className="daizie-eyebrow">Here we go</p>
            <h2>
              We&rsquo;re building remarkable things. We also have two very
              specific needs.
            </h2>
            <div className="daizie-needs-list">
              <div>
                <span>01</span>
                <strong>We need to be found in this new world of AI.</strong>
                <p>
                  The way people discover businesses is changing, and the good
                  work we&rsquo;re doing needs clear evidence behind it.
                </p>
              </div>
              <div>
                <span>02</span>
                <strong>We need simple safeguards.</strong>
                <p>
                  We&rsquo;re working at lightning speed — and AI is moving
                  just as quickly. Because generative AI isn&rsquo;t a clean,
                  predictable algorithm, it brings new risks we can&rsquo;t
                  ignore.
                </p>
              </div>
            </div>
            <p style={{ margin: "8px 0 0", lineHeight: 1.7 }}>
              I know I need both of these things, and I imagine you do too. But
              small businesses can&rsquo;t afford large consulting firms, and
              most of us don&rsquo;t have marketing or cybersecurity
              departments. We need solutions that are practical to implement,
              right-sized for our businesses, and priced within reach.
            </p>
            <div className="daizie-actions">
              <Link className="daizie-btn primary" href="/ai-visibility">
                AI visibility →
              </Link>
              <Link className="daizie-btn secondary" href="/craizie">
                AI governance →
              </Link>
            </div>
          </article>
        </Reveal>

        {/* ── Product grid: Daizie + Craizie ───────────────────────────── */}
        <div className="daizie-product-grid">
          <Reveal>
            <article className="daizie-pane daizie-product-card daizie-card">
              <p className="category-label">AI visibility</p>
              <div className="daizie-product-lockup" style={{ marginBottom: 18 }}>
                <Image
                  src="/images/brand-2026/daizie-mark.png"
                  alt=""
                  width={96}
                  height={96}
                  style={{ width: 96, height: 96 }}
                />
                <span className="lockup-text">
                  <span className="lockup-name" style={{ fontSize: "2.4rem" }}>
                    Daizie
                  </span>
                </span>
              </div>
              <h2>From dazed to discoverable.</h2>
              <p>
                AI is bringing small businesses to life in ways search never
                could — and dazing us at the same time. Ask ChatGPT, Claude,
                Perplexity, and Gemini the same question about your industry
                and you can get four different answers.
              </p>
              <p>
                How do you build confidence your business is showing up — and
                showing up accurately? Daizie tests what those four engines
                actually say about you, then hands you the specific fixes that
                make your business easier to find and harder to misrepresent.
              </p>
              <p className="plain-note">
                The goal stays human: help the right people find the good work
                you&rsquo;re already doing.
              </p>
              <p
                style={{
                  margin: "12px 0 0",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  color: "var(--dz-forest)",
                  fontSize: "1.05rem",
                  fontWeight: 500,
                }}
              >
                Free readiness check · <strong>$895</strong> full Assessment
              </p>
              <Link className="text-link" href="/ai-visibility">
                Explore AI visibility <span>→</span>
              </Link>
            </article>
          </Reveal>
          <Reveal>
            <article className="daizie-pane daizie-product-card craizie-card">
              <p className="category-label">AI governance</p>
              <div className="daizie-product-lockup" style={{ marginBottom: 18 }}>
                <Image
                  src="/images/brand-2026/craizie-mark.png"
                  alt=""
                  width={96}
                  height={96}
                  style={{ width: 96, height: 96 }}
                />
                <span className="lockup-text">
                  <span className="lockup-name" style={{ fontSize: "2.4rem" }}>
                    Craizie
                  </span>
                </span>
              </div>
              <h2>Because the questions can feel a little crazy.</h2>
              <p>
                You built something useful with AI. Then your business
                insurance renewal asks about AI enablement. A customer asks how
                you handle their data. Suddenly you&rsquo;re expected to have
                answers.
              </p>
              <p>
                Do you know what your AI is doing today? Could you catch drift
                or hallucination? I&rsquo;m no cybersecurity expert — I bet you
                aren&rsquo;t either. But AI governance isn&rsquo;t just for
                enterprises anymore. Craizie turns those questions into
                practical safeguards — inventory, ownership, boundaries, and a
                plan for when something goes wrong.
              </p>
              <p className="plain-note">
                Governance without the theater. Right-sized for the way small
                businesses actually work.
              </p>
              <Link className="text-link" href="/craizie">
                Explore AI governance <span>→</span>
              </Link>
            </article>
          </Reveal>
        </div>

        {/* ── The throughline (forest quote) ───────────────────────────── */}
        <Reveal>
          <article className="daizie-pane forest">
            <p className="daizie-eyebrow">The throughline</p>
            <blockquote
              style={{
                margin: 0,
                fontFamily: "var(--font-serif), Georgia, serif",
                fontWeight: 500,
                fontSize: "clamp(1.6rem, 3vw, 2.6rem)",
                lineHeight: 1.25,
              }}
            >
              &ldquo;A playful front door. Clear evidence, reasonable
              safeguards, and serious work underneath.&rdquo;
            </blockquote>
            <div className="daizie-actions" style={{ justifyContent: "flex-start" }}>
              <a className="daizie-btn light" href={BOOK_CALL_HREF}>
                Book a free 20-minute conversation →
              </a>
            </div>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
