"use client";

import { useState, type FormEvent } from "react";
import { ArrowRightIcon } from "@/components/ui/Icons";
import {
  getStartHereNudge,
  type StartHereCrawlerSignals,
  type V3ReadinessDriverId,
} from "@practical-informatics/avi/client";

/**
 * The free /scan interactive flow.
 *
 * Three phases on one page:
 *   1. URL form
 *   2. Loading state (progress labels track the pipeline)
 *   3. Result (tier + readiness-driver bars + findings + email gate)
 *
 * No page navigation between phases — the scanId + access token stay
 * in component state and the email gate posts back with them.
 *
 * Turnstile widget loads when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * If it isn't, the form still submits (server-side verify also bypasses
 * cleanly — see lib/avi/turnstile.ts).
 */

type Dimension = { id: string; name: string; score: number | null };
type Finding = {
  dimensionId: string;
  dimensionName: string;
  score: number | null;
  summary: string;
};

type Tier =
  | "invisible"
  | "hidden"
  | "faintly-visible"
  | "discoverable"
  | "agent-ready";

type AudienceLane = "local" | "online_b2b";

type MasterKeyCheck = {
  id: string;
  label: string;
  lane: AudienceLane;
  found: boolean;
  confidence: "high" | "medium" | "low" | "none";
  evidenceUrl?: string;
  evidenceTitle?: string;
  notes?: string;
  remediationOptions?: string[];
};

type MasterKeyReport = {
  lane: AudienceLane;
  checks: MasterKeyCheck[];
  presentCount: number;
  totalChecks: number;
  headline: string;
};

type ScanSuccess = {
  ok: true;
  scanId: string;
  accessToken: string;
  url: string;
  subjectName: string;
  subjectType: "personal_brand" | "company";
  readinessScore: number;
  tier: Tier;
  dimensions: Dimension[];
  findings: Finding[];
  crawler?: CrawlerSnapshot;
  corroboration?: CorroborationSnapshot;
  crawlerReachable: boolean;
  masterKeys?: MasterKeyReport;
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
  founderLikelyNamed?: boolean;
  pricingLikelyVisible?: boolean;
};

type CorroborationSnapshot = {
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

type Phase = "form" | "scanning" | "result" | "email-sent";

const TIER_COPY: Record<
  Tier,
  { label: string; sentence: string; color: string }
> = {
  invisible: {
    label: "Invisible",
    sentence:
      "Your site is missing major readiness signals that help AI understand the business. The fixes are usually practical and specific.",
    color: "bg-red-200 text-red-900",
  },
  hidden: {
    label: "Hidden",
    sentence:
      "Some basic signals are present, but AI systems may still struggle to understand what you do and when you are a good fit.",
    color: "bg-orange-200 text-orange-900",
  },
  "faintly-visible": {
    label: "Faintly Visible",
    sentence:
      "Your business has some readable signals, but important clarity, source, or positioning gaps still need attention.",
    color: "bg-yellow-200 text-yellow-900",
  },
  discoverable: {
    label: "Discoverable",
    sentence:
      "Your business is reasonably readable to AI systems. Closing the remaining gaps should make your positioning easier to preserve.",
    color: "bg-emerald-200 text-emerald-900",
  },
  "agent-ready": {
    label: "Agent-Ready",
    sentence:
      "Your website has strong readiness signals. A paid live-AI review can test whether those signals are showing up in actual AI answers.",
    color: "bg-forest text-cream",
  },
};

export default function FreeScanFlow() {
  const [phase, setPhase] = useState<Phase>("form");
  const [scan, setScan] = useState<ScanSuccess | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [audienceLane, setAudienceLane] = useState<AudienceLane | null>(null);

  async function onSubmitUrl(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    if (!audienceLane) {
      setErrorMsg("Tell us how customers find and hire you — one quick pick.");
      return;
    }
    setPhase("scanning");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          audienceLane,
          // Turnstile token would go here once wired client-side.
          turnstileToken: undefined,
        }),
      });
      const data = (await res.json()) as
        | ScanSuccess
        | { ok: false; error: string };

      if (!res.ok || !data.ok) {
        // TEMPORARY: dump the full error payload to console + UI so we can
        // see what Vercel is actually returning.
        console.error("[/scan] server returned error payload:", data);
        const debugSuffix =
          "stack" in data && data.stack
            ? `\n\nStack:\n${String(data.stack)}`
            : "";
        const envSuffix =
          "env" in data && data.env
            ? `\n\nEnv:\n${JSON.stringify(data.env, null, 2)}`
            : "";
        setErrorMsg(
          `${("error" in data && data.error) || "Something went wrong."}${debugSuffix}${envSuffix}`
        );
        setPhase("form");
        return;
      }

      setScan(data);
      setPhase("result");
    } catch {
      setErrorMsg(
        "We couldn't reach our server. Check your connection and try again."
      );
      setPhase("form");
    }
  }

  if (phase === "form") {
    return (
      <UrlForm
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        audienceLane={audienceLane}
        setAudienceLane={setAudienceLane}
        onSubmit={onSubmitUrl}
        errorMsg={errorMsg}
      />
    );
  }

  if (phase === "scanning") {
    return <Scanning />;
  }

  if (phase === "result" && scan) {
    return (
      <ScanResult
        scan={scan}
        onEmailSent={() => setPhase("email-sent")}
        emailSent={false}
      />
    );
  }

  if (phase === "email-sent" && scan) {
    return <ScanResult scan={scan} onEmailSent={() => undefined} emailSent />;
  }

  return null;
}

// ============================================================================
// Phase 1 — URL form
// ============================================================================

function UrlForm({
  urlInput,
  setUrlInput,
  audienceLane,
  setAudienceLane,
  onSubmit,
  errorMsg,
}: {
  urlInput: string;
  setUrlInput: (v: string) => void;
  audienceLane: AudienceLane | null;
  setAudienceLane: (v: AudienceLane) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  errorMsg: string | null;
}) {
  return (
    <form onSubmit={onSubmit} className="daizie-scan-form" noValidate>
      <fieldset>
        <legend className="daizie-scan-label">
          How do most customers find and hire you?
        </legend>
        <p className="daizie-scan-hint">
          We check the profiles AI actually reads for your kind of business.
        </p>
        <div className="daizie-scan-lanes">
          {(
            [
              {
                value: "local" as const,
                title: "In person",
                sub: "Local & brick-and-mortar — customers come to me, or I go to them.",
              },
              {
                value: "online_b2b" as const,
                title: "Online",
                sub: "Consultants, coaches, agencies — work delivered remotely.",
              },
            ]
          ).map((opt) => {
            const active = audienceLane === opt.value;
            return (
              <label
                key={opt.value}
                className={`daizie-scan-lane${active ? " active" : ""}`}
              >
                <input
                  type="radio"
                  name="audience-lane"
                  value={opt.value}
                  checked={active}
                  onChange={() => setAudienceLane(opt.value)}
                  className="sr-only"
                />
                <span className="lane-title">{opt.title}</span>
                <span className="lane-sub">{opt.sub}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="scan-url" className="daizie-scan-label">
          Your website URL
        </label>
        <input
          id="scan-url"
          name="url"
          type="url"
          required
          autoComplete="url"
          placeholder="https://yourbusiness.com"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="daizie-scan-input"
        />
      </div>

      {errorMsg && (
        <div role="alert" className="daizie-scan-error">
          {errorMsg}
        </div>
      )}

      <button type="submit" className="daizie-btn primary daizie-scan-submit">
        Scan in 30 seconds →
      </button>
      <p className="daizie-scan-footnote">
        No email required to see your tier. Enter your email only if you want
        the hosted report link sent to you.
      </p>
    </form>
  );
}

// ============================================================================
// Phase 2 — Loading
// ============================================================================

function Scanning() {
  return (
    <div className="daizie-scan-loading">
      <p className="font-serif text-lg text-forest">
        Scanning your site…
      </p>
      <ul className="space-y-2 text-sm text-charcoal">
        <li className="flex items-start gap-2">
          <Spinner /> Reading your homepage, schema, and llms.txt
        </li>
        <li className="flex items-start gap-2 text-moss">
          <Dot /> Cross-checking entity signals (LinkedIn, Wikidata, press)
        </li>
        <li className="flex items-start gap-2 text-moss">
          <Dot /> Scoring the five readiness drivers
        </li>
      </ul>
      <p className="text-xs text-moss">
        This usually takes 25–35 seconds. Hang tight.
      </p>
    </div>
  );
}

function MasterKeysSection({ report }: { report: MasterKeyReport }) {
  const laneLabel =
    report.lane === "local"
      ? "Local & brick-and-mortar"
      : "Online consultants, coaches, and agencies";
  return (
    <section className="daizie-scan-card">
      <p className="card-eyebrow">Master-key presence · {laneLabel}</p>
      <h3>The profiles AI reads for your kind of business</h3>
      <p style={{ marginTop: 10, maxWidth: 720 }}>{report.headline}</p>
      <div className="daizie-masterkeys">
        {report.checks.map((c) => (
          <div
            key={c.id}
            className={`mk-card ${c.found ? "present" : "missing"}`}
          >
            <div className="mk-head">
              <span className="mk-label">{c.label}</span>
              <span className={`mk-badge ${c.found ? "ok" : "no"}`}>
                {c.found ? "Present" : "Missing"}
              </span>
            </div>
            {c.found && c.evidenceUrl ? (
              <div className="mk-body">
                <a
                  href={c.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-forest border-r-transparent"
    />
  );
}

function Dot() {
  return (
    <span
      aria-hidden="true"
      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-tan"
    />
  );
}

// ============================================================================
// Phase 3 — Result + email gate
// ============================================================================

function ScanResult({
  scan,
  onEmailSent,
  emailSent,
}: {
  scan: ScanSuccess;
  onEmailSent: () => void;
  emailSent: boolean;
}) {
  const tierCopy = TIER_COPY[scan.tier];
  const pct = Math.round(scan.readinessScore * 100);
  const [activeTab, setActiveTab] = useState<"report" | "evidence" | "methodology">("report");
  const previewFindings = scan.findings.slice(0, 2);
  const findingByDimensionId = new Map(
    previewFindings.map((finding) => [finding.dimensionId, finding])
  );

  return (
    <div className="daizie-scan-result">
      <nav className="result-nav" aria-label="Report sections">
        <div className="tabs">
          {(["report", "evidence", "methodology"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "active" : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="brand-tag">Daizie</span>
      </nav>

      <section className="daizie-scan-card">
        <p className="card-eyebrow">Free Daizie Readiness Check</p>
        <h2>{scan.subjectName}</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Preview result for {friendlyDomain(scan.url)}
        </p>
      </section>

      {activeTab === "report" && (
        <>
          <section className="daizie-scan-card">
            <div className="daizie-score-row">
              <div>
                <p className="card-eyebrow">Your AI readiness</p>
                <div className="score-value">
                  <span className="num">{pct}</span>
                  <span className="of">/ 100</span>
                  <span className="tier">{tierCopy.label}</span>
                </div>
                <p style={{ marginTop: 6, maxWidth: 460 }}>
                  {tierCopy.sentence}
                </p>
              </div>
              <div>
                <p>
                  Readiness is the work AI can see on your public site — the
                  foundation that determines whether AI can find, understand,
                  and correctly describe your business.
                </p>
                <p className="muted" style={{ marginTop: 8, fontSize: ".9rem" }}>
                  This free check scores readiness only. The paid Daizie
                  Assessment measures live AI answers across four engines.
                </p>
              </div>
            </div>
            {!scan.crawlerReachable && (
              <p
                className="muted"
                style={{
                  marginTop: 14,
                  fontSize: ".85rem",
                  fontStyle: "italic",
                }}
              >
                We couldn&rsquo;t fully read your site directly, so this
                result is based on the signals we could observe.
              </p>
            )}
          </section>

          {scan.masterKeys && <MasterKeysSection report={scan.masterKeys} />}

          <section className="daizie-scan-card">
            <h3>The five things that make up your readiness</h3>
            <p className="muted" style={{ marginTop: 6, fontSize: ".9rem" }}>
              Each driver is scored 0–5 against observable public evidence.
            </p>
            <div className="daizie-driver-list">
              {scan.dimensions.map((d) => (
                <DaizieDriverRow
                  key={d.id}
                  dim={d}
                  finding={findingByDimensionId.get(d.id)}
                  crawler={
                    scan.crawler
                      ? {
                          organizationSchemaPresent:
                            scan.crawler.organizationSchemaPresent,
                          personSchemaPresent: scan.crawler.personSchemaPresent,
                          faqSchemaPresent: scan.crawler.faqSchemaPresent,
                          serviceSchemaPresent:
                            scan.crawler.serviceSchemaPresent,
                          llmsTxtPresent: scan.crawler.llmsTxtPresent,
                          robotsTxtPresent: scan.crawler.robotsTxtPresent,
                        }
                      : null
                  }
                />
              ))}
            </div>
            <p
              className="muted"
              style={{ marginTop: 14, fontSize: ".85rem", fontStyle: "italic" }}
            >
              Full report includes the complete driver breakdown and action plan.
            </p>
          </section>

          {previewFindings.length > 0 && (
            <section className="daizie-scan-card">
              <h3>What stood out</h3>
              <div className="daizie-findings">
                {previewFindings.map((f) => (
                  <div key={f.dimensionId} className="finding-card">
                    <p className="title">
                      {f.dimensionName}
                      {typeof f.score === "number" && (
                        <span className="score">
                          ({f.score.toFixed(1)} / 5)
                        </span>
                      )}
                    </p>
                    <p className="body">{f.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === "evidence" && <PreviewEvidence scan={scan} />}
      {activeTab === "methodology" && <PreviewMethodology />}

      <EmailGate scan={scan} onEmailSent={onEmailSent} emailSent={emailSent} />
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Headline tier card */}
      <div className="rounded-lg border border-tan bg-cream-dim p-6 sm:p-8">
        <p className="font-serif text-sm uppercase tracking-[0.18em] text-gold-dark">
          {scan.subjectName}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
          <span
            className={`inline-block rounded-md px-3 py-1.5 font-serif text-2xl font-semibold ${tierCopy.color}`}
          >
            {tierCopy.label}
          </span>
          <span className="font-serif text-3xl text-forest">{pct}/100</span>
        </div>
        <p className="mt-4 text-base leading-relaxed text-charcoal">
          {tierCopy.sentence}
        </p>
        {!scan.crawlerReachable && (
          <p className="mt-3 text-sm text-moss">
            We couldn&apos;t fully read your site directly — this tier is
            based on what we found through cross-source signals only.
          </p>
        )}
      </div>

      {/* Readiness drivers as bars */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-forest">
          The readiness drivers
        </h2>
        <ul className="space-y-3">
          {scan.dimensions.map((d) => (
            <DimensionBar key={d.id} dim={d} />
          ))}
        </ul>
      </div>

      {/* Findings */}
      {scan.findings.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl text-forest">
            What stood out
          </h2>
          <ul className="space-y-4">
            {scan.findings.map((f) => (
              <li
                key={f.dimensionId}
                className="rounded-lg border border-tan bg-cream-dim p-5"
              >
                <p className="font-serif text-sm font-semibold text-forest">
                  {f.dimensionName}
                  {typeof f.score === "number" && (
                    <span className="ml-2 text-gold-dark">
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
        </div>
      )}

      {/* Email gate */}
      <EmailGate scan={scan} onEmailSent={onEmailSent} emailSent={emailSent} />
    </div>
  );
}

function DimensionBar({ dim }: { dim: Dimension }) {
  const score = typeof dim.score === "number" ? dim.score : 0;
  const pct = (score / 5) * 100;
  return (
    <li>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-forest">
          <span className="text-gold-dark">{dim.id}</span> — {dim.name}
        </span>
        <span className="text-sm text-moss">
          {typeof dim.score === "number" ? dim.score.toFixed(1) : "—"} / 5
        </span>
      </div>
      <div
        className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-tan/40"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={`${dim.name} score`}
      >
        <div
          className="h-full rounded-full bg-forest motion-safe:transition-[width] motion-safe:duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function DaizieDriverRow({
  dim,
  finding,
  crawler,
}: {
  dim: Dimension;
  finding?: Finding;
  crawler?: StartHereCrawlerSignals | null;
}) {
  const score = typeof dim.score === "number" ? dim.score : 0;
  const pct = (score / 5) * 100;
  const nudge = getStartHereNudge(
    dim.id as V3ReadinessDriverId,
    dim.score,
    crawler
  );
  return (
    <div className="daizie-driver-row">
      <div className="row-head">
        <span className="name">{dim.name}</span>
        <span className="value">
          {typeof dim.score === "number" ? dim.score.toFixed(1) : "—"} / 5
        </span>
      </div>
      <div
        className="bar"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={`${dim.name} score`}
      >
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
      {finding && <p className="finding">{finding.summary}</p>}
      {nudge && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 8,
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
              color: "var(--dz-charcoal)",
            }}
          >
            {nudge}
          </p>
        </div>
      )}
    </div>
  );
}

function PreviewEvidence({ scan }: { scan: ScanSuccess }) {
  const crawler = scan.crawler;
  const corroboration = scan.corroboration;
  const signals: Array<{ label: string; present: boolean | undefined }> = [
    { label: "Organization schema", present: crawler?.organizationSchemaPresent },
    { label: "Person schema", present: crawler?.personSchemaPresent },
    { label: "FAQ schema", present: crawler?.faqSchemaPresent },
    { label: "Service schema", present: crawler?.serviceSchemaPresent },
    { label: "llms.txt", present: crawler?.llmsTxtPresent },
    { label: "robots.txt", present: crawler?.robotsTxtPresent },
    { label: "Founder named", present: crawler?.founderLikelyNamed },
    { label: "Pricing visible", present: crawler?.pricingLikelyVisible },
  ];

  return (
    <section className="rounded-lg bg-forest-dark p-6">
      <div className="text-[11px] uppercase tracking-widest text-gold">
        Evidence preview
      </div>
      <h3 className="mt-2 font-sans text-2xl font-semibold text-cream sm:text-3xl">
        Site and source signals we could observe
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tan">
        This free check uses public website signals and web corroboration. It
        does not include live AI answer testing or claim verification.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-tan/40 bg-forest/60 p-4">
          <h4 className="font-sans text-base font-semibold text-cream">
            What we read on the site
          </h4>
          <ul className="mt-3 grid gap-2">
            {signals.map((signal) => (
              <li
                key={signal.label}
                className="flex items-center justify-between gap-3 rounded bg-forest-dark/65 px-3 py-2 text-sm"
              >
                <span className="text-tan">{signal.label}</span>
                <span
                  className={
                    signal.present
                      ? "rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-forest"
                      : "rounded-full bg-charcoal px-2 py-0.5 text-xs font-semibold text-tan"
                  }
                >
                  {signal.present ? "yes" : "no"}
                </span>
              </li>
            ))}
          </ul>
          {crawler?.schemaTypes && crawler.schemaTypes.length > 0 && (
            <p className="mt-3 text-xs text-tan">
              JSON-LD types detected: {crawler.schemaTypes.join(", ")}
            </p>
          )}
        </div>

        <div className="rounded border border-tan/40 bg-forest/60 p-4">
          <h4 className="font-sans text-base font-semibold text-cream">
            What corroborated the entity
          </h4>
          <p className="mt-3 text-sm text-tan">
            We found {corroboration?.totalCorroboratingDomains ?? 0}
            {" "}corroborating domain
            {corroboration?.totalCorroboratingDomains === 1 ? "" : "s"}.
          </p>
          <ul className="mt-3 grid gap-2 text-sm">
            <li className="rounded bg-forest-dark/65 px-3 py-2">
              <span className="font-semibold text-cream">LinkedIn: </span>
              <span className="text-tan">
                {corroboration?.linkedinPresent ? "found" : "not found"}
              </span>
            </li>
            <li className="rounded bg-forest-dark/65 px-3 py-2">
              <span className="font-semibold text-cream">Wikidata: </span>
              <span className="text-tan">
                {corroboration?.wikidataPresent ? "found" : "not found"}
              </span>
            </li>
          </ul>
          {corroboration?.mentions && corroboration.mentions.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-widest text-gold">
                Top mentions
              </p>
              <ul className="mt-2 space-y-2">
                {corroboration.mentions.slice(0, 3).map((mention) => (
                  <li key={mention.url} className="text-sm">
                    <a
                      href={mention.url}
                      className="font-semibold text-cream underline decoration-gold underline-offset-4 hover:text-gold"
                    >
                      {mention.title || mention.domain}
                    </a>
                    <span className="ml-2 text-xs text-tan">({mention.domain})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewMethodology() {
  const drivers = [
    ["Business clarity", "Can AI tell what this business is and who it helps?"],
    ["Source support", "Is there enough evidence for AI to believe the right facts?"],
    ["AI readability", "Is the business easy for AI systems to read?"],
    ["Distinctive point of view", "Does AI have a reason to choose this business?"],
    ["Recommendation fit", "Does AI know when this is an appropriate recommendation?"],
  ];

  return (
    <section className="rounded-lg bg-forest-dark p-6">
      <div className="text-[11px] uppercase tracking-widest text-gold">
        Methodology
      </div>
      <h3 className="mt-2 font-sans text-2xl font-semibold text-cream sm:text-3xl">
        What this free check measures
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tan">
        The free readiness check scores public signals that help AI systems
        understand a business. It is a readiness scan, not a live visibility
        audit.
      </p>
      <ul className="mt-5 grid gap-3 lg:grid-cols-2">
        {drivers.map(([name, question]) => (
          <li key={name} className="rounded border border-tan/40 bg-forest/60 p-4">
            <p className="font-serif text-base font-semibold text-cream">
              {name}
            </p>
            <p className="mt-1 text-sm text-tan">{question}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmailGate({
  scan,
  onEmailSent,
  emailSent,
}: {
  scan: ScanSuccess;
  onEmailSent: () => void;
  emailSent: boolean;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (emailSent) {
    return (
      <div className="daizie-scan-card">
        <p className="card-eyebrow">Report on its way</p>
        <h3>Thanks — check your inbox.</h3>
        <p style={{ marginTop: 8 }}>
          The token-enabled report link will arrive in the next 30 seconds.
          If it doesn&rsquo;t arrive within 5 minutes, email{" "}
          <a
            href="mailto:hello@martykoepke.com"
            style={{
              color: "var(--dz-forest)",
              textDecoration: "underline",
              textDecorationColor: "var(--dz-gold)",
              textUnderlineOffset: 3,
            }}
          >
            hello@martykoepke.com
          </a>
          .
        </p>
      </div>
    );
  }

  async function onSubmitEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/scan/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId: scan.scanId,
          accessToken: scan.accessToken,
          email: email.trim(),
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErrorMsg(
          data.error || "Something went wrong. Please try again."
        );
        setSubmitting(false);
        return;
      }
      onEmailSent();
    } catch {
      setErrorMsg(
        "We couldn't reach our server. Check your connection and try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmitEmail} className="daizie-scan-card" noValidate>
      <p className="card-eyebrow">Private report link</p>
      <h3 style={{ marginTop: 4 }}>Send the full report to your inbox</h3>
      <p style={{ marginTop: 10 }}>
        This preview stays on screen. Enter your email and we&rsquo;ll send
        the token-enabled hosted report link, available for 30 days, with
        the full score breakdown and recommended next moves.
      </p>
      <div style={{ marginTop: 16 }}>
        <label htmlFor="scan-email" className="daizie-scan-label">
          Your email
        </label>
        <input
          id="scan-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourbusiness.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="daizie-scan-input"
        />
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="daizie-scan-error"
          style={{ marginTop: 14 }}
        >
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="daizie-btn primary"
        style={{ marginTop: 18, opacity: submitting ? 0.6 : 1 }}
      >
        {submitting ? "Sending…" : "Send me the full report →"}
      </button>
      <p
        style={{
          marginTop: 12,
          fontSize: ".82rem",
          color: "#56675c",
          fontStyle: "italic",
        }}
      >
        No spam. Private link expires after 30 days. See our{" "}
        <a
          href="/privacy"
          style={{
            color: "var(--dz-forest)",
            textDecoration: "underline",
            textDecorationColor: "var(--dz-gold)",
            textUnderlineOffset: 3,
          }}
        >
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}

function friendlyDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
