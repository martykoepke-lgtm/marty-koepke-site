import type { Metadata } from "next";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { META, RESOURCES, SITE } from "@/lib/content";
import { formatDate, getAllPostMeta } from "@/lib/blog";

export const metadata: Metadata = { title: META.resources.title, description: META.resources.description, alternates: { canonical: "/resources" }, openGraph: { title: META.resources.title, description: META.resources.description, url: `${SITE.url}/resources` } };

export default function ResourcesPage() {
  const posts = getAllPostMeta();
  return <div className="daizie-shell hub-shell"><DaizieHeader /><main className="daizie-main"><div className="daizie-hero-spacer compact" aria-hidden="true" />
    <Reveal><article className="daizie-pane"><p className="daizie-eyebrow">{RESOURCES.eyebrow}</p><h1>{RESOURCES.headline}</h1><p className="daizie-lede">{RESOURCES.lede}</p></article></Reveal>
    <section className="hub-resource-grid" aria-label="Resource collections">{RESOURCES.collections.map((item, index) => <Reveal key={item.title}><article className="daizie-pane hub-resource-card"><span>0{index + 1}</span><h2>{item.title}</h2><p>{item.body}</p>{item.title === "Field notes" ? <a className="text-link" href={RESOURCES.substack.href}>Read on Substack ↗</a> : item.title === "Start here" ? <Link className="text-link" href="/about">Begin with the throughline →</Link> : <p className="hub-coming">Collection in progress</p>}</article></Reveal>)}</section>
    <Reveal><article className="daizie-pane forest hub-substack"><div><p className="daizie-eyebrow">{RESOURCES.substack.eyebrow}</p><h2>{RESOURCES.substack.headline}</h2><p className="daizie-lede">{RESOURCES.substack.body}</p></div><a className="daizie-btn light" href={RESOURCES.substack.href}>{RESOURCES.substack.label} ↗</a></article></Reveal>
    {posts.length > 0 && <Reveal><article className="daizie-pane"><p className="daizie-eyebrow">From the library</p><h2>Published resources</h2><div className="hub-published-list">{posts.map((post) => <Link key={post.slug} href={`/blog/${post.slug}`}><span>{formatDate(post.date)}</span><strong>{post.title}</strong><small>{post.description}</small></Link>)}</div></article></Reveal>}
    <Reveal><article className="daizie-pane"><p className="daizie-eyebrow">On the workbench</p><h2>Questions worth working through carefully</h2><ul className="hub-topic-list">{RESOURCES.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul></article></Reveal>
  </main></div>;
}
