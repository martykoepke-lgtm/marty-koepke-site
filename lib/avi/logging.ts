/**
 * Per-call logging for the AVI ops monitor.
 *
 * Every external API call from the AVI system goes through here before
 * returning to the caller. Writes one row to the api_calls table for
 * every call attempt — success, failure, timeout, rate-limit, all of them.
 *
 * Fail-open by design: if the Supabase insert fails (network glitch,
 * RLS misconfig, etc.), the caller still gets its response. We log a
 * warning to Vercel logs; under no circumstance does logging derail the
 * primary path.
 *
 * Read AVI_OPS_MONITOR.md for the full design. Specifically:
 *   §4.1 — the wrapper shape
 *   §4.4 — the api_calls schema
 *   §6   — failure modes (this is the only file that can swallow errors)
 */

import { supabaseAdmin } from "@/lib/supabase";

export type ApiCallStatus =
  | "success"
  | "error"
  | "timeout"
  | "rate_limited";

export type ApiCallLogEntry = {
  provider: string;
  model?: string | null;
  endpoint?: string | null;
  submission_id?: string | null;
  tokens_input?: number | null;
  tokens_output?: number | null;
  cost_estimated_usd?: number | null;
  request_id?: string | null;
  duration_ms?: number | null;
  status: ApiCallStatus;
  error_message?: string | null;
  ip?: string | null;
};

/**
 * Record one external API call. Never throws; never blocks the caller.
 *
 * Note: we do NOT await this on the hot path in callers. The wrapper
 * (lib/avi/llm.ts) awaits it because logging during a single call is
 * fast enough not to matter (~5–30ms). If you ever batch many calls
 * and the per-insert latency adds up, switch to fire-and-forget here.
 */
export async function logApiCall(entry: ApiCallLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin()
      .from("api_calls")
      .insert([entry]);
    if (error) {
      console.warn(
        "[ops-monitor] logApiCall insert failed:",
        error.message,
        "context:",
        {
          provider: entry.provider,
          endpoint: entry.endpoint ?? null,
          status: entry.status,
        }
      );
    }
  } catch (e) {
    console.warn(
      "[ops-monitor] logApiCall threw:",
      e instanceof Error ? e.message : String(e)
    );
  }
}

// ============================================================================
// Cost estimation
// ============================================================================

/**
 * Per-million-token pricing in USD. Last reviewed: 2026-06-06.
 *
 * UPDATE this table when a vendor changes pricing. The monitor compares
 * month-to-date sums of this column against SPEND_CAP_* env vars to
 * decide when to fire the 80% heads-up and 95% out-of-band alerts.
 * Stale pricing here → wrong cap-percentage in your inbox.
 *
 * Sources:
 *   - Anthropic:  https://www.anthropic.com/pricing
 *   - OpenAI:     https://openai.com/api/pricing
 *   - Google AI:  AI Studio free tier — $0 within rate limits
 *   - Perplexity: https://docs.perplexity.ai/guides/pricing
 *
 * Tavily charges per-search (not per-token); computed by lib/avi/tavily.ts.
 * Resend free tier covers 3,000 emails/month; no per-message $ cost.
 */
type PricePerMillion = { input: number; output: number };

const PRICING_USD_PER_M_TOKENS: Record<string, PricePerMillion> = {
  // Anthropic
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },

  // OpenAI
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },

  // Google AI (AI Studio free tier — $0 within rate limits;
  // promote to paid pricing if/when migrating to Vertex AI)
  "gemini-2.5-flash": { input: 0.0, output: 0.0 },
  "gemini-2.5-pro": { input: 0.0, output: 0.0 },

  // Perplexity Sonar
  "sonar": { input: 1.0, output: 1.0 },
  "sonar-pro": { input: 3.0, output: 15.0 },
};

/**
 * Estimate the cost of a single LLM call in USD.
 *
 * Returns null if model is unknown, or if tokens-in / tokens-out are
 * missing (we don't want to record a misleadingly low cost). A null
 * cost still counts as a call in the monitor — call-count anomalies
 * are surfaced separately.
 */
export function estimateCost(
  model: string | null | undefined,
  tokensIn: number | null | undefined,
  tokensOut: number | null | undefined
): number | null {
  if (!model || tokensIn == null || tokensOut == null) return null;
  const price = PRICING_USD_PER_M_TOKENS[model];
  if (!price) {
    // Unknown model → log warning + return null so the monitor doesn't
    // silently undercount. Update PRICING_USD_PER_M_TOKENS when a new
    // model is added to the provider adapters.
    console.warn(`[ops-monitor] estimateCost: unknown model "${model}"`);
    return null;
  }
  const cost =
    (tokensIn / 1_000_000) * price.input +
    (tokensOut / 1_000_000) * price.output;
  // Round to 6 decimal places to fit numeric(10,6) in Postgres.
  return Math.round(cost * 1_000_000) / 1_000_000;
}
