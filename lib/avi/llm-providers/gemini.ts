import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  type LlmResponse,
  MAX_RESPONSE_TOKENS,
  PROVIDER_TIMEOUT_MS,
} from "./types";

/**
 * Gemini adapter.
 *
 * Uses gemini-2.5-flash — fast, generous free tier covers most of
 * our usage. If we hit rate limits the SDK throws and we record the
 * failure but keep the audit going.
 */

const MODEL = "gemini-2.5-flash";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (client) return client;
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error(
      "Missing GOOGLE_API_KEY — add it to .env.local (server-side only, no NEXT_PUBLIC_)."
    );
  }
  client = new GoogleGenerativeAI(key);
  return client;
}

export async function askGemini(prompt: string): Promise<LlmResponse> {
  const startedAt = Date.now();
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        maxOutputTokens: MAX_RESPONSE_TOKENS,
        temperature: 0.2,
      },
    });

    // Gemini SDK doesn't expose an obvious timeout — race it
    const completion = await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Gemini request timed out")),
          PROVIDER_TIMEOUT_MS
        )
      ),
    ]);

    const text = completion.response.text();
    const usage = completion.response.usageMetadata;

    return {
      provider: "gemini",
      model: MODEL,
      prompt,
      text,
      ok: true,
      tokensIn: usage?.promptTokenCount,
      tokensOut: usage?.candidatesTokenCount,
      latencyMs: Date.now() - startedAt,
    };
  } catch (e) {
    return {
      provider: "gemini",
      model: MODEL,
      prompt,
      text: "",
      ok: false,
      error: e instanceof Error ? e.message : "Unknown Gemini error",
      latencyMs: Date.now() - startedAt,
    };
  }
}
