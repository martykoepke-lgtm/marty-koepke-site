import type { Metadata } from "next";
import Image from "next/image";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { META, SITE } from "@/lib/content";
import { BOOK_CALL_HREF } from "@/lib/links";

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

export default function AboutPage() {
  return (
    <div className="daizie-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />

        <Reveal>
          <article className="daizie-pane daizie-profile-pane">
            <Image
              src="/images/headshot.jpg"
              alt="Marty Koepke"
              width={230}
              height={290}
              priority
            />
            <div>
              <p className="daizie-eyebrow">About Marty</p>
              <h1>Twenty years of informatics behind every recommendation.</h1>
              <p className="daizie-lede">
                I&rsquo;ve spent my career standing between people and
                complicated technology — translating what the system can do
                into what people actually need.
              </p>
            </div>
          </article>
        </Reveal>

        <Reveal>
          <article className="daizie-pane">
            <h2>Serious inside. Playful outside.</h2>
            <p className="daizie-lede" style={{ marginTop: 14 }}>
              Daizie and Craizie make the first step feel possible. Underneath
              the approachable names is the same discipline I&rsquo;ve used
              across enterprise healthcare: define the question, make the
              evidence visible, keep judgment with the right person, and build
              a process people can follow.
            </p>
            <div className="daizie-stats">
              <div>
                <strong>20+</strong>
                <span>years in informatics</span>
              </div>
              <div>
                <strong>2,500+</strong>
                <span>ambulatory facilities</span>
              </div>
              <div>
                <strong>62</strong>
                <span>businesses studied</span>
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal>
          <article className="daizie-pane forest">
            <p className="daizie-eyebrow">Prefer to talk first?</p>
            <h2>Bring the question. I&rsquo;ll bring the framework.</h2>
            <p className="daizie-lede" style={{ color: "rgba(250,246,238,.85)" }}>
              Whether you&rsquo;re trying to be found or trying to put sensible
              safeguards around what you&rsquo;ve built, book a free
              twenty-minute conversation.
            </p>
            <div className="daizie-actions">
              <a className="daizie-btn light" href={BOOK_CALL_HREF}>
                Schedule a free 20-minute conversation →
              </a>
            </div>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
