import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { META, SITE } from "@/lib/content";
import { SUBSTACK_URL } from "@/lib/links";

export const metadata: Metadata = { title: META.about.title, description: META.about.description, alternates: { canonical: "/about" }, openGraph: { title: META.about.title, description: META.about.description, url: `${SITE.url}/about` } };

const credentials = ["Master of Healthcare Administration", "Lean Six Sigma Black Belt", "Certified SAFe 6.0 Agilist", "Scrum Master", "Epic Clinical Informaticist"];

export default function AboutPage() {
  return <div className="daizie-shell hub-shell"><DaizieHeader /><main className="daizie-main"><div className="daizie-hero-spacer" aria-hidden="true" />
    <Reveal><article className="daizie-pane daizie-profile-pane"><Image src="/images/headshot.jpg" alt="Marty Koepke" width={230} height={290} priority /><div><p className="daizie-eyebrow">About Marty</p><h1>A translator between people, operations, and technology.</h1><p className="daizie-lede">I’m an informatics leader, founder, writer, and applied AI builder. For more than fifteen years, my work has centered on one practical question: how do we turn a complicated system into decisions and workflows people can understand, trust, and use?</p></div></article></Reveal>
    <Reveal><article className="daizie-pane"><p className="daizie-eyebrow">Professional foundation</p><h2>Enterprise-scale work, grounded in the people using the system.</h2><div className="hub-prose"><p>Since 2010, I have worked across electronic health record implementation, clinical application leadership, enterprise governance, workflow standardization, telehealth, interoperability, automation, and AI-enabled clinical documentation.</p><p>At CommonSpirit Health, I help lead cross-functional informatics work spanning more than 2,500 ambulatory sites and 25,000 clinicians across several EHR platforms. The work requires careful translation between clinical leaders, operations, technical teams, and the people responsible for making consequential decisions.</p></div></article></Reveal>
    <Reveal><article className="daizie-pane"><p className="daizie-eyebrow">The founder-builder chapter</p><h2>Learning the whole product, not just the exciting part.</h2><div className="hub-prose"><p>Over the last eighteen months, I began building applications for myself. I started with assisted-building platforms, then learned why a working screen is only the beginning. Useful products also require architecture, data design, migrations, authentication, testing, deployment, observability, security practices, governance, and a clear market promise.</p><p>I am still building a business of my own. I share this work from inside the journey — with experience to draw from, real products to test the ideas against, and enough humility to distinguish what I know from what I am still learning.</p></div></article></Reveal>
    <Reveal><article className="daizie-pane forest"><p className="daizie-eyebrow">What I believe</p><h2>Good technology preserves human judgment.</h2><p className="daizie-lede">AI can extend what people are able to do. It should not quietly replace the expertise, accountability, or judgment that belongs with them. Useful systems make those boundaries clear.</p></article></Reveal>
    <Reveal><article className="daizie-pane"><p className="daizie-eyebrow">Education and credentials</p><ul className="hub-credential-grid">{credentials.map((item) => <li key={item}>{item}</li>)}</ul><div className="daizie-actions"><a className="daizie-btn secondary" href={SUBSTACK_URL}>Read on Substack ↗</a><Link className="daizie-btn primary" href="/contact">Connect with Marty →</Link></div></article></Reveal>
  </main></div>;
}
