import type { Metadata } from "next";
import Image from "next/image";
import Section, { SoftDivider } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import HeroBanner from "@/components/sections/HeroBanner";
import FinalCta from "@/components/sections/FinalCta";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/Icons";
import { META, HOME } from "@/lib/content";

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <HeroBanner />

      {/* Brand statement — the umbrella positioning under the hero. */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <p className="text-center font-serif text-xl italic leading-relaxed text-charcoal sm:text-2xl">
            {HOME.brandStatement}
          </p>
        </Reveal>
      </Section>

      {/* BLOCK 1 — AI Visibility (lead offer, productized) */}
      <Section tone="forest">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold">
            {HOME.aviBlock.eyebrow}
          </p>
          <h2 className="mt-3 text-center font-serif text-3xl text-cream sm:text-4xl">
            {HOME.aviBlock.headline}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-cream/85">
            {HOME.aviBlock.intro}
          </p>
        </Reveal>
        <RevealGroup className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {HOME.aviBlock.tiers.map((tier) => (
            <RevealItem
              key={tier.name}
              className="rounded-lg border border-cream/15 bg-forest-dark/40 p-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-serif text-lg text-cream">{tier.name}</h3>
                <span className="font-serif text-2xl text-gold">
                  {tier.price}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-cream/55">
                {tier.note}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-cream/80">
                {tier.description}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
        <Reveal className="mt-12 text-center" delay={0.1}>
          <Button href={HOME.aviBlock.cta.href} variant="onForest">
            {HOME.aviBlock.cta.label}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </Reveal>
      </Section>

      {/* BLOCK 2 — Custom engagements (secondary block) */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {HOME.customBlock.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">
            {HOME.customBlock.headline}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-charcoal">
            {HOME.customBlock.intro}
          </p>
          <div className="mt-7">
            <Button href={HOME.customBlock.cta.href} variant="ghost">
              {HOME.customBlock.cta.label}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </Reveal>
      </Section>

      {/* PRINCIPLE — Complementary, not substitutive */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {HOME.principle.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">
            {HOME.principle.headline}
          </h2>
        </Reveal>
        <Reveal className="mt-8">
          <p className="text-lg leading-relaxed text-charcoal">
            {HOME.principle.body}
          </p>
        </Reveal>
        <RevealGroup className="mt-10 grid gap-6 md:grid-cols-2">
          <RevealItem className="rounded-lg border border-tan bg-cream-dim p-6">
            <p className="font-serif text-sm uppercase tracking-[0.14em] text-gold-dark">
              What we bring
            </p>
            <ul className="mt-4 space-y-2">
              {HOME.principle.weBring.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-charcoal"
                >
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-gold-dark" />
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
              {HOME.principle.weNeverReplace.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-charcoal"
                >
                  <span className="mt-1 inline-block h-4 w-4 shrink-0 text-gold-dark">
                    —
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </RevealItem>
        </RevealGroup>
      </Section>

      {/* CASE STUDY — research credibility marker */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {HOME.caseStudy.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">
            {HOME.caseStudy.headline}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-charcoal">
            {HOME.caseStudy.body}
          </p>
        </Reveal>
      </Section>

      {/* WHO IS MARTY */}
      <Section tone="cream">
        <Reveal>
          <div className="grid items-center gap-10 md:grid-cols-[300px_1fr]">
            <Image
              src="/images/headshot.jpg"
              alt="Marty Koepke"
              width={300}
              height={300}
              className="mx-auto h-[260px] w-[260px] rounded-full object-cover md:h-[300px] md:w-[300px]"
            />
            <div>
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
                {HOME.whoIAm.eyebrow}
              </p>
              <h2 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">
                {HOME.whoIAm.headline}
              </h2>
              <div className="mt-5 space-y-4">
                {HOME.whoIAm.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className="leading-relaxed text-charcoal"
                  >
                    {para}
                  </p>
                ))}
              </div>
              <div className="mt-7">
                <Button href="/about" variant="ghost">
                  More about me
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <SoftDivider />

      {/* FORTHCOMING — small text, one line */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <p className="text-center text-sm italic text-moss">
            {HOME.forthcoming}
          </p>
        </Reveal>
      </Section>

      <FinalCta />
    </>
  );
}
