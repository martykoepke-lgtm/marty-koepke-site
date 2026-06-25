/**
 * /scan/report/[id]?t=<access_token>
 *
 * Public token-gated free-scan report. Same data as the on-screen result
 * in /scan, plus a couple of extra signal sections from the crawler +
 * corroboration runs. Print-friendly — this page IS the PDF (via
 * scripts/scan-pdf.ts).
 *
 * Gate: `?t=` must match submissions.access_token. No other auth — same
 * pattern as the v1.0 /ai-visibility/results/[id] page.
 *
 * Per D006 / AVI_FREE_FLOW.md. Rendering brand: cream background, forest
 * headings, gold accents, Lora serif + Inter sans, tan hairlines.
 */

import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";
import { tierFor, type Tier } from "@practical-informatics/avi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================================
// Types — narrow rows for what this page consumes
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
};

type DimensionRow = {
  dimension_id: string;
  dimension_name: string;
  score: number | null;
  justification: string | null;
};

const TIER_COPY: Record<
  Tier,
  { label: string; sentence: string; tone: string }
> = {
  invisible: {
    label: "Invisible",
    sentence:
      "AI tools don't currently surface this business when buyers ask. Strong signals are missing, but the fixes are mostly cheap.",
    tone: "bg-red-100 text-red-900 border-red-300",
  },
  hidden: {
    label: "Hidden",
    sentence:
      "AI tools can find this business if pressed but won't recommend it on their own yet. A handful of structured fixes change that.",
    tone: "bg-orange-100 text-orange-900 border-orange-300",
  },
  "faintly-visible": {
    label: "Faintly Visible",
    sentence:
      "AI tools mention this business sometimes, but inconsistently. You're in the conversation — not yet at the top of it.",
    tone: "bg-yellow-100 text-yellow-900 border-yellow-300",
  },
  discoverable: {
    label: "Discoverable",
    sentence:
      "AI tools recognize this business as a credible answer. Closing the remaining gaps moves you to a default recommendation.",
    tone: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  "agent-ready": {
    label: "Agent-Ready",
    sentence:
      "AI tools surface this business confidently across the queries that matter. You're set up to compound visibility, not chase it.",
    tone: "bg-forest text-cream border-forest",
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
  const supabase = supabaseAdmin();
  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .select(
      "id, url, company_name, access_token, subject_type, created_at"
    )
    .eq("id", submissionId)
    .maybeSingle<SubmissionRow>();
  if (subErr || !submission) return null;
  if (submission.access_token !== token) return null;

  const { data: audit, error: audErr } = await supabase
    .from("audits")
    .select(
      "id, submission_id, rubric_version, subject_type, readiness_score, tier, crawler_output, scoring_output, created_at"
    )
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AuditRow>();
  if (audErr || !audit) return null;

  const { data: dimRows } = await supabase
    .from("audit_dimension_scores")
    .select("dimension_id, dimension_name, score, justification")
    .eq("audit_id", audit.id)
    .order("dimension_id", { ascending: true })
    .returns<DimensionRow[]>();

  return { submission, audit, dimensions: dimRows ?? [] };
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

  return (
    <main className="bg-cream text-charcoal min-h-screen pb-24 print:pb-0">
      <article className="mx-auto max-w-3xl px-8 pt-16 pb-12 print:pt-10 print:px-10">
        <ReportHeader submission={submission} audit={audit} />
        <TierHeadline audit={audit} />
        <DimensionsSection dimensions={dimensions} />
        <FindingsSection findings={audit.scoring_output?.findings ?? []} />
        <CrawlerSection crawler={audit.crawler_output} />
        <CorroborationSection
          corroboration={audit.scoring_output?.corroboration ?? null}
        />
        <UpsellSection />
        <ReportFooter audit={audit} />
      </article>
    </main>
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
    <header className="border-b border-tan pb-8 mb-10">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold-dark mb-3">
            Free AI Readiness Check
          </p>
          <h1 className="font-serif text-4xl text-forest leading-tight">
            {submission.company_name ?? domain}
          </h1>
          <p className="mt-2 text-sm text-moss">
            {domain}
            {audit.subject_type ? ` · ${humanizeSubjectType(audit.subject_type)}` : ""}
          </p>
        </div>
        <div className="text-right text-xs text-moss">
          <p>Generated {formatDate(audit.created_at)}</p>
          <p className="mt-1">Rubric {audit.rubric_version ?? "v2.0"}</p>
        </div>
      </div>
    </header>
  );
}

function TierHeadline({ audit }: { audit: AuditRow }) {
  // The free-flow tier is derived from readiness only (no Visibility
  // outcome). The DB's audits.tier column may have been set by the paid
  // pipeline against the composite score, so we recompute here to keep
  // the free-flow report consistent with its own scale.
  const score = audit.readiness_score ?? 0;
  const tierKey: Tier = tierFor(score);
  const t = TIER_COPY[tierKey];
  const pct = Math.round(score * 100);

  return (
    <section className="mb-12">
      <div className={`border ${t.tone} rounded-lg p-7`}>
        <p className="text-xs uppercase tracking-[0.18em] text-gold-dark mb-3">
          Your tier
        </p>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="font-serif text-4xl font-semibold">{t.label}</span>
          <span className="font-serif text-3xl text-forest">{pct}/100</span>
        </div>
        <p className="mt-5 text-base leading-relaxed">{t.sentence}</p>
      </div>
    </section>
  );
}

function DimensionsSection({ dimensions }: { dimensions: DimensionRow[] }) {
  if (dimensions.length === 0) return null;
  return (
    <section className="mb-12 break-inside-avoid">
      <h2 className="font-serif text-2xl text-forest mb-6">
        The readiness drivers
      </h2>
      <ul className="space-y-5">
        {dimensions.map((d) => (
          <DimensionRowItem key={d.dimension_id} row={d} />
        ))}
      </ul>
    </section>
  );
}

function DimensionRowItem({ row }: { row: DimensionRow }) {
  const score = typeof row.score === "number" ? row.score : 0;
  const pct = (score / 5) * 100;
  return (
    <li>
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-base text-forest">
          <span className="text-gold-dark mr-2">{row.dimension_id}</span>
          {row.dimension_name}
        </p>
        <p className="text-sm text-moss">
          {typeof row.score === "number" ? row.score.toFixed(1) : "—"} / 5
        </p>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-tan/40"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={score}
      >
        <div
          className="h-full rounded-full bg-forest"
          style={{ width: `${pct}%` }}
        />
      </div>
      {row.justification && (
        <p className="mt-3 text-sm leading-relaxed text-charcoal">
          {row.justification}
        </p>
      )}
    </li>
  );
}

function FindingsSection({
  findings,
}: {
  findings: NonNullable<ScoringSnapshot["findings"]>;
}) {
  if (!findings || findings.length === 0) return null;
  return (
    <section className="mb-12 break-inside-avoid">
      <h2 className="font-serif text-2xl text-forest mb-6">What stood out</h2>
      <ul className="space-y-4">
        {findings.map((f) => (
          <li
            key={f.dimensionId}
            className="rounded-lg border border-tan bg-cream-dim p-5"
          >
            <p className="font-serif text-base font-semibold text-forest">
              {f.dimensionName}
              {typeof f.score === "number" && (
                <span className="ml-2 text-gold-dark text-sm font-normal">
                  ({f.score.toFixed(1)} / 5)
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal">
              {f.summary}
            </p>
          </li>
        ))}
      </ul>
    </section>
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
    <section className="mb-12 break-inside-avoid">
      <h2 className="font-serif text-2xl text-forest mb-6">
        What we read on your site
      </h2>
      <div className="rounded-lg border border-tan bg-cream-dim p-5">
        {!crawler.reachable && (
          <p className="mb-4 text-sm text-moss">
            We couldn&apos;t fully read your site directly — this section is
            partial.
          </p>
        )}
        <ul className="grid gap-2 sm:grid-cols-2">
          {signals.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-sm">
              <span
                className={
                  s.present
                    ? "inline-block h-2 w-2 rounded-full bg-forest"
                    : "inline-block h-2 w-2 rounded-full bg-tan"
                }
                aria-hidden="true"
              />
              <span className="text-charcoal">
                {s.label}: {s.present ? "yes" : "no"}
              </span>
            </li>
          ))}
        </ul>
        {Array.isArray(crawler.schemaTypes) && crawler.schemaTypes.length > 0 && (
          <p className="mt-4 text-xs text-moss">
            JSON-LD types detected: {crawler.schemaTypes.join(", ")}
          </p>
        )}
      </div>
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
    <section className="mb-12 break-inside-avoid">
      <h2 className="font-serif text-2xl text-forest mb-6">
        What the web says about you
      </h2>
      <div className="rounded-lg border border-tan bg-cream-dim p-5">
        <p className="text-sm text-charcoal">
          We found {corroboration.totalCorroboratingDomains ?? 0} corroborating
          domain{corroboration.totalCorroboratingDomains === 1 ? "" : "s"} that
          name this business.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
          <li>
            LinkedIn:{" "}
            {corroboration.linkedinPresent ? (
              <a
                href={corroboration.linkedinUrl}
                className="underline hover:text-forest break-all"
              >
                {corroboration.linkedinUrl}
              </a>
            ) : (
              <span className="text-moss">not found</span>
            )}
          </li>
          <li>
            Wikidata:{" "}
            {corroboration.wikidataPresent ? (
              <a
                href={corroboration.wikidataUrl}
                className="underline hover:text-forest break-all"
              >
                {corroboration.wikidataUrl}
              </a>
            ) : (
              <span className="text-moss">not found</span>
            )}
          </li>
        </ul>
        {mentions.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest text-gold-dark mb-2">
              Top mentions
            </p>
            <ul className="space-y-3">
              {mentions.slice(0, 5).map((m, i) => (
                <li key={i} className="text-sm">
                  <a
                    href={m.url}
                    className="font-semibold text-forest underline hover:text-forest-dark"
                  >
                    {m.title || m.domain}
                  </a>
                  <span className="ml-2 text-xs text-moss">({m.domain})</span>
                  {m.snippet && (
                    <p className="mt-1 text-charcoal text-sm leading-relaxed">
                      {m.snippet}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function UpsellSection() {
  return (
    <section className="mb-12 print:break-before-page">
      <div className="rounded-lg bg-forest text-cream p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold mb-3">
          The next step
        </p>
        <h2 className="font-serif text-2xl mb-4">
          Want to know if AI is actually finding you?
        </h2>
        <p className="text-base leading-relaxed text-cream/95">
          This report scored what&apos;s on your site. The paid{" "}
          <strong className="text-gold">AI Visibility Snapshot</strong>{" "}
          ($495) adds a focused live-AI review and walkthrough. The $1,950 AI
          Business Accuracy Audit goes deeper on accuracy, claim support,
          context preservation, and recommendation fit.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://www.practicalinformatics.com/ai-visibility"
            className="inline-block rounded-md bg-gold px-6 py-3 text-base font-semibold text-forest hover:bg-gold-dark transition-colors"
          >
            See the AI Visibility Index →
          </a>
          <a
            href="https://tally.so/r/xXVPgo"
            className="inline-block rounded-md border border-gold px-6 py-3 text-base font-semibold text-gold hover:bg-forest-dark transition-colors"
          >
            Book a 20-minute call
          </a>
        </div>
      </div>
    </section>
  );
}

function ReportFooter({ audit }: { audit: AuditRow }) {
  return (
    <footer className="border-t border-tan pt-8 mt-12 text-sm text-moss">
      <p>
        Practical Informatics LLC · Mokelumne Hill, California ·{" "}
        <a
          href="https://www.practicalinformatics.com"
          className="underline hover:text-forest"
        >
          practicalinformatics.com
        </a>
      </p>
      <p className="mt-2 text-xs">
        Free Readiness Check · Rubric {audit.rubric_version ?? "v2.0"} · Report
        ID <code className="font-mono">{audit.id.slice(0, 8)}</code>
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
