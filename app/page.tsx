import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Section, { SoftDivider } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import HeroBanner from "@/components/sections/HeroBanner";
import FinalCta from "@/components/sections/FinalCta";
import { Icon, ArrowRightIcon } from "@/components/ui/Icons";
import { META, HOME } from "@/lib/content";
import { getAllPostMeta, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: META.home.title,
  description: META.home.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const posts = getAllPostMeta();
  const recent = posts.slice(0, 3);

  return (
    <>
      <HeroBanner />

      {/* The problem — light section, generous prose */}
      <Section tone="cream" width="narrow">
        <RevealGroup className="space-y-6">
          {HOME.problem.map((para, i) => (
            <RevealItem key={i}>
              <p className="text-lg leading-relaxed text-charcoal">{para}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* What I do — FOREST band, gold icons pop, cream text */}
      <Section tone="forest">
        <Reveal>
          <h2 className="text-center text-3xl text-cream sm:text-4xl">
            What I do
          </h2>
        </Reveal>
        <RevealGroup className="mt-14 grid gap-12 md:grid-cols-3">
          {HOME.whatIDo.map((col) => (
            <RevealItem key={col.headline} className="text-center md:text-left">
              <Icon
                name={col.icon}
                className="mx-auto h-9 w-9 text-gold md:mx-0"
              />
              <h3 className="mt-5 font-serif text-2xl text-cream">
                {col.headline}
              </h3>
              <p className="mt-3 leading-relaxed text-cream/80">{col.body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <Reveal className="mt-14 text-center" delay={0.1}>
          <Button href="/ai-visibility-index" variant="onForest">
            See the AI Visibility Index in full
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </Reveal>
      </Section>

      {/* AI Integration — cream-dim band, scrollable list of concrete AI work.
          Subtitle frames the list; the list provides specific proof points. */}
      <Section tone="cream-dim" width="narrow">
        <Reveal>
          <p className="text-center font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {HOME.whereAIFits.eyebrow}
          </p>
          <h2 className="mt-3 text-center font-serif text-3xl text-forest sm:text-4xl">
            {HOME.whereAIFits.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center font-serif text-lg italic leading-relaxed text-moss sm:text-xl">
            {HOME.whereAIFits.subtitle}
          </p>
        </Reveal>
        <RevealGroup className="mx-auto mt-12 max-w-2xl">
          {HOME.whereAIFits.list.map((item, i) => (
            <RevealItem
              key={i}
              className="flex gap-5 border-b border-tan py-5 last:border-b-0"
            >
              <span className="min-w-[32px] pt-0.5 font-serif text-sm font-semibold text-gold-dark">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="leading-relaxed text-charcoal">{item}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Where I focus — differentiation, anti-AI-guru positioning */}
      <Section tone="cream" width="narrow">
        <Reveal>
          <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
            {HOME.differentiation.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-forest sm:text-4xl">
            {HOME.differentiation.headline}
          </h2>
        </Reveal>
        <Reveal className="mt-8" delay={0.1}>
          <p className="text-lg leading-relaxed text-charcoal">
            {HOME.differentiation.body}
          </p>
        </Reveal>
        <Reveal className="mt-10" delay={0.2}>
          <p className="border-l-2 border-gold pl-5 font-serif text-xl italic leading-snug text-forest">
            {HOME.differentiation.closing}
          </p>
        </Reveal>
      </Section>

      {/* Who I am — warm light, headshot + intro */}
      <Section tone="cream-dim">
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
              {HOME.whoIAm.map((para, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "font-serif text-2xl text-forest"
                      : "mt-4 leading-relaxed text-charcoal"
                  }
                >
                  {para}
                </p>
              ))}
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

      {/* Recent thinking — only when there are 3+ published posts */}
      {recent.length >= 3 && (
        <>
          <SoftDivider />
          <Section tone="cream">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl">Recent thinking</h2>
            </Reveal>
            <RevealGroup className="mt-12 grid gap-8 md:grid-cols-3">
              {recent.map((post) => (
                <RevealItem key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block h-full rounded-lg border border-tan bg-cream p-6 transition-colors hover:border-forest"
                  >
                    <p className="text-sm text-moss">
                      {formatDate(post.date)}
                    </p>
                    <h3 className="mt-2 text-xl text-forest">{post.title}</h3>
                    <p className="mt-2 text-moss">{post.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-forest">
                      Read more
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
            <Reveal className="mt-10" delay={0.1}>
              <Button href="/blog" variant="ghost">
                All posts
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Reveal>
          </Section>
        </>
      )}

      <FinalCta />
    </>
  );
}
