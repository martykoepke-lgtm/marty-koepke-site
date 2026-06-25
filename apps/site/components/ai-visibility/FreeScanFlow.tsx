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
  crawlerReachable: boolean;
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

  async function onSubmitUrl(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setPhase("scanning");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
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
  onSubmit,
  errorMsg,
}: {
  urlInput: string;
  setUrlInput: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  errorMsg: string | null;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="scan-url"
          className="block font-serif text-sm font-semibold text-forest"
        >
          Your website URL
        </label>
        <input
          id="scan-url"
          name="url"
          type="url"
          required
          autoFocus
          autoComplete="url"
          placeholder="https://yourbusiness.com"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="mt-3 w-full rounded-md border border-tan bg-cream px-4 py-3 text-charcoal placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
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
        className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-7 py-3.5 text-base font-semibold text-cream transition-colors duration-300 hover:bg-forest-dark motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
      >
        Scan in 30 seconds
        <ArrowRightIcon className="h-4 w-4" />
      </button>
      <p className="text-xs text-moss">
        No email required to see your tier. We don&apos;t save anything until
        you ask us to send the full report.
      </p>
    </form>
  );
}

// ============================================================================
// Phase 2 — Loading
// ============================================================================

function Scanning() {
  return (
    <div className="space-y-6 rounded-lg border border-tan bg-cream-dim p-6 sm:p-8">
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
          <Dot /> Scoring the five V3 readiness drivers
        </li>
      </ul>
      <p className="text-xs text-moss">
        This usually takes 25–35 seconds. Hang tight.
      </p>
    </div>
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
      <div className="rounded-lg border border-forest bg-cream-dim p-6">
        <p className="font-serif text-lg text-forest">
          Thanks — your report is on its way.
        </p>
        <p className="mt-2 text-sm text-charcoal">
          Check your inbox in the next 30 seconds. If it doesn&apos;t arrive
          within 5 minutes, email{" "}
          <a
            href="mailto:marty.koepke@practicalinformatics.com"
            className="underline hover:text-forest"
          >
            marty.koepke@practicalinformatics.com
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
      className="space-y-4 rounded-lg border border-tan bg-cream p-6 sm:p-8"
      noValidate
    >
      <h2 className="font-serif text-xl text-forest">
        Get the full report
      </h2>
      <p className="text-sm leading-relaxed text-charcoal">
        This was the preview. The full write-up names every gap,
        prioritizes the five highest-leverage fixes, and includes the
        technical patches you can hand to a developer. Enter your email
        and we&apos;ll send it in 30 seconds.
      </p>
      <div>
        <label
          htmlFor="scan-email"
          className="block text-sm font-semibold text-forest"
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
          className="mt-2 w-full rounded-md border border-tan bg-cream px-4 py-3 text-charcoal placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
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
        className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-7 py-3 text-base font-semibold text-cream transition-colors duration-300 hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send me the full report"}
        {!submitting && <ArrowRightIcon className="h-4 w-4" />}
      </button>
      <p className="text-xs text-moss">
        No spam. See our{" "}
        <a href="/privacy" className="underline hover:text-forest">
          privacy policy
        </a>
        .
      </p>
    </form>
  );
}
