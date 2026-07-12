import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";

export const dynamic = "force-dynamic";

interface EngineRow {
  id: string;
  template_id: string;
  query: string;
  engine: string;
  raw_response: string | null;
  error: string | null;
  captured_at: string;
}

interface ExtractedRow {
  engine_response_id: string;
  mentioned: boolean;
  position: "top" | "middle" | "late" | "not_named";
  sentiment: "positive" | "neutral" | "negative" | "missing";
  competitors_mentioned: string[] | null;
}

interface ClaimRow {
  id: string;
  claim_type: string;
  claim_text: string;
  source_response_excerpt: string | null;
  audit_claim_verifications: Array<{
    label: string;
    source_url: string | null;
    rationale: string | null;
  }>;
}

async function loadEvidence(auditId: string) {
  const supabase = supabaseAdmin();
  const [auditRes, snapshotRes, enginesRes, extractedRes, claimsRes, sourcesRes] =
    await Promise.all([
      supabase
        .from("audits_v2")
        .select("id, mode, rubric_version, started_at, engines_used")
        .eq("id", auditId)
        .maybeSingle(),
      supabase
        .from("audit_subjects_snapshot")
        .select("canonical_name")
        .eq("audit_id", auditId)
        .maybeSingle(),
      supabase
        .from("audit_engine_responses")
        .select("id, template_id, query, engine, raw_response, error, captured_at")
        .eq("audit_id", auditId)
        .order("template_id")
        .order("engine"),
      supabase
        .from("audit_extracted")
        .select("engine_response_id, mentioned, position, sentiment, competitors_mentioned")
        .eq("audit_id", auditId),
      supabase
        .from("audit_claims")
        .select(
          "id, claim_type, claim_text, source_response_excerpt, audit_claim_verifications(label, source_url, rationale)"
        )
        .eq("audit_id", auditId),
      supabase
        .from("audit_source_evidence")
        .select("id")
        .eq("audit_id", auditId),
    ]);

  return {
    audit: auditRes.data,
    snapshot: snapshotRes.data,
    engineResponses: (enginesRes.data ?? []) as EngineRow[],
    extracted: (extractedRes.data ?? []) as ExtractedRow[],
    claims: (claimsRes.data ?? []) as ClaimRow[],
    sourceCount: sourcesRes.data?.length ?? 0,
  };
}

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { audit, snapshot, engineResponses, extracted, claims, sourceCount } =
    await loadEvidence(id);

  if (!audit) notFound();

  const extractedByResponseId = new Map<string, ExtractedRow>(
    extracted.map((row) => [row.engine_response_id, row])
  );

  // Group responses by query (template_id).
  const byQuery = new Map<string, EngineRow[]>();
  for (const row of engineResponses) {
    const list = byQuery.get(row.template_id) ?? [];
    list.push(row);
    byQuery.set(row.template_id, list);
  }
  const queries = [...byQuery.entries()].map(([template_id, rows]) => ({
    template_id,
    query: rows[0]?.query ?? "(unknown query)",
    rows,
  }));

  const totalQueries = queries.length;
  const totalResponses = engineResponses.length;
  const verifiedClaims = claims.reduce(
    (sum, c) => sum + c.audit_claim_verifications.length,
    0
  );

  const featured = pickFeaturedQuery(queries, extractedByResponseId);
  const rest = queries.filter((q) => q.template_id !== featured?.template_id);

  return (
    <div className="space-y-8">
      <header className="border-b border-tan/30 pb-4">
        <div className="text-[11px] uppercase tracking-widest text-tan">
          Evidence ledger
        </div>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-cream">
          All {totalQueries} queries and {totalResponses} responses
        </h1>
        <p className="mt-2 text-sm text-tan">
          {snapshot?.canonical_name ?? "Audit"}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Queries asked" value={String(totalQueries)} hint={`across ${audit.engines_used?.length ?? 0} engines`} />
        <StatTile label="Engine responses" value={String(totalResponses)} hint={(audit.engines_used ?? []).join(" · ")} />
        <StatTile label="Claims extracted" value={String(claims.length)} hint="about your business specifically" />
        <StatTile label="Sources cited" value={String(sourceCount)} hint="verified against real URLs" />
      </div>

      {featured && (
        <section className="rounded-lg bg-forest-dark p-6 text-cream">
          <div className="mb-1 text-[11px] uppercase tracking-widest text-gold">
            Featured query · 1 of {totalQueries}
          </div>
          <div className="text-lg font-semibold text-cream">
            "{featured.query}"
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {featured.rows.map((row) => {
              const extraction = extractedByResponseId.get(row.id);
              const status = engineStatusFor(extraction);
              return (
                <div
                  key={row.id}
                  className="rounded border border-tan/40 bg-forest-dark p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-cream">
                      {row.engine}
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <div className="mt-2 text-sm font-semibold leading-relaxed text-cream">
                    "{excerpt(row.raw_response ?? "")}"
                  </div>
                  {extraction && (
                    <EvidenceFooter extraction={extraction} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold text-cream">
          More queries — {rest.length} {rest.length === 1 ? "more" : "additional"} below
        </h2>
        <p className="mt-1 text-sm text-tan">
          Each row shows the question and how each engine handled it.
        </p>
        <div className="mt-4 space-y-2">
          {rest.map((q, i) => (
            <CompactQueryRow
              key={q.template_id}
              index={i + 2}
              query={q.query}
              rows={q.rows}
              extractedByResponseId={extractedByResponseId}
            />
          ))}
        </div>
      </section>

      <footer className="border-t border-tan/30 pt-4 text-[11px] text-tan">
        Showing all queries from this audit · run on {new Date(audit.started_at).toLocaleDateString()}
      </footer>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded bg-forest-dark p-4 text-cream">
      <div className="text-[11px] uppercase tracking-wider text-gold">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-cream">{value}</div>
      <div className="text-[11px] text-tan">{hint}</div>
    </div>
  );
}

type EngineStatus = "named" | "missed" | "errors" | "no_response";

function engineStatusFor(extraction: ExtractedRow | undefined): EngineStatus {
  if (!extraction) return "no_response";
  if (!extraction.mentioned) return "missed";
  if (extraction.sentiment === "negative") return "errors";
  return "named";
}

function StatusBadge({ status }: { status: EngineStatus }) {
  const label =
    status === "named"
      ? "named"
      : status === "missed"
      ? "missed"
      : status === "errors"
      ? "errors"
      : "no response";
  const classes =
    status === "named"
      ? "bg-forest text-cream"
      : status === "errors"
      ? "bg-gold-dark text-cream"
      : "border border-gold-darker text-gold bg-forest-dark";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${classes}`}
    >
      {label}
    </span>
  );
}

function EvidenceFooter({ extraction }: { extraction: ExtractedRow }) {
  const competitors = extraction.competitors_mentioned ?? [];
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-tan/40 pt-2 text-[11px] text-tan">
      <div>
        <span className="text-gold">named:</span>{" "}
        {extraction.mentioned ? "yes" : "no"}
      </div>
      <div>
        <span className="text-gold">position:</span> {extraction.position}
      </div>
      <div>
        <span className="text-gold">sentiment:</span>{" "}
        {extraction.sentiment}
      </div>
      <div>
        <span className="text-gold">competitors:</span>{" "}
        {competitors.length > 0 ? competitors.slice(0, 2).join(", ") : "none"}
      </div>
    </div>
  );
}

function CompactQueryRow({
  index,
  query,
  rows,
  extractedByResponseId,
}: {
  index: number;
  query: string;
  rows: EngineRow[];
  extractedByResponseId: Map<string, ExtractedRow>;
}) {
  return (
    <div className="rounded border border-tan/30 bg-forest-dark p-4 text-cream">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex-1">
          <div className="text-[11px] text-tan">
            Query {index} of {index + rows.length - 1}
          </div>
          <div className="text-sm font-semibold text-cream">"{query}"</div>
        </div>
        <div className="flex items-center gap-1">
          {rows.map((row) => {
            const extraction = extractedByResponseId.get(row.id);
            const status = engineStatusFor(extraction);
            return (
              <div
                key={row.id}
                className="flex items-center gap-1.5"
                title={`${row.engine}: ${status.replace("_", " ")}`}
              >
                <span className="text-[10px] text-tan">{row.engine}</span>
                <StatusBadge status={status} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function pickFeaturedQuery(
  queries: Array<{ template_id: string; query: string; rows: EngineRow[] }>,
  extractedByResponseId: Map<string, ExtractedRow>
) {
  // Pick the query with the most interesting story — one where engines
  // disagree most about whether the subject was named.
  let best = queries[0] ?? null;
  let bestVariance = -1;
  for (const q of queries) {
    const namedCount = q.rows.filter((r) => {
      const e = extractedByResponseId.get(r.id);
      return e?.mentioned;
    }).length;
    const total = q.rows.length;
    if (total === 0) continue;
    // Variance peaks when half are named, half aren't.
    const ratio = namedCount / total;
    const variance = ratio * (1 - ratio);
    if (variance > bestVariance) {
      best = q;
      bestVariance = variance;
    }
  }
  return best;
}

function excerpt(raw: string, maxLen = 320): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxLen) return cleaned;
  const sentenceEnd = cleaned.slice(0, maxLen).lastIndexOf(". ");
  if (sentenceEnd > maxLen * 0.5) return cleaned.slice(0, sentenceEnd + 1);
  return cleaned.slice(0, maxLen).trimEnd() + "…";
}
