/**
 * Admin audit report page — styled web view + the source of truth for
 * PDF generation. One HTML/CSS surface, two outputs (browser + PDF).
 *
 * Protected by ?secret=<CRON_SECRET> (no user-auth in this project).
 *
 * Read AVI_INDEX_REPORT.md for the data shape this renders.
 */

import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";

export const runtime = "nodejs";
// Always render fresh; never cache audit data.
export const dynamic = "force-dynamic";

// ============================================================================
// Data fetching (server-side)
// ============================================================================

type SubmissionRow = {
  company_name: string;
  url: string | null;
  industry: string;
  location: string | null;
  subject_type: string | null;
};

type AuditRow = {
  id: string;
  submission_id: string;
  rubric_version: string | null;
  subject_type: string | null;
  composite_score: number | null;
  readiness_score: number | null;
  visibility_score: number | null;
  total_spend_usd: number | null;
  tier: string | null;
  crawler_output: Record<string, unknown> | null;
  scoring_output: { corroboration?: Corroboration | null } | null;
  query_output: VisibilityQueryOutput | null;
  recommendations: Recommendation[] | null;
  created_at: string;
};

type Recommendation = {
  title: string;
  category: string;
  why_it_matters: string;
  do_this: string[];
  youll_know_it_worked: string;
  effort: string;
  dimensions_lifted: string[];
  estimated_delta: string;
  priority: number;
};

type DimensionScore = {
  dimension_id: string;
  dimension_name: string;
  score: number | null;
  justification: string | null;
  evidence_pointers: Array<{ type: string; value: string; found: boolean }> | null;
};

type QueryResponse = {
  query_id: string;
  query_category: string;
  query_text: string;
  engine: string;
  rep_index: number;
  mentioned: boolean | null;
  cited_with_link: boolean | null;
  position_band: string | null;
  competitors_mentioned: string[] | null;
  evidence_text: string | null;
  status: string;
};

type Corroboration = {
  wikidataPresent: boolean;
  wikidataUrl?: string;
  linkedinPresent: boolean;
  linkedinUrl?: string;
  totalCorroboratingDomains: number;
  mentions: Array<{
    url: string;
    title: string;
    domain: string;
    snippet: string;
  }>;
};

type VisibilityQueryOutput = {
  breakdown?: {
    presence: number;
    citation: number;
    shareOfVoice: number;
    prominence: number;
  };
};

async function loadAuditData(auditId: string): Promise<{
  audit: AuditRow;
  submission: SubmissionRow;
  dimensions: DimensionScore[];
  responses: QueryResponse[];
} | null> {
  const supabase = supabaseAdmin();

  const { data: audit, error: auditErr } = await supabase
    .from("audits")
    .select(
      "id, submission_id, rubric_version, subject_type, composite_score, readiness_score, visibility_score, total_spend_usd, tier, crawler_output, scoring_output, query_output, recommendations, created_at"
    )
    .eq("id", auditId)
    .single<AuditRow>();
  if (auditErr || !audit) return null;

  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .select("company_name, url, industry, location, subject_type")
    .eq("id", audit.submission_id)
    .single<SubmissionRow>();
  if (subErr || !submission) return null;

  const [dimsRes, respsRes] = await Promise.all([
    supabase
      .from("audit_dimension_scores")
      .select(
        "dimension_id, dimension_name, score, justification, evidence_pointers"
      )
      .eq("audit_id", auditId)
      .returns<DimensionScore[]>(),
    supabase
      .from("audit_query_responses")
      .select(
        "query_id, query_category, query_text, engine, rep_index, mentioned, cited_with_link, position_band, competitors_mentioned, evidence_text, status"
      )
      .eq("audit_id", auditId)
      .returns<QueryResponse[]>(),
  ]);

  return {
    audit,
    submission,
    dimensions: dimsRes.data ?? [],
    responses: respsRes.data ?? [],
  };
}

// ============================================================================
// Page
// ============================================================================

export default async function AdminAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ secret?: string }>;
}) {
  const { id } = await params;
  const { secret } = await searchParams;

  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-charcoal">
        <h1 className="text-2xl font-serif text-forest">Unauthorized</h1>
        <p className="mt-4">
          This page is protected. Append <code>?secret=…</code> to the URL.
        </p>
      </main>
    );
  }

  const data = await loadAuditData(id);
  if (!data) notFound();
  const { audit, submission, dimensions, responses } = data;

  return (
    <main className="bg-cream text-charcoal min-h-screen pb-32 print:pb-0">
      <article className="mx-auto max-w-3xl px-8 pt-16 pb-12">
        <Header audit={audit} submission={submission} />
        <Headline audit={audit} />
        <RecommendationsSection recommendations={audit.recommendations} />
        <VisibilityBreakdown audit={audit} />
        <DimensionsSection dimensions={dimensions} />
        <PerQuerySection responses={responses} />
        <CrawlerSection crawler={audit.crawler_output} />
        <CorroborationSection
          corroboration={audit.scoring_output?.corroboration ?? null}
        />
        <FailuresSection responses={responses} />
        <ReportFooter audit={audit} />
      </article>
    </main>
  );
}

// ============================================================================
// Sections
// ============================================================================

function Header({
  audit,
  submission,
}: {
  audit: AuditRow;
  submission: SubmissionRow;
}) {
  return (
    <header className="border-b border-tan pb-8 mb-12">
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark mb-3">
        AI Visibility Index — Audit Report
      </p>
      <h1 className="font-serif text-4xl text-forest leading-tight mb-6">
        {submission.company_name}
      </h1>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <Row label="URL">
          {submission.url ?? <em className="text-moss">none</em>}
        </Row>
        <Row label="Industry">{submission.industry}</Row>
        <Row label="Location">
          {submission.location ?? <em className="text-moss">not specified</em>}
        </Row>
        <Row label="Subject type">{submission.subject_type ?? "—"}</Row>
        <Row label="Rubric">{audit.rubric_version ?? "—"}</Row>
        <Row label="Generated">{formatDate(audit.created_at)}</Row>
        <Row label="LLM spend">
          ${(audit.total_spend_usd ?? 0).toFixed(3)}
        </Row>
        <Row label="Audit ID">
          <code className="font-mono text-xs">{audit.id.slice(0, 8)}…</code>
        </Row>
      </dl>
    </header>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-moss">{label}</dt>
      <dd className="text-charcoal">{children}</dd>
    </>
  );
}

function Headline({ audit }: { audit: AuditRow }) {
  const composite = audit.composite_score;
  const tier = audit.tier ?? "—";

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-forest mb-6">Headline</h2>
      <div className="bg-cream-dim border border-tan p-8 grid grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-moss mb-2">
            Composite
          </p>
          <p className="font-serif text-5xl text-forest leading-none">
            {composite == null ? "—" : composite.toFixed(3)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-moss mb-2">
            Tier
          </p>
          <p className="font-serif text-3xl text-forest leading-tight">
            {tier}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-moss mb-2">
            Readiness (X)
          </p>
          <p className="font-serif text-2xl text-charcoal">
            {fmt(audit.readiness_score)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-moss mb-2">
            Visibility (Y)
          </p>
          <p className="font-serif text-2xl text-charcoal">
            {fmt(audit.visibility_score)}
          </p>
        </div>
      </div>
      <p className="text-sm text-moss mt-4">
        Composite = 0.40 × Readiness + 0.60 × Visibility. Tier bands: Invisible
        0–0.19, Hidden 0.20–0.39, Faintly Visible 0.40–0.59, Discoverable
        0.60–0.79, Agent-Ready 0.80–1.00.
      </p>
    </section>
  );
}

function VisibilityBreakdown({ audit }: { audit: AuditRow }) {
  const b = audit.query_output?.breakdown;
  if (!b) {
    return (
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-forest mb-4">
          Visibility breakdown
        </h2>
        <p className="text-moss italic">
          No breakdown available (aggregation may not have run).
        </p>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-forest mb-2">
        Visibility breakdown <span className="text-moss text-base font-sans">(the Y outcome)</span>
      </h2>
      <p className="text-sm text-moss mb-6">
        What AI search actually says when asked. Measured from the 80-cell query grid.
      </p>
      <BreakdownTable
        rows={[
          ["Presence", b.presence, `named in ${pct(b.presence)} of responses`],
          ["Citation", b.citation, `cited with link in ${pct(b.citation)}`],
          [
            "Share-of-Voice",
            b.shareOfVoice,
            "named vs. competitors when both appear",
          ],
          [
            "Prominence",
            b.prominence,
            "avg position when named (1.0 = top, 0 = absent)",
          ],
        ]}
      />
      <p className="text-xs text-moss mt-4 font-mono">
        Weighted: 0.20 × Presence + 0.30 × Citation + 0.30 × SoV + 0.20 × Prominence
      </p>
    </section>
  );
}

function BreakdownTable({
  rows,
}: {
  rows: Array<[string, number, string]>;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-tan">
          <th className="text-left text-xs uppercase tracking-widest text-moss font-medium pb-2">
            Sub-metric
          </th>
          <th className="text-right text-xs uppercase tracking-widest text-moss font-medium pb-2 pr-4">
            Score
          </th>
          <th className="text-left text-xs uppercase tracking-widest text-moss font-medium pb-2">
            Reading
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, score, reading]) => (
          <tr key={label} className="border-b border-tan/50">
            <td className="py-3 text-charcoal">{label}</td>
            <td className="py-3 pr-4 text-right font-mono text-forest font-semibold">
              {score.toFixed(2)}
            </td>
            <td className="py-3 text-sm text-moss">{reading}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DimensionsSection({ dimensions }: { dimensions: DimensionScore[] }) {
  const sorted = [...dimensions].sort((a, b) =>
    a.dimension_id.localeCompare(b.dimension_id)
  );

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-forest mb-2">
        Readiness <span className="text-moss text-base font-sans">(the X drivers)</span>
      </h2>
      <p className="text-sm text-moss mb-6">
        How well the subject is built to be found. Scored 0–5 against the
        Legacy rubric view. V3 reports should display readiness drivers and measured outcomes separately.
      </p>

      <div className="space-y-6">
        {sorted.map((d) => (
          <div
            key={d.dimension_id}
            className="border-l-2 border-gold pl-6 break-inside-avoid"
          >
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-serif text-xl text-forest">
                {d.dimension_id} — {d.dimension_name}
              </h3>
              <p className="font-serif text-2xl text-forest font-semibold">
                {d.score == null ? "—" : d.score.toFixed(1)}
                <span className="text-base text-moss"> / 5</span>
              </p>
            </div>
            {d.justification && (
              <p className="text-sm text-charcoal leading-relaxed mb-3">
                {d.justification}
              </p>
            )}
            {d.evidence_pointers && d.evidence_pointers.length > 0 && (
              <ul className="text-xs text-moss space-y-1">
                {d.evidence_pointers.map((ev, i) => (
                  <li key={i} className="font-mono">
                    {ev.found ? (
                      <span className="text-forest">✓</span>
                    ) : (
                      <span className="text-gold-dark">✗</span>
                    )}{" "}
                    <span className="text-charcoal">{ev.type}</span>:{" "}
                    {ev.value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function PerQuerySection({ responses }: { responses: QueryResponse[] }) {
  // Group by template
  const byTemplate = new Map<string, QueryResponse[]>();
  for (const r of responses) {
    const arr = byTemplate.get(r.query_id) ?? [];
    arr.push(r);
    byTemplate.set(r.query_id, arr);
  }

  // Sort by category order then template id
  const categoryOrder = [
    "category-search",
    "name-search",
    "competitive",
    "buyer-scenario",
  ];
  const ordered = [...byTemplate.entries()].sort(([, a], [, b]) => {
    const aCat = a[0]?.query_category ?? "";
    const bCat = b[0]?.query_category ?? "";
    return (
      categoryOrder.indexOf(aCat) - categoryOrder.indexOf(bCat) ||
      a[0].query_id.localeCompare(b[0].query_id)
    );
  });

  let lastCat: string | null = null;
  const elements: React.ReactNode[] = [];
  for (const [queryId, cells] of ordered) {
    const cat = cells[0]?.query_category ?? "uncategorized";
    if (cat !== lastCat) {
      elements.push(
        <h3
          key={`cat-${cat}`}
          className="font-serif text-xl text-forest mt-8 mb-4 first:mt-0"
        >
          {prettyCategory(cat)}
        </h3>
      );
      lastCat = cat;
    }
    elements.push(
      <QueryTemplateCard key={queryId} queryId={queryId} cells={cells} />
    );
  }

  return (
    <section className="mb-12 break-before-page">
      <h2 className="font-serif text-2xl text-forest mb-2">
        Per-query summary
      </h2>
      <p className="text-sm text-moss mb-6">
        Grouped by template. Mention rate shows how often the subject was
        named in the cells that ran.
      </p>
      {elements}
    </section>
  );
}

function QueryTemplateCard({
  queryId,
  cells,
}: {
  queryId: string;
  cells: QueryResponse[];
}) {
  const successCells = cells.filter(
    (c) => c.status === "success" && c.mentioned !== null
  );
  const mentioned = successCells.filter((c) => c.mentioned === true).length;
  const errored = cells.filter((c) => c.status !== "success").length;
  const totalSuccess = successCells.length;

  const sample = cells[0]?.query_text ?? "_(no rendered text)_";

  const evidenceCell = successCells.find(
    (c) => c.mentioned && c.evidence_text && c.evidence_text.trim()
  );

  // Per-engine breakdown
  const byEngine = new Map<
    string,
    { total: number; mentioned: number; errored: number }
  >();
  for (const c of cells) {
    const stat = byEngine.get(c.engine) ?? {
      total: 0,
      mentioned: 0,
      errored: 0,
    };
    stat.total++;
    if (c.status !== "success") stat.errored++;
    if (c.mentioned === true) stat.mentioned++;
    byEngine.set(c.engine, stat);
  }
  const engines = [...byEngine.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const mentionPct =
    totalSuccess === 0
      ? "—"
      : `${Math.round((mentioned / totalSuccess) * 100)}%`;

  return (
    <div className="border border-tan p-6 mb-4 break-inside-avoid bg-white">
      <div className="flex items-baseline justify-between mb-1">
        <code className="text-xs font-mono text-moss">{queryId}</code>
        <p className="text-sm">
          <span className="text-moss">mention rate</span>{" "}
          <span className="font-mono font-semibold text-forest">
            {mentionPct}
          </span>{" "}
          <span className="text-moss text-xs">
            ({mentioned}/{totalSuccess})
          </span>
        </p>
      </div>
      <p className="text-base text-charcoal mb-4 italic font-serif">
        “{sample}”
      </p>
      <table className="w-full text-xs mb-3">
        <thead>
          <tr className="border-b border-tan">
            <th className="text-left text-moss font-normal pb-1">Engine</th>
            <th className="text-right text-moss font-normal pb-1 pr-3">
              Mentioned
            </th>
            <th className="text-right text-moss font-normal pb-1">Errored</th>
          </tr>
        </thead>
        <tbody>
          {engines.map(([engine, stat]) => (
            <tr key={engine}>
              <td className="py-1 text-charcoal">{engine}</td>
              <td className="py-1 pr-3 text-right font-mono">
                {stat.mentioned}/{stat.total}
              </td>
              <td className="py-1 text-right font-mono">
                {stat.errored > 0 ? (
                  <span className="text-gold-dark">{stat.errored}</span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {evidenceCell?.evidence_text && (
        <blockquote className="text-sm text-charcoal italic border-l-2 border-gold pl-3 mt-2">
          “{evidenceCell.evidence_text.trim()}”
        </blockquote>
      )}
      {errored > 0 && (
        <p className="text-xs text-gold-dark mt-3 italic">
          {errored} cell{errored === 1 ? "" : "s"} errored on this template.
        </p>
      )}
    </div>
  );
}

function CrawlerSection({
  crawler,
}: {
  crawler: AuditRow["crawler_output"];
}) {
  if (!crawler) {
    return (
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-forest mb-4">
          Crawler signals
        </h2>
        <p className="text-moss italic">
          No crawler data — subject had no URL.
        </p>
      </section>
    );
  }
  const c = crawler;

  const checks = [
    ["Reachable", c.reachable],
    ["Person schema", c.personSchemaPresent],
    ["Organization schema", c.organizationSchemaPresent],
    ["FAQ schema", c.faqSchemaPresent],
    ["Service schema", c.serviceSchemaPresent],
    ["llms.txt", c.llmsTxtPresent],
    ["robots.txt", c.robotsTxtPresent],
    ["Founder likely named", c.founderLikelyNamed],
    ["Pricing likely visible", c.pricingLikelyVisible],
  ] as const;

  return (
    <section className="mb-12 break-before-page">
      <h2 className="font-serif text-2xl text-forest mb-2">
        Crawler signals
      </h2>
      <p className="text-sm text-moss mb-6">
        Read from the subject&apos;s own site (<code>{(c.url as string) ?? "—"}</code>).
      </p>
      <table className="w-full border-collapse">
        <tbody>
          {checks.map(([label, val]) => (
            <tr key={label} className="border-b border-tan/50">
              <td className="py-2 text-charcoal">{label}</td>
              <td className="py-2 text-right">
                {val ? (
                  <span className="text-forest font-mono">✓ yes</span>
                ) : (
                  <span className="text-moss font-mono">— no</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {Array.isArray(c.schemaTypes) && (c.schemaTypes as string[]).length > 0 && (
        <p className="text-sm text-moss mt-4">
          <strong className="text-charcoal">Schema types:</strong>{" "}
          {(c.schemaTypes as string[]).join(", ")}
        </p>
      )}
    </section>
  );
}

function CorroborationSection({
  corroboration,
}: {
  corroboration: Corroboration | null;
}) {
  if (!corroboration) {
    return (
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-forest mb-4">
          Cross-source corroboration
        </h2>
        <p className="text-moss italic">No corroboration data.</p>
      </section>
    );
  }
  const c = corroboration;

  return (
    <section className="mb-12 break-before-page">
      <h2 className="font-serif text-2xl text-forest mb-2">
        Cross-source corroboration
      </h2>
      <p className="text-sm text-moss mb-6">
        External signals about the subject (Tavily searches).
      </p>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <tr className="border-b border-tan/50">
            <td className="py-2 text-charcoal">LinkedIn profile</td>
            <td className="py-2 text-right text-sm">
              {c.linkedinPresent ? (
                <a
                  href={c.linkedinUrl}
                  className="text-forest underline font-mono text-xs break-all"
                >
                  ✓ {c.linkedinUrl}
                </a>
              ) : (
                <span className="text-moss">— not found</span>
              )}
            </td>
          </tr>
          <tr className="border-b border-tan/50">
            <td className="py-2 text-charcoal">Wikidata entry</td>
            <td className="py-2 text-right text-sm">
              {c.wikidataPresent ? (
                <a
                  href={c.wikidataUrl}
                  className="text-forest underline font-mono text-xs break-all"
                >
                  ✓ {c.wikidataUrl}
                </a>
              ) : (
                <span className="text-moss">— not found</span>
              )}
            </td>
          </tr>
          <tr>
            <td className="py-2 text-charcoal">Total corroborating domains</td>
            <td className="py-2 text-right font-mono font-semibold text-forest">
              {c.totalCorroboratingDomains}
            </td>
          </tr>
        </tbody>
      </table>
      {c.mentions?.length > 0 && (
        <div>
          <h3 className="font-serif text-lg text-forest mb-3">Top mentions</h3>
          <ul className="space-y-3">
            {c.mentions.slice(0, 10).map((m) => (
              <li key={m.url} className="border-l-2 border-tan pl-4">
                <p className="text-sm font-semibold text-charcoal">
                  {m.domain}
                </p>
                <p className="text-sm">
                  <a href={m.url} className="text-forest underline">
                    {m.title}
                  </a>
                </p>
                {m.snippet && (
                  <p className="text-xs text-moss mt-1 italic">
                    “{m.snippet.slice(0, 220)}
                    {m.snippet.length > 220 ? "…" : ""}”
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

function FailuresSection({
  responses,
}: {
  responses: QueryResponse[];
}) {
  const failed = responses.filter((r) => r.status !== "success");
  if (failed.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-forest mb-4">Failures</h2>
        <p className="text-sm text-charcoal">
          None — every cell returned successfully.
        </p>
      </section>
    );
  }

  const byEngine = new Map<string, number>();
  for (const f of failed) {
    byEngine.set(f.engine, (byEngine.get(f.engine) ?? 0) + 1);
  }
  const sorted = [...byEngine.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <section className="mb-12 break-before-page">
      <h2 className="font-serif text-2xl text-forest mb-2">Failures</h2>
      <p className="text-sm text-moss mb-4">
        {failed.length} of {responses.length} cells errored (
        {((failed.length / responses.length) * 100).toFixed(1)}%).
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-tan">
            <th className="text-left text-xs uppercase tracking-widest text-moss font-medium pb-2">
              Engine
            </th>
            <th className="text-right text-xs uppercase tracking-widest text-moss font-medium pb-2">
              Errored
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([engine, count]) => (
            <tr key={engine} className="border-b border-tan/50">
              <td className="py-2 text-charcoal">{engine}</td>
              <td className="py-2 text-right font-mono">{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ReportFooter({ audit }: { audit: AuditRow }) {
  return (
    <>
      {/* The audit metadata line stays close to the report body */}
      <p className="mt-12 mb-8 text-xs text-moss text-center">
        Audit <code className="font-mono">{audit.id}</code> ·{" "}
        {formatDate(audit.created_at)}
      </p>

      {/* Brand-styled footer mirrors the boxed sections of the website footer
          (logo + tagline + martykoepke.com link, plus GET IN TOUCH + email). */}
      <footer className="bg-forest text-cream px-10 py-10 -mx-8 print:break-inside-avoid">
        <div className="max-w-2xl">
          <span className="inline-block rounded-md bg-cream p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-horizontal.png"
              alt="Practical Informatics LLC"
              className="h-16 w-auto"
            />
          </span>
          <p className="mt-4 text-cream/80 text-base">
            Reclaim your time. Run a smarter business.
          </p>
          <p className="mt-2 text-sm text-cream/60">
            For Marty&apos;s healthcare informatics work, speaking, and
            writing, visit{" "}
            <a
              href="https://martykoepke.com"
              className="underline decoration-gold underline-offset-4"
            >
              martykoepke.com
            </a>
            .
          </p>

          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gold">
              Get in touch
            </h2>
            <p className="mt-2 text-cream/90">
              <a
                href="mailto:marty.koepke@practicalinformatics.com"
                className="hover:text-gold"
              >
                marty.koepke@practicalinformatics.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

// ============================================================================
// Recommendations section
// ============================================================================

const EFFORT_LABEL: Record<string, string> = {
  "15min": "15 min",
  "1hr": "~1 hour",
  "half day": "half day",
  "1day": "1 day",
  "1week": "1 week",
  "2+weeks": "2+ weeks",
};

function RecommendationsSection({
  recommendations,
}: {
  recommendations: Recommendation[] | null;
}) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-forest mb-4">
          What to do next
        </h2>
        <p className="text-moss italic">
          No recommendations yet — run{" "}
          <code className="font-mono text-charcoal">
            npm run audit:recommend -- &lt;audit_id&gt;
          </code>
          .
        </p>
      </section>
    );
  }

  // Group by category, preserving priority order within each
  const sorted = [...recommendations].sort((a, b) => a.priority - b.priority);
  const byCategory = new Map<string, Recommendation[]>();
  for (const r of sorted) {
    const arr = byCategory.get(r.category) ?? [];
    arr.push(r);
    byCategory.set(r.category, arr);
  }

  return (
    <section className="mb-12">
      <h2 className="font-serif text-2xl text-forest mb-2">What to do next</h2>
      <p className="text-sm text-moss mb-6">
        Your prioritized action list. Numbers in the title show overall
        priority — item 1 has the highest impact-per-hour. Pick one, follow
        the checklist, then check the &ldquo;you&rsquo;ll know it worked
        when&rdquo; line in a couple of weeks to confirm.
      </p>

      <div className="space-y-8">
        {[...byCategory.entries()].map(([category, items]) => (
          <div key={category} className="break-inside-avoid">
            <h3 className="font-serif text-lg text-forest mb-4 pb-2 border-b border-tan/70">
              {category}
            </h3>
            <div className="space-y-5">
              {items.map((rec) => (
                <RecommendationCard key={rec.title} rec={rec} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="bg-white border border-tan p-5 break-inside-avoid">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h4 className="font-serif text-base text-charcoal leading-snug">
          <span className="text-gold-dark font-mono text-sm mr-2">
            {rec.priority}.
          </span>
          {rec.title}
        </h4>
        <span className="text-xs text-moss font-mono whitespace-nowrap pt-1">
          {EFFORT_LABEL[rec.effort] ?? rec.effort}
        </span>
      </div>

      <p className="text-sm text-charcoal mb-4 leading-relaxed">
        <strong className="text-forest">Why this matters: </strong>
        {rec.why_it_matters}
      </p>

      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-moss mb-2">
          Do this
        </p>
        <ul className="space-y-1.5">
          {rec.do_this.map((step, i) => (
            <li
              key={i}
              className="text-sm text-charcoal flex items-start gap-2"
            >
              <span
                className="inline-block w-3.5 h-3.5 border border-charcoal/60 rounded-sm mt-1 flex-shrink-0"
                aria-hidden
              />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-charcoal leading-relaxed border-l-2 border-gold pl-3 italic">
        <strong className="not-italic text-forest">
          You&apos;ll know it worked when:{" "}
        </strong>
        {rec.youll_know_it_worked}
      </p>

      <p className="text-xs text-moss mt-3 font-mono">
        Lifts {rec.dimensions_lifted.join(", ")} by{" "}
        <strong className="text-charcoal">{rec.estimated_delta}</strong>
      </p>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(3);
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      timeZone: process.env.CRON_TIMEZONE ?? "America/Los_Angeles",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function prettyCategory(cat: string): string {
  switch (cat) {
    case "category-search":
      return "Category-search queries — do you get named?";
    case "name-search":
      return "Name-search queries — when AI names you, what does it say?";
    case "competitive":
      return "Competitive queries — how do you stack up?";
    case "buyer-scenario":
      return "Buyer-scenario queries — realistic decision context";
    default:
      return cat;
  }
}
