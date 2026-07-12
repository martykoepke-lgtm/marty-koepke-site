"use client";

/**
 * Shared render surface for the free Daizie readiness report.
 *
 * Rendered identically in two places:
 *   - Post-email on-screen result in <FreeScanFlow /> (/scan)
 *   - Token-gated report page (/scan/report/[id])
 *
 * Layout (top → bottom):
 *   1. TierHeatmap        — big score, 5-tier heatmap, marker at your score
 *   2. MasterKeysCard     — profiles AI reads for your business type
 *   3. DriverHeatmapTiles — five drivers, each with a universal short
 *                            description and a 0–5 mini heatmap
 *   4. OpportunityCards   — two lowest-scoring drivers with the
 *                            diagnosis and the START HERE nudge
 *   5. PaidTeaserCard     — what the paid Assessment adds
 *
 * All components are pure — no hooks, no side effects. Marked "use client"
 * so they can be imported directly by <FreeScanFlow /> (a client component)
 * without a server/client boundary error.
 */

import {
  getStartHereNudge,
  V3_READINESS_DRIVER_DEFINITIONS,
  type StartHereCrawlerSignals,
  type V3ReadinessDriverId,
} from "@practical-informatics/avi/client";

type Tier =
  | "invisible"
  | "hidden"
  | "faintly-visible"
  | "discoverable"
  | "agent-ready";

export type Dimension = {
  id: string;
  name: string;
  score: number | null;
};

export type Finding = {
  dimensionId: string;
  dimensionName: string;
  score: number | null;
  summary: string;
};

const MASTER_KEY_LANE_LABEL: Record<
  MasterKeyReportShape["lane"],
  string
> = {
  local: "Local & brick-and-mortar",
  services: "Advice-driven services",
  product: "Products & software",
};

export type MasterKeyCheck = {
  id: string;
  label: string;
  found: boolean;
  evidenceUrl?: string;
  evidenceTitle?: string;
  notes?: string;
  remediationOptions?: string[];
};

export type MasterKeyReportShape = {
  lane: "local" | "services" | "product";
  checks: MasterKeyCheck[];
  presentCount: number;
  totalChecks: number;
  headline: string;
};

// ---------------------------------------------------------------------------
// Tier metadata (shared source of truth for the heatmap)
// ---------------------------------------------------------------------------

const TIERS: ReadonlyArray<{
  key: Tier;
  label: string;
  color: string;
  from: number;
  to: number;
}> = [
  { key: "invisible", label: "Invisible", color: "#C25E4A", from: 0, to: 20 },
  { key: "hidden", label: "Hidden", color: "#D4923F", from: 20, to: 40 },
  { key: "faintly-visible", label: "Faintly Visible", color: "#C9A961", from: 40, to: 60 },
  { key: "discoverable", label: "Discoverable", color: "#7A9878", from: 60, to: 80 },
  { key: "agent-ready", label: "Agent-Ready", color: "#1F3A2E", from: 80, to: 100 },
];

const TIER_SENTENCE: Record<Tier, string> = {
  invisible:
    "AI tools don't currently surface this business when buyers ask. Strong signals are missing, but the fixes are mostly practical.",
  hidden:
    "AI tools can find this business if pressed, but won't recommend it on their own yet. A handful of structured fixes change that.",
  "faintly-visible":
    "AI tools mention this business sometimes, but inconsistently. You're in the conversation — not yet at the top of it.",
  discoverable:
    "AI tools recognize this business as a credible answer. Closing the remaining gaps moves you to a default recommendation.",
  "agent-ready":
    "AI tools surface this business confidently across the queries that matter. You're set up to compound visibility, not chase it.",
};

// ---------------------------------------------------------------------------
// 1. TierHeatmap — big score with 5-tier heatmap
// ---------------------------------------------------------------------------

export function TierHeatmap({
  readinessScore,
  tier,
}: {
  readinessScore: number; // 0–1
  tier: Tier;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(readinessScore * 100)));
  const sentence = TIER_SENTENCE[tier];
  const tierLabel = TIERS.find((t) => t.key === tier)?.label ?? "";

  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Your AI Readiness</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "baseline", marginTop: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "3.5rem",
            lineHeight: 1,
            fontWeight: 500,
            color: "var(--dz-forest)",
          }}
        >
          {pct}
        </span>
        <span style={{ fontSize: "1rem", color: "#56675c" }}>/ 100</span>
        <span
          style={{
            marginLeft: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "var(--dz-forest)",
            color: "var(--dz-cream)",
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "0.95rem",
            fontWeight: 500,
          }}
        >
          {tierLabel}
        </span>
      </div>

      <p style={{ marginTop: 14, maxWidth: 640 }}>{sentence}</p>

      {/* Heatmap */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`AI Readiness Score — ${tierLabel}, ${pct} out of 100`}
        style={{ marginTop: 26, position: "relative" }}
      >
        {/* 5-segment colored bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            height: 14,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,.08)",
          }}
        >
          {TIERS.map((t) => (
            <div
              key={t.key}
              style={{
                background: t.color,
                opacity: 0.85,
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Marker */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -6,
            left: `calc(${pct}% - 10px)`,
            width: 20,
            height: 26,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 2,
              background: "var(--dz-charcoal, #2C2A26)",
              boxShadow: "0 0 0 1px rgba(255,255,255,.7)",
            }}
          />
        </div>

        {/* Tier labels below */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            marginTop: 8,
            fontSize: "0.68rem",
            letterSpacing: "0.06em",
            color: "#56675c",
          }}
        >
          {TIERS.map((t) => (
            <div
              key={t.key}
              style={{
                textAlign: "center",
                fontWeight: t.key === tier ? 700 : 400,
                color: t.key === tier ? "var(--dz-forest)" : undefined,
              }}
            >
              <div>{t.label}</div>
              <div style={{ opacity: 0.7 }}>
                {t.from}–{t.to}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. MasterKeysCard — profiles AI reads for your business type
// ---------------------------------------------------------------------------

export function MasterKeysCard({ report }: { report: MasterKeyReportShape }) {
  const laneLabel = MASTER_KEY_LANE_LABEL[report.lane];

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

// ---------------------------------------------------------------------------
// 3. DriverHeatmapTiles — five drivers with universal descriptions + heatmap
// ---------------------------------------------------------------------------

const DRIVER_SHORT_DESCRIPTION: Record<V3ReadinessDriverId, string> = {
  business_clarity:
    "Can AI tell who you are, what you do, who you help, and where you work?",
  source_support:
    "Are your important claims backed by proof that AI can read?",
  ai_readability:
    "Is your website structured so AI systems can actually parse it?",
  distinctive_point_of_view:
    "Do you have a clear, supportable reason to be recommended over alternatives?",
  recommendation_fit:
    "Is it clear when you're the right recommendation — and when you're not?",
};

export function DriverHeatmapTiles({
  dimensions,
}: {
  dimensions: Dimension[];
}) {
  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Score breakdown</p>
      <h3>The five things that make up your readiness</h3>
      <p className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>
        Each driver is scored 0–5 against observable public evidence. The
        two lowest-scoring drivers become your priority opportunities
        below.
      </p>
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {dimensions.map((d) => (
          <DriverTile key={d.id} dim={d} />
        ))}
      </div>
    </section>
  );
}

function DriverTile({ dim }: { dim: Dimension }) {
  const score = typeof dim.score === "number" ? dim.score : 0;
  const description =
    DRIVER_SHORT_DESCRIPTION[dim.id as V3ReadinessDriverId] ??
    V3_READINESS_DRIVER_DEFINITIONS[dim.id as V3ReadinessDriverId]
      ?.plain_question ??
    "";
  const pct = (score / 5) * 100;

  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 14,
        border: "1px solid rgba(23, 62, 44, .12)",
        background: "rgba(255, 255, 255, .6)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "1.05rem",
            fontWeight: 500,
            color: "var(--dz-forest)",
          }}
        >
          {dim.name}
        </span>
        <span
          style={{
            fontSize: "1rem",
            fontFamily: "var(--font-serif), Georgia, serif",
            color: "var(--dz-gold-dark, #A8893F)",
          }}
        >
          {typeof dim.score === "number" ? dim.score.toFixed(1) : "—"} / 5
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "#4a5b52" }}>
        {description}
      </p>
      {/* Mini 0–5 heatmap */}
      <div
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={`${dim.name}: ${dim.score ?? "—"} out of 5`}
        style={{ position: "relative", marginTop: 4 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,.08)",
          }}
        >
          {TIERS.map((t) => (
            <div key={t.key} style={{ background: t.color, opacity: 0.75 }} aria-hidden="true" />
          ))}
        </div>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -3,
            left: `calc(${pct}% - 7px)`,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "var(--dz-charcoal, #2C2A26)",
            border: "2px solid var(--dz-cream, #FAF6EE)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. OpportunityCards — two lowest-scoring drivers with the diagnosis + nudge
// ---------------------------------------------------------------------------

export function OpportunityCards({
  dimensions,
  findings,
  crawler,
}: {
  dimensions: Dimension[];
  findings: Finding[];
  crawler?: StartHereCrawlerSignals | null;
}) {
  // Two lowest-scoring drivers, ties broken by driver order.
  const scored = dimensions.filter(
    (d): d is Dimension & { score: number } => typeof d.score === "number"
  );
  const twoLowest = [...scored].sort((a, b) => a.score - b.score).slice(0, 2);
  if (twoLowest.length === 0) return null;

  const findingByDimensionId = new Map(
    findings.map((f) => [f.dimensionId, f])
  );

  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Opportunities to improve</p>
      <h3>Your two biggest opportunities</h3>
      <p className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>
        The two drivers with the most room to move — what we saw, and the
        specific next step for each.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
        {twoLowest.map((d) => (
          <OpportunityCard
            key={d.id}
            dim={d}
            finding={findingByDimensionId.get(d.id)}
            crawler={crawler}
          />
        ))}
      </div>
    </section>
  );
}

function OpportunityCard({
  dim,
  finding,
  crawler,
}: {
  dim: Dimension;
  finding: Finding | undefined;
  crawler?: StartHereCrawlerSignals | null;
}) {
  const nudge = getStartHereNudge(
    dim.id as V3ReadinessDriverId,
    dim.score,
    crawler ?? null
  );

  return (
    <div
      style={{
        padding: "18px 20px",
        borderRadius: 14,
        border: "1px solid rgba(23, 62, 44, .12)",
        background: "rgba(255, 255, 255, .7)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "1.15rem",
            fontWeight: 500,
            color: "var(--dz-forest)",
          }}
        >
          {dim.name}
        </span>
        <span
          style={{
            fontSize: "1rem",
            fontFamily: "var(--font-serif), Georgia, serif",
            color: "var(--dz-gold-dark, #A8893F)",
          }}
        >
          {typeof dim.score === "number" ? dim.score.toFixed(1) : "—"} / 5
        </span>
      </div>
      {finding?.summary && (
        <p style={{ marginTop: 12, fontSize: "0.94rem", lineHeight: 1.6, color: "var(--dz-charcoal, #2C2A26)" }}>
          {finding.summary}
        </p>
      )}
      {nudge && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 10,
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
              color: "var(--dz-charcoal, #2C2A26)",
            }}
          >
            {nudge}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. PaidTeaserCard — what the paid Assessment adds
// ---------------------------------------------------------------------------

export function PaidTeaserCard() {
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
      <h3>A calibrated AI agent. A human review of the output.</h3>
      <p style={{ marginTop: 10 }}>
        Daizie is a carefully calibrated AI agent that generates your
        Assessment against Marty's proprietary rubric — live responses
        from four AI engines, every claim verified, every recommendation
        tied to a research-backed reason it works. Marty personally
        reviews the generated Assessment before it reaches you, then
        walks you through it on a 30-minute call. You leave with a
        clear optimization strategy tuned to your business type.
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
          title="Marty's review before delivery + a walk-through call"
          body="The Assessment is generated by Daizie against Marty's rubric. Before it reaches you, Marty reads it herself — checking the evidence, the framing for your business type, and that every recommendation is actionable. Then a 30-minute review call: you go through the Assessment together and leave with a clear plan."
        />
        <PaidBullet
          title="Live AI transcripts — 4 engines, 32 responses"
          body="Daizie runs 8 buyer-question queries against ChatGPT, Claude, Perplexity, and Gemini. You get every response captured, timestamped, and saved — the evidence behind every recommendation."
        />
        <PaidBullet
          title="Claim-by-claim verification"
          body="Every factual claim AI makes about you gets labeled — supported, unsupported, contradicted, stale, ambiguous, or not verifiable — with a source excerpt showing where the truth lives. This is the accuracy layer the free scan can't reach."
        />
        <PaidBullet
          title="Competitor comparison quadrant"
          body="You name two competitors. Daizie plots all three of you on a Readiness × Visibility chart across the same 8 queries. You see where you stand — and where you can move — with the evidence, not a guess."
        />
        <PaidBullet
          title="Priority-ranked playbook, backed by research"
          body="Not a generic checklist. Three readiness fixes and three accuracy fixes, ranked by what AI is actually saying (or misrepresenting) about you today, each tied to the published research that says the fix works."
        />
      </ul>
      <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
        <a
          href="/ai-visibility"
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
          fontSize: "0.9rem",
          lineHeight: 1.6,
          color: "var(--dz-charcoal, #2C2A26)",
        }}
      >
        {body}
      </p>
    </li>
  );
}
