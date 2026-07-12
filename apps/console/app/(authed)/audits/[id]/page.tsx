import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/Shell";
import { Card, Tag } from "@/components/Card";
import { RunAuditForm } from "@/components/RunAuditForm";
import { supabaseAdmin } from "@practical-informatics/avi";
import { relativeTime } from "@/lib/data/stats";
import { getSubjectIdByUrl } from "@/lib/data/subjects";
import { regenerateSynthesisAction } from "./actions";

export const dynamic = "force-dynamic";

async function getAudit(id: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audits_v2")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function getSubjectSnapshot(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_subjects_snapshot")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();
  return data;
}

async function getCrawlerEvidence(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_crawler_evidence")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();
  return data;
}

async function getCorroboration(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_corroboration")
    .select("platform, result_index, title, url, snippet")
    .eq("audit_id", auditId)
    .order("platform")
    .order("result_index");
  return data ?? [];
}

async function getEngineResponses(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_engine_responses")
    .select("id, template_id, query, engine, raw_response, error, captured_at")
    .eq("audit_id", auditId)
    .order("template_id")
    .order("engine");
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

async function getVisibility(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_visibility_outcomes")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();
  return data;
}

async function getV3Outcomes(auditId: string) {
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
    .eq("audit_id", auditId)
    .order("dimension_id");
  return data ?? [];
}

async function getRecs(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_v2_recommendations")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();
  return data;
}

async function getV3Claims(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_claims")
    .select(
      "id, claim_text, claim_type, subject_name, confidence, audit_claim_verifications(label, source_url, source_type, evidence_quote, rationale, verifier)"
    )
    .eq("audit_id", auditId)
    .order("created_at");
  return data ?? [];
}

async function getV3SourceEvidence(auditId: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audit_source_evidence")
    .select("url, source_type, fetch_status, title, excerpt, mentions_subject")
    .eq("audit_id", auditId)
    .order("source_type");
  return data ?? [];
}

const DRIVER_NAMES: Record<string, string> = {
  D1: "Entity Clarity & Consistency",
  D2: "Third-Party Corroboration",
  D3: "Machine-Readability & Structure",
  D4: "Differentiation from Consensus",
  D6: "Platform-Native Fit",
  business_clarity: "Business Clarity",
  source_support: "Source Support",
  ai_readability: "AI Readability",
  distinctive_point_of_view: "Distinctive Point of View",
  recommendation_fit: "Recommendation Fit",
};

const SynthesisPanel = ({
  auditId,
  synthesis,
}: {
  auditId: string;
  synthesis: {
    headline?: string;
    body?: string;
    generated_at?: string;
    synthesizer_model?: string;
  } | null;
}) => {
  if (synthesis && (synthesis.headline || synthesis.body)) {
    return (
      <section className="mb-10">
        <div className="border-l-4 border-gold bg-paper rounded-md p-6">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-xs font-semibold text-gold-dark uppercase tracking-wider">
              Executive read
            </div>
            <form action={regenerateSynthesisAction}>
              <input type="hidden" name="auditId" value={auditId} />
              <button
                type="submit"
                className="text-xs text-muted hover:text-charcoal underline"
              >
                Regenerate
              </button>
            </form>
          </div>
          {synthesis.headline && (
            <h2 className="text-xl font-semibold text-forest-dark leading-snug mb-3 tracking-tight">
              {synthesis.headline}
            </h2>
          )}
          {synthesis.body && (
            <div className="text-sm text-charcoal leading-relaxed whitespace-pre-line">
              {synthesis.body}
            </div>
          )}
          {synthesis.generated_at && (
            <div className="text-xs text-muted mt-4 pt-3 border-t border-rule">
              Synthesized by {synthesis.synthesizer_model ?? "-"} -{" "}
              {new Date(synthesis.generated_at).toLocaleString()}
            </div>
          )}
        </div>
      </section>
    );
  }
  return (
    <section className="mb-10">
      <div className="border border-rule-strong bg-paper-dim rounded-md p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-charcoal mb-1">
            No executive synthesis yet
          </div>
          <div className="text-xs text-muted leading-relaxed">
            This audit was scored before the Synthesizer role existed (or generation
            failed). Click Generate to produce a plain-English narrative summary from
            the existing driver scores, visibility metrics, and recommendations.
            ~$0.10 in LLM cost.
          </div>
        </div>
        <form action={regenerateSynthesisAction}>
          <input type="hidden" name="auditId" value={auditId} />
          <button
            type="submit"
            className="shrink-0 px-4 py-2 rounded-md text-sm font-semibold bg-forest text-white border border-forest hover:bg-forest-dark transition-colors"
          >
            Generate
          </button>
        </form>
      </div>
    </section>
  );
};

export default async function AuditDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await getAudit(id);
  if (!audit) notFound();

  const isFullRun = ["paid", "audit", "monitoring"].includes(audit.mode);
  const isV3 = audit.rubric_version?.startsWith("v3") ?? false;

  const [
    snapshot,
    crawler,
    corroboration,
    engineResponses,
    extracted,
    visibility,
    v3Outcomes,
    drivers,
    recs,
    v3Claims,
    v3Sources,
  ] =
    await Promise.all([
      getSubjectSnapshot(id),
      getCrawlerEvidence(id),
      getCorroboration(id),
      isFullRun ? getEngineResponses(id) : Promise.resolve([]),
      isFullRun ? getExtracted(id) : Promise.resolve([]),
      isFullRun ? getVisibility(id) : Promise.resolve(null),
      isV3 ? getV3Outcomes(id) : Promise.resolve(null),
      getDriverScores(id),
      getRecs(id),
      isV3 ? getV3Claims(id) : Promise.resolve([]),
      isV3 ? getV3SourceEvidence(id) : Promise.resolve([]),
    ]);

  // Look up the JSON file id by URL so "Run again" buttons can re-fire the same Server Action.
  const subjectFileId = snapshot?.url
    ? await getSubjectIdByUrl(snapshot.url)
    : null;

  const corrByPlatform = groupBy(corroboration, (r) => r.platform);
  const extractedByResponseId = new Map(
    extracted.map((e: any) => [e.engine_response_id, e])
  );
  const errors = (audit.errors as { step: string; message: string; fatal: boolean }[]) ?? [];
  const fatalErrors = errors.filter((e) => e.fatal);
  const displayAudit = isV3 && audit.mode !== "free" ? { ...audit, mode: "paid" } : audit;

  return (
    <>
      <div className="mb-3">
        <Link href="/audits" className="text-xs text-paper/70 hover:text-paper">
          Back to audits
        </Link>
      </div>

      <PageHeader
        title={snapshot?.canonical_name ?? `Audit ${id.slice(0, 8)}`}
        description={`${audit.mode} - rubric ${audit.rubric_version} - ${relativeTime(audit.started_at)} - ${id.slice(0, 8)}`}
        action={
          <div className="flex items-center gap-2">
            <Tag tone={audit.status === "complete" ? "forest" : audit.status === "failed" ? "neutral" : "gold"}>
              {audit.status}
            </Tag>
            {subjectFileId && (
              <>
                <RunAuditForm subjectId={subjectFileId} mode="free" variant="header" />
                <RunAuditForm subjectId={subjectFileId} mode="paid" variant="header" />
              </>
            )}
          </div>
        }
      />

      {subjectFileId && (
        <div className="mb-6 flex items-center gap-3 text-xs">
          <span className="text-muted">More for this subject:</span>
          <Link
            href={`/subjects/${subjectFileId}`}
            className="text-forest-dark hover:underline"
          >
            Back to subject page (history + edit)
          </Link>
        </div>
      )}

      {fatalErrors.length > 0 && (
        <div className="mb-6 border border-red-200 bg-red-50 rounded-md p-4">
          <div className="text-sm font-medium text-red-800 mb-2">
            {fatalErrors.length} fatal error{fatalErrors.length === 1 ? "" : "s"} during this run
          </div>
          <ul className="text-xs text-red-900 space-y-1">
            {fatalErrors.map((e, i) => (
              <li key={i}>
                <span className="font-mono">{e.step}:</span> {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ReportScoreOverview
        audit={audit}
        displayAudit={displayAudit}
        v3Outcomes={v3Outcomes}
        visibility={visibility}
      />

      <ReportNav
        hasAnswers={engineResponses.length > 0}
        hasFailures={isV3 && v3Claims.length > 0}
        hasRecommendations={Boolean(recs && Array.isArray(recs.fixes) && recs.fixes.length > 0)}
        hasVisibility={Boolean(visibility)}
        hasEvidence={Boolean(crawler || corroboration.length > 0 || v3Sources.length > 0)}
      />

      {engineResponses.length > 0 && (
        <AIAnswersByQuestionSection
          engineResponses={engineResponses}
          extractedByResponseId={extractedByResponseId}
          subjectName={snapshot?.canonical_name ?? ""}
          aliases={Array.isArray(snapshot?.aliases) ? snapshot.aliases : []}
          competitors={Array.isArray(snapshot?.competitors) ? snapshot.competitors : []}
        />
      )}

      {isV3 && v3Claims.length > 0 && (
        <ClaimsReviewSection claims={v3Claims} />
      )}

      {/* ============== DRIVER SCORES - primary evaluation surface ============== */}
      <DetailsSection
        id="drivers"
        title={isV3 ? "V3 readiness drivers" : "Driver scores"}
        subtitle={
          isV3
            ? "Business clarity, source support, AI readability, distinctive point of view, and recommendation fit."
            : "Five weighted dimensions, judged 0-5 against the anchored rubric."
        }
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 gap-3">
          {drivers.map((d: any) => (
            <DriverCard key={d.dimension_id} driver={d} />
          ))}
        </div>
      </DetailsSection>

      {/* ============== RECOMMENDATIONS ============== */}
      {recs && Array.isArray(recs.fixes) && recs.fixes.length > 0 && (
        <DetailsSection
          id="recommendations"
          title="Recommendations"
          subtitle="Top fixes ranked by impact-per-hour. Click any card to read the rationale."
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-3">
            {recs.fixes.map((f: any, i: number) => (
              <RecommendationCard key={i} fix={f} index={i} />
            ))}
          </div>
          {recs.rank_aware_note && (
            <div className="mt-3 text-xs text-muted italic">
              {recs.rank_aware_note}
            </div>
          )}
        </DetailsSection>
      )}

      {/* ============== VISIBILITY OUTCOMES (paid only) ============== */}
      {visibility && (
        <DetailsSection
          id="visibility"
          title="Visibility outcomes"
          subtitle="Sub-metrics aggregated from extracted engine responses. All in [0.0, 1.0]."
          defaultOpen={false}
        >
          <div className="grid grid-cols-5 gap-4">
            <MiniStat label="Presence" value={pct(visibility.presence)} />
            <MiniStat label="Citation" value={pct(visibility.citation)} />
            <MiniStat label="Share-of-Voice" value={pct(visibility.share_of_voice)} />
            <MiniStat label="Prominence" value={pct(visibility.prominence)} />
            <MiniStat label="Composite" value={pct(visibility.composite)} highlight />
          </div>
        </DetailsSection>
      )}

      {/* ============== EVIDENCE APPENDIX (collapsed by default) ============== */}
      <details id="evidence" className="mb-10 group">
        <summary className="cursor-pointer flex items-center gap-2 px-4 py-3 bg-paper border border-rule-strong rounded-md hover:bg-cream-dim transition-colors list-none [&::-webkit-details-marker]:hidden">
          <span className="text-forest-dark text-base transition-transform group-open:rotate-90">&gt;</span>
          <div>
            <div className="text-sm font-semibold text-forest-dark">
              Evidence appendix
            </div>
            <div className="text-xs text-muted mt-0.5">
              Crawler findings, third-party corroboration, engine query grid, subject snapshot - the raw inputs the audit was built from. Click to expand.
            </div>
          </div>
        </summary>

        <div className="mt-6 space-y-10">

      {isV3 && v3Sources.length > 0 && (
        <Section
          title="V3 source evidence"
          subtitle="Fetched sources used to support, contradict, or mark extracted claims as not verifiable."
        >
          <div className="space-y-3">
            {v3Sources.slice(0, 20).map((source: any) => (
              <Card key={source.url}>
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <Tag tone={source.mentions_subject ? "forest" : "muted"}>
                    {source.source_type}
                  </Tag>
                  <span className="text-xs text-muted">
                    status {source.fetch_status ?? "-"}
                  </span>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-forest-dark underline break-all"
                >
                  {source.title ?? source.url}
                </a>
                {source.excerpt && (
                  <p className="text-xs text-muted mt-2 leading-relaxed">
                    {source.excerpt.slice(0, 420)}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {crawler && (
        <Section title="Crawler evidence" subtitle="Deterministic - no LLM. Used as input to Driver Judges D1, D3.">
          <Card>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field label="URL">
                <a href={crawler.url} target="_blank" rel="noreferrer" className="text-forest-dark underline break-all">
                  {crawler.url}
                </a>
              </Field>
              <Field label="HTTP status">{crawler.status}</Field>
              <Field label="Title">{crawler.title ?? <span className="text-muted">-</span>}</Field>
              <Field label="Word count">{crawler.word_count?.toLocaleString() ?? "-"}</Field>
              <Field label="Meta description" full>
                {crawler.meta_description ? (
                  <span className="text-charcoal/80 italic">"{crawler.meta_description}"</span>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </Field>
              <Field label="H1s">
                {Array.isArray(crawler.h1) && crawler.h1.length > 0
                  ? crawler.h1.join(" - ")
                  : "-"}
              </Field>
              <Field label="Schema blocks">
                {Array.isArray(crawler.schema_blocks) ? crawler.schema_blocks.length : 0} JSON-LD
              </Field>
            </dl>

            <div className="mt-5 pt-4 border-t border-rule">
              <div className="text-xs text-muted uppercase tracking-wider mb-2">
                Scent flags (deterministic - feed D3 cap)
              </div>
              <div className="flex flex-wrap gap-1.5">
                <ScentFlag label="meta has action verb" on={crawler.meta_description_has_action_verb} />
                <ScentFlag label="meta names category" on={crawler.meta_description_names_category} />
                <ScentFlag label="og:description present" on={crawler.og_description_present} />
                <ScentFlag label="title has descriptor" on={crawler.title_has_descriptor} />
                <ScentFlag label="differentiation above fold" on={crawler.differentiation_above_fold} />
                <ScentFlag label="keyword stuffing" on={crawler.keyword_stuffing_detected} negative />
                <ScentFlag label="FAQ schema" on={crawler.has_faq_schema} />
                <ScentFlag label="Person schema" on={crawler.has_person_schema} />
                <ScentFlag label="Organization schema" on={crawler.has_organization_schema} />
              </div>
              <div className="text-xs text-muted mt-2">
                Meta description: {crawler.meta_description_chars ?? 0} chars
              </div>
            </div>

            {crawler.raw_text_sample && (
              <details className="mt-5 pt-4 border-t border-rule">
                <summary className="text-xs text-muted uppercase tracking-wider cursor-pointer hover:text-charcoal">
                  Raw text sample (first ~2000 chars)
                </summary>
                <pre className="mt-3 text-xs text-charcoal whitespace-pre-wrap bg-cream-dim p-3 rounded-md max-h-64 overflow-y-auto">
                  {crawler.raw_text_sample}
                </pre>
              </details>
            )}
          </Card>
        </Section>
      )}

      {/* ============== CORROBORATION ============== */}
      {corroboration.length > 0 && (
        <Section
          title="Corroboration"
          subtitle={`${corroboration.length} Tavily results across ${Object.keys(corrByPlatform).length} platforms. Feeds D2 + D6.`}
        >
          <div className="space-y-4">
            {Object.entries(corrByPlatform).map(([platform, rows]) => (
              <Card key={platform}>
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-sm font-semibold text-charcoal">
                    {platform}
                  </h3>
                  <span className="text-xs text-muted">{rows.length} result{rows.length === 1 ? "" : "s"}</span>
                </div>
                <ul className="space-y-2.5 text-sm">
                  {rows.slice(0, 8).map((r, i) => (
                    <li key={i}>
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-forest-dark hover:underline font-medium block">
                          {r.title ?? r.url}
                        </a>
                      ) : (
                        <span className="text-charcoal font-medium">{r.title ?? "(no title)"}</span>
                      )}
                      {r.snippet && (
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{r.snippet}</p>
                      )}
                    </li>
                  ))}
                  {rows.length > 8 && (
                    <li className="text-xs text-muted italic">+ {rows.length - 8} more</li>
                  )}
                </ul>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* ============== ENGINE RESPONSES (paid only) ============== */}
      {engineResponses.length > 0 && (
        <Section
          title="Engine query grid"
          subtitle={`${engineResponses.length} raw responses. Each was passed to the Extractor and verified.`}
        >
          <div className="space-y-3">
            {engineResponses.map((r: any) => {
              const ex = extractedByResponseId.get(r.id);
              return (
                <Card key={r.id}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <Tag tone={ex?.mentioned ? "forest" : "muted"}>
                      {r.engine}
                    </Tag>
                    <span className="text-xs font-mono text-muted">{r.template_id}</span>
                    {ex?.mentioned ? (
                      <Tag tone="gold">{ex.position}</Tag>
                    ) : (
                      <Tag tone="muted">not mentioned</Tag>
                    )}
                    {ex?.cited_with_link && <Tag tone="forest">cited</Tag>}
                  </div>
                  <div className="text-sm text-charcoal/80 italic mb-3">
                    "{r.query}"
                  </div>
                  {r.error ? (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
                      Error: {r.error}
                    </div>
                  ) : (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-xs text-muted uppercase tracking-wider hover:text-charcoal">
                        Raw response
                      </summary>
                      <pre className="mt-2 text-xs text-charcoal whitespace-pre-wrap bg-cream-dim p-3 rounded-md max-h-72 overflow-y-auto">
                        {r.raw_response}
                      </pre>
                    </details>
                  )}
                  {ex && (
                    <div className="mt-3 pt-3 border-t border-rule">
                      <div className="text-xs text-muted uppercase tracking-wider mb-2">
                        Extracted
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted">Sentiment:</span>{" "}
                          <span className="text-charcoal">{ex.sentiment}</span>
                        </div>
                        <div>
                          <span className="text-muted">Competitors:</span>{" "}
                          <span className="text-charcoal">
                            {ex.competitors_mentioned?.length
                              ? ex.competitors_mentioned.join(", ")
                              : "-"}
                          </span>
                        </div>
                        {ex.cited_urls?.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-muted">Cited URLs:</span>{" "}
                            <span className="text-charcoal break-all">
                              {ex.cited_urls.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {/* ============== BUSINESS SNAPSHOT ============== */}
      {snapshot && (
        <Section title="Business details used for this audit" subtitle="These are the details the tool used when the audit started. Later edits do not change old reports.">
          <Card>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field label="Company name">{snapshot.canonical_name}</Field>
              <Field label="Business type">
                <Tag tone={snapshot.subject_type === "company" ? "forest" : "gold"}>
                  {snapshot.subject_type === "personal_brand"
                    ? "Person or personal brand"
                    : "Company or organization"}
                </Tag>
              </Field>
              <Field label="What it sells or does">{snapshot.industry}</Field>
              <Field label="Where it serves customers">{snapshot.location ?? "-"}</Field>
              <Field label="Other names AI might see">
                {Array.isArray(snapshot.aliases) && snapshot.aliases.length > 0
                  ? snapshot.aliases.join(", ")
                  : "-"}
              </Field>
              <Field label="Website">
                <a href={snapshot.url} target="_blank" rel="noreferrer" className="text-forest-dark underline break-all">
                  {snapshot.url}
                </a>
              </Field>
              <Field label="What makes it different" full>
                {Array.isArray(snapshot.known_differentiation_terms) &&
                snapshot.known_differentiation_terms.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {snapshot.known_differentiation_terms.map((t: string) => (
                      <Tag key={t} tone="neutral">{t}</Tag>
                    ))}
                  </div>
                ) : (
                  "-"
                )}
              </Field>
            </dl>
          </Card>
        </Section>
      )}

        </div>
      </details>
    </>
  );
}

function DriverCard({ driver }: { driver: any }) {
  const bandValue = driver.band_insufficient ? null : driver.band_value;
  const dimName = DRIVER_NAMES[driver.dimension_id] ?? "";
  const weight = Number(driver.weight ?? 0).toFixed(2);
  const justification: string = driver.justification ?? "";
  const evidenceCount = Array.isArray(driver.evidence_pointers)
    ? driver.evidence_pointers.length
    : 0;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex">
        <div className="shrink-0 w-32 bg-paper-dim border-r border-rule px-5 py-4 flex flex-col items-center justify-center">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider">
            {driver.dimension_id}
          </div>
          <div className="text-4xl font-semibold tabular-nums text-forest-dark mt-1 leading-none">
            {bandValue ?? "-"}
          </div>
          <div className="text-[10px] text-muted uppercase tracking-wider mt-1">
            weight {weight}
          </div>
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h3 className="text-sm font-semibold text-charcoal">{dimName}</h3>
            <div className="flex gap-1.5 items-center">
              {driver.cap_triggered && (
                <Tag tone="gold">cap: {driver.cap_triggered}</Tag>
              )}
              {driver.band_insufficient && (
                <Tag tone="muted">insufficient evidence</Tag>
              )}
            </div>
          </div>

          <p className="text-sm text-charcoal leading-relaxed">{justification}</p>

          {evidenceCount > 0 && (
            <details className="mt-3 text-xs text-muted">
              <summary className="cursor-pointer hover:text-charcoal">
                {evidenceCount} evidence pointer{evidenceCount === 1 ? "" : "s"}
              </summary>
              <ul className="mt-2 space-y-1.5 ml-2 pl-3 border-l border-rule">
                {driver.evidence_pointers.map((p: any, i: number) => (
                  <li key={i} className="text-charcoal">
                    <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                      {p.type ?? p.source ?? "ptr"}:
                    </span>{" "}
                    {p.value ?? JSON.stringify(p)}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </Card>
  );
}

function RecommendationCard({ fix, index }: { fix: any; index: number }) {
  const rank = fix.rank ?? index + 1;
  const tactic = fix.tactic ?? fix.framed_as ?? "-";
  const impact = fix.impact_estimate;
  const sentences = splitSentences(tactic);
  const headline = sentences[0] ?? tactic;
  const steps = sentences.slice(1);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex">
        <div className="shrink-0 w-16 bg-forest text-white flex items-start justify-center pt-5 text-2xl font-semibold tabular-nums">
          {rank}
        </div>

        <div className="flex-1 p-5">
          {/* Tags row at top */}
          <div className="flex items-center gap-1.5 mb-3">
            <Tag tone="forest">{fix.dimension_id}</Tag>
            {impact && (
              <Tag tone={impact === "high" ? "gold" : "muted"}>
                {impact} impact
              </Tag>
            )}
          </div>

          {/* Headline - first sentence, bold and larger */}
          <h3 className="text-base font-semibold text-charcoal leading-snug mb-3">
            {headline}
          </h3>

          {/* Action steps - remaining sentences as bullets */}
          {steps.length > 0 && (
            <ul className="space-y-1.5 mb-4 ml-0.5">
              {steps.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 text-sm text-charcoal/90 leading-relaxed"
                >
                  <span className="text-gold mt-0.5 shrink-0 select-none">*</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Gap callout - distinct strip */}
          {fix.gap && (
            <div className="bg-paper-dim border-l-2 border-rule-strong rounded-r px-3 py-2 mb-3">
              <div className="text-[10px] text-muted uppercase tracking-wider font-medium mb-0.5">
                The gap
              </div>
              <div className="text-xs text-charcoal leading-relaxed">{fix.gap}</div>
            </div>
          )}

          {/* Why this works - collapsed */}
          {fix.rationale && (
            <details className="mb-3">
              <summary className="cursor-pointer text-[11px] text-forest-dark uppercase tracking-wider font-semibold hover:text-forest list-none [&::-webkit-details-marker]:hidden flex items-center gap-1.5">
                <span className="inline-block w-3 transition-transform">&gt;</span>
                Why this works
              </summary>
              <p className="mt-2 ml-4 text-sm text-charcoal/85 leading-relaxed">
                {fix.rationale}
              </p>
            </details>
          )}

          {/* Evidence pointer - small caption */}
          {fix.evidence_pointer && (
            <div className="text-[10px] text-muted mt-3 pt-2 border-t border-rule font-mono break-all">
              <span className="uppercase tracking-wider not-italic font-sans">
                Evidence:
              </span>{" "}
              {fix.evidence_pointer}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function splitSentences(text: string): string[] {
  if (!text) return [];
  // Split on sentence boundary: period/exclamation/question followed by whitespace
  // and a capital letter or quote (start of next sentence).
  return text
    .split(/(?<=[.!?])\s+(?=["'(]?[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ReportScoreOverview({
  audit,
  displayAudit,
  v3Outcomes,
  visibility,
}: {
  audit: any;
  displayAudit: any;
  v3Outcomes: any;
  visibility: any;
}) {
  return (
    <section id="scores" className="mb-6">
      <div className="border border-gold/20 bg-paper rounded-md p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-muted uppercase tracking-wider font-semibold">
              Report summary
            </div>
            <h2 className="text-xl text-forest-dark font-semibold mt-1">
              Scores at a glance
            </h2>
          </div>
          <Tag tone="forest">{audit.tier ?? "Unscored"}</Tag>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatCard
            label={audit.rubric_version === "v3.0" ? "Accuracy index" : "Composite"}
            value={fmtNum(audit.composite_score)}
            sub={audit.tier}
          />
          <StatCard label="Readiness" value={fmtNum(audit.readiness_score)} />
          <StatCard
            label="Visibility"
            value={displayAudit.mode === "paid" ? fmtNum(audit.visibility_score) : "-"}
            sub={displayAudit.mode === "free" ? "paid only" : undefined}
          />
          <StatCard
            label="Run size"
            value={`${audit.protocol_query_count ?? audit.query_count ?? 0} x ${audit.engine_count ?? 0}`}
            sub="questions x AI systems"
          />
        </div>

        {v3Outcomes && (
          <div className="grid grid-cols-6 gap-3">
            <MiniStat label="AI visibility" value={pct(v3Outcomes.visibility)} />
            <MiniStat label="Representation" value={pct(v3Outcomes.representation_accuracy)} />
            <MiniStat label="Claim support" value={pct(v3Outcomes.claim_support)} />
            <MiniStat label="Context" value={pct(v3Outcomes.context_preservation)} />
            <MiniStat label="Recommendation" value={pct(v3Outcomes.recommendation_quality)} />
            <MiniStat label="Stability" value={pct(v3Outcomes.stability)} highlight />
          </div>
        )}

        {!v3Outcomes && visibility && (
          <div className="grid grid-cols-5 gap-3">
            <MiniStat label="Presence" value={pct(visibility.presence)} />
            <MiniStat label="Citation" value={pct(visibility.citation)} />
            <MiniStat label="Share-of-Voice" value={pct(visibility.share_of_voice)} />
            <MiniStat label="Prominence" value={pct(visibility.prominence)} />
            <MiniStat label="Composite" value={pct(visibility.composite)} highlight />
          </div>
        )}
      </div>
    </section>
  );
}

function ReportNav({
  hasAnswers,
  hasFailures,
  hasRecommendations,
  hasVisibility,
  hasEvidence,
}: {
  hasAnswers: boolean;
  hasFailures: boolean;
  hasRecommendations: boolean;
  hasVisibility: boolean;
  hasEvidence: boolean;
}) {
  const links = [
    { href: "#scores", label: "Scores", show: true },
    { href: "#answers", label: "AI Answers", show: hasAnswers },
    { href: "#failures", label: "Accuracy Failures", show: hasFailures },
    { href: "#recommendations", label: "Recommendations", show: hasRecommendations },
    { href: "#drivers", label: "Drivers", show: true },
    { href: "#visibility", label: "Visibility", show: hasVisibility },
    { href: "#evidence", label: "Evidence", show: hasEvidence },
  ].filter((link) => link.show);

  return (
    <nav className="mb-8 border-b border-gold/35">
      <div className="flex flex-wrap gap-1">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-t-md border border-b-0 border-gold/25 bg-forest px-4 py-2 text-xs font-semibold text-paper/80 hover:bg-paper hover:text-forest-dark"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function AIAnswersByQuestionSection({
  engineResponses,
  extractedByResponseId,
  subjectName,
  aliases,
  competitors,
}: {
  engineResponses: any[];
  extractedByResponseId: Map<any, any>;
  subjectName: string;
  aliases: string[];
  competitors: Array<{ canonical_name?: string; aliases?: string[] }>;
}) {
  const byQuestion = groupBy(engineResponses, (response) => response.query);

  return (
    <Section
      id="answers"
      title="Questions asked and AI answers"
      subtitle="This is the measurement surface: the exact questions sent to AI and what each system said about the business."
    >
      {competitors.length > 0 && (
        <CompetitorMentionSummary
          engineResponses={engineResponses}
          extractedByResponseId={extractedByResponseId}
          subjectName={subjectName}
          competitors={competitors}
        />
      )}

      <div className="space-y-5">
        {Object.entries(byQuestion).map(([question, responses], index) => (
          <Card key={question}>
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-7 h-7 rounded-md bg-forest text-white flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <div>
                <div className="text-xs text-muted uppercase tracking-wider font-medium">
                  Question sent to AI
                </div>
                <div className="text-base text-charcoal font-medium leading-snug mt-1">
                  {question}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {responses.map((response: any) => {
                const extraction = extractedByResponseId.get(response.id);
                return (
                  <AIAnswerCard
                    key={response.id}
                    response={response}
                    extraction={extraction}
                    subjectName={subjectName}
                    aliases={aliases}
                  />
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function AIAnswerCard({
  response,
  extraction,
  subjectName,
  aliases,
}: {
  response: any;
  extraction: any;
  subjectName: string;
  aliases: string[];
}) {
  const excerpt = response.error
    ? ""
    : excerptAroundSubject(response.raw_response ?? "", [subjectName, ...aliases]);

  return (
    <div className="border border-rule bg-paper-dim rounded-md p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Tag tone="neutral">{engineName(response.engine)}</Tag>
        <Tag tone={extraction?.mentioned ? "forest" : "muted"}>
          {extraction?.mentioned ? "named business" : "did not name business"}
        </Tag>
        {extraction?.position && <Tag tone="muted">position: {extraction.position}</Tag>}
        {extraction?.sentiment && <Tag tone="muted">sentiment: {extraction.sentiment}</Tag>}
        {extraction?.cited_with_link && <Tag tone="forest">cited with link</Tag>}
      </div>

      {response.error ? (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
          Error: {response.error}
        </div>
      ) : (
        <>
          <div className="text-xs text-muted uppercase tracking-wider font-medium mb-1">
            Answer excerpt
          </div>
          <div className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">
            {excerpt || "(No response text captured.)"}
          </div>

          {extraction?.competitors_mentioned?.length > 0 && (
            <div className="mt-3 text-xs text-charcoal">
              <span className="text-muted uppercase tracking-wider font-medium">
                Competitors mentioned:
              </span>{" "}
              {extraction.competitors_mentioned.join(", ")}
            </div>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted uppercase tracking-wider hover:text-charcoal">
              Full raw answer
            </summary>
            <pre className="mt-2 text-xs text-charcoal whitespace-pre-wrap bg-paper p-3 rounded-md max-h-96 overflow-y-auto">
              {response.raw_response}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}

function CompetitorMentionSummary({
  engineResponses,
  extractedByResponseId,
  subjectName,
  competitors,
}: {
  engineResponses: any[];
  extractedByResponseId: Map<any, any>;
  subjectName: string;
  competitors: Array<{ canonical_name?: string; aliases?: string[] }>;
}) {
  const subjectMentions = engineResponses.filter((response) => {
    const extraction = extractedByResponseId.get(response.id);
    return extraction?.mentioned;
  }).length;

  const competitorCounts = competitors.map((competitor) => {
    const names = [competitor.canonical_name, ...(competitor.aliases ?? [])]
      .filter(Boolean)
      .map((name) => String(name).toLowerCase());
    const count = engineResponses.filter((response) => {
      const extraction = extractedByResponseId.get(response.id);
      const extractedMentions = (extraction?.competitors_mentioned ?? []).map((name: string) =>
        String(name).toLowerCase()
      );
      const raw = String(response.raw_response ?? "").toLowerCase();
      return names.some(
        (name) => extractedMentions.includes(name) || raw.includes(name)
      );
    }).length;
    return {
      name: competitor.canonical_name ?? "Unnamed competitor",
      count,
    };
  });

  return (
    <Card className="mb-4 bg-forest/5 border-forest/20">
      <div className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
        Named comparison check
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted">{subjectName || "Subject"} named:</span>{" "}
          <span className="font-semibold text-charcoal">{subjectMentions}</span>
          <span className="text-muted"> / {engineResponses.length} answers</span>
        </div>
        {competitorCounts.map((competitor) => (
          <div key={competitor.name}>
            <span className="text-muted">{competitor.name} named:</span>{" "}
            <span className="font-semibold text-charcoal">{competitor.count}</span>
            <span className="text-muted"> / {engineResponses.length} answers</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function excerptAroundSubject(text: string, names: string[]): string {
  const clean = text.trim();
  if (!clean) return "";

  const lower = clean.toLowerCase();
  const found = names
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => lower.indexOf(name.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (found === undefined) return clean.slice(0, 800);

  const start = Math.max(0, found - 240);
  const end = Math.min(clean.length, found + 900);
  return `${start > 0 ? "... " : ""}${clean.slice(start, end)}${
    end < clean.length ? " ..." : ""
  }`;
}

function engineName(engine: string): string {
  const labels: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    perplexity: "Perplexity",
    gemini: "Gemini",
  };
  return labels[engine] ?? engine;
}

function ClaimsReviewSection({ claims }: { claims: any[] }) {
  const needsReview = claims.filter((claim) =>
    isReviewLabel(displayClaimLabel(claim))
  );
  const supported = claims.filter((claim) =>
    isSupportedLabel(displayClaimLabel(claim))
  );

  return (
    <Section
      id="failures"
      title="AI accuracy failures"
      subtitle="These are statements AI systems made in their answers. They are not report conclusions. AI invented this means the system assigned a business-specific claim the company does not make and available sources do not support."
    >
      {supported.length > 0 && (
        <div className="rounded-md border border-forest/15 bg-paper px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-forest-dark">
            Supported claims
          </div>
          <ul className="space-y-1.5">
            {supported.map((claim: any) => (
              <ClaimBullet key={claim.id} claim={claim} compact />
            ))}
          </ul>
        </div>
      )}

      {needsReview.length > 0 && (
        <div className="mt-3 rounded-md border border-gold/35 bg-paper px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold-dark">
            Accuracy failures
          </div>
          <ul className="space-y-2">
            {needsReview.map((claim: any) => (
              <ClaimBullet key={claim.id} claim={claim} />
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

function ClaimBullet({ claim, compact = false }: { claim: any; compact?: boolean }) {
  const verification = claim.audit_claim_verifications?.[0];
  const label = displayClaimLabel(claim);
  const review = isReviewLabel(label);

  return (
    <li className="text-sm text-charcoal">
      <div className="flex gap-2 leading-relaxed">
        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${review ? "bg-gold" : "bg-forest"}`} />
        <div className="min-w-0">
          <div>
            <span className="font-medium">{claimStatusLabel(label)}:</span>{" "}
            {claim.claim_text}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Tag tone="muted">{claim.claim_type}</Tag>
            {verification?.source_url && <Tag tone="forest">source linked</Tag>}
          </div>
          {!compact && claim.source_response_excerpt && (
            <div className="mt-1 text-xs text-muted">
              AI excerpt: {claim.source_response_excerpt}
            </div>
          )}
          {verification?.rationale && (
            <div className="mt-1 text-xs text-muted">
              {label === "ai_misrepresentation"
                ? "AI invented or assigned a business-specific claim that the available sources do not support."
                : verification.rationale}
            </div>
          )}
        </div>
      </div>
      {!compact && claim.source_response_excerpt && (
        <div className="sr-only">{claim.source_response_excerpt}</div>
      )}
    </li>
  );
}

function isReviewLabel(label: string | undefined): boolean {
  return [
    "ai_misrepresentation",
    "unsupported",
    "contradicted",
    "stale",
    "ambiguous",
    "not_verifiable",
  ].includes(String(label));
}

function isSupportedLabel(label: string | undefined): boolean {
  return [
    "supported_by_owned_source",
    "supported_by_independent_source",
    "supported_by_multiple_sources",
  ].includes(String(label));
}

function claimStatusLabel(label: string): string {
  if (label === "ai_misrepresentation") return "AI invented this";
  return String(label).replaceAll("_", " ");
}

function displayClaimLabel(claim: any): string {
  const label = claim.audit_claim_verifications?.[0]?.label ?? "not_verifiable";
  if (label === "unsupported" && isBusinessRepresentationClaim(claim.claim_type)) {
    return "ai_misrepresentation";
  }
  return label;
}

function isBusinessRepresentationClaim(type: string | undefined): boolean {
  return [
    "identity",
    "category",
    "service",
    "location",
    "audience",
    "credential",
    "pricing",
    "comparison",
    "recommendation",
  ].includes(String(type));
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-forest-dark uppercase tracking-wider">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function DetailsSection({
  id,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details id={id} open={defaultOpen} className="mb-10 group scroll-mt-4">
      <summary className="cursor-pointer flex items-center gap-2 px-4 py-3 bg-paper border border-rule-strong rounded-md hover:bg-cream-dim transition-colors list-none [&::-webkit-details-marker]:hidden">
        <span className="text-forest-dark text-base transition-transform group-open:rotate-90">
          &gt;
        </span>
        <div>
          <div className="text-sm font-semibold text-forest-dark uppercase tracking-wider">
            {title}
          </div>
          {subtitle && <div className="text-xs text-muted mt-0.5">{subtitle}</div>}
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <div className="text-xs text-muted uppercase tracking-wider font-medium">{label}</div>
      <div className="text-3xl font-semibold text-forest-dark mt-2 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </Card>
  );
}

function MiniStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border rounded-md p-3 ${highlight ? "border-forest/30 bg-forest/5" : "border-rule-strong bg-paper"}`}>
      <div className="text-xs text-muted uppercase tracking-wider font-medium">
        {label}
      </div>
      <div className={`text-lg font-semibold mt-1 tabular-nums ${highlight ? "text-forest-dark" : "text-charcoal"}`}>
        {value}
      </div>
    </div>
  );
}

function ScentFlag({
  label,
  on,
  negative = false,
}: {
  label: string;
  on: boolean;
  negative?: boolean;
}) {
  // For positive scent indicators: on=good (forest), off=neutral (muted)
  // For negative indicators (e.g., keyword_stuffing): on=bad (gold-warning), off=good (forest)
  const tone: "forest" | "muted" | "gold" = negative
    ? on
      ? "gold"
      : "muted"
    : on
    ? "forest"
    : "muted";
  const symbol = on ? "✓" : "-";
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${tone === "forest" ? "bg-forest/10 text-forest-dark border-forest/20" : tone === "gold" ? "bg-gold/15 text-gold-dark border-gold/30" : "bg-cream-dim text-muted border-rule"}`}>
      <span className="font-mono">{symbol}</span>
      {label}
    </span>
  );
}

function Field({
  label,
  children,
  full = false,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs text-muted uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-charcoal">{children}</dd>
    </div>
  );
}

function fmtNum(n: any): string {
  if (n == null) return "-";
  return Number(n).toFixed(1);
}

function pct(n: any): string {
  if (n == null) return "-";
  return `${(Number(n) * 100).toFixed(0)}%`;
}

function groupBy<T>(items: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

