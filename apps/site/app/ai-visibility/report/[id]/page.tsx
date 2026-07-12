import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getImprovements, supabaseAdmin } from "@practical-informatics/avi";
import type { V3DimensionId, V3Improvement } from "@practical-informatics/avi";

export const dynamic = "force-dynamic";

const READINESS_DRIVERS: Array<{
  id: V3DimensionId;
  name: string;
  plain_question: string;
}> = [
  {
    id: "business_clarity",
    name: "Business clarity",
    plain_question: "Can AI tell what this business is and who it helps?",
  },
  {
    id: "source_support",
    name: "Source support",
    plain_question: "Is there enough evidence for AI to believe the right facts?",
  },
  {
    id: "ai_readability",
    name: "AI readability",
    plain_question: "Is the business easy for AI systems to read?",
  },
  {
    id: "distinctive_point_of_view",
    name: "Distinctive point of view",
    plain_question: "Does AI have a real reason to choose this business?",
  },
  {
    id: "recommendation_fit",
    name: "Recommendation fit",
    plain_question: "Does AI know when this is an appropriate recommendation?",
  },
];

interface DriverRow {
  dimension_id: string;
  band_value: number | null;
  band_insufficient: boolean;
  justification: string | null;
}

// Legacy dimension id mapping so older free audits still render under the
// current free report. Older scoring used short codes; current reports use
// plain-English driver ids.
const V2_TO_V3: Record<string, string> = {
  D1: "business_clarity",
  D2: "source_support",
  D3: "ai_readability",
  D4: "distinctive_point_of_view",
  D6: "recommendation_fit",
};

async function loadReport(id: string) {
  const supabase = supabaseAdmin();
  const [auditRes, snapshotRes, driversRes] = await Promise.all([
    supabase
      .from("audits_v2")
      .select("id, mode, rubric_version, started_at, readiness_score, tier")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("audit_subjects_snapshot")
      .select("canonical_name, url")
      .eq("audit_id", id)
      .maybeSingle(),
    supabase
      .from("audit_driver_scores")
      .select("dimension_id, band_value, band_insufficient, justification")
      .eq("audit_id", id),
  ]);
  const normalized = ((driversRes.data ?? []) as DriverRow[]).map((row) => ({
    ...row,
    dimension_id: V2_TO_V3[row.dimension_id] ?? row.dimension_id,
  }));
  return {
    audit: auditRes.data,
    snapshot: snapshotRes.data,
    drivers: normalized,
  };
}

export default async function ReportBase({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { audit, snapshot, drivers } = await loadReport(id);
  if (!audit) notFound();

  if (audit.mode !== "free") {
    // Paid audits don't have a customer-facing live report page on the site yet
    // — operator view lives in the console at /audits/[id]/v31. For now, send
    // them to methodology so they see something coherent.
    redirect(`/ai-visibility/report/${id}/methodology`);
  }

  const driverByDimensionId = new Map(
    drivers.map((d) => [d.dimension_id, d])
  );
  const readinessScore = num(audit.readiness_score);
  const tierLabel = audit.tier ?? tierFromScore(readinessScore);

  return (
    <div className="space-y-8">
      <header className="rounded-lg bg-forest-dark p-5">
        <div className="text-[11px] uppercase tracking-widest text-gold">
          Free AI readiness check
        </div>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-cream">
          {snapshot?.canonical_name ?? "Your readiness report"}
        </h1>
        <p className="mt-2 text-sm text-tan">
          Run {new Date(audit.started_at).toLocaleDateString()} ·{" "}
          {snapshot?.url}
        </p>
      </header>

      <section className="rounded-lg bg-forest-dark p-6">
        <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-2">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gold">
              Your AI readiness
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-5xl font-semibold text-cream">
                {Math.round(readinessScore)}
              </span>
              <span className="text-xl text-tan">
                / 100
              </span>
              <span className="text-xl text-gold ml-2">
                {tierLabel}
              </span>
            </div>
            <p className="mt-3 text-sm text-cream leading-relaxed max-w-md">
              {tierLine(tierLabel)}
            </p>
          </div>
          <div className="text-sm text-cream leading-relaxed">
            <p>
              Readiness is the work AI can see on your public site. It's the
              foundation that determines whether AI can find, understand, and
              correctly describe your business when buyers ask.
            </p>
            <p className="mt-2 text-tan">
              This free check reports readiness only. It does not measure how
              often AI actually surfaces you — that's the paid audit.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-forest-dark p-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-cream">
          The five things that make up your readiness
        </h2>
        <p className="mt-1 text-sm text-tan">
          Each one scored 0–100 against observable evidence on your site. Click
          any row to see what good looks like.
        </p>

        <div className="mt-4">
          <ScaleLegend />
          <div className="mt-4 space-y-3">
            {READINESS_DRIVERS.map((driver) => {
              const row = driverByDimensionId.get(driver.id);
              const display = row?.band_insufficient
                ? null
                : row?.band_value != null
                ? row.band_value * 20
                : null;
              return (
                <DriverRowDisplay
                  key={driver.id}
                  name={driver.name}
                  plainQuestion={driver.plain_question}
                  score={display}
                  justification={row?.justification ?? null}
                  improvements={getImprovements(driver.id)}
                />
              );
            })}
          </div>
        </div>
      </section>

      <PaidUpgrade auditId={id} />

      <footer className="rounded bg-forest-dark px-4 py-3 text-[11px] text-tan leading-relaxed">
        <Link
          href={`/ai-visibility/report/${id}/methodology`}
          className="text-cream hover:text-gold underline underline-offset-2"
        >
          See the methodology behind this score
        </Link>
        {" · "}
        Every score traces to observable evidence
      </footer>
    </div>
  );
}

function ScaleLegend() {
  return (
    <div className="rounded border border-tan/50 bg-forest-dark px-4 py-2 text-[11px] text-tan">
      <div className="mb-1 flex items-center justify-between">
        <span>0 — weak</span>
        <span>40 — emerging</span>
        <span>60 — strong</span>
        <span>80 — excellent</span>
      </div>
      <div className="relative h-1.5 rounded bg-charcoal">
        <div className="absolute inset-y-0 left-0 w-[40%] bg-gold-dark" />
        <div className="absolute inset-y-0 left-[40%] w-[20%] bg-gold" />
        <div className="absolute inset-y-0 left-[60%] w-[40%] bg-cream" />
      </div>
    </div>
  );
}

function DriverRowDisplay({
  name,
  plainQuestion,
  score,
  justification,
  improvements,
}: {
  name: string;
  plainQuestion: string;
  score: number | null;
  justification: string | null;
  improvements: V3Improvement[];
}) {
  const display = score === null ? "—" : Math.round(score);
  const bar = score === null ? 0 : Math.max(0, Math.min(100, score));
  const weak = score !== null && score < 50;
  const valueColor = weak ? "text-gold" : "text-cream";
  const barColor = weak ? "bg-gold" : "bg-cream";
  return (
    <div className="rounded border border-tan/40 bg-forest-dark p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-cream">{name}</div>
          <div className="text-xs italic text-tan">"{plainQuestion}"</div>
        </div>
        <div className={`text-2xl font-semibold ${valueColor}`}>
          {display}
          <span className="text-[11px] text-tan ml-0.5">/ 100</span>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded bg-charcoal relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barColor}`}
          style={{ width: `${bar}%` }}
        />
        <div className="absolute inset-y-0 left-[40%] w-px bg-tan" />
        <div className="absolute inset-y-0 left-[60%] w-px bg-tan" />
      </div>

      {justification && (
        <p className="mt-3 text-xs text-cream leading-relaxed">
          {justification}
        </p>
      )}

      {improvements.length > 0 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-[11px] text-gold hover:text-cream transition-colors list-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">What good looks like →</span>
            <span className="hidden group-open:inline">Hide tactics ↓</span>
          </summary>
          <div className="mt-3 space-y-3 rounded bg-cream px-4 py-3 text-charcoal">
            {improvements.map((imp, i) => (
              <div key={i}>
                <div className="text-[12px] font-medium text-forest-dark leading-snug">
                  {imp.tactic}
                </div>
                <div className="mt-0.5 text-[11px] text-charcoal leading-relaxed">
                  {imp.rationale}
                </div>
                <a
                  href={imp.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-[10px] text-gold-darker hover:text-forest-dark underline underline-offset-2"
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

function PaidUpgrade({ auditId }: { auditId: string }) {
  return (
    <section className="rounded-lg border-2 border-gold bg-forest-dark p-6">
      <div className="text-[11px] uppercase tracking-widest text-gold">
        What you're not seeing yet
      </div>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-cream">
        The paid audit adds the live measurement layer
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div>
          <div className="text-base font-semibold text-cream">
            What AI actually says about you
          </div>
          <p className="mt-1 text-sm text-cream leading-relaxed">
            We ask ChatGPT, Claude, Perplexity, and Gemini your buyer's
            questions and capture every word each one says about your business.
          </p>
        </div>
        <div>
          <div className="text-base font-semibold text-cream">
            Whether AI's claims are true
          </div>
          <p className="mt-1 text-sm text-cream leading-relaxed">
            Every factual claim AI makes about you gets checked against your
            real sources. Wrong city, wrong service, invented credential — we
            flag it.
          </p>
        </div>
        <div>
          <div className="text-base font-semibold text-cream">
            Where you stand next to competitors
          </div>
          <p className="mt-1 text-sm text-cream leading-relaxed">
            Name two or three competitors and we'll plot you on the same
            Readiness × Visibility chart — so you can see exactly where AI
            puts you in your market.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href={`/ai-visibility/order?from=${auditId}`}
          className="rounded bg-gold px-5 py-2.5 text-sm font-medium text-forest-dark hover:bg-cream transition-colors"
        >
          Start the paid audit
        </Link>
        <Link
          href="/our-framework"
          className="text-sm text-cream hover:text-gold underline underline-offset-2"
        >
          Read more about the framework
        </Link>
      </div>
    </section>
  );
}

function num(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function tierFromScore(score: number): string {
  if (score < 20) return "Invisible";
  if (score < 40) return "Overlooked";
  if (score < 60) return "Emerging";
  if (score < 80) return "Discoverable";
  return "Agent-Ready";
}

function tierLine(tier: string): string {
  switch (tier) {
    case "Invisible":
      return "AI does not surface your business for relevant prompts yet. The foundation work hasn't been laid — that's a fixable problem with specific moves, not a marketing problem.";
    case "Overlooked":
      return "AI sometimes names your business, but rarely the first time and rarely with the right detail. There are a few clear gaps to close.";
    case "Emerging":
      return "Base infrastructure exists. Two or three focused moves usually shift the score 10 to 20 points. This is the most actionable category.";
    case "Discoverable":
      return "AI finds your business reliably. Work shifts to defending and deepening — not adding more.";
    case "Agent-Ready":
      return "AI treats your business as a primary source. Maintenance is real but smaller than the work that got you here.";
    default:
      return "Your readiness profile is unusual — see the driver breakdown below for the specific pattern.";
  }
}
