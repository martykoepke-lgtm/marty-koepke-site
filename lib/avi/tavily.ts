/**
 * Tavily search wrapper.
 *
 * Every Tavily call from the AVI system MUST go through `tavilySearch()`
 * here. Same enforcement pattern as `lib/avi/llm.ts` for LLMs and
 * `lib/avi/email.ts` for Resend — single point that talks to the
 * external API + logs every call to api_calls so the ops monitor sees
 * the spend.
 *
 * Tavily is HTTP-only (no official SDK), so the wrapper is a thin fetch
 * around the search endpoint. Cost is per-search ($0.005 basic,
 * $0.008 advanced) — we charge a flat per-call cost based on
 * `search_depth`, not on tokens.
 *
 * Read AVI_INDEX_REPORT.md §4.2 for the design.
 */

import { logApiCall } from "./logging";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

const TAVILY_COST_USD: Record<"basic" | "advanced", number> = {
  basic: 0.005,
  advanced: 0.008,
};

/**
 * Context attached to every logged Tavily call. Tells the ops monitor
 * which part of the system originated the call and which submission
 * (if any) it relates to.
 */
export type TavilyCallContext = {
  endpoint:
    | "corroboration_broad"
    | "corroboration_linkedin"
    | "corroboration_wikidata"
    | "corroboration_other"
    | (string & {});
  submissionId?: string | null;
  ip?: string | null;
};

export type TavilySearchInput = {
  query: string;
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
};

export type TavilyResultRow = {
  url: string;
  title: string;
  content: string;
  score: number;
  publishedDate?: string;
};

export type TavilyResponse = {
  ok: boolean;
  query: string;
  results: TavilyResultRow[];
  /** Tavily-provided one-paragraph summary, if available */
  answer?: string;
  error?: string;
};

/**
 * Run one Tavily search. Always logs to api_calls; never throws — the
 * caller checks `ok` on the return value.
 */
export async function tavilySearch(
  input: TavilySearchInput,
  context: TavilyCallContext
): Promise<TavilyResponse> {
  const startedAt = Date.now();
  const depth: "basic" | "advanced" = input.searchDepth ?? "basic";
  const maxResults = input.maxResults ?? 5;

  let status: "success" | "error" | "timeout" | "rate_limited" = "success";
  let errorMessage: string | null = null;
  let parsed: TavilyResponse = {
    ok: false,
    query: input.query,
    results: [],
  };

  try {
    const key = process.env.TAVILY_API_KEY;
    if (!key) {
      throw new Error(
        "Missing TAVILY_API_KEY — add it to .env.local (server-side only)."
      );
    }

    const res = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        query: input.query,
        search_depth: depth,
        max_results: maxResults,
        include_domains: input.includeDomains,
        exclude_domains: input.excludeDomains,
      }),
    });

    if (res.status === 429) {
      status = "rate_limited";
      errorMessage = `Tavily rate-limited (HTTP 429)`;
    } else if (!res.ok) {
      status = "error";
      errorMessage = `Tavily HTTP ${res.status}: ${await res.text().catch(() => "<unreadable>")}`;
    } else {
      const json = (await res.json()) as {
        results?: Array<{
          url: string;
          title: string;
          content: string;
          score: number;
          published_date?: string;
        }>;
        answer?: string;
      };
      parsed = {
        ok: true,
        query: input.query,
        results: (json.results ?? []).map((r) => ({
          url: r.url,
          title: r.title,
          content: r.content,
          score: r.score,
          publishedDate: r.published_date,
        })),
        answer: json.answer,
      };
    }
  } catch (e) {
    status = "error";
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  await logApiCall({
    provider: "tavily",
    model: depth, // we stash the depth here for downstream "what kind of search did we run?" analytics
    endpoint: context.endpoint,
    submission_id: context.submissionId ?? null,
    tokens_input: null,
    tokens_output: null,
    cost_estimated_usd:
      status === "success" ? TAVILY_COST_USD[depth] : 0,
    request_id: null,
    duration_ms: Date.now() - startedAt,
    status,
    error_message: errorMessage,
    ip: context.ip ?? null,
  });

  if (status !== "success") {
    parsed.ok = false;
    parsed.error = errorMessage ?? "Tavily failure";
  }

  return parsed;
}
