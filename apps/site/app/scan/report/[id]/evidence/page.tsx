import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import { TokenReportNav } from "../TokenReportNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type SubmissionRow = {
  id: string;
  url: string | null;
  company_name: string | null;
  access_token: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  crawler_output: CrawlerSnapshot | null;
  scoring_output: ScoringSnapshot | null;
  created_at: string;
};

type CrawlerSnapshot = {
  reachable?: boolean;
  title?: string;
  metaDescription?: string;
  organizationSchemaPresent?: boolean;
  personSchemaPresent?: boolean;
  faqSchemaPresent?: boolean;
  serviceSchemaPresent?: boolean;
  llmsTxtPresent?: boolean;
  robotsTxtPresent?: boolean;
  sameAsLinks?: string[];
  schemaTypes?: string[];
  founderLikelyNamed?: boolean;
  pricingLikelyVisible?: boolean;
};

type ScoringSnapshot = {
  corroboration?: {
    wikidataPresent?: boolean;
    wikidataUrl?: string;
    linkedinPresent?: boolean;
    linkedinUrl?: string;
    totalCorroboratingDomains?: number;
    degraded?: boolean;
    mentions?: Array<{
      url: string;
      title: string;
      domain: string;
      snippet: string;
    }>;
  };
};

async function loadEvidence(submissionId: string, token: string) {
  try {
    const supabase = supabaseAdmin();
    const { data: submission } = await supabase
      .from("submissions")
      .select("id, url, company_name, access_token, created_at")
      .eq("id", submissionId)
      .maybeSingle<SubmissionRow>();
    if (
      !submission ||
      submission.access_token !== token ||
      isExpired(submission.created_at)
    ) {
      return null;
    }

    const { data: audit } = await supabase
      .from("audits")
      .select("id, crawler_output, scoring_output, created_at")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<AuditRow>();
    if (!audit) return null;

    return {
      submission,
      audit: {
        ...audit,
        crawler_output: parseIfString<CrawlerSnapshot>(audit.crawler_output),
        scoring_output: parseIfString<ScoringSnapshot>(audit.scoring_output),
      },
    };
  } catch (e) {
    console.error("[scan/report/evidence] loadEvidence failed:", e);
    return null;
  }
}

function parseIfString<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return v as T;
}

export default async function EvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  if (!t) notFound();

  const data = await loadEvidence(id, t);
  if (!data) notFound();

  const crawler = data.audit.crawler_output;
  const corroboration = data.audit.scoring_output?.corroboration ?? null;
  const signals = [
    ["Organization schema", crawler?.organizationSchemaPresent],
    ["Person schema", crawler?.personSchemaPresent],
    ["FAQPage schema", crawler?.faqSchemaPresent],
    ["Service schema", crawler?.serviceSchemaPresent],
    ["llms.txt", crawler?.llmsTxtPresent],
    ["robots.txt", crawler?.robotsTxtPresent],
    ["Founder named", crawler?.founderLikelyNamed],
    ["Pricing visible", crawler?.pricingLikelyVisible],
  ] as const;

  return (
    <div className="daizie-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />
        <article className="daizie-pane daizie-hero-pane">
          <TokenReportNav reportId={id} token={t} active="evidence" />

          <section className="daizie-scan-card" style={{ marginTop: 20 }}>
            <p className="card-eyebrow">Evidence</p>
            <h2>Site and source signals</h2>
            <p style={{ marginTop: 8 }}>
              Evidence used by this free Daizie Readiness Check for{" "}
              <strong>{friendlyDomain(data.submission.url)}</strong>.
            </p>
          </section>

          <section className="daizie-scan-card">
            <h3>What we read on the site</h3>
            <p className="muted" style={{ marginTop: 6, fontSize: "0.92rem" }}>
              These are public crawlability, structure, and entity signals
              visible during the free scan.
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "18px 0 0",
                display: "grid",
                gap: 10,
                gridTemplateColumns: "1fr",
              }}
              className="site-signals"
            >
              {signals.map(([label, present]) => (
                <li
                  key={label as string}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "rgba(23, 62, 44, .04)",
                    border: "1px solid rgba(23, 62, 44, .1)",
                  }}
                >
                  <span style={{ color: "var(--dz-forest)" }}>
                    {label as string}
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: present ? "#0e7a4a" : "#a83232",
                    }}
                  >
                    {present ? "yes" : "no"}
                  </span>
                </li>
              ))}
            </ul>
            {crawler?.title && (
              <p
                className="muted"
                style={{ marginTop: 18, fontSize: "0.9rem" }}
              >
                <strong style={{ color: "var(--dz-forest)" }}>
                  Page title:{" "}
                </strong>
                {crawler.title}
              </p>
            )}
            {crawler?.metaDescription && (
              <p
                className="muted"
                style={{ marginTop: 6, fontSize: "0.9rem" }}
              >
                <strong style={{ color: "var(--dz-forest)" }}>
                  Meta description:{" "}
                </strong>
                {crawler.metaDescription}
              </p>
            )}
            {crawler?.schemaTypes && crawler.schemaTypes.length > 0 && (
              <p
                className="muted"
                style={{ marginTop: 6, fontSize: "0.9rem" }}
              >
                <strong style={{ color: "var(--dz-forest)" }}>
                  JSON-LD types:{" "}
                </strong>
                {crawler.schemaTypes.join(", ")}
              </p>
            )}
          </section>

          <section className="daizie-scan-card">
            <h3>What corroborated the entity</h3>
            <p className="muted" style={{ marginTop: 6, fontSize: "0.92rem" }}>
              We found {corroboration?.totalCorroboratingDomains ?? 0}{" "}
              corroborating domain
              {corroboration?.totalCorroboratingDomains === 1 ? "" : "s"}.
            </p>
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "1fr 1fr",
                marginTop: 18,
              }}
            >
              <EvidenceLink
                label="LinkedIn"
                found={corroboration?.linkedinPresent}
                url={corroboration?.linkedinUrl}
              />
              <EvidenceLink
                label="Wikidata"
                found={corroboration?.wikidataPresent}
                url={corroboration?.wikidataUrl}
              />
            </div>
            {corroboration?.mentions && corroboration.mentions.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "20px 0 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {corroboration.mentions.slice(0, 6).map((mention) => (
                  <li
                    key={mention.url}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 12,
                      background: "rgba(23, 62, 44, .04)",
                      border: "1px solid rgba(23, 62, 44, .1)",
                    }}
                  >
                    <a
                      href={mention.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontWeight: 500,
                        color: "var(--dz-forest)",
                        textDecoration: "underline",
                        textDecorationColor: "var(--dz-gold)",
                        textUnderlineOffset: 3,
                      }}
                    >
                      {mention.title || mention.domain}
                    </a>
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: "0.78rem",
                        color: "#56675c",
                      }}
                    >
                      ({mention.domain})
                    </span>
                    {mention.snippet && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: "0.88rem",
                          lineHeight: 1.55,
                          color: "#4a5b52",
                        }}
                      >
                        {mention.snippet}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      </main>
    </div>
  );
}

function EvidenceLink({
  label,
  found,
  url,
}: {
  label: string;
  found?: boolean;
  url?: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: found ? "rgba(16, 122, 78, .05)" : "rgba(23, 62, 44, .04)",
        border: found
          ? "1px solid rgba(16, 122, 78, .25)"
          : "1px solid rgba(23, 62, 44, .1)",
        fontSize: "0.9rem",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-serif), Georgia, serif",
          fontWeight: 500,
          color: "var(--dz-forest)",
        }}
      >
        {label}
      </p>
      {found && url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            marginTop: 6,
            wordBreak: "break-all",
            fontSize: "0.82rem",
            color: "var(--dz-forest)",
            textDecoration: "underline",
            textDecorationColor: "var(--dz-gold)",
            textUnderlineOffset: 2,
          }}
        >
          {url}
        </a>
      ) : (
        <p style={{ margin: "6px 0 0", color: "#a83232", fontSize: "0.82rem" }}>
          not found
        </p>
      )}
    </div>
  );
}

function friendlyDomain(url: string | null): string {
  if (!url) return "your site";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return true;
  return Date.now() - created > REPORT_TOKEN_TTL_MS;
}
