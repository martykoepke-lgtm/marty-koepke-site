import type { Metadata } from "next";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { META, SITE, WORK } from "@/lib/content";

export const metadata: Metadata = {
  title: META.work.title,
  description: META.work.description,
  alternates: { canonical: "/work" },
  openGraph: {
    title: META.work.title,
    description: META.work.description,
    url: `${SITE.url}/work`,
  },
};

export default function WorkPage() {
  return (
    <div className="daizie-shell hub-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer compact" aria-hidden="true" />

        <Reveal>
          <article className="daizie-pane">
            <p className="daizie-eyebrow">{WORK.eyebrow}</p>
            <h1>{WORK.headline}</h1>
            <p className="daizie-lede">{WORK.lede}</p>
          </article>
        </Reveal>

        <section className="hub-work-grid" aria-label="Selected work">
          {WORK.items.map((item) => (
            <Reveal key={item.title}>
              <article className="daizie-pane hub-work-card">
                <p className="daizie-eyebrow">{item.type}</p>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                {item.external ? (
                  <a className="text-link" href={item.href}>{item.label} ↗</a>
                ) : (
                  <Link className="text-link" href={item.href}>{item.label} →</Link>
                )}
              </article>
            </Reveal>
          ))}
          <Reveal>
            <article className="daizie-pane hub-work-card">
              <p className="daizie-eyebrow">{WORK.governedWorkflow.type}</p>
              <h2>{WORK.governedWorkflow.title}</h2>
              <p>{WORK.governedWorkflow.body}</p>
              <Link className="text-link" href="/work/governed-workflow-tools">
                Explore the workflow tools →
              </Link>
            </article>
          </Reveal>
        </section>

        <Reveal>
          <article className="daizie-pane forest">
            <p className="daizie-eyebrow">An important distinction</p>
            <h2>Built, led, and still learning are different claims.</h2>
            <p className="daizie-lede">{WORK.distinction}</p>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
