import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AVI_V3_RUBRIC_VERSION,
  aggregateCompetitorVisibility,
  accuracyRecommendV3,
  getImprovements,
  recommendV3,
  selectV3Quotes,
  supabaseAdmin,
  synthesizeV3,
} from "@practical-informatics/avi";
import type {
  EngineResponse,
  ExtractorOutput,
  Subject,
  V3DimensionId,
} from "@practical-informatics/avi";
import { relativeTime } from "@/lib/data/stats";

export const dynamic = "force-dynamic";

const DRIVER_DISPLAY: Record<string, string> = {
  business_clarity: "Business clarity",
  source_support: "Source support",
  ai_readability: "AI readability",
  distinctive_point_of_view: "Distinctive point of view",
  recommendation_fit: "Recommendation fit",
};

const DRIVER_WEIGHTS: Record<string, number> = {
  business_clarity: 0.25,
  source_support: 0.25,
  ai_readability: 0.2,
  distinctive_point_of_view: 0.15,
  recommendation_fit: 0.15,
};

const QUADRANT_DISPLAY: Record<string, { name: string; description: string }> = {
  invisible: {
    name: "Invisible",
    description: "AI doesn't surface the business, and the foundation isn't there yet.",
  },
  fragile: {
    name: "Found, but fragile",
    description: "AI is naming the business more than the site has earned.",
  },
  undiscovered: {
    name: "Built but undiscovered",
    description: "The structural work is there; AI hasn't caught up yet.",
  },
  compounding: {
    name: "Compounding",
    description: "Foundation is solid and AI is naming the business.",
  },
};

interface AuditRow {
  id: string;
  subject_id: string;
  mode: string;
  rubric_version: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  composite_score: string | number | null;
  readiness_score: string | number | null;
  visibility_score: string | number | null;
  tier: string | null;
  query_count: number;
  engine_count: number;
  engines_used: string[];
  errors: Array<{ step: string; message: string; fatal: boolean }> | null;
  synthesis: unknown;
}

async function getAudit(id: string): Promise<AuditRow | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audits_v2")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as AuditRow | null;
}

async function getSnapshot(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_subjects_snapshot")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();
  return data;
}

async function getOutcomeScores(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_outcome_scores")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();
  return data;
}

async function getDriverScores(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_driver_scores")
    .select("*")
    .eq("audit_id", auditId);
  return data ?? [];
}

async function getCompetitorReadiness(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_competitor_readiness")
    .select("competitor_canonical_name, competitor_url, readiness_score, driver_scores, crawled_at, errors")
    .eq("audit_id", auditId);
  return data ?? [];
}

async function getEngineResponses(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_engine_responses")
    .select(
      "id, template_id, query, engine, raw_response, error, captured_at"
    )
    .eq("audit_id", auditId);
  return data ?? [];
}

async function getExtracted(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_extracted")
    .select("*")
    .eq("audit_id", auditId);
  return data ?? [];
}

async function getClaims(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_claims")
    .select(
      "id, claim_text, claim_type, subject_name, source_response_excerpt, confidence, audit_claim_verifications(label, source_url, source_type, evidence_quote, rationale, verifier, verified_at)"
    )
    .eq("audit_id", auditId);
  return data ?? [];
}

function num(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function buildSubject(snapshot: any): Subject {
  return {
    canonical_name: snapshot?.canonical_name ?? "Unknown subject",
    aliases: Array.isArray(snapshot?.aliases) ? snapshot.aliases : [],
    industry: snapshot?.industry ?? "",
    subject_type: snapshot?.subject_type ?? "company",
    url: snapshot?.url ?? "",
    location: snapshot?.location ?? undefined,
    buyer_type: snapshot?.buyer_type ?? undefined,
    problem: snapshot?.problem ?? undefined,
    competitors: Array.isArray(snapshot?.competitors) ? snapshot.competitors : [],
    known_differentiation_terms: Array.isArray(snapshot?.known_differentiation_terms)
      ? snapshot.known_differentiation_terms
      : [],
  };
}

function buildExtractorOutput(
  row: any,
  responseLookup: Map<string, { template_id: string; query: string; engine: string }>
): ExtractorOutput | null {
  const meta = responseLookup.get(row.engine_response_id);
  if (!meta) return null;
  return {
    template_id: meta.template_id,
    engine: meta.engine as ExtractorOutput["engine"],
    query: meta.query,
    mentioned: !!row.mentioned,
    cited_with_link: !!row.cited_with_link,
    cited_urls: Array.isArray(row.cited_urls) ? row.cited_urls : [],
    cited_urls_verified: Array.isArray(row.cited_urls_verified)
      ? row.cited_urls_verified
      : [],
    position: row.position ?? "not_named",
    competitors_mentioned: Array.isArray(row.competitors_mentioned)
      ? row.competitors_mentioned
      : [],
    sentiment: row.sentiment ?? "missing",
    evidence_pointers: Array.isArray(row.evidence_pointers) ? row.evidence_pointers : [],
    scent: row.scent_subject_in_opening !== null && row.scent_subject_in_opening !== undefined
      ? {
          subject_in_opening: !!row.scent_subject_in_opening,
          description_present: !!row.scent_description_present,
          description_word_count: row.scent_description_word_count ?? 0,
          category_named: !!row.scent_category_named,
          differentiation_named: !!row.scent_differentiation_named,
        }
      : null,
  };
}

function buildEngineResponse(row: any): EngineResponse {
  return {
    template_id: row.template_id,
    engine: row.engine,
    query: row.query,
    raw_response: row.raw_response ?? "",
    error: row.error ?? undefined,
    captured_at: row.captured_at,
  };
}

export default async function AuditDetailV31({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) notFound();

  const [snapshot, outcomeScores, driverRows, engineRows, extractedRows, claimRows, competitorReadinessRows] =
    await Promise.all([
      getSnapshot(id),
      getOutcomeScores(id),
      getDriverScores(id),
      getEngineResponses(id),
      getExtracted(id),
      getClaims(id),
      getCompetitorReadiness(id),
    ]);

  const subject = buildSubject(snapshot);
  const engineResponses = engineRows.map(buildEngineResponse);

  const responseLookup = new Map<
    string,
    { template_id: string; query: string; engine: string }
  >();
  for (const row of engineRows) {
    responseLookup.set(row.id, {
      template_id: row.template_id,
      query: row.query,
      engine: row.engine,
    });
  }
  const extracted: ExtractorOutput[] = extractedRows
    .map((row: any) => buildExtractorOutput(row, responseLookup))
    .filter((x): x is ExtractorOutput => x !== null);

  const readinessScores = driverRows.map((row: any) => ({
    driver_id: row.dimension_id,
    driver_name: DRIVER_DISPLAY[row.dimension_id] ?? row.dimension_id,
    band: (row.band_insufficient ? "insufficient_evidence" : row.band_value) as any,
    score: row.band_insufficient ? null : row.band_value,
    justification: row.justification ?? "",
    evidence_pointers: Array.isArray(row.evidence_pointers) ? row.evidence_pointers : [],
    rubric_version: row.rubric_version,
  }));

  const claims = claimRows.map((row: any) => ({
    id: row.id,
    claim_text: row.claim_text,
    claim_type: row.claim_type,
    subject_name: row.subject_name,
    source_response_excerpt: row.source_response_excerpt ?? undefined,
    confidence: row.confidence ?? undefined,
  }));

  const claimVerifications = claimRows.flatMap((row: any) =>
    (row.audit_claim_verifications ?? []).map((v: any) => ({
      claim_id: row.id,
      label: v.label,
      source_url: v.source_url ?? undefined,
      source_type: v.source_type ?? undefined,
      evidence_quote: v.evidence_quote ?? undefined,
      rationale: v.rationale ?? "",
      verifier: v.verifier,
      verified_at: v.verified_at,
    }))
  );

  const publicScores = {
    ai_readiness_score: num(outcomeScores?.ai_readiness_score ?? audit.readiness_score),
    ai_visibility_score: num(outcomeScores?.ai_visibility_score ?? audit.visibility_score),
    ai_business_accuracy_score: num(outcomeScores?.ai_business_accuracy_score),
    ai_business_accuracy_index: num(
      outcomeScores?.ai_business_accuracy_index ?? audit.composite_score
    ),
    tier: (outcomeScores?.tier ?? audit.tier ?? "Emerging") as any,
  };

  const recommendations = recommendV3({
    readinessScores,
    outcomes: outcomeScores
      ? {
          visibility: num(outcomeScores.visibility),
          representation_accuracy: num(outcomeScores.representation_accuracy),
          claim_support: num(outcomeScores.claim_support),
          context_preservation: num(outcomeScores.context_preservation),
          recommendation_quality: num(outcomeScores.recommendation_quality),
          stability: num(outcomeScores.stability),
        }
      : undefined,
    publicScores,
  });

  const accuracyRecommendations = accuracyRecommendV3({
    claims,
    claimVerifications,
  });

  const verdict = synthesizeV3({
    subject,
    publicScores,
    readinessScores,
    outcomes: undefined,
    recommendations,
    accuracyRecommendations,
  });

  const quotes = selectV3Quotes({ engineResponses, extracted });

  const competitorVisibility = aggregateCompetitorVisibility({
    extracted,
    namedCompetitors: subject.competitors?.flatMap((c) => [c.canonical_name, ...c.aliases]) ?? [],
  });

  // Build per-competitor plot data: readiness from audit_competitor_readiness rows,
  // visibility from competitorVisibility coverage (mention rate × 100). Fuzzy-match
  // names between the two sources so case/whitespace divergence doesn't drop a dot.
  const totalResponses = competitorVisibility.total_responses;
  const competitorReadinessByKey = new Map<string, number>();
  for (const row of competitorReadinessRows as Array<{
    competitor_canonical_name: string;
    readiness_score: number | string | null;
  }>) {
    const key = row.competitor_canonical_name.trim().toLowerCase();
    const score = num(row.readiness_score);
    competitorReadinessByKey.set(key, score);
  }
  const competitorPlotPoints = (subject.competitors ?? [])
    .map((c) => {
      const readinessKey = c.canonical_name.trim().toLowerCase();
      const readiness = competitorReadinessByKey.get(readinessKey);
      const visEntry = competitorVisibility.competitors.find(
        (v) => v.display_name.trim().toLowerCase() === readinessKey
      );
      const visibility =
        visEntry && totalResponses > 0
          ? (visEntry.mention_count / totalResponses) * 100
          : 0;
      return {
        canonical_name: c.canonical_name,
        url: c.url,
        readiness: typeof readiness === "number" ? readiness : null,
        visibility,
      };
    })
    .filter((c): c is { canonical_name: string; url: string | undefined; readiness: number; visibility: number } => c.readiness !== null);

  const competitorNamesForHeader = subject.competitors?.map((c) => c.canonical_name) ?? [];

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/audits/${id}`}
          className="text-xs text-paper/70 hover:text-paper underline-offset-2 hover:underline"
        >
          ← Back to the operator view
        </Link>
      </div>

      <ReportHeader
        title={subject.canonical_name}
        runStartedAt={audit.started_at}
        rubricVersion={audit.rubric_version}
        competitorNames={competitorNamesForHeader}
      />

      <VerdictBand
        quadrantKey={verdict.quadrant}
        verdictSentence={verdict.verdict_sentence}
        fixThisFirst={verdict.fix_this_first}
      />

      <ScoreTiles
        readiness={publicScores.ai_readiness_score}
        visibility={publicScores.ai_visibility_score}
        accuracy={publicScores.ai_business_accuracy_score}
        composite={publicScores.ai_business_accuracy_index}
        tier={publicScores.tier}
      />

      <QuadrantPanel
        subjectName={subject.canonical_name}
        readiness={publicScores.ai_readiness_score}
        visibility={publicScores.ai_visibility_score}
        competitors={competitorVisibility.competitors.slice(0, 5)}
        competitorPlotPoints={competitorPlotPoints}
        totalResponses={competitorVisibility.total_responses}
        subjectNamedCount={competitorVisibility.subject_named_count}
      />

      <AccuracyPanel quotes={quotes} />

      <FixLists
        readinessFixes={recommendations.fixes}
        accuracyFixes={accuracyRecommendations.fixes}
      />

      <DetailTables
        readinessScores={readinessScores}
        outcomeScores={outcomeScores}
      />

      <DebugFooter
        auditId={id}
        rubricVersion={audit.rubric_version}
        currentRubricVersion={AVI_V3_RUBRIC_VERSION}
        synthesizerModel={verdict.synthesizer_model}
        engineResponseCount={engineResponses.length}
        extractedCount={extracted.length}
        claimCount={claims.length}
        verificationCount={claimVerifications.length}
      />
    </>
  );
}

function ReportHeader({
  title,
  runStartedAt,
  rubricVersion,
  competitorNames,
}: {
  title: string;
  runStartedAt: string;
  rubricVersion: string;
  competitorNames: string[];
}) {
  return (
    <div className="mb-7 flex items-baseline justify-between border-b border-tan/40 pb-3">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-paper/70">
          AI business accuracy report
        </div>
        <h1 className="mt-1 text-3xl sm:text-4xl font-semibold text-cream">{title}</h1>
      </div>
      <div className="text-right text-xs text-paper/70">
        Run {relativeTime(runStartedAt)} · rubric {rubricVersion}
        {competitorNames.length > 0 && (
          <div className="mt-1">
            Compared with {competitorNames.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

function VerdictBand({
  quadrantKey,
  verdictSentence,
  fixThisFirst,
}: {
  quadrantKey: string;
  verdictSentence: string;
  fixThisFirst: string;
}) {
  const quadrant = QUADRANT_DISPLAY[quadrantKey] ?? QUADRANT_DISPLAY.invisible;
  return (
    <div className="mb-7 rounded-lg bg-forest-dark/90 px-7 py-6 text-paper backdrop-blur-sm">
      <div className="mb-2 text-[11px] uppercase tracking-widest text-gold">
        Where you stand · {quadrant.name}
      </div>
      <p className="text-lg leading-snug">{verdictSentence}</p>
      <div className="mt-4 border-t border-gold/30 pt-4">
        <div className="mb-1 text-[11px] uppercase tracking-widest text-gold">
          Fix this first
        </div>
        <p className="text-sm">{fixThisFirst}</p>
      </div>
    </div>
  );
}

function ScoreTiles({
  readiness,
  visibility,
  accuracy,
  composite,
  tier,
}: {
  readiness: number;
  visibility: number;
  accuracy: number;
  composite: number;
  tier: string;
}) {
  const accuracyWeak = accuracy < 40;
  return (
    <div className="mb-7 grid grid-cols-4 gap-3">
      <Tile label="Readiness" value={readiness} hint="how AI-ready your story is" />
      <Tile label="Visibility" value={visibility} hint="how often AI surfaces you" />
      <Tile
        label="Accuracy"
        value={accuracy}
        hint="quality check on what's visible"
        tone={accuracyWeak ? "warning" : "neutral"}
      />
      <Tile
        label="Overall"
        value={composite}
        hint={`tier: ${tier.toLowerCase()}`}
        tone="emphasis"
      />
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "neutral" | "warning" | "emphasis";
}) {
  const card =
    tone === "emphasis"
      ? "bg-forest-dark text-paper"
      : "bg-forest-dark text-cream";
  const valueColor =
    tone === "warning"
      ? "text-gold-dark"
      : tone === "emphasis"
      ? "text-paper"
      : "text-cream";
  const hintColor = tone === "emphasis" ? "text-gold" : "text-gold-dark";
  return (
    <div className={`rounded-md p-4 ${card}`}>
      <div className={`text-[11px] uppercase tracking-wider ${tone === "emphasis" ? "text-gold" : "text-tan"}`}>
        {label}
      </div>
      <div className={`mt-1 text-3xl font-semibold ${valueColor}`}>
        {Math.round(value)}
      </div>
      <div className={`text-[11px] ${hintColor}`}>{hint}</div>
    </div>
  );
}

function QuadrantPanel({
  subjectName,
  readiness,
  visibility,
  competitors,
  competitorPlotPoints,
  totalResponses,
  subjectNamedCount,
}: {
  subjectName: string;
  readiness: number;
  visibility: number;
  competitors: Array<{
    display_name: string;
    mention_count: number;
    first_named_count: number;
    coverage: number;
  }>;
  competitorPlotPoints: Array<{
    canonical_name: string;
    url: string | undefined;
    readiness: number;
    visibility: number;
  }>;
  totalResponses: number;
  subjectNamedCount: number;
}) {
  // Quadrant SVG canvas: 616 x 360
  // Plot area: x [70, 586], y [40, 310]
  // Midpoint: x=328, y=175
  const xFor = (r: number) => 70 + Math.max(0, Math.min(100, r)) / 100 * 516;
  const yFor = (v: number) => 310 - Math.max(0, Math.min(100, v)) / 100 * 270;
  const x = xFor(readiness);
  const y = yFor(visibility);

  return (
    <div className="mb-7 rounded-lg bg-forest-dark p-6">
      <div className="mb-1 text-lg font-semibold text-cream">
        How AI sees you next to your competitors
      </div>
      <div className="mb-5 text-xs text-tan">
        Readiness is the foundation work on the site. Visibility is what AI is
        actually doing with it. The quadrant tells you which one to work on first.
      </div>

      <svg
        viewBox="-40 0 656 380"
        className="block w-full rounded bg-cream-dim"
        role="img"
        aria-label={`Four-quadrant chart. ${subjectName} plotted at readiness ${Math.round(readiness)}, visibility ${Math.round(visibility)}.`}
      >
        <text x={199} y={98} fontSize="12" fill="#5A6B5A" textAnchor="middle" fontStyle="italic" opacity="0.55">
          found, but fragile
        </text>
        <text x={457} y={98} fontSize="12" fill="#5A6B5A" textAnchor="middle" fontStyle="italic" opacity="0.55">
          compounding
        </text>
        <text x={199} y={248} fontSize="12" fill="#5A6B5A" textAnchor="middle" fontStyle="italic" opacity="0.55">
          invisible
        </text>
        <text x={457} y={248} fontSize="12" fill="#5A6B5A" textAnchor="middle" fontStyle="italic" opacity="0.55">
          built but undiscovered
        </text>

        <line x1={328} y1={40} x2={328} y2={310} stroke="#D8CCB4" strokeWidth="1" strokeDasharray="3,3" />
        <line x1={70} y1={175} x2={586} y2={175} stroke="#D8CCB4" strokeWidth="1" strokeDasharray="3,3" />

        <line x1={70} y1={40} x2={70} y2={310} stroke="#1F3A2E" strokeWidth="1" />
        <line x1={70} y1={310} x2={586} y2={310} stroke="#1F3A2E" strokeWidth="1" />

        <text x={70} y={332} fontSize="11" fill="#5A6B5A">underbuilt</text>
        <text x={586} y={332} fontSize="11" fill="#5A6B5A" textAnchor="end">strong foundation</text>
        <text x={328} y={352} fontSize="11" fill="#2C2A26" textAnchor="middle" fontStyle="italic">readiness — the work on your site</text>

        <text x={62} y={314} fontSize="11" fill="#5A6B5A" textAnchor="end">unseen</text>
        <text x={62} y={48} fontSize="11" fill="#5A6B5A" textAnchor="end">surfaced often</text>
        <text x={-8} y={175} fontSize="11" fill="#2C2A26" textAnchor="middle" fontStyle="italic" transform="rotate(-90 -8 175)">visibility — what AI is doing with it</text>

        {competitorPlotPoints.map((c) => {
          const cx = xFor(c.readiness);
          const cy = yFor(c.visibility);
          return (
            <g key={c.canonical_name}>
              <circle cx={cx} cy={cy} r={9} fill="#1F3A2E" opacity="0.85" />
              <text x={cx} y={cy - 14} fontSize="11" fill="#1F3A2E" textAnchor="middle" fontWeight="500">
                {c.canonical_name}
              </text>
              <text x={cx} y={cy + 21} fontSize="10" fill="#5A6B5A" textAnchor="middle">
                R {Math.round(c.readiness)} · V {Math.round(c.visibility)}
              </text>
            </g>
          );
        })}

        <circle cx={x} cy={y} r={13} fill="#C9A961" stroke="#1F3A2E" strokeWidth="2" />
        <text x={x} y={y - 18} fontSize="13" fill="#1F3A2E" textAnchor="middle" fontWeight="500">
          You — {subjectName}
        </text>
        <text x={x} y={y + 26} fontSize="11" fill="#5A6B5A" textAnchor="middle">
          readiness {Math.round(readiness)} · visibility {Math.round(visibility)}
        </text>
      </svg>

      <div className="mt-4 border-t border-tan/40 pt-3 text-xs">
        <div className="mb-2 text-tan italic">
          {competitorPlotPoints.length > 0
            ? `${competitorPlotPoints.length} competitor${competitorPlotPoints.length === 1 ? "" : "s"} plotted from a lightweight readiness pass on their public site.`
            : "Add a URL alongside each competitor at intake to plot them on the chart. Below: how often AI named the competitors across all responses."}
        </div>
        {competitors.length === 0 ? (
          <div className="text-tan">
            AI didn't name any competitors in {totalResponses} response
            {totalResponses === 1 ? "" : "s"}.
          </div>
        ) : (
          <ul className="space-y-1">
            <li className="flex items-baseline justify-between text-cream">
              <span className="font-medium">{subjectName} (you)</span>
              <span className="text-tan">
                named in {subjectNamedCount} of {totalResponses}
              </span>
            </li>
            {competitors.map((c) => (
              <li
                key={c.display_name}
                className="flex items-baseline justify-between text-cream"
              >
                <span>{c.display_name}</span>
                <span className="text-tan">
                  named in {c.mention_count} of {totalResponses}
                  {c.first_named_count > 0 && ` · first-named in ${c.first_named_count}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AccuracyPanel({
  quotes,
}: {
  quotes: Array<{
    category: string;
    engine: string;
    query: string;
    response_excerpt: string;
    annotation: string;
  }>;
}) {
  const categoryLabel: Record<string, string> = {
    missed: "missed entirely",
    named_with_issues: "named, with issues",
    named_cleanly: "named cleanly",
  };
  return (
    <div className="mb-7 rounded-lg bg-forest-dark p-6">
      <div className="mb-1 text-lg font-semibold text-cream">
        What AI gets wrong about you
      </div>
      <div className="mb-2 text-xs text-tan">
        We only verify claims about your business — that's why this section is
        about you, not your competitors. Representative responses pulled from
        the engine grid we ran.
      </div>
      <div className="mb-5 text-[11px] italic text-gold-dark">
        Verifying competitors would require auditing each of them too. We don't
        make claims we can't ground in evidence.
      </div>

      {quotes.length === 0 ? (
        <div className="rounded border border-tan/40 bg-forest-dark p-5 text-sm text-tan">
          We don't have a representative response to surface yet. The audit
          either ran without engine responses or the selector didn't find a
          clear win/miss/wrong example.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {quotes.map((q, i) => (
            <div
              key={`${q.engine}:${i}`}
              className="rounded border border-tan/40 bg-forest-dark p-4"
            >
              <div className="mb-1 text-[11px] uppercase tracking-wider text-tan">
                {q.engine} · {categoryLabel[q.category] ?? q.category}
              </div>
              <div className="mb-2 text-xs italic text-gold-dark">
                "{q.query}"
              </div>
              <div className="text-sm italic leading-relaxed text-cream">
                "{q.response_excerpt}"
              </div>
              <div className="mt-3 text-[11px] text-gold-dark">
                {q.annotation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FixLists({
  readinessFixes,
  accuracyFixes,
}: {
  readinessFixes: Array<{ rank: number; tactic: string; framed_as: string; rationale?: string }>;
  accuracyFixes: Array<{
    rank: 1 | 2 | 3;
    claim_type: string;
    tactic: string;
    framed_as: string;
    gap: string;
    affected_claim_count: number;
  }>;
}) {
  return (
    <div className="mb-7 grid grid-cols-2 gap-5">
      <FixColumn
        kicker="Three fixes for readiness"
        subtitle="Things AI can't find on your site today. Move you to the right on the chart."
        items={readinessFixes.slice(0, 3).map((fix) => ({
          rank: fix.rank,
          headline: fix.framed_as,
          body: fix.tactic,
        }))}
        emptyText="No readiness fixes were ranked — driver signal was insufficient."
        rankColor="forest"
      />
      <FixColumn
        kicker="Three fixes for accuracy"
        subtitle="What AI is getting wrong about you right now. Higher-impact for trust."
        items={accuracyFixes.slice(0, 3).map((fix) => ({
          rank: fix.rank,
          headline: fix.framed_as,
          body: `${fix.gap} ${fix.tactic}`,
        }))}
        emptyText="No accuracy failures were flagged in this run."
        rankColor="gold"
      />
    </div>
  );
}

function FixColumn({
  kicker,
  subtitle,
  items,
  emptyText,
  rankColor,
}: {
  kicker: string;
  subtitle: string;
  items: Array<{ rank: number; headline: string; body: string }>;
  emptyText: string;
  rankColor: "forest" | "gold";
}) {
  const rankClass = rankColor === "gold" ? "text-gold-dark" : "text-cream";
  return (
    <div className="rounded border border-tan/40 bg-forest-dark p-5">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-gold-dark">
        {kicker}
      </div>
      <div className="mb-4 text-xs text-tan">{subtitle}</div>
      {items.length === 0 ? (
        <div className="text-sm text-tan">{emptyText}</div>
      ) : (
        <div className="divide-y divide-rule">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`text-lg font-semibold leading-none ${rankClass}`}>
                {item.rank}
              </div>
              <div>
                <div className="text-sm font-medium text-cream">
                  {item.headline}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-cream">
                  {item.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailTables({
  readinessScores,
  outcomeScores,
}: {
  readinessScores: Array<{
    driver_id: string;
    driver_name: string;
    score: number | null;
  }>;
  outcomeScores: any | null;
}) {
  const outcomes = outcomeScores
    ? [
        { id: "visibility", name: "Visibility", value: num01(outcomeScores.visibility) },
        {
          id: "representation_accuracy",
          name: "Representation accuracy",
          value: num01(outcomeScores.representation_accuracy),
        },
        {
          id: "claim_support",
          name: "Claim support",
          value: num01(outcomeScores.claim_support),
        },
        {
          id: "context_preservation",
          name: "Context preservation",
          value: num01(outcomeScores.context_preservation),
        },
        {
          id: "recommendation_quality",
          name: "Recommendation quality",
          value: num01(outcomeScores.recommendation_quality),
        },
        { id: "stability", name: "Stability", value: num01(outcomeScores.stability) },
      ]
    : [];

  const weakDriverThreshold = 50;
  const weakOutcomeThreshold = 40;

  return (
    <div className="mb-7 rounded-lg bg-forest-dark p-6">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-lg font-semibold text-cream">
          The full picture, if you want it
        </div>
        <div className="text-[11px] text-tan">
          rubric · driver + outcome rollup
        </div>
      </div>
      <div className="mb-4 text-xs text-tan">
        The three scores above are made of these eleven measurements. Every
        score is on the same 0–100 scale: higher means AI is getting more right.
      </div>

      <ScaleLegend />

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-cream">
            Five readiness drivers
          </div>
          {readinessScores.length === 0 ? (
            <div className="text-sm text-tan">
              No driver scores persisted for this audit.
            </div>
          ) : (
            <div className="space-y-2">
              {readinessScores.map((s) => {
                const display = s.score === null ? null : s.score * 20;
                const weak = display !== null && display < weakDriverThreshold;
                return (
                  <ScoreRow
                    key={s.driver_id}
                    label={s.driver_name}
                    value={display}
                    weak={weak}
                    dimensionId={s.driver_id as V3DimensionId}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-cream">
            Six measured outcomes
          </div>
          {outcomes.length === 0 ? (
            <div className="text-sm text-tan">
              No outcome scores persisted (free or insufficient-evidence run).
            </div>
          ) : (
            <div className="space-y-2">
              {outcomes.map((o) => {
                const display = o.value * 100;
                const weak = display < weakOutcomeThreshold;
                return (
                  <ScoreRow
                    key={o.id}
                    label={o.name}
                    value={display}
                    weak={weak}
                    dimensionId={o.id as V3DimensionId}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-tan/40 pt-3 text-[11px] text-tan leading-relaxed">
        Gold numbers are aimed at by the priority fixes. Forest numbers are
        holding steady. The thresholds match the headline tiers: under 20 is
        Invisible, 20–39 Overlooked, 40–59 Emerging, 60–79 Discoverable, 80+
        Agent-Ready.
      </div>
    </div>
  );
}

function ScaleLegend() {
  return (
    <div className="mb-4 rounded border border-tan/40 bg-forest-dark px-3 py-2 text-[11px] text-tan">
      <div className="mb-1 flex items-center justify-between">
        <span>0 — weak</span>
        <span>40 — emerging</span>
        <span>60 — strong</span>
        <span>80 — excellent</span>
      </div>
      <div className="relative h-1.5 rounded bg-cream-dim">
        <div className="absolute inset-y-0 left-0 w-[40%] bg-gold/40" />
        <div className="absolute inset-y-0 left-[40%] w-[20%] bg-gold-dark/30" />
        <div className="absolute inset-y-0 left-[60%] w-[40%] bg-forest/40" />
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  value,
  weak,
  dimensionId,
}: {
  label: string;
  value: number | null;
  weak: boolean;
  dimensionId: V3DimensionId;
}) {
  const display = value === null ? "—" : Math.round(value);
  const bar = value === null ? 0 : Math.max(0, Math.min(100, value));
  const valueColor = weak ? "text-gold-dark" : "text-cream";
  const barColor = weak ? "bg-gold-dark/70" : "bg-forest/70";
  const improvements = getImprovements(dimensionId);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-cream">{label}</span>
        <span className={`text-base font-semibold ${valueColor}`}>
          {display}
          <span className="text-[10px] text-tan ml-0.5">/ 100</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded bg-cream-dim relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barColor}`}
          style={{ width: `${bar}%` }}
        />
        <div className="absolute inset-y-0 left-[40%] w-px bg-rule-strong/60" />
        <div className="absolute inset-y-0 left-[60%] w-px bg-rule-strong/60" />
      </div>
      {improvements.length > 0 && (
        <details className="mt-1.5 group">
          <summary className="cursor-pointer text-[11px] text-gold-dark hover:text-cream transition-colors list-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">How to improve this →</span>
            <span className="hidden group-open:inline">Hide tactics ↓</span>
          </summary>
          <div className="mt-2 space-y-2.5 rounded border border-tan/40 bg-forest-dark px-3 py-2.5">
            {improvements.map((imp, i) => (
              <div key={i}>
                <div className="text-[12px] font-medium text-cream leading-snug">
                  {imp.tactic}
                </div>
                <div className="mt-0.5 text-[11px] text-cream/80 leading-relaxed">
                  {imp.rationale}
                </div>
                <a
                  href={imp.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-[10px] text-gold-dark hover:text-cream underline underline-offset-2"
                >
                  Source: {imp.source.label}
                </a>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function num01(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

function DebugFooter({
  auditId,
  rubricVersion,
  currentRubricVersion,
  synthesizerModel,
  engineResponseCount,
  extractedCount,
  claimCount,
  verificationCount,
}: {
  auditId: string;
  rubricVersion: string;
  currentRubricVersion: string;
  synthesizerModel: string;
  engineResponseCount: number;
  extractedCount: number;
  claimCount: number;
  verificationCount: number;
}) {
  return (
    <div className="mt-10 border-t border-tan/40 pt-4 text-[11px] text-paper/60">
      Audit {auditId.slice(0, 8)} · stored at {rubricVersion} · current rubric{" "}
      {currentRubricVersion} · synthesizer {synthesizerModel} ·{" "}
      {engineResponseCount} responses · {extractedCount} extracted ·{" "}
      {claimCount} claims · {verificationCount} verifications
    </div>
  );
}
