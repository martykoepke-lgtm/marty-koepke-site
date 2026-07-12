import type { Metadata } from "next";
import Image from "next/image";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { SITE } from "@/lib/content";
import { BOOK_CALL_HREF } from "@/lib/links";

export const metadata: Metadata = {
  title: "Craizie — Practical AI governance",
  description:
    "Craizie helps small businesses build sensible safeguards around the AI they use — inventory, ownership, boundaries, testing, disclosure, and an incident plan proportionate to the risk.",
  alternates: { canonical: "/craizie" },
  openGraph: {
    title: "Craizie — Practical AI governance",
    description:
      "Sensible safeguards around the AI you use — inventory, ownership, boundaries, testing, disclosure, and an incident plan proportionate to the risk.",
    url: `${SITE.url}/craizie`,
  },
};

const QUESTIONS = [
  "Where are we using AI?",
  "Does it interact with customers?",
  "What information does it receive?",
  "What can it decide or do?",
  "Where must a person remain accountable?",
  "What happens when it gets something wrong?",
];

export default function CraiziePage() {
  return (
    <div className="daizie-shell craizie-surface">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane daizie-hero-pane">
            <div className="daizie-product-lockup">
              <Image
                src="/images/brand-2026/craizie-mark.png"
                alt=""
                width={420}
                height={420}
                priority
              />
              <span className="lockup-text">
                <span className="lockup-name">Craizie</span>
                <span className="lockup-tag">AI governance, made sane</span>
              </span>
            </div>
            <p className="daizie-eyebrow">
              Practical AI governance
            </p>
            <h1>The questions arrive before the answers do.</h1>
            <p className="daizie-lede">
              An insurer, customer, or partner asks how your customer-facing
              AI is governed. Craizie helps you understand the question — and
              build a sensible answer.
            </p>
            <div className="daizie-actions">
              <a className="daizie-btn primary" href={BOOK_CALL_HREF}>
                Start a real conversation →
              </a>
            </div>
          </article>
        </Reveal>

        {/* ── Six starter questions ────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <p className="daizie-eyebrow">
              Start with what is real
            </p>
            <h2>You are not behind. These are new questions.</h2>
            <p className="daizie-lede" style={{ marginTop: 14 }}>
              Every AI governance conversation starts with the same six
              questions. Whether an insurer or a customer or your own team is
              asking, this is where clarity begins.
            </p>
            <div className="daizie-question-grid">
              {QUESTIONS.map((q, i) => (
                <div key={q}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{q}</p>
                </div>
              ))}
            </div>
          </article>
        </Reveal>

        {/* ── Governance without theater ──────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane forest">
            <p className="daizie-eyebrow">Governance without the theater</p>
            <h2>Right-sized for the way small businesses actually work.</h2>
            <p className="daizie-lede" style={{ color: "rgba(250,246,238,.85)" }}>
              No pretend enterprise program. No wall of acronyms. Just an
              inventory, clear ownership, practical boundaries, testing,
              disclosure, and an incident plan proportionate to the risk.
            </p>
            <div className="daizie-actions">
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
