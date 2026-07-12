import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";
import { TokenReportNav } from "../TokenReportNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DRIVERS = [
  {
    name: "Business clarity",
    question: "Can AI tell what this business is and who it helps?",
    signals: ["Official name", "category", "audience", "offer", "service area"],
  },
  {
    name: "Source support",
    question: "Is there enough evidence for AI to believe the right facts?",
    signals: ["Website evidence", "external mentions", "profiles", "proof", "consistency"],
  },
  {
    name: "AI readability",
    question: "Is the business easy for AI systems to read?",
    signals: ["Crawlability", "headings", "schema", "llms.txt", "stable pages"],
  },
  {
    name: "Distinctive point of view",
    question: "Does AI have a real reason to choose this business?",
    signals: ["Specialization", "method", "tradeoffs", "point of view", "differentiators"],
  },
  {
    name: "Recommendation fit",
    question: "Does AI know when this is an appropriate recommendation?",
    signals: ["Best-fit buyers", "use cases", "problems solved", "budget or fit signals", "not-fit language"],
  },
];

async function validateToken(submissionId: string, token: string) {
  const { data } = await supabaseAdmin()
    .from("submissions")
    .select("id, access_token, created_at")
    .eq("id", submissionId)
    .maybeSingle<{ id: string; access_token: string | null; created_at: string }>();
  if (!data || data.access_token !== token) return false;
  return !isExpired(data.created_at);
}

export default async function MethodologyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  if (!t || !(await validateToken(id, t))) notFound();

  return (
    <main className="report-workspace min-h-screen pb-24">
      <article className="mx-auto max-w-5xl px-5 pt-10 pb-12 sm:px-8 lg:pt-14">
        <TokenReportNav reportId={id} token={t} active="methodology" />
        <header className="rounded-lg bg-forest-dark p-5">
          <div className="text-[11px] uppercase tracking-widest text-gold">
            Methodology
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-cream sm:text-4xl">
            How this free readiness check is scored
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tan">
            This report scores public signals that help AI systems understand a
            business. It does not measure whether AI currently recommends the
            business in live answers.
          </p>
        </header>

        <section className="mt-8 rounded-lg bg-forest-dark p-6">
          <h2 className="text-2xl font-semibold text-cream">The scoring model</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded border border-tan/35 bg-forest/60 p-4">
              <p className="text-[11px] uppercase tracking-widest text-gold">Inputs</p>
              <p className="mt-2 text-sm leading-relaxed text-tan">
                Homepage content, metadata, structured data, robots.txt,
                llms.txt, sameAs links, LinkedIn/Wikidata signals, and public
                corroborating mentions.
              </p>
            </div>
            <div className="rounded border border-tan/35 bg-forest/60 p-4">
              <p className="text-[11px] uppercase tracking-widest text-gold">Outputs</p>
              <p className="mt-2 text-sm leading-relaxed text-tan">
                A 0-100 readiness score, a tier, five driver scores, key
                findings, and recommended next moves.
              </p>
            </div>
            <div className="rounded border border-tan/35 bg-forest/60 p-4">
              <p className="text-[11px] uppercase tracking-widest text-gold">Limit</p>
              <p className="mt-2 text-sm leading-relaxed text-tan">
                The free check does not query ChatGPT, Claude, Perplexity, or
                Gemini. That live-answer testing belongs to the paid audit.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-lg bg-forest-dark p-6">
          <h2 className="text-2xl font-semibold text-cream">Five readiness drivers</h2>
          <p className="mt-2 text-sm leading-relaxed text-tan">
            Each driver is scored from public evidence. Strong scores mean the
            business is easier for AI systems to classify, trust, and preserve
            accurately when buyers ask.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {DRIVERS.map((driver) => (
              <div key={driver.name} className="rounded border border-tan/35 bg-forest/60 p-4">
                <h3 className="font-serif text-lg font-semibold text-cream">
                  {driver.name}
                </h3>
                <p className="mt-1 text-sm text-gold">{driver.question}</p>
                <p className="mt-3 text-sm leading-relaxed text-tan">
                  Signals: {driver.signals.join(", ")}.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-lg bg-forest-dark p-6">
          <h2 className="text-2xl font-semibold text-cream">What the paid audit adds</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-tan">
            The paid AI Business Accuracy Audit tests live answers across major
            AI engines, verifies factual claims against source evidence, checks
            whether context and recommendation fit are preserved, and compares
            the business against two named competitors.
          </p>
        </section>
      </article>
    </main>
  );
}

function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return true;
  return Date.now() - created > REPORT_TOKEN_TTL_MS;
}
