import { notFound } from "next/navigation";
import { supabaseAdmin } from "@practical-informatics/avi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  subject_id: string;
  mode: string;
  rubric_version: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  composite_score: number | null;
  readiness_score: number | null;
  visibility_score: number | null;
  tier: string | null;
  query_count: number;
  engine_count: number;
  errors: unknown;
};

type SubjectRow = {
  canonical_name: string;
  aliases: string[];
  industry: string;
  subject_type: string;
  url: string;
  location: string | null;
  buyer_type: string | null;
  problem: string | null;
};

type DriverRow = {
  dimension_id: string;
  band_value: number | null;
  band_insufficient: boolean;
  justification: string | null;
};

type OutcomeRow = {
  visibility: number;
  representation_accuracy: number;
  claim_support: number;
  context_preservation: number;
  recommendation_quality: number;
  stability: number;
  ai_visibility_score: number;
  ai_readiness_score: number;
  ai_business_accuracy_score: number;
  ai_business_accuracy_index: number;
  tier: string;
};

type ClaimRow = {
  id: string;
  claim_text: string;
  claim_type: string;
  subject_name: string | null;
  confidence: number | null;
  audit_claim_verifications?: VerificationRow[];
};

type VerificationRow = {
  label: string;
  source_url: string | null;
  source_type: string | null;
  evidence_quote: string | null;
  rationale: string;
  verifier: string;
};

type SourceEvidenceRow = {
  url: string;
  source_type: string;
  fetch_status: number | null;
  title: string | null;
  excerpt: string | null;
  mentions_subject: boolean | null;
};

async function loadV3Audit(auditId: string) {
  const supabase = supabaseAdmin();

  const { data: audit, error: auditError } = await supabase
    .from("audits_v2")
    .select(
      "id, subject_id, mode, rubric_version, status, started_at, completed_at, composite_score, readiness_score, visibility_score, tier, query_count, engine_count, errors"
    )
    .eq("id", auditId)
    .single<AuditRow>();
  if (auditError || !audit) return null;

  const [subjectRes, driversRes, outcomeRes, claimsRes, sourcesRes] = await Promise.all([
    supabase
      .from("subjects")
      .select("canonical_name, aliases, industry, subject_type, url, location, buyer_type, problem")
      .eq("id", audit.subject_id)
      .single<SubjectRow>(),
    supabase
      .from("audit_driver_scores")
      .select("dimension_id, band_value, band_insufficient, justification")
      .eq("audit_id", auditId)
      .order("dimension_id")
      .returns<DriverRow[]>(),
    supabase
      .from("audit_outcome_scores")
      .select(
        "visibility, representation_accuracy, claim_support, context_preservation, recommendation_quality, stability, ai_visibility_score, ai_readiness_score, ai_business_accuracy_score, ai_business_accuracy_index, tier"
      )
      .eq("audit_id", auditId)
      .maybeSingle<OutcomeRow>(),
    supabase
      .from("audit_claims")
      .select(
        "id, claim_text, claim_type, subject_name, confidence, audit_claim_verifications(label, source_url, source_type, evidence_quote, rationale, verifier)"
      )
      .eq("audit_id", auditId)
      .order("created_at")
      .returns<ClaimRow[]>(),
    supabase
      .from("audit_source_evidence")
      .select("url, source_type, fetch_status, title, excerpt, mentions_subject")
      .eq("audit_id", auditId)
      .order("source_type")
      .returns<SourceEvidenceRow[]>(),
  ]);

  if (subjectRes.error || !subjectRes.data) return null;

  return {
    audit,
    subject: subjectRes.data,
    drivers: driversRes.data ?? [],
    outcome: outcomeRes.data ?? null,
    claims: claimsRes.data ?? [],
    sources: sourcesRes.data ?? [],
  };
}

export default async function V3AdminAuditPage({
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
          This page is protected. Append <code>?secret=...</code> to the URL.
        </p>
      </main>
    );
  }

  const data = await loadV3Audit(id);
  if (!data) notFound();

  const { audit, subject, drivers, outcome, claims, sources } = data;

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <article className="mx-auto max-w-4xl px-8 py-14">
        <header className="border-b border-tan pb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
            V3 AI Business Accuracy Audit
          </p>
          <h1 className="mt-3 font-serif text-4xl text-forest">{subject.canonical_name}</h1>
          <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
            <Row label="URL">{subject.url}</Row>
            <Row label="Industry">{subject.industry}</Row>
            <Row label="Mode">{audit.mode}</Row>
            <Row label="Rubric">{audit.rubric_version}</Row>
            <Row label="Generated">{formatDate(audit.started_at)}</Row>
            <Row label="Audit ID">
              <code>{audit.id}</code>
            </Row>
          </dl>
        </header>

        <section className="py-10">
          <h2 className="font-serif text-2xl text-forest">Public Scores</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <ScoreCard label="Accuracy Index" value={outcome?.ai_business_accuracy_index ?? audit.composite_score} />
            <ScoreCard label="Readiness" value={outcome?.ai_readiness_score ?? audit.readiness_score} />
            <ScoreCard label="Visibility" value={outcome?.ai_visibility_score ?? audit.visibility_score} />
            <ScoreCard label="Tier" text={outcome?.tier ?? audit.tier ?? "-"} />
          </div>
        </section>

        {outcome && (
          <section className="border-t border-tan py-10">
            <h2 className="font-serif text-2xl text-forest">Measured Outcomes</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Visibility" value={outcome.visibility} />
              <Metric label="Representation Accuracy" value={outcome.representation_accuracy} />
              <Metric label="Claim Support" value={outcome.claim_support} />
              <Metric label="Context Preservation" value={outcome.context_preservation} />
              <Metric label="Recommendation Quality" value={outcome.recommendation_quality} />
              <Metric label="Stability" value={outcome.stability} />
            </div>
          </section>
        )}

        <section className="border-t border-tan py-10">
          <h2 className="font-serif text-2xl text-forest">Readiness Drivers</h2>
          <div className="mt-5 space-y-4">
            {drivers.map((driver) => (
              <div key={driver.dimension_id} className="border-l-2 border-gold pl-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-serif text-xl text-forest">
                    {driverName(driver.dimension_id)}
                  </h3>
                  <p className="font-mono text-sm text-moss">
                    {driver.band_insufficient ? "insufficient evidence" : `${driver.band_value ?? "-"} / 5`}
                  </p>
                </div>
                {driver.justification && <p className="mt-2 text-sm">{driver.justification}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-tan py-10">
          <h2 className="font-serif text-2xl text-forest">Claims and Support</h2>
          <div className="mt-5 space-y-5">
            {claims.length === 0 && <p className="text-moss">No claims extracted.</p>}
            {claims.map((claim) => {
              const verification = claim.audit_claim_verifications?.[0];
              return (
                <div key={claim.id} className="border border-tan bg-white p-5">
                  <p className="text-xs uppercase tracking-widest text-moss">{claim.claim_type}</p>
                  <p className="mt-2 font-serif text-lg text-charcoal">{claim.claim_text}</p>
                  {verification && (
                    <div className="mt-4 text-sm">
                      <p>
                        <strong className="text-forest">Support:</strong>{" "}
                        {supportLabel(verification.label)}
                      </p>
                      {verification.source_url && (
                        <p className="mt-1 break-all text-moss">{verification.source_url}</p>
                      )}
                      {verification.rationale && <p className="mt-2">{verification.rationale}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t border-tan py-10">
          <h2 className="font-serif text-2xl text-forest">Source Evidence</h2>
          <div className="mt-5 space-y-4">
            {sources.length === 0 && <p className="text-moss">No source evidence collected.</p>}
            {sources.slice(0, 20).map((source) => (
              <div key={source.url} className="border border-tan bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs uppercase tracking-widest text-moss">
                    {source.source_type} - status {source.fetch_status ?? "-"}
                  </p>
                  <p className="text-xs text-moss">
                    {source.mentions_subject ? "mentions subject" : "subject not found"}
                  </p>
                </div>
                <p className="mt-2 break-all text-sm text-forest">{source.url}</p>
                {source.title && <p className="mt-2 font-semibold">{source.title}</p>}
                {source.excerpt && <p className="mt-2 text-sm text-moss">{source.excerpt.slice(0, 360)}</p>}
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-moss">{label}</dt>
      <dd className="break-words">{children}</dd>
    </>
  );
}

function ScoreCard({ label, value, text }: { label: string; value?: number | null; text?: string }) {
  return (
    <div className="border border-tan bg-white p-5">
      <p className="text-xs uppercase tracking-widest text-moss">{label}</p>
      <p className="mt-2 font-serif text-3xl text-forest">
        {text ?? (value == null ? "-" : value.toFixed(1))}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-tan bg-white p-4">
      <p className="text-sm text-moss">{label}</p>
      <p className="mt-1 font-mono text-lg text-forest">{Math.round(value * 100)}%</p>
    </div>
  );
}

function driverName(id: string) {
  return id
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function supportLabel(label: string) {
  return label.replace(/_/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: process.env.CRON_TIMEZONE ?? "America/Los_Angeles",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
