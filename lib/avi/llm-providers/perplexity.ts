import OpenAI from "openai";
import {
  type LlmResponse,
  MAX_RESPONSE_TOKENS,
  PROVIDER_TIMEOUT_MS,
} from "./types";

/**
 * Perplexity adapter.
 *
 * Perplexity's API is OpenAI-compatible — we reuse the `openai` SDK and
 * just override the base URL. The model family (Sonar) does live web
 * search as part of every response, which is the value-add: when AI is
 * asked "best AI visibility consultant," Sonar will actually search the
 * web and synthesize an answer, not just recite training data.
 *
 * For our query grid, Sonar is the basic model — $1/M tokens, perfect
 * for the "ask a question and see what comes back" pattern. Sonar Pro
 * (better, $3 in / $15 out) is overkill at the v1 stage.
 *
 * Note: this file imports `openai` directly — that's allowed because
 * we live inside `lib/avi/llm-providers/`, which is exempted from the
 * ESLint no-direct-SDK-imports rule. Outside callers go through
 * `lib/avi/llm.ts` per AVI_OPS_MONITOR.md §4.1.
 */

const MODEL = "sonar";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    throw new Error(
      "Missing PERPLEXITY_API_KEY — add it to .env.local (server-side only, no NEXT_PUBLIC_)."
    );
  }
  client = new OpenAI({
    apiKey: key,
    baseURL: "https://api.perplexity.ai",
    timeout: PROVIDER_TIMEOUT_MS,
  });
  return client;
}

export async function askPerplexity(prompt: string): Promise<LlmResponse> {
  const startedAt = Date.now();
  try {
    const perplexity = getClient();
    const completion = await perplexity.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: MAX_RESPONSE_TOKENS,
      temperature: 0.2, // deterministic-ish — same as the other adapters
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return {
      provider: "perplexity",
      model: MODEL,
      prompt,
      text,
      ok: true,
      tokensIn: completion.usage?.prompt_tokens,
      tokensOut: completion.usage?.completion_tokens,
      latencyMs: Date.now() - startedAt,
    };
  } catch (e) {
    return {
      provider: "perplexity",
      model: MODEL,
      prompt,
      text: "",
      ok: false,
      error: e instanceof Error ? e.message : "Unknown Perplexity error",
      latencyMs: Date.now() - startedAt,
    };
  }
}
