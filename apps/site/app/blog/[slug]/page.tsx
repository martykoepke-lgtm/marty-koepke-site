import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Section from "@/components/ui/Section";
import Reveal from "@/components/motion/Reveal";
import FrameworkSubNav from "@/components/sections/FrameworkSubNav";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { SITE } from "@/lib/content";
import { getAllSlugs, getPost, formatDate } from "@/lib/blog";

const SUB_NAV_SLUGS = new Set(["why-ai-business-accuracy-matters"]);

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: `${post.title} | Marty Koepke`,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${SITE.url}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: "Marty Koepke" },
    publisher: { "@type": "Organization", name: SITE.legalName },
    mainEntityOfPage: `${SITE.url}/blog/${slug}`,
  };

  return (
    <>
      {SUB_NAV_SLUGS.has(slug) && <FrameworkSubNav />}
      <Section width="narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Reveal>
        <article>
          <h1 className="text-4xl text-forest sm:text-5xl">{post.title}</h1>
          <p className="mt-3 text-sm text-moss">{formatDate(post.date)}</p>
          <div
            className="mt-8 text-lg text-charcoal"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      </Reveal>

      <div className="soft-divider my-12" aria-hidden="true" />

      <div className="flex items-center gap-4">
        <Image
          src="/images/headshot.jpg"
          alt="Marty Koepke"
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <p className="font-serif text-forest">Marty Koepke</p>
          <p className="text-sm text-moss">
            AI visibility for small business, grounded in twenty years of
            informatics.
          </p>
        </div>
      </div>

      <Link
        href="/ai-visibility"
        className="mt-8 inline-flex items-center gap-2 font-serif text-lg text-forest hover:text-forest-dark"
      >
        See how Daizie measures AI visibility and business accuracy
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </Section>
    </>
  );
}
