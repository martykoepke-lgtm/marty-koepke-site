/**
 * Query Agent.
 *
 * Orchestrates the 5 prompt templates × 3 LLM providers = 15 API calls
 * per audit. All run in parallel so total wallclock time is ~the slowest
 * single response (~20–30 sec).
 *
 * Each result is classified as `mentioned` / `not_mentioned` based on
 * whether the company name appears in the response. Richer classification
 * (accurate / outdated / entity-error etc.) is handled at the human-review
 * step for now — we keep the raw text so reviewers can read it themselves.
 */

import { llmCall, type LlmCallContext } from "./llm";
import type { LlmProviderName, LlmResponse } from "./llm-providers/types";

// ============================================================================
// Inputs + outputs
// ============================================================================

export type QueryAgentInput = {
  companyName: string;
  industry: string;            // "what does your business do?" — full phrase
  location?: string | null;
  targetQuery?: string | null; // optional — customer's own phrasing

  // Ops-monitor context. Required so every LLM call is attributable to a
  // submission (for traffic-by-IP-and-submission slicing in the weekly email).
  submissionId?: string | null;
  ip?: string | null;
};

export type QueryPromptCategory = "category-search" | "name-search";

export type QueryResult = {
  promptId: string;
  promptCategory: QueryPromptCategory;
  promptText: string;
  provider: LlmProviderName;
  model: string;
  response: string;
  ok: boolean;
  error?: string;
  mentioned: boolean;          // company name appears in the response?
  tokensIn?: number;
  tokensOut?: number;
  latencyMs: number;
};

export type QueryAgentOutput = {
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  results: QueryResult[];

  // Quick aggregate summary (the headline numbers)
  totalCalls: number;
  successCount: number;
  errorCount: number;
  mentionRateByProvider: Record<LlmProviderName, number>;        // 0.0–1.0
  mentionRateByCategory: Record<QueryPromptCategory, number>;    // 0.0–1.0
  overallMentionRate: number;                                    // 0.0–1.0
};

// ============================================================================
// Prompt templates
// ============================================================================

type PromptTemplate = {
  id: string;
  category: QueryPromptCategory;
  build: (i: QueryAgentInput) => string;
};

const PROMPT_TEMPLATES: PromptTemplate[] = [
  // ----- Category-search prompts (Eval 1 — AI Search Ranking) -----
  {
    id: "cat-best-in-location",
    category: "category-search",
    build: (i) =>
      `Best ${i.industry}${i.location ? ` in ${i.location}` : ""}. Who should I call?`,
  },
  {
    id: "cat-problem-based",
    category: "category-search",
    build: (i) =>
      i.targetQuery
        ? `${i.targetQuery}`
        : `I'm a small business owner looking for ${i.industry}${
            i.location ? ` near ${i.location}` : ""
          }. Who do you recommend?`,
  },
  {
    id: "cat-top-5",
    category: "category-search",
    build: (i) =>
      `What are the top 5 ${i.industry}${
        i.location ? ` in ${i.location}` : " in the United States"
      }?`,
  },

  // ----- Name-search prompts (Eval 2 — Website Readiness) -----
  {
    id: "name-tell-me-about",
    category: "name-search",
    build: (i) => `Tell me about ${i.companyName}. What do they do today?`,
  },
  {
    id: "name-reputable",
    category: "name-search",
    build: (i) =>
      `Is ${i.companyName} reputable? Should a customer hire them?`,
  },
];

// ============================================================================
// Top-level entry point
// ============================================================================

export async function runQueryAgent(
  input: QueryAgentInput
): Promise<QueryAgentOutput> {
  const startedAt = Date.now();

  // Every llmCall logs to api_calls with this context attached, so the
  // ops monitor can attribute the spend back to this submission and IP.
  const context: LlmCallContext = {
    endpoint: "free_scan_query",
    submissionId: input.submissionId ?? null,
    ip: input.ip ?? null,
  };

  // Build all prompt × provider combos
  const tasks: Promise<QueryResult>[] = [];
  for (const tpl of PROMPT_TEMPLATES) {
    const promptText = tpl.build(input);
    tasks.push(runOne("openai", tpl, promptText, input.companyName, context));
    tasks.push(runOne("anthropic", tpl, promptText, input.companyName, context));
    tasks.push(runOne("gemini", tpl, promptText, input.companyName, context));
  }

  // Run them all. allSettled means one failure doesn't kill the whole batch.
  const settled = await Promise.allSettled(tasks);

  const results: QueryResult[] = settled.map((s) =>
    s.status === "fulfilled" ? s.value : synthesizeFailedResult(s.reason)
  );

  const finishedAt = Date.now();

  return {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    totalDurationMs: finishedAt - startedAt,
    results,
    ...summarize(results),
  };
}

// ============================================================================
// One prompt × one provider
// ============================================================================

async function runOne(
  provider: LlmProviderName,
  tpl: PromptTemplate,
  promptText: string,
  companyName: string,
  context: LlmCallContext
): Promise<QueryResult> {
  const r: LlmResponse = await llmCall(provider, promptText, context);
  return {
    promptId: tpl.id,
    promptCategory: tpl.category,
    promptText,
    provider: r.provider,
    model: r.model,
    response: r.text,
    ok: r.ok,
    error: r.error,
    mentioned: r.ok && isCompanyMentioned(r.text, companyName),
    tokensIn: r.tokensIn,
    tokensOut: r.tokensOut,
    latencyMs: r.latencyMs,
  };
}

function synthesizeFailedResult(reason: unknown): QueryResult {
  const message = reason instanceof Error ? reason.message : "Unknown error";
  return {
    promptId: "unknown",
    promptCategory: "category-search",
    promptText: "",
    provider: "openai",
    model: "unknown",
    response: "",
    ok: false,
    error: message,
    mentioned: false,
    latencyMs: 0,
  };
}

// ============================================================================
// Mention detection
// ============================================================================

/**
 * Lightweight company-name detection.
 * Normalizes the company name and the response (lowercase, strip punctuation,
 * collapse whitespace) then checks substring presence.
 *
 * Future enhancement: handle abbreviations, AKA names, common misspellings,
 * and "Practical" vs "Practical Informatics LLC" partial matches.
 */
function isCompanyMentioned(response: string, companyName: string): boolean {
  if (!response || !companyName) return false;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const haystack = norm(response);
  const fullName = norm(companyName);
  if (haystack.includes(fullName)) return true;

  // Also try the first significant word(s) of the company name, in case the
  // response uses just the brand short form (e.g. "Practical" for "Practical Informatics LLC")
  const tokens = fullName.split(" ").filter((t) => t.length >= 4);
  if (tokens.length > 0 && haystack.includes(tokens[0])) {
    // Require at least two consecutive tokens to match, to avoid false positives
    // on common words like "informatics"
    if (tokens.length === 1) return true;
    return haystack.includes(`${tokens[0]} ${tokens[1]}`);
  }

  return false;
}

// ============================================================================
// Aggregation
// ============================================================================

type Summary = Pick<
  QueryAgentOutput,
  | "totalCalls"
  | "successCount"
  | "errorCount"
  | "mentionRateByProvider"
  | "mentionRateByCategory"
  | "overallMentionRate"
>;

function summarize(results: QueryResult[]): Summary {
  const totalCalls = results.length;
  const successCount = results.filter((r) => r.ok).length;
  const errorCount = totalCalls - successCount;

  const providers: LlmProviderName[] = ["openai", "anthropic", "gemini", "perplexity"];
  const mentionRateByProvider: Record<LlmProviderName, number> = {
    openai: 0,
    anthropic: 0,
    gemini: 0,
    perplexity: 0,
  };
  for (const p of providers) {
    const subset = results.filter((r) => r.provider === p && r.ok);
    mentionRateByProvider[p] =
      subset.length === 0
        ? 0
        : subset.filter((r) => r.mentioned).length / subset.length;
  }

  const cats: QueryPromptCategory[] = ["category-search", "name-search"];
  const mentionRateByCategory: Record<QueryPromptCategory, number> = {
    "category-search": 0,
    "name-search": 0,
  };
  for (const c of cats) {
    const subset = results.filter((r) => r.promptCategory === c && r.ok);
    mentionRateByCategory[c] =
      subset.length === 0
        ? 0
        : subset.filter((r) => r.mentioned).length / subset.length;
  }

  const mentionedTotal = results.filter((r) => r.ok && r.mentioned).length;
  const overallMentionRate =
    successCount === 0 ? 0 : mentionedTotal / successCount;

  return {
    totalCalls,
    successCount,
    errorCount,
    mentionRateByProvider,
    mentionRateByCategory,
    overallMentionRate,
  };
}
