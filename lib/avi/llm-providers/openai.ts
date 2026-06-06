import OpenAI from "openai";
import {
  type LlmResponse,
  MAX_RESPONSE_TOKENS,
  PROVIDER_TIMEOUT_MS,
} from "./types";

/**
 * OpenAI adapter.
 *
 * Uses gpt-4o-mini — cheap, fast, plenty smart for the recognition
 * tasks we run (5 prompts that ask what AI knows about a business).
 * Per-audit cost target: ~$0.01–0.05.
 */

const MODEL = "gpt-4o-mini";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "Missing OPENAI_API_KEY — add it to .env.local (server-side only, no NEXT_PUBLIC_)."
    );
  }
  client = new OpenAI({ apiKey: key, timeout: PROVIDER_TIMEOUT_MS });
  return client;
}

export async function askOpenAI(prompt: string): Promise<LlmResponse> {
  const startedAt = Date.now();
  try {
    const openai = getClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: MAX_RESPONSE_TOKENS,
      temperature: 0.2, // deterministic-ish — we want the model's stable knowledge
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return {
      provider: "openai",
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
      provider: "openai",
      model: MODEL,
      prompt,
      text: "",
      ok: false,
      error: e instanceof Error ? e.message : "Unknown OpenAI error",
      latencyMs: Date.now() - startedAt,
    };
  }
}
