import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { HUB, META, SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
  alternates: { canonical: "/" },
  openGraph: { title: META.home.title, description: META.home.description, url: SITE.url },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE.url}/#marty-koepke`,
  name: "Marty Koepke",
  gender: "Female",
  pronouns: "she/her",
  jobTitle: "Informatics leader, founder, and applied AI builder",
  url: SITE.url,
  sameAs: ["https://www.linkedin.com/in/marty-koepke", "https://substack.com/@martykoepke", "https://daizie.ai"],
};

export default function HomePage() {
  return (
    <div className="daizie-shell hub-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />
        <Reveal>
          <article className="daizie-pane hub-hero">
            <div>
              <p className="daizie-eyebrow">{HUB.hero.eyebrow}</p>
              <h1>{HUB.hero.headline}</h1>
              <p className="daizie-lede">{HUB.hero.lede}</p>
              <div className="daizie-actions">
                <Link className="daizie-btn primary" href={HUB.hero.primary.href}>{HUB.hero.primary.label} →</Link>
                <Link className="daizie-btn secondary" href={HUB.hero.secondary.href}>{HUB.hero.secondary.label}</Link>
              </div>
            </div>
            <Image className="hub-portrait" src="/images/headshot.jpg" alt="Marty Koepke" width={430} height={520} priority />
          </article>
        </Reveal>

        <Reveal>
          <article className="daizie-pane hub-intro">
            <p className="daizie-eyebrow">{HUB.introduction.eyebrow}</p>
            <h2>{HUB.introduction.headline}</h2>
            <div className="hub-prose">{HUB.introduction.body.map((p) => <p key={p}>{p}</p>)}</div>
          </article>
        </Reveal>

        <section className="hub-theme-grid" aria-label="Areas of work">
          {HUB.themes.map((theme) => (
            <Reveal key={theme.number}>
              <article className="daizie-pane hub-theme-card">
                <span>{theme.number}</span><h2>{theme.title}</h2><p>{theme.body}</p>
              </article>
            </Reveal>
          ))}
        </section>

        <Reveal>
          <article className="daizie-pane forest hub-feature">
            <div>
              <p className="daizie-eyebrow">{HUB.featured.eyebrow}</p>
              <h2>{HUB.featured.headline}</h2>
              <p className="daizie-lede">{HUB.featured.body}</p>
              <div className="daizie-actions"><a className="daizie-btn light" href={HUB.featured.href}>{HUB.featured.label} ↗</a></div>
            </div>
            <div className="hub-daizie-mark" aria-hidden="true">D</div>
          </article>
        </Reveal>

        <Reveal>
          <article className="daizie-pane">
            <p className="daizie-eyebrow">Grounded in practice</p>
            <div className="hub-proof-grid">{HUB.proof.map((item) => <div key={item.value}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div>
            <p className="hub-boundary">These are outcomes and scale from enterprise work I helped lead. They are not presented as results from Daizie or from my independent products.</p>
          </article>
        </Reveal>

        <Reveal>
          <article className="daizie-pane center">
            <p className="daizie-eyebrow">{HUB.closing.eyebrow}</p><h2>{HUB.closing.headline}</h2>
            <p className="daizie-lede">{HUB.closing.body}</p>
            <div className="daizie-actions"><Link className="daizie-btn primary" href="/resources">Explore writing and resources →</Link></div>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
