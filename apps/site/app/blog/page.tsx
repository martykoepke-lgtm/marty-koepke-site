import type { Metadata } from "next";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { META, BLOG, SITE } from "@/lib/content";
import { SUBSTACK_URL } from "@/lib/links";
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
    <div className="daizie-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer compact" aria-hidden="true" />

        {/* ── Hero: what this library is, and where the casual notes live ── */}
        <Reveal>
          <article className="daizie-pane">
            <p className="daizie-eyebrow">{BLOG.eyebrow}</p>
            <h1>{BLOG.heading}</h1>
            <p className="daizie-lede">{BLOG.lede}</p>
            <div className="daizie-actions">
              <a
                className="plain-link"
                href={SUBSTACK_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {BLOG.substackLabel}
              </a>
            </div>
          </article>
        </Reveal>

        {/* ── Post list: one calm card per piece ──────────────────────── */}
        {posts.length === 0 ? (
          <Reveal>
            <article className="daizie-pane">
              <p className="daizie-lede">{BLOG.comingSoon}</p>
            </article>
          </Reveal>
        ) : (
          posts.map((post) => (
            <Reveal key={post.slug}>
              <article className="daizie-pane daizie-post-card">
                <p className="daizie-eyebrow">{formatDate(post.date)}</p>
                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="post-desc">{post.description}</p>
                <Link className="text-link" href={`/blog/${post.slug}`}>
                  {BLOG.readMore} <span>→</span>
                </Link>
              </article>
            </Reveal>
          ))
        )}

        {/* ── Close the loop into the scan funnel ─────────────────────── */}
        <Reveal>
          <article className="daizie-pane forest">
            <p className="daizie-eyebrow">{BLOG.cta.eyebrow}</p>
            <h2>{BLOG.cta.headline}</h2>
            <p className="daizie-lede" style={{ color: "rgba(250,246,238,.85)" }}>
              {BLOG.cta.body}
            </p>
            <div className="daizie-actions">
              <Link className="daizie-btn light" href={BLOG.cta.href}>
                {BLOG.cta.label}
              </Link>
            </div>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
