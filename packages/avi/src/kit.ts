/**
 * Kit (formerly ConvertKit) — lead-magnet subscribe + tier tagging.
 *
 * Posts the customer's email to the configured Kit form and applies a
 * tier-specific tag for downstream nurture sequencing. Read AVI_FREE_FLOW.md
 * §3 step 4 and §3.6.
 *
 * Degrades gracefully when KIT_* env vars aren't set — returns ok=true and
 * logs a warning once per process, so the email-gate handler still ships
 * the customer's PDF email even if Kit is offline or unconfigured.
 *
 * Tag scheme:
 *   scan-completed              — every successful free scan
 *   tier-invisible / hidden / faintly-visible / discoverable / agent-ready
 */

let _warnedBypassed = false;

export type KitSubscribeInput = {
  email: string;
  firstName?: string | null;
  tier:
    | "invisible"
    | "hidden"
    | "faintly-visible"
    | "discoverable"
    | "agent-ready";
};

export type KitSubscribeResult = { ok: boolean; reason?: string };

const TIER_TAG: Record<KitSubscribeInput["tier"], string> = {
  invisible: "tier-invisible",
  hidden: "tier-hidden",
  "faintly-visible": "tier-faintly-visible",
  discoverable: "tier-discoverable",
  "agent-ready": "tier-agent-ready",
};

export async function kitSubscribe(
  input: KitSubscribeInput
): Promise<KitSubscribeResult> {
  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;

  if (!apiKey || !formId) {
    if (!_warnedBypassed) {
      console.warn(
        "[kit] KIT_API_KEY / KIT_FORM_ID not set — subscribe bypassed. " +
          "Set both in Vercel env vars to enable nurture sequences."
      );
      _warnedBypassed = true;
    }
    return { ok: true, reason: "bypassed" };
  }

  // Kit v3 form subscribe endpoint. The form trigger automatically
  // applies the tier tag if the form is configured with that tag, but
  // we send tags explicitly here so re-runs don't depend on console
  // settings staying right.
  const url = `https://api.convertkit.com/v3/forms/${formId}/subscribe`;
  const body = {
    api_key: apiKey,
    email: input.email,
    first_name: input.firstName ?? undefined,
    tags: ["scan-completed", TIER_TAG[input.tier]],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "(no body)");
      return { ok: false, reason: `kit-http-${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "kit-error",
    };
  }
}
