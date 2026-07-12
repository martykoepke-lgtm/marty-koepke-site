import { notFound } from "next/navigation";
import { supabaseAdmin, getImprovements } from "@practical-informatics/avi";
import type {
  V3OutcomeId,
  V3ReadinessDriverId,
  V3Improvement,
} from "@practical-informatics/avi";

export const dynamic = "force-dynamic";

const READINESS_DRIVERS: Array<{
  id: V3ReadinessDriverId;
  name: string;
  weight: string;
  plain_question: string;
  signals: string[];
}> = [
  {
    id: "business_clarity",
    name: "Business clarity",
    weight: "25%",
    plain_question: "Can AI tell what this business is and who it helps?",
    signals: [
      "Official name and aliases",
      "Category clarity",
      "Services and offers",
      "Location or service area",
      "Audience fit",
      "About-page explanation",
      "Best-fit language",
    ],
  },
  {
    id: "source_support",
    name: "Source support",
    weight: "25%",
    plain_question: "Is there enough evidence for AI to believe and repeat the right facts?",
    signals: [
      "Website evidence",
      "Google Business Profile",
      "Directory consistency",
      "Reviews",
      "Articles, profiles, podcasts, awards",
      "Case studies and testimonials",
      "Independent corroboration",
    ],
  },
  {
    id: "ai_readability",
    name: "AI readability",
    weight: "20%",
    plain_question: "Is the business easy for AI systems to read?",
    signals: [
      "Crawlability",
      "Page structure",
      "Clear headings",
      "Internal links",
      "Service pages",
      "FAQs",
      "Schema and structured data",
      "Stable source URLs",
    ],
  },
  {
    id: "distinctive_point_of_view",
    name: "Distinctive point of view",
    weight: "15%",
    plain_question: "Does AI have a real reason to choose this business?",
    signals: [
      "Unique method or framework",
      "Clear specialization",
      "Point of view",
      "Differentiated claims",
      "Evidence for the difference",
      "Clear tradeoffs",
      "For-and-not-for language",
    ],
  },
  {
    id: "recommendation_fit",
    name: "Recommendation fit",
    weight: "15%",
    plain_question: "Does AI know when this business is an appropriate recommendation?",
    signals: [
      "Ideal customer profile",
      "Use cases",
      "Problems solved",
      "Buying situations",
      "Budget or fit signals",
      "Contraindications",
      "Competitor and alternative context",
    ],
  },
];

const OUTCOMES: Array<{
  id: V3OutcomeId;
  name: string;
  plain_question: string;
  description: string;
}> = [
  {
    id: "visibility",
    name: "Visibility",
    plain_question: "Does the business show up?",
    description:
      "Presence, citation, share of voice, and prominence in the answer — captured live from real AI prompts.",
  },
  {
    id: "representation_accuracy",
    name: "Representation accuracy",
    plain_question: "Did AI get the basic facts right?",
    description:
      "Name, category, location, services, audience — every factual claim verified against your real sources.",
  },
  {
    id: "claim_support",
    name: "Claim support",
    plain_question: "Can we prove what AI said?",
    description:
      "Each claim labeled: supported by an owned source · supported by an independent source · unsupported · contradicted · stale · AI misrepresentation.",
  },
  {
    id: "context_preservation",
    name: "Context preservation",
    plain_question: "Did AI keep what makes you different?",
    description:
      "Whether the description carries your category, specialization, and differentiator — or blurs you into the category average.",
  },
  {
    id: "recommendation_quality",
    name: "Recommendation quality",
    plain_question: "Was the recommendation fair and right-fit?",
    description:
      "Whether you were recommended for the situations you actually serve — not for wrong-fit ones.",
  },
  {
    id: "stability",
    name: "Stability",
    plain_question: "Is this a real result, or a lucky one-off?",
    description:
      "Whether results hold across prompts, engines, repetitions, and time. Feeds both Visibility and Accuracy.",
  },
];

const TIERS = [
  {
    name: "Invisible",
    range: "0–19",
    description:
      "AI does not surface the business for relevant prompts. Often a foundation problem more than a marketing one.",
  },
  {
    name: "Overlooked",
    range: "20–39",
    description:
      "AI sometimes names the business, but rarely the first time and rarely with the right detail.",
  },
  {
    name: "Emerging",
    range: "40–59",
    description:
      "Base infrastructure exists. Two or three focused moves usually shift the score 10 to 20 points.",
  },
  {
    name: "Discoverable",
    range: "60–79",
    description:
      "AI finds the business reliably. Work shifts to defending and deepening, not adding more.",
  },
  {
    name: "Agent-Ready",
    range: "80–100",
    description:
      "AI treats the business as a primary source. Maintenance is real but smaller than the work that got them here.",
  },
];

async function getAuditMode(id: string): Promise<{ mode: string; rubric_version: string } | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("audits_v2")
    .select("mode, rubric_version")
    .eq("id", id)
    .maybeSingle();
  return data as { mode: string; rubric_version: string } | null;
}

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await getAuditMode(id);
  if (!audit) notFound();

  const isFree = audit.mode === "free";

  return (
    <div className="space-y-8">
      <header className="border-b border-tan/30 pb-4">
        <div className="text-[11px] uppercase tracking-widest text-tan">
          Methodology
        </div>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-cream">
          How we score your AI Business Accuracy
        </h1>
        <p className="mt-2 text-sm text-tan">
          Every score traces to observable evidence and every band cites the
          research it's based on.
        </p>
      </header>

      <section className="max-w-3xl">
        <p className="font-serif text-lg leading-relaxed text-cream">
          Your overall score is a weighted blend of three things: how AI-ready
          your business is on paper, how often AI actually surfaces you in the
          wild, and how truthfully AI describes you when it does. Each comes
          from observable evidence. None comes from opinion.
        </p>
      </section>

      <Architecture />

      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-cream">Five readiness drivers</h2>
        <p className="mt-1 text-sm text-tan">
          The work on your site and the third-party platforms AI cites. Scored
          from observable evidence — no opinion.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {READINESS_DRIVERS.map((driver) => (
            <DimensionCard
              key={driver.id}
              name={driver.name}
              weight={driver.weight}
              plainQuestion={driver.plain_question}
              signals={driver.signals}
              improvements={getImprovements(driver.id)}
            />
          ))}
        </div>
      </section>

      {isFree ? (
        <PaidTeaser />
      ) : (
        <section>
          <h2 className="text-2xl sm:text-3xl font-semibold text-cream">Six measured outcomes</h2>
          <p className="mt-1 text-sm text-tan">
            What AI actually does when we ask it the questions your buyer asks.
            Captured live, then scored from the responses.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {OUTCOMES.map((outcome) => (
              <OutcomeCard
                key={outcome.id}
                name={outcome.name}
                plainQuestion={outcome.plain_question}
                description={outcome.description}
                improvements={getImprovements(outcome.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl sm:text-3xl font-semibold text-cream">The five tiers</h2>
        <p className="mt-1 text-sm text-tan">
          Where the overall score lands. Same scale for every business we
          audit, locked in code, stamped on every report.
        </p>
        <div className="mt-4 overflow-hidden rounded border border-tan/30">
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={`flex items-baseline gap-5 px-5 py-3 ${
                i < TIERS.length - 1 ? "border-b border-tan/20" : ""
              } bg-forest-dark`}
            >
              <div className="w-32 text-base font-semibold text-cream">
                {tier.name}
              </div>
              <div className="w-20 text-sm text-gold">{tier.range}</div>
              <div className="flex-1 text-sm text-cream">
                {tier.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded bg-forest-dark p-6">
        <h2 className="text-xl font-semibold text-cream">
          What the free check reports — and what only the paid audit can
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-tan">
              Free AI Readiness Check
            </div>
            <p className="mt-2 text-sm text-cream leading-relaxed">
              Reads your public site and scores your five readiness drivers.
              Reports readiness only. Never claims AI mentions, names, or
              recommends you — that's a live measurement we don't run for free.
            </p>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gold">
              Paid Audit
            </div>
            <p className="mt-2 text-sm text-cream leading-relaxed">
              Adds the live measurement. Asks ChatGPT, Claude, Perplexity, and
              Gemini your buyer's questions, captures the full responses,
              verifies every claim against real sources, and runs the
              lightweight readiness pass on the competitors you name.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-tan/30 pt-4 text-[11px] text-tan leading-relaxed">
        Every score traces to observable evidence. The math is locked in code
        for reproducibility. Old audits remain traceable internally to the
        scoring method used at the time.
      </footer>
    </div>
  );
}

function Architecture() {
  return (
    <section className="rounded-lg bg-forest-dark p-6">
      <div className="mb-4 text-[11px] uppercase tracking-widest text-gold">
        The architecture, in one view
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ScoreColumn
          title="Readiness"
          weight="40% of overall"
          subtitle="Made of five drivers:"
          rows={[
            "Business clarity · 25%",
            "Source support · 25%",
            "AI readability · 20%",
            "Distinctive POV · 15%",
            "Recommendation fit · 15%",
          ]}
        />
        <ScoreColumn
          title="Visibility"
          weight="40% of overall"
          subtitle="Made of two outcomes:"
          rows={[
            "Visibility outcome · 70%",
            "(presence, citation, share of voice, prominence)",
            "Stability · 30%",
          ]}
        />
        <ScoreColumn
          title="Accuracy"
          weight="20% of overall"
          subtitle="Made of five outcomes:"
          rows={[
            "Representation accuracy · 30%",
            "Claim support · 25%",
            "Context preservation · 20%",
            "Recommendation quality · 15%",
            "Stability · 10%",
          ]}
        />
      </div>

      <div className="mt-5 rounded border border-gold/40 bg-gold/10 px-4 py-3">
        <div className="text-[11px] uppercase tracking-widest text-gold">
          Overall
        </div>
        <div className="mt-1 text-base font-semibold text-cream">
          0.40 × Readiness + 0.40 × Visibility + 0.20 × Accuracy
        </div>
      </div>
    </section>
  );
}

function ScoreColumn({
  title,
  weight,
  subtitle,
  rows,
}: {
  title: string;
  weight: string;
  subtitle: string;
  rows: string[];
}) {
  return (
    <div className="rounded border-t-2 border-gold bg-forest-dark p-4">
      <div className="text-lg font-semibold text-cream">{title}</div>
      <div className="text-[11px] uppercase tracking-widest text-gold">
        {weight}
      </div>
      <div className="mt-3 border-t border-gold/30 pt-3 text-xs text-cream">
        {subtitle}
      </div>
      <div className="mt-2 space-y-1 text-xs text-cream leading-relaxed">
        {rows.map((row, i) => (
          <div key={i}>{row}</div>
        ))}
      </div>
    </div>
  );
}

function DimensionCard({
  name,
  weight,
  plainQuestion,
  signals,
  improvements,
}: {
  name: string;
  weight: string;
  plainQuestion: string;
  signals: string[];
  improvements: V3Improvement[];
}) {
  return (
    <div className="rounded bg-forest-dark p-5 text-cream">
      <div className="flex items-baseline justify-between">
        <div className="text-base font-semibold text-cream">{name}</div>
        <div className="text-[11px] font-medium text-gold">
          weight {weight}
        </div>
      </div>
      <p className="mt-1 text-sm italic text-cream">"{plainQuestion}"</p>
      <p className="mt-3 text-xs leading-relaxed text-tan">
        {signals.join(" · ")}
      </p>
      {improvements.length > 0 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-[11px] text-gold hover:text-cream transition-colors list-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">What good looks like →</span>
            <span className="hidden group-open:inline">Hide tactics ↓</span>
          </summary>
          <div className="mt-2 space-y-2.5 border-t border-tan/40 pt-3">
            {improvements.map((imp, i) => (
              <ImprovementBlock key={i} improvement={imp} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function OutcomeCard({
  name,
  plainQuestion,
  description,
  improvements,
}: {
  name: string;
  plainQuestion: string;
  description: string;
  improvements: V3Improvement[];
}) {
  return (
    <div className="rounded border border-tan/30 bg-forest-dark p-5 text-cream">
      <div className="text-base font-semibold text-cream">{name}</div>
      <p className="mt-1 text-sm italic text-cream">"{plainQuestion}"</p>
      <p className="mt-2 text-xs leading-relaxed text-tan">
        {description}
      </p>
      {improvements.length > 0 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-[11px] text-gold hover:text-cream transition-colors list-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">What good looks like →</span>
            <span className="hidden group-open:inline">Hide tactics ↓</span>
          </summary>
          <div className="mt-2 space-y-2.5 border-t border-tan/40 pt-3">
            {improvements.map((imp, i) => (
              <ImprovementBlock key={i} improvement={imp} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ImprovementBlock({ improvement }: { improvement: V3Improvement }) {
  return (
    <div>
      <div className="text-[12px] font-medium text-cream leading-snug">
        {improvement.tactic}
      </div>
      <div className="mt-0.5 text-[11px] text-tan leading-relaxed">
        {improvement.rationale}
      </div>
      <a
        href={improvement.source.url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block text-[10px] text-gold hover:text-cream underline underline-offset-2"
      >
        Source: {improvement.source.label}
      </a>
    </div>
  );
}

function PaidTeaser() {
  return (
    <section className="rounded-lg border border-gold/40 bg-forest-dark p-6">
      <div className="text-[11px] uppercase tracking-widest text-gold">
        What you're not seeing yet
      </div>
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-cream">
        Six measured outcomes — paid only
      </h2>
      <p className="mt-3 text-sm text-cream leading-relaxed max-w-2xl">
        Your free check scored your readiness. The paid audit adds the live
        measurement layer: we ask ChatGPT, Claude, Perplexity, and Gemini your
        buyer's questions and watch what each one actually says. Then we verify
        every claim against your real sources.
      </p>
      <p className="mt-3 text-sm text-cream leading-relaxed max-w-2xl">
        We measure six outcomes you can't see right now: <em>visibility</em>{" "}
        (how often AI surfaces you), <em>representation accuracy</em> (whether
        AI gets your facts right), <em>claim support</em> (whether your sources
        actually back what AI says about you), <em>context preservation</em>{" "}
        (whether AI keeps what makes you different), <em>recommendation
        quality</em> (whether AI recommends you for right-fit situations), and{" "}
        <em>stability</em> (whether the result holds across engines and time).
      </p>
      <p className="mt-3 text-sm text-cream leading-relaxed max-w-2xl">
        The paid audit also runs the lightweight readiness pass on competitors
        you name — so you can see how AI positions you next to them, not just
        where you stand alone.
      </p>
    </section>
  );
}
