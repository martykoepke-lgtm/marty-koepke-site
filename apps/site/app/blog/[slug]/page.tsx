import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { SITE, BLOG } from "@/lib/content";
import { SUBSTACK_URL } from "@/lib/links";
import { getAllSlugs, getPost, formatDate } from "@/lib/blog";

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
    <div className="daizie-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer compact" aria-hidden="true" />

        {/* ── The piece itself ────────────────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane">
            <Link className="daizie-back-link" href="/blog">
              <span aria-hidden="true">←</span> {BLOG.backLabel}
            </Link>
            <p className="daizie-eyebrow">{formatDate(post.date)}</p>
            <h1>{post.title}</h1>
            <div
              className="daizie-article-body"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          </article>
        </Reveal>

        {/* ── Author + where this leads ───────────────────────────────── */}
        <Reveal>
          <article className="daizie-pane daizie-post-card">
            <div className="daizie-author-card">
              <Image
                src="/images/headshot.jpg"
                alt="Marty Koepke"
                width={56}
                height={56}
              />
              <div>
                <p className="author-name">Marty Koepke</p>
                <p className="author-line">{BLOG.authorLine}</p>
              </div>
            </div>
            <p className="post-desc" style={{ marginTop: 18 }}>
              {BLOG.substackNote}{" "}
              <a
                href={SUBSTACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--dz-forest)",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textDecorationColor: "var(--dz-gold)",
                  textUnderlineOffset: 3,
                }}
              >
                martykoepke.substack.com
              </a>
            </p>
            <Link className="text-link" href="/ai-visibility">
              See how Daizie measures AI visibility and business accuracy{" "}
              <span>→</span>
            </Link>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
