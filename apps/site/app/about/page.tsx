import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { ABOUT, META, SITE } from "@/lib/content";
import { SUBSTACK_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: META.about.title,
  description: META.about.description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: META.about.title,
    description: META.about.description,
    url: `${SITE.url}/about`,
  },
};

const story = ABOUT.siteStory;

export default function AboutPage() {
  return (
    <div className="daizie-shell hub-shell">
      <DaizieHeader />
      <main className="daizie-main hub-about-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />

        <Reveal>
          <article className="daizie-pane hub-hero">
            <div>
              <p className="daizie-eyebrow">{story.eyebrow}</p>
              <h1>{story.headline}</h1>
              <p className="daizie-lede">{story.lede}</p>
            </div>
            <Image className="hub-portrait" src="/images/headshot.jpg" alt="Marty Koepke" width={520} height={650} priority />
          </article>
        </Reveal>

        <Reveal>
          <article className="daizie-pane">
            <div className="hub-proof-grid" aria-label="Experience at a glance">
              {story.proof.map((item) => (
                <div key={item.value}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </article>
        </Reveal>

        <Reveal>
          <article className="daizie-pane hub-intro">
            <p className="daizie-eyebrow">{story.throughline.eyebrow}</p>
            <h2>{story.throughline.headline}</h2>
            <div className="hub-prose">
              {story.throughline.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </article>
        </Reveal>

        <section className="hub-principle-grid" aria-label="How Marty works">
          {story.principles.map((principle) => (
            <Reveal key={principle.number}>
              <article className="daizie-pane hub-theme-card">
                <span>{principle.number}</span>
                <h2>{principle.title}</h2>
                <p>{principle.body}</p>
              </article>
            </Reveal>
          ))}
        </section>

        <Reveal>
          <article className="daizie-pane forest">
            <p className="daizie-eyebrow">{story.outcomes.eyebrow}</p>
            <h2>{story.outcomes.headline}</h2>
            <p className="daizie-lede">{story.outcomes.body}</p>
            <p className="hub-boundary on-forest">{story.outcomes.note}</p>
          </article>
        </Reveal>

        <Reveal>
          <article className="daizie-pane">
            <p className="daizie-eyebrow">{story.builder.eyebrow}</p>
            <h2>{story.builder.headline}</h2>
            <div className="hub-prose hub-prose-wide">
              {story.builder.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </article>
        </Reveal>

        <section className="hub-work-grid" aria-label="What Marty is building now">
          {story.currentWork.map((item) => (
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
        </section>

        <Reveal>
          <article className="daizie-pane">
            <p className="daizie-eyebrow">Education and credentials</p>
            <h2>Formal training supports the work. It does not replace the work.</h2>
            <ul className="hub-credential-grid">
              {story.credentials.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="hub-boundary">{story.distinction}</p>
            <div className="daizie-actions">
              <a className="daizie-btn secondary" href={SUBSTACK_URL}>Read on Substack ↗</a>
              <Link className="daizie-btn primary" href="/contact">Connect with Marty →</Link>
            </div>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
