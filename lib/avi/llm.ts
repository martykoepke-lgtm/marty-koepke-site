/**
 * The LLM-call wrapper.
 *
 * Every LLM call from the AVI system MUST go through `llmCall()` here.
 * Never import askAnthropic / askOpenAI / askGemini directly from
 * `./llm-providers/*` outside of this file — an ESLint rule will enforce
 * that once added. Direct imports bypass logging; the monitor under-counts;
 * spend caps under-fire.
 *
 * The wrapper does three things:
 *   1. Dispatches to the right provider adapter based on `provider`.
 *   2. Logs the call (tokens, cost estimate, latency, status) to api_calls.
 *   3. Returns the response to the caller — same shape adapters return.
 *
 * Logging failures don't propagate. See lib/avi/logging.ts.
 *
 * Read AVI_OPS_MONITOR.md §4.1 for the design.
 */

import { askAnthropic } from "./llm-providers/anthropic";
import { askOpenAI } from "./llm-providers/openai";
import { askGemini } from "./llm-providers/gemini";
import { askPerplexity } from "./llm-providers/perplexity";
import type { LlmProviderName, LlmResponse } from "./llm-providers/types";
import { estimateCost, logApiCall } from "./logging";

/**
 * Context attached to every logged LLM call.
 *
 * Tells the ops monitor which part of the system originated the call,
 * which submission (if any) it relates to, and which IP triggered it.
 * Used by the weekly summary to slice spend per surface and identify
 * abusive traffic patterns.
 */
export type LlmCallContext = {
  /**
   * What part of the AVI system fired this call. Open-ended string so
   * new surfaces can be added without changing this type, but the
   * canonical values are listed below for searchability.
   */
  endpoint:
    | "free_scan_query"           // legacy v1 mention-counting; will be retired
    | "free_scan_score"           // v2 LLM-as-judge scoring per rubric dim
    | "paid_pipeline_query"       // 10–20 queries × 4–5 engines × 3 reps
    | "paid_pipeline_extract"     // structured extraction per query response
    | "paid_pipeline_score"       // LLM-as-judge per driver dimension
    | "monitor_self_test"         // smoke-test calls from the monitor itself
    | (string & {});              // forward-compatible, no false-positive narrowing

  /** Linked submission row, if applicable. Null for monitor-internal calls. */
  submissionId?: string | null;

  /** Requester IP — populated for customer-triggered calls. */
  ip?: string | null;
};

/**
 * Make one logged LLM call.
 *
 * Always returns an LlmResponse — provider failures are surfaced as
 * `{ ok: false, error }` rather than thrown, same as the underlying
 * adapter contract. Callers should check `ok` before reading `text`.
 */
export async function llmCall(
  provider: LlmProviderName,
  prompt: string,
  context: LlmCallContext
): Promise<LlmResponse> {
  const askFn = ASK_FUNCTIONS[provider];
  const response = await askFn(prompt);

  // Always log, success or failure. The monitor needs every attempt to
  // detect anomalies like "Anthropic is timing out 30% of the time today."
  await logApiCall({
    provider: response.provider,
    model: response.model,
    endpoint: context.endpoint,
    submission_id: context.submissionId ?? null,
    tokens_input: response.tokensIn ?? null,
    tokens_output: response.tokensOut ?? null,
    cost_estimated_usd: estimateCost(
      response.model,
      response.tokensIn,
      response.tokensOut
    ),
    duration_ms: response.latencyMs,
    status: response.ok ? "success" : "error",
    error_message: response.error ?? null,
    // Provider adapters don't surface request IDs today; add when they do.
    request_id: null,
    ip: context.ip ?? null,
  });

  return response;
}

const ASK_FUNCTIONS: Record<
  LlmProviderName,
  (prompt: string) => Promise<LlmResponse>
> = {
  anthropic: askAnthropic,
  openai: askOpenAI,
  gemini: askGemini,
  perplexity: askPerplexity,
};
