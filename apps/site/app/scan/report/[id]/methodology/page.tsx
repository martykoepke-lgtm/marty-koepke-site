import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";
import DaizieHeader from "@/components/daizie/DaizieHeader";
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
    signals: [
      "Best-fit buyers",
      "use cases",
      "problems solved",
      "budget or fit signals",
      "not-fit language",
    ],
  },
];

async function validateToken(submissionId: string, token: string) {
  try {
    const { data } = await supabaseAdmin()
      .from("submissions")
      .select("id, access_token, created_at")
      .eq("id", submissionId)
      .maybeSingle<{
        id: string;
        access_token: string | null;
        created_at: string;
      }>();
    if (!data || data.access_token !== token) return false;
    return !isExpired(data.created_at);
  } catch (e) {
    console.error("[scan/report/methodology] validateToken failed:", e);
    return false;
  }
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
    <div className="daizie-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />
        <article className="daizie-pane daizie-hero-pane">
          <TokenReportNav reportId={id} token={t} active="methodology" />

          <section className="daizie-scan-card" style={{ marginTop: 20 }}>
            <p className="card-eyebrow">Methodology</p>
            <h2>How this free Daizie Readiness Check is scored</h2>
            <p style={{ marginTop: 8, maxWidth: 720 }}>
              This report scores public signals that help AI systems
              understand a business. It does not measure whether AI
              currently mentions or recommends the business in live
              answers — that&rsquo;s what the paid Daizie AI Visibility
              Assessment does.
            </p>
          </section>

          <section className="daizie-scan-card">
            <h3>The scoring model</h3>
            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "1fr",
                marginTop: 18,
              }}
              className="method-grid"
            >
              <MethodCard
                eyebrow="Inputs"
                body="Homepage content, metadata, structured data, robots.txt, llms.txt, sameAs links, LinkedIn / Wikidata signals, and public corroborating mentions."
              />
              <MethodCard
                eyebrow="Outputs"
                body="A 0–100 readiness score, a tier, five driver scores, key findings, and recommended next moves."
              />
              <MethodCard
                eyebrow="Limit"
                body="The free check does not query ChatGPT, Claude, Perplexity, or Gemini. Live-answer testing belongs to the paid Assessment."
              />
            </div>
          </section>

          <section className="daizie-scan-card">
            <h3>Five readiness drivers</h3>
            <p className="muted" style={{ marginTop: 6, fontSize: "0.92rem" }}>
              Each driver is scored from public evidence. Strong scores mean
              the business is easier for AI systems to classify, trust, and
              preserve accurately when buyers ask.
            </p>
            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "1fr",
                marginTop: 18,
              }}
              className="driver-grid"
            >
              {DRIVERS.map((driver) => (
                <div
                  key={driver.name}
                  style={{
                    padding: "18px 20px",
                    borderRadius: 14,
                    background: "rgba(23, 62, 44, .04)",
                    border: "1px solid rgba(23, 62, 44, .12)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      color: "var(--dz-forest)",
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {driver.name}
                  </h3>
                  <p
                    style={{
                      marginTop: 6,
                      color: "var(--dz-forest)",
                      fontSize: "0.9rem",
                      fontStyle: "italic",
                    }}
                  >
                    {driver.question}
                  </p>
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: "0.85rem",
                      color: "#4a5b52",
                      lineHeight: 1.55,
                    }}
                  >
                    <strong style={{ color: "var(--dz-forest)" }}>
                      Signals:{" "}
                    </strong>
                    {driver.signals.join(", ")}.
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="daizie-scan-card">
            <h3>What the paid Assessment adds</h3>
            <p style={{ marginTop: 8 }}>
              The paid Daizie AI Visibility Assessment tests live answers
              across ChatGPT, Claude, Perplexity, and Gemini; captures 32
              live AI responses; verifies factual claims against source
              evidence; checks whether context and recommendation fit are
              preserved; and compares the business against two named
              competitors on the same eight queries.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}

function MethodCard({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <div
      style={{
        padding: "18px 20px",
        borderRadius: 14,
        background: "rgba(23, 62, 44, .04)",
        border: "1px solid rgba(23, 62, 44, .12)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "0.68rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "var(--dz-forest)",
        }}
      >
        {eyebrow}
      </p>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          color: "#4a5b52",
        }}
      >
        {body}
      </p>
    </div>
  );
}

function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return true;
  return Date.now() - created > REPORT_TOKEN_TTL_MS;
}
