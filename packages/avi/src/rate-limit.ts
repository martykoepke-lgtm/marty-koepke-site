/**
 * Upstash Redis rate limit — IP buckets for /api/scan.
 *
 * 3 scans per IP per 24-hour rolling window per AVI_FREE_FLOW.md §3.2
 * step 1. Backed by Upstash Redis (REST API). Falls back to "allow" if
 * UPSTASH_REDIS_REST_URL / TOKEN aren't set — same shape as the
 * Turnstile bypass; lets Marty ship before the Upstash account is live.
 *
 * Implementation note: we use a simple INCR + EXPIRE pattern instead of
 * the @upstash/ratelimit package to avoid a heavy dependency. The math
 * is "incr scan:<ip>:<yyyy-mm-dd>; if first call, set 86400s TTL; allow
 * if value ≤ 3". UTC-day-bucketed not rolling-window — close enough for
 * abuse defense and trivially debuggable from the Upstash dashboard.
 */

const MAX_SCANS_PER_DAY = 3;
const TTL_SECONDS = 60 * 60 * 24;

let _warnedBypassed = false;

export type RateLimitResult = {
  allowed: boolean;
  used: number;
  limit: number;
};

export async function checkScanRateLimit(ip: string): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!_warnedBypassed) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / TOKEN not set — rate limit bypassed. " +
          "Configure before public launch."
      );
      _warnedBypassed = true;
    }
    return { allowed: true, used: 0, limit: MAX_SCANS_PER_DAY };
  }

  const safeIp = (ip || "unknown").replace(/[^a-zA-Z0-9.:_-]/g, "_");
  const day = new Date().toISOString().slice(0, 10);
  const key = `scan:${safeIp}:${day}`;

  try {
    // INCR — returns the new count.
    const incrRes = await upstash(url, token, ["INCR", key]);
    const count = typeof incrRes === "number" ? incrRes : Number(incrRes) || 0;

    if (count === 1) {
      // First scan of the day for this IP — set the daily TTL.
      await upstash(url, token, ["EXPIRE", key, String(TTL_SECONDS)]);
    }

    return {
      allowed: count <= MAX_SCANS_PER_DAY,
      used: count,
      limit: MAX_SCANS_PER_DAY,
    };
  } catch (e) {
    // Fail open on transient Redis errors. The vendor spend caps are
    // the last line of defense.
    console.warn("[rate-limit] Upstash call failed; allowing:", e);
    return { allowed: true, used: 0, limit: MAX_SCANS_PER_DAY };
  }
}

// ============================================================================
// Upstash REST helper
// ============================================================================

async function upstash(
  baseUrl: string,
  token: string,
  command: string[]
): Promise<unknown> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(3_000),
  });
  if (!res.ok) {
    throw new Error(`Upstash ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result;
}
