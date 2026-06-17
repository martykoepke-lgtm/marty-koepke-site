import type { Metadata } from "next";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import ThePath from "@/components/sections/ThePath";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { META, ASSESSMENT, SITE } from "@/lib/content";
import { BOOK_CALL_HREF, BOOK_CALL_LABEL } from "@/lib/links";

export const metadata: Metadata = {
  title: META.assessment.title,
  description: META.assessment.description,
  alternates: { canonical: "/time-back-assessment" },
  openGraph: {
    title: META.assessment.title,
    description: META.assessment.description,
    url: `${SITE.url}/time-back-assessment`,
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ASSESSMENT.faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const offerJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Time Back Assessment",
  provider: { "@type": "Organization", name: SITE.legalName },
  areaServed: SITE.serviceArea,
  description: META.assessment.description,
  offers: {
    "@type": "Offer",
    price: "1500",
    priceCurrency: "USD",
    description: "Flat fee. Includes on-site visit, written report, follow-up call, and one implemented quick win.",
  },
};

export default function AssessmentPage() {
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

      {/* Hero — light, centered. Sub-tagline carries AI signal above the fold. */}
      <Section tone="cream" width="narrow" className="text-center">
        <Reveal>
          <h1 className="text-4xl text-forest sm:text-5xl">
            {ASSESSMENT.heroHeadline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg italic text-gold-dark sm:text-xl">
            {ASSESSMENT.subTagline}
          </p>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-xl text-moss">
            {ASSESSMENT.heroSubhead}
          </p>
          <div className="mt-9">
            <Button href={BOOK_CALL_HREF}>
              {BOOK_CALL_LABEL}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="mx-auto mt-7 max-w-xl border-t border-tan pt-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-moss sm:text-xs">
              {ASSESSMENT.heroTrust.map((item, i) => (
                <span key={i}>
                  {i <= 2 ? (
                    <span className="text-gold-dark">{item}</span>
                  ) : (
                    item
                  )}
                  {i < ASSESSMENT.heroTrust.length - 1 && (
                    <span className="mx-2 text-tan">·</span>
                  )}
                </span>
              ))}
            </p>
          </div>
        </Reveal>
      </Section>

      {/* What's different — FOREST band, sets the tone for the offer */}
      <Section tone="forest" width="narrow">
        <Reveal>
          <h2 className="text-3xl text-cream sm:text-4xl">
            What&apos;s different about this
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-5">
          {ASSESSMENT.whatsDifferent.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-cream/85">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* A note on AI — moved UP from later in the page so AI integration
          is visible right after the positioning, not buried near FAQ */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            How AI shows up here
          </p>
          <h2 className="mt-2 text-center text-3xl text-forest sm:text-4xl">
            A note on AI
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-5">
          {ASSESSMENT.noteOnAI.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-charcoal">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* If you're not local — quieter cream-dim follow-on */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <h2 className="text-2xl text-forest sm:text-3xl">
            {ASSESSMENT.notLocal.heading}
          </h2>
        </Reveal>
        <Reveal className="mt-6">
          <p className="text-lg leading-relaxed text-charcoal">
            {ASSESSMENT.notLocal.body}
          </p>
        </Reveal>
      </Section>

      {/* The Path + full detail — light, interactive */}
      <Section tone="cream" width="wide">
        <Reveal>
          <h2 className="text-center text-3xl sm:text-4xl">What you get</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-moss">
            Five steps, from first conversation to one real thing built in your
            business.
          </p>
        </Reveal>
        <div className="mt-16">
          <ThePath />
        </div>

        {/* Always-in-DOM detailed list (SEO / AI-readable / no-JS fallback) */}
        <Reveal className="mt-20">
          <ol className="mx-auto max-w-3xl space-y-10">
            {ASSESSMENT.path.map((step) => (
              <li key={step.id} className="border-l-2 border-gold pl-6">
                <p className="font-serif text-sm text-gold-dark">
                  Step {step.step} of 5
                </p>
                <h3 className="mt-1 text-2xl text-forest">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-charcoal">
                  {step.detail}
                </p>
                {step.id === "report" && (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-charcoal">
                    {ASSESSMENT.reportBullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>

      {/* Cost — warm tan, single clear price */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">What it costs</h2>
          <p className="mt-6 font-serif text-2xl text-forest">
            {ASSESSMENT.cost.headline}
          </p>
        </Reveal>
      </Section>

      {/* Who it's for / isn't for — light, bordered cards */}
      <Section tone="cream">
        <RevealGroup className="grid gap-8 md:grid-cols-2">
          <RevealItem className="rounded-lg border border-tan bg-cream-dim p-7">
            <h2 className="font-serif text-2xl text-forest">
              Who this is for
            </h2>
            <p className="mt-4 leading-relaxed text-charcoal">
              {ASSESSMENT.forYou}
            </p>
          </RevealItem>
          <RevealItem className="rounded-lg border border-tan bg-cream-dim p-7">
            <h2 className="font-serif text-2xl text-forest">
              Who this isn&apos;t for
            </h2>
            <p className="mt-4 leading-relaxed text-charcoal">
              {ASSESSMENT.notForYou}
            </p>
          </RevealItem>
        </RevealGroup>
      </Section>

      {/* FAQ — warm tan, expandable */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>
        <Reveal className="mt-8">
          <Faq items={ASSESSMENT.faq} />
        </Reveal>
      </Section>

      <FinalCta
        headline="Ready to see where your time is going?"
        body={ASSESSMENT.finalCta}
      />
    </>
  );
}
