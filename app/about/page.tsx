import type { Metadata } from "next";
import Image from "next/image";
import Section, { SoftDivider } from "@/components/ui/Section";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import FinalCta from "@/components/sections/FinalCta";
import BuiltThings from "@/components/sections/BuiltThings";
import { META, ABOUT, SITE } from "@/lib/content";
import { MARTYKOEPKE_URL, SOCIAL } from "@/lib/links";

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

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE.url}/#marty-koepke`,
  name: "Marty Koepke",
  alternateName: "Marty Koepke, MHA",
  gender: "Female",
  pronouns: "she/her",
  jobTitle: "Founder, Practical Informatics LLC · Informatics Consultant",
  description: META.about.description,
  url: `${SITE.url}/about`,
  image: `${SITE.url}/images/headshot.jpg`,
  disambiguatingDescription:
    "Marty Koepke (she/her), founder of Practical Informatics LLC at practicalinformatics.com (no hyphen). Based in California. Author of 'Between the Clicks: The Hidden Work of Healthcare Informatics.' Twenty years in healthcare informatics including enterprise-scale digital transformation across multiple states and EHR platforms. Not affiliated with practical-informatics.com (different entity) or other people named Marty or Mark Koepke.",
  homeLocation: {
    "@type": "Place",
    name: "California",
  },
  address: {
    "@type": "PostalAddress",
    addressRegion: "CA",
    addressCountry: "US",
  },
  worksFor: {
    "@type": "Organization",
    "@id": `${SITE.url}/#org`,
    name: SITE.legalName,
    url: SITE.url,
  },
  knowsAbout: [
    "AI visibility",
    "Generative engine optimization",
    "Answer engine optimization",
    "Healthcare informatics",
    "Clinical informatics",
    "Business process improvement",
    "Workflow optimization",
    "Schema.org structured data",
    "Lean Six Sigma",
    "Agile delivery",
    "AI implementation for small business",
  ],
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "degree",
      name: "Master of Health Administration",
      recognizedBy: { "@type": "Organization", name: "Ashford University" },
    },
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "Lean Six Sigma Black Belt",
    },
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "Lean Six Sigma Green Belt",
    },
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "Certified SAFe 6.0 Agilist",
    },
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "Certified Scrum Master",
      recognizedBy: { "@type": "Organization", name: "Scrum Alliance" },
    },
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certification",
      name: "Epic Clinical Informaticist Certification",
      recognizedBy: { "@type": "Organization", name: "Epic" },
    },
  ],
  hasOccupation: {
    "@type": "Occupation",
    name: "Informatics Consultant",
    occupationLocation: {
      "@type": "Place",
      name: "United States",
    },
    skills:
      "AI visibility; generative engine optimization; healthcare informatics; workflow optimization; process improvement; AI implementation; Lean Six Sigma; agile delivery",
  },
  workExample: {
    "@type": "Book",
    name: "Between the Clicks: The Hidden Work of Healthcare Informatics",
    author: { "@id": `${SITE.url}/#marty-koepke` },
  },
  sameAs: [
    SOCIAL.linkedin,
    SOCIAL.facebook,
    MARTYKOEPKE_URL,
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/* Hero — warm tan tone, headshot + headline */}
      <Section tone="cream-dim" width="wide">
        <Reveal>
          <div className="grid items-center gap-10 md:grid-cols-[280px_1fr]">
            <Image
              src="/images/headshot.jpg"
              alt="Marty Koepke"
              width={280}
              height={280}
              priority
              className="mx-auto h-[240px] w-[240px] rounded-full object-cover md:h-[280px] md:w-[280px]"
            />
            <h1 className="text-center font-serif text-3xl leading-snug text-forest sm:text-4xl md:text-left md:text-5xl">
              {ABOUT.heroHeadline}
            </h1>
          </div>
        </Reveal>
      </Section>

      {/* The story — light, generous prose */}
      <Section tone="cream" width="narrow">
        <RevealGroup className="space-y-6">
          {ABOUT.story.map((p, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-charcoal">{p}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* How I work — FOREST band, principles in cream + gold */}
      <Section tone="forest">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold">
            Principles
          </p>
          <h2 className="mt-2 text-center text-3xl text-cream sm:text-4xl">
            How I work
          </h2>
        </Reveal>
        <RevealGroup className="mt-12 grid gap-10 md:grid-cols-2">
          {ABOUT.principles.map((p) => (
            <RevealItem key={p.headline}>
              <h3 className="font-serif text-2xl text-cream">{p.headline}</h3>
              <p className="mt-3 leading-relaxed text-cream/80">{p.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Background — restructured for visual punch: bio + stat grid + chip cloud */}
      <Section tone="cream">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {ABOUT.backgroundEyebrow}
          </p>
          <h2 className="mt-3 text-center font-serif text-3xl text-forest sm:text-4xl">
            {ABOUT.backgroundHeadline}
          </h2>
        </Reveal>

        {/* Bio statement — centered prose */}
        <Reveal className="mt-10">
          <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-charcoal">
            {ABOUT.backgroundIntro}
          </p>
        </Reveal>

        {/* Outcome stat grid — 4 visual cards */}
        <RevealGroup className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT.outcomeStats.map((stat) => (
            <RevealItem
              key={stat.value}
              className="rounded-lg border border-tan bg-cream-dim p-6 text-center"
            >
              <div className="font-serif text-4xl font-semibold text-forest">
                {stat.value}
              </div>
              <div className="mt-2 font-serif text-xs uppercase tracking-[0.14em] text-gold-dark">
                {stat.label}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-moss">
                {stat.context}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Credentials chips */}
        <Reveal className="mt-14">
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            Credentials
          </p>
          <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
            {ABOUT.credentialsChips.map((c) => (
              <span
                key={c}
                className="rounded-full border border-tan bg-cream-dim px-4 py-1.5 text-sm text-charcoal"
              >
                {c}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Quiet cross-link to martykoepke.com */}
        <Reveal className="mt-12 text-center">
          <p className="text-sm text-moss">
            For Marty&apos;s healthcare informatics work, speaking, and writing,
            visit{" "}
            <a
              href={MARTYKOEPKE_URL}
              className="underline decoration-gold underline-offset-4 hover:text-forest"
            >
              martykoepke.com
            </a>
            .
          </p>
        </Reveal>
      </Section>

      <SoftDivider />

      {/* Things I've built — dynamic modal, click to see more + launch demo */}
      <Section tone="cream-dim">
        <Reveal>
          <h2 className="text-2xl text-forest sm:text-3xl">
            A few things I&apos;ve built
          </h2>
          <p className="mt-3 max-w-2xl text-moss">
            Part of doing the thinking is being able to build the fix. These
            are working systems I designed and shipped myself — tap a card for
            details and to launch the demo.
          </p>
        </Reveal>
        <div className="mt-10">
          <BuiltThings />
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
