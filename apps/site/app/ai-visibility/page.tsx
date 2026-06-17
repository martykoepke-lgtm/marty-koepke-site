import type { Metadata } from "next";
import Image from "next/image";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import Faq from "@/components/sections/Faq";
import { Icon, ArrowRightIcon, CheckIcon } from "@/components/ui/Icons";
import { META, AVI, SITE } from "@/lib/content";
import { BOOK_CALL_HREF, resolveTierCta } from "@/lib/links";

export const metadata: Metadata = {
  title: META.aiVisibility.title,
  description: META.aiVisibility.description,
  alternates: { canonical: "/ai-visibility" },
  openGraph: {
    title: META.aiVisibility.title,
    description: META.aiVisibility.description,
    url: `${SITE.url}/ai-visibility`,
  },
};

// Structured data — helps real search engines AND models AI scrape this page
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AVI.faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Visibility Index",
  provider: { "@id": `${SITE.url}/#org` },
  description: META.aiVisibility.description,
  offers: [
    {
      "@type": "Offer",
      name: "Free AI Readiness Check",
      price: "0",
      priceCurrency: "USD",
      description:
        "Preliminary readiness score and 2–3 surface findings. Coming soon.",
    },
    {
      "@type": "Offer",
      name: "AI Visibility Report",
      price: "697",
      priceCurrency: "USD",
      description:
        "Cross-engine measurement scored against 7 dimensions, with a prioritized remediation roadmap and a 45-minute walkthrough call. 100% credited toward a Sprint within 30 days.",
    },
    {
      "@type": "Offer",
      name: "Done-With-You Sprint — Foundations",
      price: "2997",
      priceCurrency: "USD",
      description:
        "Every fix in your AI Visibility Report, implemented with you. For solo operators, single location, focused service set. 30-day engagement with a 60-day re-measure.",
    },
    {
      "@type": "Offer",
      name: "Done-With-You Sprint — Expanded",
      price: "4997",
      priceCurrency: "USD",
      description:
        "Every fix in your AI Visibility Report, implemented with you. For multi-location, multi-service businesses, or larger competitive fields. 45-day engagement with a 60-day re-measure.",
    },
    {
      "@type": "Offer",
      name: "Visibility Partner",
      price: "597",
      priceCurrency: "USD",
      description:
        "Optional ongoing maintenance after a Sprint. Monthly monitoring, quarterly re-measure, ongoing guidance. Cancel anytime.",
    },
  ],
};

export default function AiVisibilityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      {/* Hero — light, centered. Sub-tagline carries the methodology pitch. */}
      <Section tone="cream" width="narrow" className="text-center">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {AVI.heroEyebrow}
          </p>
          <h1 className="mt-3 text-4xl text-forest sm:text-5xl">
            {AVI.heroHeadline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-lg italic text-gold-dark sm:text-xl">
            {AVI.subTagline}
          </p>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-xl text-moss">
            {AVI.heroSubhead}
          </p>
          <div className="mt-9">
            <Button href="/scan">
              Run the free Readiness Check
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

      {/* The problem — FOREST band sets the gravity */}
      <Section tone="forest" width="narrow">
        <Reveal>
          <h2 className="text-3xl text-cream sm:text-4xl">
            The shift nobody&apos;s talking about.
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-5">
          {AVI.problem.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-cream/85">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* The six dimensions — cream-dim, 6-up grid with line-art icons */}
      <Section tone="cream-dim">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {AVI.dimensionsEyebrow}
          </p>
          <h2 className="mt-3 text-center text-3xl text-forest sm:text-4xl">
            {AVI.dimensionsHeadline}
          </h2>
        </Reveal>
        <RevealGroup className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {AVI.dimensions.map((d) => (
            <RevealItem
              key={d.name}
              className="rounded-lg border border-tan bg-cream p-7"
            >
              <Icon
                name={d.icon as "user" | "search" | "fingerprint" | "layers" | "code" | "network"}
                className="h-8 w-8 text-gold-dark"
              />
              <h3 className="mt-5 font-serif text-xl text-forest">{d.name}</h3>
              <p className="mt-3 leading-relaxed text-charcoal">{d.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Org-level section — brand context: complementary, not substitutive */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {AVI.orgSection.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">
            {AVI.orgSection.headline}
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-5">
          {AVI.orgSection.bodyParagraphs.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-charcoal">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <RevealGroup className="mt-10 grid gap-6 md:grid-cols-2">
          <RevealItem className="rounded-lg border border-tan bg-cream-dim p-6">
            <p className="font-serif text-sm uppercase tracking-[0.14em] text-gold-dark">
              What we bring
            </p>
            <ul className="mt-4 space-y-2">
              {AVI.orgSection.weBring.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-charcoal"
                >
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </RevealItem>
          <RevealItem className="rounded-lg border border-tan bg-cream-dim p-6">
            <p className="font-serif text-sm uppercase tracking-[0.14em] text-gold-dark">
              What we never replace
            </p>
            <ul className="mt-4 space-y-2">
              {AVI.orgSection.weNeverReplace.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-charcoal"
                >
                  <span className="mt-0.5 inline-block h-4 w-4 shrink-0 text-center text-gold-dark">
                    —
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </RevealItem>
        </RevealGroup>
      </Section>

      {/* Why this is different — anti-generic-SEO positioning */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {AVI.differentEyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">
            {AVI.differentHeadline}
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 space-y-5">
          {AVI.differentBody.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-charcoal">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Pricing — three tiers, middle featured */}
      <Section tone="cream-dim" width="wide">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {AVI.pricingEyebrow}
          </p>
          <h2 className="mt-3 text-center text-3xl text-forest sm:text-4xl">
            {AVI.pricingHeadline}
          </h2>
        </Reveal>
        <RevealGroup className="mt-14 grid gap-8 md:grid-cols-2">
          {AVI.tiers.map((tier) => {
            const href = resolveTierCta(tier.ctaTarget);
            return (
              <RevealItem
                key={tier.id}
                className={
                  tier.featured
                    ? "relative flex flex-col rounded-lg border-2 border-gold bg-cream p-8 shadow-sm md:-translate-y-2"
                    : "flex flex-col rounded-lg border border-tan bg-cream p-8"
                }
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 font-serif text-[11px] uppercase tracking-[0.14em] text-forest-dark">
                    Most chosen
                  </span>
                )}
                <h3 className="font-serif text-xl text-forest">{tier.name}</h3>
                <p className="mt-4 font-serif text-4xl text-forest">
                  {tier.price}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-moss">
                  {tier.priceNote}
                </p>
                <p className="mt-4 font-serif text-base italic text-gold-dark">
                  {tier.tagline}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.includes.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-relaxed text-charcoal"
                    >
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button
                    href={href}
                    variant={tier.featured ? "primary" : "ghost"}
                    className="w-full"
                  >
                    {tier.cta}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Section>

      {/* Who it's for / isn't for — two bordered cards */}
      <Section tone="cream">
        <RevealGroup className="grid gap-8 md:grid-cols-2">
          <RevealItem className="rounded-lg border border-tan bg-cream-dim p-7">
            <h2 className="font-serif text-2xl text-forest">
              {AVI.forYouHeadline}
            </h2>
            <p className="mt-4 leading-relaxed text-charcoal">{AVI.forYou}</p>
          </RevealItem>
          <RevealItem className="rounded-lg border border-tan bg-cream-dim p-7">
            <h2 className="font-serif text-2xl text-forest">
              {AVI.notForYouHeadline}
            </h2>
            <p className="mt-4 leading-relaxed text-charcoal">
              {AVI.notForYou}
            </p>
          </RevealItem>
        </RevealGroup>
      </Section>

      {/* About Marty — credibility for the AVI specifically */}
      <Section tone="cream-dim">
        <Reveal>
          <div className="grid items-center gap-10 md:grid-cols-[260px_1fr]">
            <Image
              src="/images/headshot.jpg"
              alt="Marty Koepke"
              width={260}
              height={260}
              className="mx-auto h-[220px] w-[220px] rounded-full object-cover md:h-[260px] md:w-[260px]"
            />
            <div>
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
                {AVI.aboutMartyEyebrow}
              </p>
              <h2 className="mt-3 font-serif text-2xl text-forest sm:text-3xl">
                {AVI.aboutMartyHeadline}
              </h2>
              {AVI.aboutMartyBody.map((p, i) => (
                <p key={i} className="mt-4 leading-relaxed text-charcoal">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      {/* FAQ */}
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

      {/* Secondary CTA — for talk-first folks */}
      <Section tone="forest" width="narrow" className="text-center">
        <Reveal>
          <h2 className="text-3xl text-cream sm:text-4xl">
            {AVI.secondaryCta.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream/80">
            {AVI.secondaryCta.body}
          </p>
          <div className="mt-9">
            <Button href={BOOK_CALL_HREF} variant="onForest">
              Schedule a free 20-minute conversation
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
