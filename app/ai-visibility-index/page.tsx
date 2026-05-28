import type { Metadata } from "next";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { META, AVI, SITE } from "@/lib/content";
import { BOOK_CALL_HREF, BOOK_CALL_LABEL } from "@/lib/links";

export const metadata: Metadata = {
  title: META.avi.title,
  description: META.avi.description,
  alternates: { canonical: "/ai-visibility-index" },
  openGraph: {
    title: META.avi.title,
    description: META.avi.description,
    url: `${SITE.url}/ai-visibility-index`,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AVI.faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const offerJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Visibility Index",
  alternateName: ["AVI", "AI Visibility Audit", "Generative Engine Optimization Audit"],
  serviceType: "AI Visibility Audit",
  provider: {
    "@type": "Organization",
    "@id": `${SITE.url}/#org`,
    name: SITE.legalName,
    url: SITE.url,
  },
  areaServed: { "@type": "Country", name: "United States" },
  description: META.avi.description,
  audience: {
    "@type": "BusinessAudience",
    audienceType: "Established small professional-service firms",
  },
  offers: {
    "@type": "Offer",
    price: "697",
    priceCurrency: "USD",
    description:
      "Flat fee. Includes 10-page AVI Report with live LLM tests across Claude, ChatGPT, and Gemini, six-dimension scorecard, top-5 prioritized fix list, projected post-fix score, and a 30-minute walk-through call. Delivered in 5 business days.",
    availability: "https://schema.org/InStock",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "AI Visibility Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "AI Visibility Index Audit" },
        price: "697",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: "Implementation Sprint" },
        price: "3997",
        priceCurrency: "USD",
      },
    ],
  },
};

export default function AVIPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerJsonLd) }}
      />

      {/* Hero — light, centered. Sub-tagline carries the AI hook above the fold. */}
      <Section tone="cream" width="narrow" className="text-center">
        <Reveal>
          <h1 className="text-4xl text-forest sm:text-5xl">
            {AVI.heroHeadline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg italic text-gold-dark sm:text-xl">
            {AVI.subTagline}
          </p>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-xl text-moss">
            {AVI.heroSubhead}
          </p>
          <div className="mt-9">
            <Button href={BOOK_CALL_HREF}>
              {BOOK_CALL_LABEL}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="mx-auto mt-7 max-w-xl border-t border-tan pt-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-moss sm:text-xs">
              {AVI.heroTrust.map((item, i) => (
                <span key={i}>
                  {i <= 1 ? (
                    <span className="text-gold-dark">{item}</span>
                  ) : (
                    item
                  )}
                  {i < AVI.heroTrust.length - 1 && (
                    <span className="mx-2 text-tan">·</span>
                  )}
                </span>
              ))}
            </p>
          </div>
        </Reveal>
      </Section>

      {/* What it is — light prose */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <h2 className="text-3xl text-forest sm:text-4xl">
            What the AI Visibility Index is
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-5">
          {AVI.whatItIs.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-charcoal">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* What's different — FOREST band */}
      <Section tone="forest" width="narrow">
        <Reveal>
          <h2 className="text-3xl text-cream sm:text-4xl">
            What&apos;s different about this
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-5">
          {AVI.whatsDifferent.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-cream/85">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Six dimensions — cream-dim, two-column grid */}
      <Section tone="cream-dim" width="wide">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            The Six Dimensions
          </p>
          <h2 className="mt-2 text-center text-3xl text-forest sm:text-4xl">
            What gets measured
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-moss">
            Every audit scores your business across these six dimensions, with
            the underlying findings driving the top-five fix list.
          </p>
        </Reveal>
        <RevealGroup className="mt-12 grid gap-6 md:grid-cols-2">
          {AVI.dimensions.map((d, i) => (
            <RevealItem
              key={d.title}
              className="rounded-lg border border-tan bg-cream p-6"
            >
              <div className="flex items-start gap-4">
                <span className="font-serif text-sm font-semibold text-gold-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-xl text-forest">{d.title}</h3>
                  <p className="mt-2 leading-relaxed text-charcoal">{d.body}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* What you get — cream, ordered list */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <h2 className="text-3xl text-forest sm:text-4xl">What you get</h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-4">
          {AVI.whatYouGet.map((item, i) => (
            <RevealItem
              key={i}
              className="flex gap-5 border-b border-tan py-4 last:border-b-0"
            >
              <span className="min-w-[32px] pt-0.5 font-serif text-sm font-semibold text-gold-dark">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="leading-relaxed text-charcoal">{item}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Cost — warm tan, single clear price + sprint hint */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">What it costs</h2>
          <p className="mt-6 font-serif text-2xl text-forest">
            {AVI.cost.headline}
          </p>
          <p className="mt-4 text-moss">{AVI.cost.sub}</p>
        </Reveal>
      </Section>

      {/* Note on AI — bordered, cream */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            How AI shows up here
          </p>
          <h2 className="mt-2 text-center text-3xl text-forest sm:text-4xl">
            A note on AI
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-5">
          {AVI.noteOnAI.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-charcoal">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Who it's for / isn't for — light, bordered cards */}
      <Section tone="cream-dim">
        <RevealGroup className="grid gap-8 md:grid-cols-2">
          <RevealItem className="rounded-lg border border-tan bg-cream p-7">
            <h2 className="font-serif text-2xl text-forest">
              Who this is for
            </h2>
            <p className="mt-4 leading-relaxed text-charcoal">{AVI.forYou}</p>
          </RevealItem>
          <RevealItem className="rounded-lg border border-tan bg-cream p-7">
            <h2 className="font-serif text-2xl text-forest">
              Who this isn&apos;t for
            </h2>
            <p className="mt-4 leading-relaxed text-charcoal">
              {AVI.notForYou}
            </p>
          </RevealItem>
        </RevealGroup>
      </Section>

      {/* FAQ — cream, expandable */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <Reveal className="mt-8">
          <Faq items={AVI.faq} />
        </Reveal>
      </Section>

      <FinalCta
        headline="Ready to find out what AI is saying about you?"
        body={AVI.finalCta}
      />
    </>
  );
}
