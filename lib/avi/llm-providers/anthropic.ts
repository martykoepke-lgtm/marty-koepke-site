import Anthropic from "@anthropic-ai/sdk";
import {
  type LlmCallOptions,
  type LlmResponse,
  MAX_RESPONSE_TOKENS,
  PROVIDER_TIMEOUT_MS,
} from "./types";

/**
 * Anthropic (Claude) adapter.
 *
 * Uses claude-sonnet-4-5 (current Sonnet tier). For our recognition
 * tasks this gives more thoughtful answers than Haiku without breaking
 * the budget — ~$0.05/audit at 5 queries.
 *
 * If Anthropic releases a newer model and you want to switch, change
 * the MODEL constant below.
 */

const MODEL = "claude-sonnet-4-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY — add it to .env.local (server-side only, no NEXT_PUBLIC_)."
    );
  }
  client = new Anthropic({ apiKey: key, timeout: PROVIDER_TIMEOUT_MS });
  return client;
}

export async function askAnthropic(
  prompt: string,
  options?: LlmCallOptions
): Promise<LlmResponse> {
  const startedAt = Date.now();
  try {
    const anthropic = getClient();
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: options?.maxTokens ?? MAX_RESPONSE_TOKENS,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    // Anthropic returns content as an array of blocks; we only care about text
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");

    return {
      provider: "anthropic",
      model: MODEL,
      prompt,
      text,
      ok: true,
      tokensIn: msg.usage?.input_tokens,
      tokensOut: msg.usage?.output_tokens,
      latencyMs: Date.now() - startedAt,
    };
  } catch (e) {
    return {
      provider: "anthropic",
      model: MODEL,
      prompt,
      text: "",
      ok: false,
      error: e instanceof Error ? e.message : "Unknown Anthropic error",
      latencyMs: Date.now() - startedAt,
    };
  }
}
