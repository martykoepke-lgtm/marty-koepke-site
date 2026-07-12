/**
 * /scan/report/[id]?t=<access_token>
 *
 * Public token-gated Daizie readiness report. Full Daizie chrome —
 * white cards, forest text, minimal gold accents on eyebrows only.
 *
 * Gate: `?t=` must match submissions.access_token and the scan must be
 * within the 30-day report access window.
 */

import { notFound } from "next/navigation";
import {
  supabaseAdmin,
  tierFor,
  getStartHereNudge,
  type Tier,
  type MasterKeyReport,
} from "@practical-informatics/avi";
import DaizieHeader from "@/components/daizie/DaizieHeader";
import { ReportActions } from "./ReportActions";
import { TokenReportNav } from "./TokenReportNav";
import type { V3ReadinessDriverId } from "@practical-informatics/avi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const REPORT_TOKEN_TTL_DAYS = 30;
const REPORT_TOKEN_TTL_MS = REPORT_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

// ============================================================================
// Types
// ============================================================================

type SubmissionRow = {
  id: string;
  url: string | null;
  company_name: string | null;
  access_token: string | null;
  subject_type: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  submission_id: string;
  rubric_version: string | null;
  subject_type: string | null;
  readiness_score: number | null;
  tier: string | null;
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
  agentBotsAllowed?: Record<string, string>;
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
    mentions?: Array<{
      url: string;
      title: string;
      domain: string;
      snippet: string;
    }>;
  };
  findings?: Array<{
    dimensionId: string;
    dimensionName: string;
    score: number | null;
    summary: string;
  }>;
  masterKeys?: MasterKeyReport | null;
};

type DimensionRow = {
  dimension_id: string;
  dimension_name: string;
  score: number | null;
  justification: string | null;
};

type ImprovementGuidance = {
  title: string;
  action: string;
  where: string;
  how: string;
  success: string;
  why: string;
  example: string;
};

const TIER_COPY: Record<Tier, { label: string; sentence: string }> = {
  invisible: {
    label: "Invisible",
    sentence:
      "AI tools don't currently surface this business when buyers ask. Strong signals are missing, but the fixes are mostly cheap.",
  },
  hidden: {
    label: "Hidden",
    sentence:
      "AI tools can find this business if pressed but won't recommend it on their own yet. A handful of structured fixes change that.",
  },
  "faintly-visible": {
    label: "Faintly Visible",
    sentence:
      "AI tools mention this business sometimes, but inconsistently. You're in the conversation — not yet at the top of it.",
  },
  discoverable: {
    label: "Discoverable",
    sentence:
      "AI tools recognize this business as a credible answer. Closing the remaining gaps moves you to a default recommendation.",
  },
  "agent-ready": {
    label: "Agent-Ready",
    sentence:
      "AI tools surface this business confidently across the queries that matter. You're set up to compound visibility, not chase it.",
  },
};

// ============================================================================
// Loader
// ============================================================================

async function loadScanData(
  submissionId: string,
  token: string
): Promise<{
  submission: SubmissionRow;
  audit: AuditRow;
  dimensions: DimensionRow[];
} | null> {
  try {
    const supabase = supabaseAdmin();
    const { data: submission } = await supabase
      .from("submissions")
      .select("id, url, company_name, access_token, subject_type, created_at")
      .eq("id", submissionId)
      .maybeSingle<SubmissionRow>();
    if (!submission) return null;
    if (submission.access_token !== token) return null;
    if (isExpired(submission.created_at)) return null;

    const { data: audit } = await supabase
      .from("audits")
      .select(
        "id, submission_id, rubric_version, subject_type, readiness_score, tier, crawler_output, scoring_output, created_at"
      )
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<AuditRow>();
    if (!audit) return null;

    const crawlerOutput = parseIfString<CrawlerSnapshot>(audit.crawler_output);
    const scoringOutput = parseIfString<ScoringSnapshot>(audit.scoring_output);

    const { data: dimRows } = await supabase
      .from("audit_dimension_scores")
      .select("dimension_id, dimension_name, score, justification")
      .eq("audit_id", audit.id)
      .order("dimension_id", { ascending: true })
      .returns<DimensionRow[]>();

    return {
      submission,
      audit: {
        ...audit,
        crawler_output: crawlerOutput,
        scoring_output: scoringOutput,
      },
      dimensions: dimRows ?? [],
    };
  } catch (e) {
    console.error("[scan/report] loadScanData failed:", e);
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

// ============================================================================
// Page
// ============================================================================

export default async function ScanReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;

  if (!t) notFound();

  const data = await loadScanData(id, t);
  if (!data) notFound();

  const { submission, audit, dimensions } = data;
  const findings = audit.scoring_output?.findings ?? [];
  const masterKeys = audit.scoring_output?.masterKeys ?? null;

  return (
    <div className="daizie-shell">
      <DaizieHeader />
      <main className="daizie-main">
        <div className="daizie-hero-spacer" aria-hidden="true" />

        <article className="daizie-pane daizie-hero-pane">
          <TokenReportNav reportId={id} token={t} active="report" />
          <ReportActions />
          <ReportHeader submission={submission} audit={audit} />
          <TierHeadline audit={audit} />
          {findings.length > 0 && <FindingsSection findings={findings} />}
          <DimensionsSection
            dimensions={dimensions}
            crawler={audit.crawler_output}
          />
          {masterKeys && <MasterKeysSection report={masterKeys} />}
          <CrawlerSection crawler={audit.crawler_output} />
          <CorroborationSection
            corroboration={audit.scoring_output?.corroboration ?? null}
          />
          <PaidTeaserSection />
          <UpsellSection />
          <ReportFooter audit={audit} />
        </article>
      </main>
    </div>
  );
}

// ============================================================================
// Sections
// ============================================================================

function ReportHeader({
  submission,
  audit,
}: {
  submission: SubmissionRow;
  audit: AuditRow;
}) {
  const domain = friendlyDomain(submission.url);
  return (
    <section className="daizie-scan-card" style={{ marginTop: 20 }}>
      <p className="card-eyebrow">Free Daizie Readiness Check</p>
      <h2>{submission.company_name ?? domain}</h2>
      <p className="muted" style={{ marginTop: 6, fontSize: "0.92rem" }}>
        {domain}
        {audit.subject_type
          ? ` · ${humanizeSubjectType(audit.subject_type)}`
          : ""}
        {" · Generated "}
        {formatDate(audit.created_at)}
      </p>
      <p
        className="muted"
        style={{
          marginTop: 8,
          fontSize: "0.78rem",
          fontStyle: "italic",
        }}
      >
        Private report link expires 30 days after scan date.
      </p>
    </section>
  );
}

function TierHeadline({ audit }: { audit: AuditRow }) {
  const score = audit.readiness_score ?? 0;
  const tierKey: Tier = tierFor(score);
  const t = TIER_COPY[tierKey];
  const pct = Math.round(score * 100);

  return (
    <section className="daizie-scan-card">
      <div className="daizie-score-row">
        <div>
          <p className="card-eyebrow">Your tier</p>
          <div className="score-value">
            <span className="num">{pct}</span>
            <span className="of">/ 100</span>
            <span className="tier" style={{ color: "var(--dz-forest)" }}>
              {t.label}
            </span>
          </div>
          <p style={{ marginTop: 10, maxWidth: 520 }}>{t.sentence}</p>
        </div>
        <div>
          <p className="card-eyebrow">Report scope</p>
          <p style={{ marginTop: 8 }}>
            This free check reads public site signals and scores readiness.
            The paid Daizie AI Visibility Assessment measures live AI
            answers across ChatGPT, Claude, Perplexity, and Gemini.
          </p>
        </div>
      </div>
    </section>
  );
}

function DimensionsSection({
  dimensions,
  crawler,
}: {
  dimensions: DimensionRow[];
  crawler: CrawlerSnapshot | null;
}) {
  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Score breakdown</p>
      <h3>The five readiness drivers</h3>
      <p className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>
        0–5, based on observable site evidence. Each driver has a
        &ldquo;Start here&rdquo; next step — even the strong ones have
        something to sharpen.
      </p>
      {dimensions.length === 0 && (
        <p
          className="muted"
          style={{ marginTop: 16, fontStyle: "italic" }}
        >
          Driver scores unavailable for this scan. Please re-run the free
          check or contact hello@martykoepke.com.
        </p>
      )}
      <div className="daizie-driver-list" style={{ marginTop: 16 }}>
        {dimensions.map((d) => {
          const score = typeof d.score === "number" ? d.score : 0;
          const pct = (score / 5) * 100;
          const nudge = getStartHereNudge(
            d.dimension_id as V3ReadinessDriverId,
            d.score,
            crawler
              ? {
                  organizationSchemaPresent: crawler.organizationSchemaPresent,
                  personSchemaPresent: crawler.personSchemaPresent,
                  faqSchemaPresent: crawler.faqSchemaPresent,
                  serviceSchemaPresent: crawler.serviceSchemaPresent,
                  llmsTxtPresent: crawler.llmsTxtPresent,
                  robotsTxtPresent: crawler.robotsTxtPresent,
                }
              : null
          );
          return (
            <div key={d.dimension_id} className="daizie-driver-row">
              <div className="row-head">
                <span className="name">{d.dimension_name}</span>
                <span className="value">
                  {typeof d.score === "number" ? d.score.toFixed(1) : "—"} / 5
                </span>
              </div>
              <div
                className="bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={5}
                aria-valuenow={score}
                aria-label={`${d.dimension_name} score`}
              >
                <div className="fill" style={{ width: `${pct}%` }} />
              </div>
              {d.justification && <p className="finding">{d.justification}</p>}
              {nudge && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(189, 143, 36, .08)",
                    borderLeft: "3px solid var(--dz-gold)",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.68rem",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "var(--dz-gold)",
                    }}
                  >
                    Start here
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                      color: "var(--dz-charcoal)",
                    }}
                  >
                    {nudge}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MasterKeysSection({ report }: { report: MasterKeyReport }) {
  const laneLabel =
    report.lane === "local"
      ? "Local & brick-and-mortar"
      : "Online consultants, coaches, and agencies";
  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">
        Master-key presence · {laneLabel}
      </p>
      <h3>The profiles AI reads for your kind of business</h3>
      <p style={{ marginTop: 10, maxWidth: 720 }}>{report.headline}</p>
      <div className="daizie-masterkeys">
        {report.checks.map((c) => (
          <div key={c.id} className={`mk-card ${c.found ? "present" : "missing"}`}>
            <div className="mk-head">
              <span className="mk-label">{c.label}</span>
              <span className={`mk-badge ${c.found ? "ok" : "no"}`}>
                {c.found ? "Present" : "Missing"}
              </span>
            </div>
            {c.found && c.evidenceUrl ? (
              <div className="mk-body">
                <a href={c.evidenceUrl} target="_blank" rel="noopener noreferrer">
                  {c.evidenceTitle || c.evidenceUrl}
                </a>
              </div>
            ) : (
              c.remediationOptions &&
              c.remediationOptions.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.68rem",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: "var(--dz-gold)",
                    }}
                  >
                    How to fix (pick one or a few)
                  </p>
                  <ol
                    style={{
                      margin: "8px 0 0",
                      padding: "0 0 0 20px",
                      fontSize: "0.82rem",
                      color: "#4a5b52",
                      lineHeight: 1.6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {c.remediationOptions.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ol>
                </div>
              )
            )}
          </div>
        ))}
      </div>
      <p style={{ marginTop: 16, fontSize: ".82rem", color: "#56675c", fontStyle: "italic" }}>
        Presence only — this doesn&rsquo;t claim AI recommends you. The paid
        Assessment tests what AI actually says.
      </p>
    </section>
  );
}

function PaidTeaserSection() {
  return (
    <section
      className="daizie-scan-card"
      style={{
        border: "1px solid rgba(189, 143, 36, .35)",
        background: "linear-gradient(180deg, rgba(189, 143, 36, .04), rgba(255, 255, 255, 1))",
      }}
    >
      <p className="card-eyebrow" style={{ color: "var(--dz-gold)" }}>
        What the paid Assessment adds
      </p>
      <h3>A human review of your business, not a template</h3>
      <p style={{ marginTop: 10 }}>
        This free report showed you the diagnosis. The paid Daizie AI
        Visibility Assessment ($895) shows you the strategy — calibrated
        by Marty personally, not generated by a scoring engine. Coaches,
        consultants, agencies, retail owners, and product businesses all
        need different moves; the paid Assessment reflects that. Every
        recommendation is tied to a research-backed reason it works.
      </p>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "20px 0 0",
          display: "grid",
          gap: 14,
          gridTemplateColumns: "1fr",
        }}
      >
        <PaidBullet
          title="Personal review, tuned to your business type"
          body="Marty reads your report herself and calibrates the playbook to what actually moves the needle for your kind of business. A local shop's fix list looks nothing like a SaaS founder's — the paid Assessment treats that as a feature, not a footnote. Includes a 30-minute call to walk through the priorities together."
        />
        <PaidBullet
          title="Live AI transcripts — 4 engines, 32 responses"
          body="We run 8 buyer-question queries against ChatGPT, Claude, Perplexity, and Gemini. You get every response captured, timestamped, and saved — the evidence behind every recommendation."
        />
        <PaidBullet
          title="Claim-by-claim verification"
          body="Every factual claim AI makes about you gets labeled — supported, unsupported, contradicted, stale, ambiguous, or not verifiable — with a source excerpt showing where the truth lives. This is the accuracy layer the free scan can't reach."
        />
        <PaidBullet
          title="Competitor comparison quadrant"
          body="You name two competitors. We plot all three of you on a Readiness × Visibility chart across the same 8 queries. You see where you stand — and where you can move — with the evidence, not a guess."
        />
        <PaidBullet
          title="Priority-ranked playbook, backed by research"
          body="Not a generic checklist. Three readiness fixes and three accuracy fixes, ranked by what AI is actually saying (or misrepresenting) about you today, each tied to the research that says the fix works."
        />
      </ul>
      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
        <a
          href="https://www.martykoepke.com/ai-visibility"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 999,
            background: "var(--dz-forest)",
            color: "var(--dz-cream)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.92rem",
          }}
        >
          See the Assessment →
        </a>
        <a
          href="https://tally.so/r/xXVPgo"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 999,
            background: "transparent",
            color: "var(--dz-forest)",
            border: "1px solid var(--dz-forest)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.92rem",
          }}
        >
          Book a 20-minute call
        </a>
      </div>
    </section>
  );
}

function PaidBullet({ title, body }: { title: string; body: string }) {
  return (
    <li
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: "rgba(23, 62, 44, .04)",
        border: "1px solid rgba(23, 62, 44, .1)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-serif), Georgia, serif",
          fontWeight: 500,
          color: "var(--dz-forest)",
          fontSize: "1rem",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: "0.88rem",
          lineHeight: 1.55,
          color: "#4a5b52",
        }}
      >
        {body}
      </p>
    </li>
  );
}

function FindingsSection({
  findings,
}: {
  findings: NonNullable<ScoringSnapshot["findings"]>;
}) {
  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Key findings</p>
      <h3>What stood out</h3>
      <div className="daizie-findings">
        {findings.slice(0, 4).map((f) => (
          <div key={f.dimensionId} className="finding-card">
            <p className="title">
              {f.dimensionName}
              {typeof f.score === "number" && (
                <span className="score">({f.score.toFixed(1)} / 5)</span>
              )}
            </p>
            <p className="body">{f.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ImprovementsSection({
  improvements,
}: {
  improvements: ImprovementGuidance[];
}) {
  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Priority improvements</p>
      <h3>Three ways to improve your AI visibility</h3>
      <p className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>
        Practical next moves based on the weakest readiness signals we could
        observe from your public site.
      </p>
      <ol
        style={{
          listStyle: "none",
          padding: 0,
          margin: "20px 0 0",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {improvements.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            style={{
              padding: "20px 22px",
              borderRadius: 16,
              background: "rgba(23, 62, 44, .04)",
              border: "1px solid rgba(23, 62, 44, .12)",
              display: "grid",
              gridTemplateColumns: "40px 1fr",
              gap: 18,
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "var(--dz-forest)",
                color: "var(--dz-cream)",
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "1.1rem",
                fontWeight: 500,
              }}
            >
              {index + 1}
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "1.2rem",
                  color: "var(--dz-forest)",
                  fontWeight: 500,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  marginTop: 10,
                  fontSize: "0.92rem",
                  lineHeight: 1.6,
                  color: "#4a5b52",
                }}
              >
                {item.why}
              </p>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns: "1fr",
                  marginTop: 14,
                }}
              >
                <ImprovementRow label="Where" text={item.where} />
                <ImprovementRow label="How" text={item.how} />
                <ImprovementRow label="Success" text={item.success} />
              </div>
              <p
                style={{
                  marginTop: 14,
                  fontSize: "0.92rem",
                  lineHeight: 1.6,
                  color: "var(--dz-charcoal)",
                }}
              >
                <strong style={{ color: "var(--dz-forest)" }}>Do this: </strong>
                {item.action}
              </p>
              <p
                style={{
                  marginTop: 8,
                  fontSize: "0.9rem",
                  lineHeight: 1.55,
                  color: "#4a5b52",
                  fontStyle: "italic",
                  borderLeft: "2px solid var(--dz-forest)",
                  paddingLeft: 10,
                }}
              >
                <strong style={{ color: "var(--dz-forest)", fontStyle: "normal" }}>
                  Example:{" "}
                </strong>
                {item.example}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ImprovementRow({ label, text }: { label: string; text: string }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: "0.88rem",
        lineHeight: 1.55,
        color: "var(--dz-charcoal)",
        borderLeft: "2px solid var(--dz-forest)",
        paddingLeft: 10,
      }}
    >
      <strong style={{ color: "var(--dz-forest)" }}>{label}: </strong>
      {text}
    </p>
  );
}

function CrawlerSection({ crawler }: { crawler: CrawlerSnapshot | null }) {
  if (!crawler) return null;
  const signals: Array<{ label: string; present: boolean | undefined }> = [
    { label: "Organization schema", present: crawler.organizationSchemaPresent },
    { label: "Person schema", present: crawler.personSchemaPresent },
    { label: "FAQPage schema", present: crawler.faqSchemaPresent },
    { label: "Service schema", present: crawler.serviceSchemaPresent },
    { label: "llms.txt", present: crawler.llmsTxtPresent },
    { label: "robots.txt", present: crawler.robotsTxtPresent },
    { label: "Founder named", present: crawler.founderLikelyNamed },
    { label: "Pricing visible", present: crawler.pricingLikelyVisible },
  ];
  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Site signals</p>
      <h3>What we read</h3>
      {!crawler.reachable && (
        <p
          className="muted"
          style={{ marginTop: 8, fontSize: "0.9rem", fontStyle: "italic" }}
        >
          We couldn&rsquo;t fully read your site directly — this section is
          partial.
        </p>
      )}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "16px 0 0",
          display: "grid",
          gap: 10,
          gridTemplateColumns: "1fr",
        }}
      >
        {signals.map((s) => (
          <li
            key={s.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(23, 62, 44, .04)",
              border: "1px solid rgba(23, 62, 44, .1)",
              fontSize: "0.9rem",
            }}
          >
            <span style={{ color: "var(--dz-forest)" }}>{s.label}</span>
            <span
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: s.present ? "#0e7a4a" : "#a83232",
              }}
            >
              {s.present ? "yes" : "no"}
            </span>
          </li>
        ))}
      </ul>
      {Array.isArray(crawler.schemaTypes) && crawler.schemaTypes.length > 0 && (
        <p
          className="muted"
          style={{ marginTop: 14, fontSize: "0.85rem" }}
        >
          <strong style={{ color: "var(--dz-forest)" }}>
            JSON-LD types detected:{" "}
          </strong>
          {crawler.schemaTypes.join(", ")}
        </p>
      )}
    </section>
  );
}

function CorroborationSection({
  corroboration,
}: {
  corroboration: NonNullable<ScoringSnapshot["corroboration"]> | null;
}) {
  if (!corroboration) return null;
  const mentions = corroboration.mentions ?? [];
  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Corroboration</p>
      <h3>What the web says</h3>
      <p style={{ marginTop: 8 }}>
        We found {corroboration.totalCorroboratingDomains ?? 0} corroborating
        domain
        {corroboration.totalCorroboratingDomains === 1 ? "" : "s"} that name
        this business.
      </p>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "1fr 1fr",
          marginTop: 16,
        }}
      >
        <CorroborationCard
          label="LinkedIn"
          found={corroboration.linkedinPresent}
          url={corroboration.linkedinUrl}
        />
        <CorroborationCard
          label="Wikidata"
          found={corroboration.wikidataPresent}
          url={corroboration.wikidataUrl}
        />
      </div>
      {mentions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p className="card-eyebrow">Top mentions</p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {mentions.slice(0, 5).map((m, i) => (
              <li
                key={i}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(23, 62, 44, .04)",
                  border: "1px solid rgba(23, 62, 44, .1)",
                  fontSize: "0.9rem",
                }}
              >
                <a
                  href={m.url}
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
                  {m.title || m.domain}
                </a>
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: "0.78rem",
                    color: "#56675c",
                  }}
                >
                  ({m.domain})
                </span>
                {m.snippet && (
                  <p
                    style={{
                      marginTop: 6,
                      fontSize: "0.85rem",
                      lineHeight: 1.55,
                      color: "#4a5b52",
                    }}
                  >
                    {m.snippet}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CorroborationCard({
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
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-serif), Georgia, serif",
          fontWeight: 500,
          color: "var(--dz-forest)",
          fontSize: "0.95rem",
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

function UpsellSection() {
  return (
    <section className="daizie-pane forest" style={{ marginTop: 20 }}>
      <p
        className="daizie-eyebrow"
        style={{ color: "var(--dz-gold-soft)" }}
      >
        The next step
      </p>
      <h2>Want to know what AI is actually saying about you?</h2>
      <p
        className="daizie-lede"
        style={{ color: "rgba(250, 246, 238, .9)" }}
      >
        This report scored what&rsquo;s on your site. The paid{" "}
        <strong>Daizie AI Visibility Assessment</strong> ($895) tests
        ChatGPT, Claude, Perplexity, and Gemini, captures 32 live AI
        responses, verifies every factual claim against your real sources,
        and plots you against two competitors you name. Includes a 30-minute
        review call.
      </p>
      <div className="daizie-actions">
        <a
          className="daizie-btn light"
          href="https://www.martykoepke.com/ai-visibility"
        >
          See the Assessment →
        </a>
        <a className="plain-link" href="https://tally.so/r/xXVPgo" style={{ color: "var(--dz-cream)", borderBottomColor: "var(--dz-gold-soft)" }}>
          Book a 20-minute call
        </a>
      </div>
    </section>
  );
}

function ReportFooter({ audit }: { audit: AuditRow }) {
  return (
    <footer
      style={{
        marginTop: 32,
        paddingTop: 20,
        borderTop: "1px solid rgba(23, 62, 44, .18)",
        fontSize: "0.82rem",
        color: "#56675c",
      }}
    >
      <p style={{ margin: 0 }}>
        Practical Informatics LLC · Mokelumne Hill, California ·{" "}
        <a
          href="https://www.martykoepke.com"
          style={{
            color: "var(--dz-forest)",
            textDecoration: "underline",
            textDecorationColor: "var(--dz-gold)",
            textUnderlineOffset: 3,
          }}
        >
          martykoepke.com
        </a>
      </p>
      <p style={{ margin: "6px 0 0", fontSize: "0.75rem" }}>
        Daizie Readiness Check · Report ID{" "}
        <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
          {audit.id.slice(0, 8)}
        </code>
      </p>
    </footer>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function friendlyDomain(url: string | null): string {
  if (!url) return "your site";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function humanizeSubjectType(t: string): string {
  if (t === "personal_brand") return "personal brand";
  if (t === "company") return "company";
  return t;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return true;
  return Date.now() - created > REPORT_TOKEN_TTL_MS;
}

function pickImprovements(dimensions: DimensionRow[]): ImprovementGuidance[] {
  const sorted = [...dimensions]
    .filter((dimension) => typeof dimension.score === "number")
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  const selected: ImprovementGuidance[] = [];
  const seen = new Set<string>();

  for (const dimension of sorted) {
    const key = guidanceKey(dimension);
    if (!key || seen.has(key)) continue;
    const item = IMPROVEMENT_GUIDANCE[key];
    if (!item) continue;
    selected.push(item);
    seen.add(key);
    if (selected.length === 3) break;
  }

  for (const fallback of FALLBACK_IMPROVEMENTS) {
    if (selected.length === 3) break;
    if (selected.some((item) => item.title === fallback.title)) continue;
    selected.push(fallback);
  }

  return selected.slice(0, 3);
}

function guidanceKey(
  dimension: DimensionRow
): keyof typeof IMPROVEMENT_GUIDANCE | null {
  const raw =
    `${dimension.dimension_id} ${dimension.dimension_name}`.toLowerCase();
  if (
    raw.includes("business_clarity") ||
    raw.includes("d1") ||
    raw.includes("clarity")
  ) {
    return "business_clarity";
  }
  if (
    raw.includes("source_support") ||
    raw.includes("d2") ||
    raw.includes("source")
  ) {
    return "source_support";
  }
  if (
    raw.includes("ai_readability") ||
    raw.includes("d3") ||
    raw.includes("readability") ||
    raw.includes("technical") ||
    raw.includes("schema")
  ) {
    return "ai_readability";
  }
  if (
    raw.includes("distinctive_point_of_view") ||
    raw.includes("d4") ||
    raw.includes("distinctive") ||
    raw.includes("point of view")
  ) {
    return "distinctive_point_of_view";
  }
  if (
    raw.includes("recommendation_fit") ||
    raw.includes("d6") ||
    raw.includes("d7") ||
    raw.includes("recommendation") ||
    raw.includes("fit")
  ) {
    return "recommendation_fit";
  }
  return null;
}

const IMPROVEMENT_GUIDANCE = {
  business_clarity: {
    title: "Make the business easier for AI to classify",
    action:
      "Put a plain-English positioning sentence near the top of the homepage that names what you do, who you serve, and the situation where you are the right fit.",
    where:
      "Homepage hero or first content block, About page intro, primary service page, and page title/meta description.",
    how:
      "Use one sentence with four parts: business category, audience, problem solved, and best-fit situation. Repeat the same wording in schema and core metadata.",
    success:
      "AI can describe the business category and buyer fit without inventing context or reducing the company to generic consulting language.",
    why:
      "AI systems extract identity and category signals from prominent page text. If the business category is implied or buried, AI has to guess.",
    example:
      "Add a sentence like: Marty Koepke helps founder-led service businesses understand and improve how AI systems describe, cite, and recommend them.",
  },
  source_support: {
    title: "Support the claims you want AI to repeat",
    action:
      "Create a claim-to-proof block for the 3-5 claims you most want AI to repeat. Each row should include the claim, the supporting proof, and a source link or concrete example.",
    where:
      "Start on the primary service page, directly below the offer explanation. Add a shorter proof band on the homepage and put credentials or background proof on the About page.",
    how:
      "Use a simple structure: Claim, Evidence, Source. Evidence can be a named project example, before/after result, testimonial quote, screenshot, credential, publication, patent, citation, or third-party profile.",
    success:
      "AI can answer why the business is credible and repeat specific claims with nearby support instead of describing the business in vague category terms.",
    why:
      "Unsupported claims are harder for AI to trust and cite. Evidence gives AI a reason to repeat the claim confidently instead of summarizing around it.",
    example:
      "If the site says AI readiness audit, add a short example showing what was measured, what changed, and which source or result supports it.",
  },
  ai_readability: {
    title: "Make the page easier for AI systems to parse",
    action:
      "Rewrite important pages into clear extraction sections: one H1, descriptive H2s, short answer-style paragraphs, internal links, and structured data that matches the visible page content.",
    where:
      "Start with the homepage and the top service page. Then update the About page, FAQ, methodology/process page, and any page linked from the main navigation.",
    how:
      "Use headings like What this service does, Who this is for, Problems it solves, What you receive, Proof and examples, When this is a good fit, and Frequently asked questions.",
    success:
      "AI can pull the business identity, service scope, proof, and buyer fit from named sections instead of stitching meaning together from scattered copy.",
    why:
      "AI tools rely on extractable passages and structured cues. Clean structure helps them preserve the meaning instead of flattening everything into generic text.",
    example:
      "Create a service section with headings like Who this is for, What the audit measures, What you receive, and When this is a good fit.",
  },
  distinctive_point_of_view: {
    title: "Give AI a specific reason to choose you",
    action:
      "Name your method, framework, or point of view, then explain what tradeoff it makes and why it matters to the buyer.",
    where:
      "Homepage differentiation section, About page, methodology page, blog pillar page, and service pages where buyers compare options.",
    how:
      "Write a short named method or principle, explain what it prioritizes, what it avoids, and why that tradeoff produces a better outcome.",
    success:
      "AI has a concise differentiator it can preserve when comparing the business against alternatives.",
    why:
      "When several businesses sound similar, AI defaults to generic recommendations. A distinct, supportable perspective helps it understand why you are different.",
    example:
      "Add a short section such as: Our approach measures accuracy before visibility, because being recommended for the wrong reason can be worse than not showing up.",
  },
  recommendation_fit: {
    title: "Tell AI when you are the right recommendation",
    action:
      "Add explicit use-case blocks that describe the situations where the business is a strong recommendation and the situations where it is not the right fit.",
    where:
      "Place a full use-case section on the primary service page. Add a shorter version near the homepage CTA, on the pricing or offer page, in the FAQ, and on the consultation booking page.",
    how:
      "Create four mini-sections: Best for, Common triggers, Not a fit for, and Choose this when.",
    success:
      "AI can recommend the business for specific buyer prompts and avoid recommending it for wrong-fit situations.",
    why:
      "AI recommendations improve when the source material includes conditions. Without fit signals, AI may recommend you too broadly or skip you for safer generic options.",
    example:
      "Add: Best fit for founder-led service businesses with a real offer and public website. Not a fit for ecommerce brands looking for paid media management.",
  },
} satisfies Record<string, ImprovementGuidance>;

const FALLBACK_IMPROVEMENTS: ImprovementGuidance[] = [
  IMPROVEMENT_GUIDANCE.business_clarity,
  IMPROVEMENT_GUIDANCE.source_support,
  IMPROVEMENT_GUIDANCE.recommendation_fit,
];
