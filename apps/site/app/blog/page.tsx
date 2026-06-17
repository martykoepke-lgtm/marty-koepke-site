import type { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/ui/Section";
import Reveal, { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { META, BLOG, SITE } from "@/lib/content";
import { getAllPostMeta, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: META.blog.title,
  description: META.blog.description,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: META.blog.title,
    description: META.blog.description,
    url: `${SITE.url}/blog`,
  },
};

export default function BlogIndexPage() {
  const posts = getAllPostMeta();

  return (
    <Section width="narrow">
      <Reveal>
        <h1 className="text-4xl text-forest sm:text-5xl">{BLOG.heading}</h1>
      </Reveal>

      {posts.length === 0 ? (
        <Reveal className="mt-8">
          <p className="text-lg text-moss">{BLOG.comingSoon}</p>
        </Reveal>
      ) : (
        <RevealGroup className="mt-12 divide-y divide-tan border-t border-tan">
          {posts.map((post) => (
            <RevealItem key={post.slug}>
              <article className="py-8">
                <p className="text-sm text-moss">{formatDate(post.date)}</p>
                <h2 className="mt-1.5 text-2xl text-forest">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="transition-colors hover:text-forest-dark"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 leading-relaxed text-charcoal">
                  {post.description}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-forest"
                >
                  Read more
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </Section>
  );
}
