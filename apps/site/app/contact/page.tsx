import type { Metadata } from "next";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { META, SITE } from "@/lib/content";
import { BOOK_CALL_HREF, CONTACT_EMAIL } from "@/lib/links";

export const metadata: Metadata = {
  title: META.contact.title,
  description: META.contact.description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: META.contact.title,
    description: META.contact.description,
    url: `${SITE.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="daizie-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />

        <Reveal>
          <article className="daizie-pane daizie-contact-pane">
            <p className="daizie-eyebrow">Connect with Marty</p>
            <h1>Bring the question. We can start there.</h1>
            <p className="daizie-lede" style={{ marginLeft: "auto", marginRight: "auto" }}>
              For thoughtful advisory work, speaking, teaching, product collaboration,
              or a conversation about Daizie, tell me what you are working through.
            </p>
            <div className="daizie-actions">
              <a className="daizie-btn primary" href={BOOK_CALL_HREF}>
                Book a free 20-minute conversation →
              </a>
              <a
                className="daizie-btn secondary"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                Email Marty
              </a>
            </div>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
