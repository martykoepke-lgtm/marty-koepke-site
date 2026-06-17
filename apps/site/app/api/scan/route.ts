import { NextResponse, type NextRequest } from "next/server";
import { runFreeScan } from "@practical-informatics/avi";
import { verifyTurnstile } from "@practical-informatics/avi";
import { checkScanRateLimit } from "@practical-informatics/avi";

/**
 * POST /api/scan
 *
 * The free Readiness Check endpoint per D006 / AVI_FREE_FLOW.md §3.2.
 *
 * Synchronous, target latency 25–35 seconds. Runs the AVI pipeline's
 * Crawler + Corroboration + Scoring services against the submitted URL
 * and returns tier + readiness score + 2–3 plain-English findings.
 *
 * Sequence:
 *   1. Rate-limit (Upstash, by IP) — 3 scans / 24h
 *   2. Turnstile verify (Cloudflare)
 *   3. Normalize URL
 *   4. Run the free scan orchestrator (lib/avi/free-scan.ts)
 *   5. Return JSON to the browser
 *
 * The submission row + audit row are persisted by the orchestrator. The
 * returned `accessToken` gates the follow-up email handler that triggers
 * Kit + Resend PDF delivery.
 */

export const runtime = "nodejs";
export const maxDuration = 60; // seconds — covers the full crawler + Tavily + 7-dim scoring window

type ScanBody = {
  url?: string;
  turnstileToken?: string;
};

export async function POST(req: NextRequest) {
  let body: ScanBody;
  try {
    body = (await req.json()) as ScanBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // ---- Validation ----
  const rawUrl = (body.url ?? "").trim();
  if (!rawUrl) {
    return NextResponse.json(
      { ok: false, error: "Please enter a website URL.", field: "url" },
      { status: 400 }
    );
  }
  if (!looksLikeUrl(rawUrl)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "That URL doesn't look right — try again with a full domain like example.com.",
        field: "url",
      },
      { status: 400 }
    );
  }

  // ---- IP for rate limit + ops attribution ----
  const ip = readClientIp(req);

  // ---- Rate limit ----
  const rl = await checkScanRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "You've reached today's free scan limit. Email marty.koepke@practicalinformatics.com if you need another.",
      },
      { status: 429 }
    );
  }

  // ---- Turnstile verify ----
  const tv = await verifyTurnstile(body.turnstileToken, ip);
  if (!tv.ok) {
    return NextResponse.json(
      { ok: false, error: "Bot check failed — please refresh and try again." },
      { status: 400 }
    );
  }

  // ---- Run the scan ----
  try {
    const result = await runFreeScan({ rawUrl, ip });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      scanId: result.submissionId,
      accessToken: result.accessToken,
      url: result.url,
      subjectName: result.subjectName,
      subjectType: result.subjectType,
      readinessScore: result.readinessScore,
      tier: result.tier,
      dimensions: result.dimensions,
      findings: result.findings,
      crawlerReachable: result.crawlerReachable,
      durationMs: result.durationMs,
    });
  } catch (e) {
    console.error("[/api/scan] unhandled error:", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong on our end. Please try again in a minute.",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helpers
// ============================================================================

function looksLikeUrl(s: string): boolean {
  // Accept either a bare domain (example.com) or a full URL. The
  // orchestrator normalizes either form.
  const candidate = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(candidate);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    if (u.hostname === "localhost") return false;
    // Reject IP-only hosts; we want real domains on the public scan.
    if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) return false;
    if (!u.hostname.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

function readClientIp(req: NextRequest): string {
  // Vercel forwards client IP in x-forwarded-for. Take the leftmost
  // value (closest to the client). Fall back to "unknown" so the rate
  // limit still applies a per-key bucket.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
