/**
 * Shared types for LLM provider adapters.
 *
 * Each adapter (OpenAI, Anthropic, Gemini) implements the same interface:
 * take a prompt, return a structured response. The Query Agent fires
 * all adapters in parallel and aggregates results.
 *
 * Adapters NEVER throw. Failures are returned as { ok: false, error }
 * so a single provider outage doesn't sink the whole audit.
 */

export type LlmProviderName = "openai" | "anthropic" | "gemini" | "perplexity";

export type LlmResponse = {
  provider: LlmProviderName;
  model: string;
  prompt: string;
  text: string;
  ok: boolean;
  error?: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs: number;
};

/**
 * Bounded response — keep AI outputs under a token cap so a runaway
 * response can't blow up our cost budget for one audit.
 */
export const MAX_RESPONSE_TOKENS = 600;

/**
 * Per-prompt timeout. If an LLM hangs, we move on with the others.
 */
export const PROVIDER_TIMEOUT_MS = 45_000;
