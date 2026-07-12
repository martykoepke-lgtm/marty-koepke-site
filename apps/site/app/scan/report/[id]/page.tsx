/**
 * /scan/report/[id]?t=<access_token>
 *
 * Public token-gated free-scan report. Same data as the on-screen result
 * in /scan, plus a couple of extra signal sections from the crawler +
 * corroboration runs. Print-friendly hosted report; customers can save it
 * as PDF from the browser.
 *
 * Gate: `?t=` must match submissions.access_token and the scan must be
 * within the 30-day report access window.
 *
 * Per D006 / AVI_FREE_FLOW.md. Rendering brand: white report surface,
 * restrained forest and gold accents, Lora serif + Inter sans.
 */

import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";
import { tierFor, type Tier } from "@practical-informatics/avi";
import { ReportActions } from "./ReportActions";
import { TokenReportNav } from "./TokenReportNav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const REPORT_TOKEN_TTL_DAYS = 30;
const REPORT_TOKEN_TTL_MS = REPORT_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

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

type ImprovementGuidance = {
  title: string;
  action: string;
  where: string;
  how: string;
  success: string;
  why: string;
  example: string;
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
  if (isExpired(submission.created_at)) return null;

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
    <main className="free-report tokenized-report report-workspace min-h-screen pb-24 text-charcoal print:bg-white print:pb-0">
      <article className="mx-auto max-w-5xl px-5 pt-10 pb-12 sm:px-8 lg:pt-14 print:max-w-none print:px-10 print:pt-10">
        <TokenReportNav reportId={id} token={t} active="report" />
        <ReportActions />
        <ReportHeader submission={submission} audit={audit} />
        <FindingsSection findings={audit.scoring_output?.findings ?? []} />
        <ImprovementSection dimensions={dimensions} />
        <TierHeadline audit={audit} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] print:block">
          <div>
            <DimensionsSection dimensions={dimensions} />
          </div>
          <div>
            <CrawlerSection crawler={audit.crawler_output} />
            <CorroborationSection
              corroboration={audit.scoring_output?.corroboration ?? null}
            />
          </div>
        </div>
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
    <header className="mb-6 overflow-hidden rounded-lg border border-tan/80 bg-white p-6 shadow-sm print:shadow-none">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-dark mb-3">
            Free AI Readiness Check
          </p>
          <h1 className="font-serif text-4xl text-forest leading-tight sm:text-5xl">
            {submission.company_name ?? domain}
          </h1>
          <p className="mt-3 text-sm text-moss">
            {domain}
            {audit.subject_type ? ` · ${humanizeSubjectType(audit.subject_type)}` : ""}
          </p>
        </div>
        <div className="rounded-md border border-tan bg-cream px-4 py-3 text-left text-xs text-moss sm:text-right">
          <p>Generated {formatDate(audit.created_at)}</p>
          <p className="mt-1">Private report link expires after 30 days</p>
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
    <section className="mb-6 break-inside-avoid">
      <div className="rounded-lg border border-tan/80 bg-white p-6 text-forest shadow-sm print:shadow-none">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-darker mb-3">
              Your tier
            </p>
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="font-serif text-4xl font-semibold sm:text-5xl">
                {t.label}
              </span>
              <span className="rounded-full border border-forest/15 bg-white/70 px-3 py-1 font-serif text-2xl text-forest">
                {pct}/100
              </span>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-charcoal">
              {t.sentence}
            </p>
          </div>
          <div className="rounded-lg border border-forest/15 bg-forest p-5 text-cream">
            <p className="text-xs uppercase tracking-[0.18em] text-gold">
              Report scope
            </p>
            <p className="mt-3 text-sm leading-relaxed text-cream/90">
              This free check reads public site signals and scores readiness.
              The paid audit measures live AI answers across major engines.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DimensionsSection({ dimensions }: { dimensions: DimensionRow[] }) {
  if (dimensions.length === 0) return null;
  return (
    <section className="mb-6 rounded-lg border border-tan/80 bg-white p-6 text-charcoal shadow-sm break-inside-avoid print:shadow-none">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
            Score breakdown
          </p>
          <h2 className="mt-2 font-serif text-2xl text-forest">
            The readiness drivers
          </h2>
        </div>
        <p className="text-sm text-moss">0-5, based on observable site evidence</p>
      </div>
      <ul className="grid gap-4 lg:grid-cols-2">
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
    <li className="rounded-lg border border-tan/70 bg-cream/45 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-serif text-base font-semibold text-forest">
          {row.dimension_name}
        </p>
        <p className="font-mono text-sm font-semibold text-forest">
          {typeof row.score === "number" ? row.score.toFixed(1) : "-"} / 5
        </p>
      </div>
      <div
        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-tan/45"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={score}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-forest"
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
    <section className="free-report-section mb-6 rounded-lg border border-tan/80 bg-white p-6 text-charcoal shadow-sm break-inside-avoid print:shadow-none">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
        Key findings
      </p>
      <h2 className="mt-2 font-serif text-2xl text-forest mb-6">What stood out</h2>
      <ul className="grid gap-4 lg:grid-cols-2">
        {findings.map((f) => (
          <li
            key={f.dimensionId}
            className="free-report-card rounded-lg border-l-4 border-gold bg-cream/55 p-5 print:break-inside-avoid"
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

function ImprovementSection({ dimensions }: { dimensions: DimensionRow[] }) {
  const improvements = pickImprovements(dimensions);
  if (improvements.length === 0) return null;

  return (
    <section className="free-report-section mb-6 rounded-lg border border-tan/80 bg-white p-6 text-charcoal shadow-sm break-inside-avoid print:shadow-none">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
        Priority improvements
      </p>
      <h2 className="mt-2 font-serif text-2xl text-forest">
        3 ways to improve your AI visibility
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-moss">
        These are practical next moves based on the weakest readiness signals we
        could observe from your public site. Each one names where to make the
        change, how to implement it, and what success should look like.
      </p>
      <ol className="mt-5 grid gap-5">
        {improvements.map((item, index) => (
          <li
            key={`${item.title}-${index}`}
            className="free-report-card rounded-lg border border-tan/70 bg-cream/45 p-5 print:break-inside-avoid"
          >
            <div className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-cream">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-semibold text-forest">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-moss">
                  {item.why}
                </p>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <p className="border-l-2 border-gold pl-3 text-sm leading-relaxed text-charcoal">
                    <strong className="text-forest">Where: </strong>
                    {item.where}
                  </p>
                  <p className="border-l-2 border-gold pl-3 text-sm leading-relaxed text-charcoal">
                    <strong className="text-forest">How: </strong>
                    {item.how}
                  </p>
                  <p className="border-l-2 border-gold pl-3 text-sm leading-relaxed text-charcoal">
                    <strong className="text-forest">Success: </strong>
                    {item.success}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-charcoal">
                  <strong className="text-forest">Do this: </strong>
                  {item.action}
                </p>
                <p className="mt-2 border-l-2 border-gold pl-3 text-sm leading-relaxed text-charcoal">
                  <strong className="text-forest">Example: </strong>
                  {item.example}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
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
    <section className="mb-6 rounded-lg border border-tan/80 bg-white p-6 text-charcoal shadow-sm break-inside-avoid print:shadow-none">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
        Site signals
      </p>
      <h2 className="mt-2 font-serif text-2xl text-forest mb-5">
        What we read
      </h2>
      <div>
        {!crawler.reachable && (
          <p className="mb-4 text-sm text-moss">
            We couldn&apos;t fully read your site directly — this section is
            partial.
          </p>
        )}
        <ul className="grid gap-2">
          {signals.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-3 rounded-md bg-cream/50 px-3 py-2 text-sm"
            >
              <span className="text-charcoal">{s.label}</span>
              <span
                className={
                  s.present
                    ? "rounded-full bg-forest px-2 py-0.5 text-xs font-semibold text-cream"
                    : "rounded-full bg-tan/60 px-2 py-0.5 text-xs font-semibold text-moss"
                }
              >
                {s.present ? "yes" : "no"}
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
    <section className="mb-6 rounded-lg border border-tan/80 bg-white p-6 text-charcoal shadow-sm break-inside-avoid print:shadow-none">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
        Corroboration
      </p>
      <h2 className="mt-2 font-serif text-2xl text-forest mb-5">
        What the web says
      </h2>
      <div>
        <p className="text-sm text-charcoal">
          We found {corroboration.totalCorroboratingDomains ?? 0} corroborating
          domain{corroboration.totalCorroboratingDomains === 1 ? "" : "s"} that
          name this business.
        </p>
        <ul className="mt-4 grid gap-3 text-sm">
          <li className="rounded-md bg-cream/50 p-3">
            <span className="font-semibold text-forest">LinkedIn: </span>
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
          <li className="rounded-md bg-cream/50 p-3">
            <span className="font-semibold text-forest">Wikidata: </span>
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
    <section className="mb-8 print:break-before-page">
      <div className="rounded-lg border border-forest bg-forest text-cream p-8 shadow-sm print:break-inside-avoid print:shadow-none">
        <p className="text-xs uppercase tracking-[0.18em] text-gold mb-3">
          The next step
        </p>
        <h2 className="font-serif text-2xl mb-4">
          Want to know if AI is actually finding you?
        </h2>
        <p className="text-base leading-relaxed text-cream/95">
          This report scored what&apos;s on your site. The paid{" "}
          <strong className="text-gold">AI Business Accuracy Audit</strong>{" "}
          ($895) goes further — four engines tested, every factual claim AI
          makes about you verified against your real sources, and you plotted
          against two competitors you name. Includes a 30-minute review call.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="https://www.martykoepke.com/ai-visibility"
            className="inline-block rounded-md bg-gold px-6 py-3 text-base font-semibold text-forest hover:bg-gold-dark transition-colors"
          >
            See the paid Audit →
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
    <footer className="mt-12 border-t border-tan pt-8 text-sm text-moss">
      <p>
        Practical Informatics LLC · Mokelumne Hill, California ·{" "}
        <a
          href="https://www.martykoepke.com"
          className="underline decoration-gold underline-offset-4 hover:text-forest"
        >
          martykoepke.com
        </a>
      </p>
      <p className="mt-2 text-xs">
        Free Readiness Check · Report
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

function guidanceKey(dimension: DimensionRow): keyof typeof IMPROVEMENT_GUIDANCE | null {
  const raw = `${dimension.dimension_id} ${dimension.dimension_name}`.toLowerCase();
  if (raw.includes("business_clarity") || raw.includes("d1") || raw.includes("clarity")) {
    return "business_clarity";
  }
  if (raw.includes("source_support") || raw.includes("d2") || raw.includes("source")) {
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

const LEGACY_IMPROVEMENT_GUIDANCE = {
  business_clarity: {
    title: "Make the business easier for AI to classify",
    action:
      "Put a plain-English positioning sentence near the top of the homepage that names what you do, who you serve, and the situation where you are the right fit.",
    why:
      "AI systems extract identity and category signals from prominent page text. If the business category is implied or buried, AI has to guess.",
    example:
      "Add a sentence like: “Marty Koepke helps founder-led service businesses understand and improve how AI systems describe, cite, and recommend them.”",
  },
  source_support: {
    title: "Support the claims you want AI to repeat",
    action:
      "Add proof next to important claims: case examples, named credentials, source links, testimonials, screenshots, or short evidence notes.",
    why:
      "Unsupported claims are harder for AI to trust and cite. Evidence gives AI a reason to repeat the claim confidently instead of summarizing around it.",
    example:
      "If the site says “AI visibility audit,” add a short example showing what was measured, what changed, and which source or result supports it.",
  },
  ai_readability: {
    title: "Make the page easier for AI systems to parse",
    action:
      "Use clear H1/H2 headings, descriptive service sections, internal links, and structured data for Organization, Person, Service, or LocalBusiness where appropriate.",
    why:
      "AI tools rely on extractable passages and structured cues. Clean structure helps them preserve the meaning instead of flattening everything into generic text.",
    example:
      "Create a service section with headings like “Who this is for,” “What the audit measures,” “What you receive,” and “When this is a good fit.”",
  },
  distinctive_point_of_view: {
    title: "Give AI a specific reason to choose you",
    action:
      "Name your method, framework, or point of view, then explain what tradeoff it makes and why it matters to the buyer.",
    why:
      "When several businesses sound similar, AI defaults to generic recommendations. A distinct, supportable perspective helps it understand why you are different.",
    example:
      "Add a short section such as: “Our approach measures accuracy before visibility, because being recommended for the wrong reason can be worse than not showing up.”",
  },
  recommendation_fit: {
    title: "Tell AI when you are the right recommendation",
    action:
      "Add explicit best-fit and not-fit language to service pages so AI knows which buyer situations should point toward you.",
    why:
      "AI recommendations improve when the source material includes conditions. Without fit signals, AI may recommend you too broadly or skip you for safer generic options.",
    example:
      "Add: “Best fit for founder-led service businesses with a real offer and public website. Not a fit for ecommerce brands looking for paid media management.”",
  },
};

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
      "Use a simple structure: Claim, Evidence, Source. Evidence can be a named project example, before/after result, testimonial quote, screenshot, credential, publication, patent, citation, or third-party profile. Keep the proof within the same section as the claim so AI can connect them.",
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
      "Use headings like What this service does, Who this is for, Problems it solves, What you receive, Proof and examples, When this is a good fit, and Frequently asked questions. Add Organization, Person, Service, FAQPage, or LocalBusiness schema only where it reflects visible content. Add an llms.txt file that points to the pages AI should read first.",
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
      "Create four mini-sections: Best for, Common triggers, Not a fit for, and Choose this when. Write them in buyer language, not internal positioning language. Include industry, company stage, budget/readiness signals, urgency, and alternative situations where another provider is better.",
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
