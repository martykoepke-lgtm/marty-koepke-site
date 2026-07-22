import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import Reveal from "@/components/motion/Reveal";
import { SITE, WORK } from "@/lib/content";

const workflow = WORK.governedWorkflow;

export const metadata: Metadata = {
  title: "Governed workflow tools | Marty Koepke",
  description: workflow.body,
  alternates: { canonical: "/work/governed-workflow-tools" },
  openGraph: {
    title: "Governed workflow tools | Marty Koepke",
    description: workflow.body,
    url: `${SITE.url}/work/governed-workflow-tools`,
  },
};

export default function GovernedWorkflowToolsPage() {
  return (
    <div className="daizie-shell hub-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer compact" aria-hidden="true" />

        <Reveal>
          <article className="daizie-pane hub-work-showcase">
            <Link className="text-link hub-back-link" href="/work">← Back to selected work</Link>
            <div className="hub-work-showcase-intro">
              <div>
                <p className="daizie-eyebrow">{workflow.type}</p>
                <h1>{workflow.title}</h1>
                <p className="daizie-lede">{workflow.body}</p>
              </div>
              <ul>
                {workflow.capabilities.map((capability) => (
                  <li key={capability}>{capability}</li>
                ))}
              </ul>
            </div>

            <div className="hub-screenshot-series">
              {workflow.screenshots.map((screenshot, index) => (
                <figure key={screenshot.src} className="hub-screenshot-card">
                  <div className="hub-screenshot-frame">
                    <Image
                      src={screenshot.src}
                      alt={screenshot.alt}
                      width={1820}
                      height={864}
                      sizes="(max-width: 900px) 100vw, 1100px"
                      priority={index === 0}
                    />
                  </div>
                  <figcaption>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="daizie-eyebrow">{screenshot.eyebrow}</p>
                      <h2>{screenshot.title}</h2>
                      <p>{screenshot.description}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </article>
        </Reveal>
      </main>
    </div>
  );
}
