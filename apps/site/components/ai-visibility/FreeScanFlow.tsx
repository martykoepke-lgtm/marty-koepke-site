"use client";

import { useState, type FormEvent } from "react";
import { ArrowRightIcon } from "@/components/ui/Icons";

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
        setErrorMsg(
          ("error" in data && data.error) ||
            "Something went wrong. Please try again."
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
    <section className="rounded-lg bg-forest-dark p-6">
      <div className="text-[11px] uppercase tracking-widest text-gold">
        Master-key presence · {laneLabel}
      </div>
      <h3 className="mt-2 font-sans text-2xl font-semibold text-cream sm:text-3xl">
        The profiles AI reads for your kind of business
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/90">
        {report.headline}
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {report.checks.map((c) => (
          <li
            key={c.id}
            className={
              c.found
                ? "rounded-md border border-emerald-500/40 bg-emerald-950/40 p-4"
                : "rounded-md border border-red-500/40 bg-red-950/40 p-4"
            }
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-serif text-base font-semibold text-cream">
                {c.label}
              </span>
              <span
                className={
                  c.found
                    ? "text-xs font-semibold uppercase tracking-wide text-emerald-300"
                    : "text-xs font-semibold uppercase tracking-wide text-red-300"
                }
              >
                {c.found ? "Present" : "Missing"}
              </span>
            </div>
            {c.found && c.evidenceUrl && (
              <a
                href={c.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block break-all text-xs text-tan underline decoration-gold/60 underline-offset-2 hover:text-gold"
              >
                {c.evidenceTitle || c.evidenceUrl}
              </a>
            )}
            {!c.found && (
              <p className="mt-2 text-xs leading-relaxed text-tan">
                {c.notes ??
                  "No obvious result. Claim or update the profile so AI can find you."}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-tan">
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
    <div className="scan-result-workspace overflow-hidden rounded-lg border border-cream/10 p-4 shadow-2xl sm:p-6">
      <nav className="mb-6 flex items-center justify-between rounded bg-forest-dark px-4 py-3">
        <div className="flex items-center gap-2 text-sm sm:gap-5">
          {(["report", "evidence", "methodology"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "rounded bg-cream px-3 py-1.5 font-semibold capitalize text-forest"
                  : "rounded px-3 py-1.5 capitalize text-cream transition-colors hover:text-gold"
              }
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="hidden text-[11px] uppercase tracking-widest text-gold sm:block">
          Marty Koepke
        </div>
      </nav>

      <div className="space-y-6">
        <header className="rounded-lg bg-forest-dark p-5">
          <div className="text-[11px] uppercase tracking-widest text-gold">
            Free AI readiness check
          </div>
          <h2 className="mt-2 font-sans text-3xl font-semibold text-cream sm:text-4xl">
            {scan.subjectName}
          </h2>
          <p className="mt-2 text-sm text-tan">
            Preview result for {friendlyDomain(scan.url)}
          </p>
        </header>

        {activeTab === "report" && (
          <>
            <section className="rounded-lg bg-forest-dark p-6">
              <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-gold">
                    Your AI readiness
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="font-serif text-5xl text-cream">{pct}</span>
                    <span className="text-xl text-tan">/ 100</span>
                    <span className="ml-2 text-xl text-gold">{tierCopy.label}</span>
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-cream">
                    {tierCopy.sentence}
                  </p>
                </div>
                <div className="text-sm leading-relaxed text-cream">
                  <p>
                    Readiness is the work AI can see on your public site. It is
                    the foundation that determines whether AI can find,
                    understand, and correctly describe your business.
                  </p>
                  <p className="mt-2 text-tan">
                    This free check scores readiness only. The paid audit
                    measures live AI answers across major engines.
                  </p>
                </div>
              </div>
              {!scan.crawlerReachable && (
                <p className="mt-4 text-sm text-tan">
                  We could not fully read your site directly, so this result is
                  based on the signals we could observe.
                </p>
              )}
            </section>

            {scan.masterKeys && (
              <MasterKeysSection report={scan.masterKeys} />
            )}

            <section className="rounded-lg bg-forest-dark p-6">
              <h3 className="font-sans text-2xl font-semibold text-cream sm:text-3xl">
                The five things that make up your readiness
              </h3>
              <p className="mt-1 text-sm text-tan">
                Each driver is scored 0-5 against observable public evidence.
              </p>
              <ul className="mt-5 space-y-3">
                {scan.dimensions.map((d) => (
                  <DarkDimensionBar
                    key={d.id}
                    dim={d}
                    finding={findingByDimensionId.get(d.id)}
                  />
                ))}
              </ul>
              <p className="mt-4 text-sm text-tan">
                Full report includes the complete driver breakdown and action
                plan.
              </p>
            </section>

            {previewFindings.length > 0 && (
              <section className="rounded-lg bg-forest-dark p-6">
                <h3 className="font-sans text-2xl font-semibold text-cream">
                  What stood out
                </h3>
                <ul className="mt-4 grid gap-3 lg:grid-cols-2">
                  {previewFindings.map((f) => (
                    <li
                      key={f.dimensionId}
                      className="rounded border border-tan/40 bg-forest/60 p-4"
                    >
                      <p className="font-serif text-base font-semibold text-cream">
                        {f.dimensionName}
                        {typeof f.score === "number" && (
                          <span className="ml-2 text-sm font-normal text-gold">
                            ({f.score.toFixed(1)} / 5)
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-tan">
                        {f.summary}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {activeTab === "evidence" && <PreviewEvidence scan={scan} />}
        {activeTab === "methodology" && <PreviewMethodology />}

        <EmailGate scan={scan} onEmailSent={onEmailSent} emailSent={emailSent} />
      </div>
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

function DarkDimensionBar({
  dim,
  finding,
}: {
  dim: Dimension;
  finding?: Finding;
}) {
  const score = typeof dim.score === "number" ? dim.score : 0;
  const pct = (score / 5) * 100;
  return (
    <li className="rounded border border-tan/40 bg-forest/60 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold text-cream">{dim.name}</span>
        <span className="text-sm text-tan">
          {typeof dim.score === "number" ? dim.score.toFixed(1) : "-"} / 5
        </span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-charcoal"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={`${dim.name} score`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-cream motion-safe:transition-[width] motion-safe:duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {finding && (
        <p className="mt-3 text-sm leading-relaxed text-tan">
          {finding.summary}
        </p>
      )}
    </li>
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
      <div className="rounded-lg border border-gold/50 bg-forest-dark p-6">
        <p className="font-serif text-lg text-cream">
          Thanks — your report is on its way.
        </p>
        <p className="mt-2 text-sm text-tan">
          Check your inbox in the next 30 seconds. If it doesn&apos;t arrive
          within 5 minutes, email{" "}
          <a
            href="mailto:hello@martykoepke.com"
            className="text-cream underline decoration-gold underline-offset-4 hover:text-gold"
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
    <form
      onSubmit={onSubmitEmail}
      className="space-y-4 rounded-lg border border-gold/50 bg-forest-dark p-6 sm:p-8"
      noValidate
    >
      <p className="text-[11px] uppercase tracking-widest text-gold">
        Private report link
      </p>
      <h2 className="font-serif text-2xl text-cream">
        Send the full report to your inbox
      </h2>
      <p className="text-sm leading-relaxed text-tan">
        This preview stays on screen. Enter your email and we&apos;ll send the
        token-enabled hosted report link, available for 30 days, with the full
        score breakdown and recommended next moves.
      </p>
      <div>
        <label
          htmlFor="scan-email"
          className="block text-sm font-semibold text-cream"
        >
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
          className="mt-2 w-full rounded-md border border-tan/50 bg-cream px-4 py-3 text-charcoal placeholder:text-moss/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-md border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-7 py-3 text-base font-semibold text-forest transition-colors duration-300 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send me the full report"}
        {!submitting && <ArrowRightIcon className="h-4 w-4" />}
      </button>
      <p className="text-xs text-tan">
        No spam. Private link expires after 30 days. See our{" "}
        <a href="/privacy" className="text-cream underline decoration-gold underline-offset-4 hover:text-gold">
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
