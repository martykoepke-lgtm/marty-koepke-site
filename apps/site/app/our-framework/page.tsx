import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";
import FrameworkSubNav from "@/components/sections/FrameworkSubNav";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SITE } from "@/lib/content";
import { getMarketingPage } from "@/lib/marketing";

const SLUG = "our-framework";

export async function generateMetadata(): Promise<Metadata> {
  const page = getMarketingPage(SLUG);
  if (!page) return { title: "Not found" };
  return {
    title: `${page.title} | Marty Koepke`,
    description: page.description,
    alternates: { canonical: `/${SLUG}` },
    openGraph: {
      type: "article",
      title: page.title,
      description: page.description,
      url: `${SITE.url}/${SLUG}`,
    },
  };
}

export default function OurFrameworkPage() {
  const page = getMarketingPage(SLUG);
  if (!page) notFound();

  return (
    <>
      <FrameworkSubNav />
      <Section width="narrow">
      <Reveal>
        <article>
          <h1 className="text-3xl sm:text-4xl font-semibold text-forest">{page.title}</h1>
          <p className="mt-3 text-base text-moss">{page.description}</p>
          <div
            className="mt-8 text-lg text-charcoal"
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        </article>
      </Reveal>

      <div className="soft-divider my-12" aria-hidden="true" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 rounded bg-forest px-5 py-3 text-base font-medium text-cream hover:bg-forest-dark transition-colors"
        >
          Start the free AI readiness check
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <Link
          href="/blog/why-ai-business-accuracy-matters"
          className="text-base text-forest underline decoration-gold underline-offset-4 hover:text-forest-dark"
        >
          See the research behind this
        </Link>
      </div>
    </Section>
    </>
  );
}
