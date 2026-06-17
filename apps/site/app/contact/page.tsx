import type { Metadata } from "next";
import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";
import { META, CONTACT, SITE } from "@/lib/content";
import { CONTACT_EMAIL, BOOK_CALL_HREF, BOOK_CALL_LABEL } from "@/lib/links";

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

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  about: {
    "@type": "ProfessionalService",
    name: SITE.legalName,
    email: CONTACT_EMAIL,
    areaServed: SITE.serviceArea,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mokelumne Hill",
      addressRegion: "CA",
      addressCountry: "US",
    },
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />

      {/* Hero — light */}
      <Section tone="cream" width="narrow" className="text-center">
        <Reveal>
          <h1 className="text-4xl text-forest sm:text-5xl">
            {CONTACT.heroHeadline}
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-xl text-moss">
            {CONTACT.heroSubhead}
          </p>
        </Reveal>
      </Section>

      {/* Booking — FOREST band, primary conversion */}
      <Section tone="forest" width="narrow" className="text-center">
        <Reveal>
          <h2 className="text-3xl text-cream sm:text-4xl">
            Book a free 20-minute conversation
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-cream/80">
            Tell me a little about your business and we&apos;ll find a time to
            talk. No pitch, no pressure — just a real conversation.
          </p>
          <a
            href={BOOK_CALL_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center justify-center rounded-md bg-cream px-7 py-3.5 font-semibold text-forest transition-colors hover:bg-cream-dim"
          >
            {BOOK_CALL_LABEL}
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          <p className="mt-4 text-sm text-cream/70">
            Or email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline decoration-gold underline-offset-4 hover:text-gold"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </Reveal>
      </Section>

      {/* Service area — warm tan */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <h2 className="text-2xl text-forest">{CONTACT.serviceAreaTitle}</h2>
          <p className="mt-3 leading-relaxed text-charcoal">
            {CONTACT.serviceArea}
          </p>
        </Reveal>
      </Section>
    </>
  );
}
