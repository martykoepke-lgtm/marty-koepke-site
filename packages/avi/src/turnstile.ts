/**
 * Cloudflare Turnstile verification.
 *
 * Server-side verify of the token the widget hands back. The widget on
 * /scan posts the token alongside the URL; this module calls Cloudflare's
 * siteverify endpoint and returns the result.
 *
 * If TURNSTILE_SECRET_KEY isn't set, verification is bypassed (returns
 * ok: true). That's intentional for local dev and the initial deploy:
 * Marty can ship /scan and add the key later via Vercel env vars. A
 * warn is logged once per process so it's visible.
 *
 * Read AVI_FREE_FLOW.md §3.2 step 2.
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

let _warnedBypassed = false;

export type TurnstileVerifyResult = { ok: true } | { ok: false; reason: string };

export async function verifyTurnstile(
  token: string | undefined,
  ip: string | null | undefined
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (!_warnedBypassed) {
      console.warn(
        "[turnstile] TURNSTILE_SECRET_KEY not set — bypassing verification. " +
          "Set it in Vercel env vars before public launch."
      );
      _warnedBypassed = true;
    }
    return { ok: true };
  }

  if (!token || token.length < 10) {
    return { ok: false, reason: "missing-token" };
  }

  const form = new URLSearchParams();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: form,
      // Cloudflare can be slow under load — keep a short ceiling so a
      // hung verify doesn't block the scan endpoint indefinitely.
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      return { ok: false, reason: `verify-http-${res.status}` };
    }
    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      return {
        ok: false,
        reason: data["error-codes"]?.join(",") || "verify-failed",
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "verify-error",
    };
  }
}
