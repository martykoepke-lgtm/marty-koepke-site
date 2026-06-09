/**
 * QueryGrid (v2.0).
 *
 * Runs the locked 10-template × 4-engine × 2-rep grid against a subject.
 * Each of the 80 cells is one LLM call routed through `llmCall()`. Per
 * cell, one row is inserted into `audit_query_responses` capturing the
 * raw response and per-call bookkeeping.
 *
 * Extraction (mentioned, cited_with_link, position_band, etc.) is the
 * job of a separate service that updates these rows in place. This
 * service stops at "raw response stored, cell metadata recorded."
 *
 * Read AVI_INDEX_REPORT.md §4.3 for the design (template table, splits,
 * target_query override behavior).
 */

import { llmCall, type LlmCallContext } from "./llm";
import { estimateCost } from "./logging";
import type { LlmProviderName } from "./llm-providers/types";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================================================
// Subject + template types
// ============================================================================

export type QueryGridSubjectType = "personal_brand" | "company";

/**
 * Slot data for rendering the v2 templates. Required fields are name,
 * industry, subject_type. Everything else has a sensible default the
 * template builder falls back on.
 */
export type QueryGridSubject = {
  name: string;
  industry: string;
  subject_type: QueryGridSubjectType;

  url?: string | null;
  location?: string | null;
  competitor_urls?: string[] | null;

  /**
   * Customer's own phrasing of the question they'd ask AI. When provided,
   * replaces template 3 (cat-helps-with-pain). When omitted, template 3
   * falls back on the buyer_descriptor + pain_point slots.
   */
  target_query?: string | null;

  /** Short label for the customer / target buyer, e.g. "small clinic". */
  buyer_descriptor?: string | null;
  /** Pain point in buyer language, e.g. "showing up in ChatGPT recommendations". */
  pain_point?: string | null;
  /** Buyer scenario in their voice, e.g. "needs to switch from print-only marketing". */
  scenario?: string | null;
  /** A distinctive method / term the subject is associated with, e.g. "GEO" or "ambient AI scribe". */
  distinctive_term?: string | null;
};

export type QueryTemplateCategory =
  | "category-search"
  | "name-search"
  | "competitive"
  | "buyer-scenario";

export type QueryTemplate = {
  id: string;
  category: QueryTemplateCategory;
  /**
   * Render the prompt text for a subject. Return `null` to skip the
   * template for this subject (e.g. competitive template skips if no
   * competitor was supplied).
   */
  build: (s: QueryGridSubject) => string | null;
};

// ============================================================================
// The locked v2.0 template bank
// ============================================================================

export const V2_TEMPLATES: QueryTemplate[] = [
  {
    id: "cat-best-for-buyer",
    category: "category-search",
    build: (s) =>
      `Best ${s.industry}${s.buyer_descriptor ? ` for ${s.buyer_descriptor}` : ""}?`,
  },
  {
    id: "cat-top-5-location",
    category: "category-search",
    build: (s) =>
      `Top 5 ${s.industry} in ${s.location ?? "the United States"}`,
  },
  {
    id: "cat-helps-with-pain",
    category: "category-search",
    build: (s) => {
      // target_query override per AVI_INDEX_REPORT.md §4.3.
      if (s.target_query?.trim()) return s.target_query.trim();
      return `Who helps ${s.buyer_descriptor ?? "small businesses"} with ${s.pain_point ?? "their core challenges"}?`;
    },
  },
  {
    id: "cat-recommend-scenario",
    category: "category-search",
    build: (s) =>
      `Recommend a ${s.industry} for someone who ${s.scenario ?? "needs this kind of service"}`,
  },
  {
    id: "cat-distinctive-term",
    category: "category-search",
    build: (s) =>
      `What companies offer ${s.distinctive_term ?? s.industry}?`,
  },
  {
    id: "name-tell-me-about",
    category: "name-search",
    build: (s) => `Tell me about ${s.name}. What do they do?`,
  },
  {
    id: "name-reputable",
    category: "name-search",
    build: (s) => `Is ${s.name} reputable? Should I hire them?`,
  },
  {
    id: "name-pricing-approach",
    category: "name-search",
    build: (s) => `What's ${s.name}'s pricing or approach?`,
  },
  {
    id: "competitive-vs",
    category: "competitive",
    build: (s) => {
      const competitor = s.competitor_urls?.[0];
      if (!competitor) return null;
      const competitorName = labelFromUrl(competitor);
      return `${s.name} vs ${competitorName}`;
    },
  },
  {
    id: "buyer-scenario",
    category: "buyer-scenario",
    build: (s) =>
      `I'm a ${s.buyer_descriptor ?? "buyer"} in ${s.location ?? "the United States"}. Should I hire ${s.name}?`,
  },
];

// ============================================================================
// Run config
// ============================================================================

export const DEFAULT_ENGINES: LlmProviderName[] = [
  "anthropic",
  "openai",
  "gemini",
  "perplexity",
];

export const DEFAULT_REPS = 2;
export const DEFAULT_CONCURRENCY = 5;

export type QueryGridConfig = {
  templates?: QueryTemplate[];
  engines?: LlmProviderName[];
  reps?: number;
  concurrency?: number;
};

export type QueryGridContext = {
  /** The audits.id this grid is being run for. Required. */
  auditId: string;
  /** The submissions.id linked to that audit. Used in api_calls.submission_id. */
  submissionId: string;
  ip?: string | null;
};

export type QueryGridResult = {
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  /** Cells we attempted to run (post template-skip filtering). */
  totalCells: number;
  successCount: number;
  errorCount: number;
  /** Sum of estimated cost across all cells. */
  totalCostUsd: number;
};

// ============================================================================
// Entry point
// ============================================================================

export async function runQueryGrid(
  subject: QueryGridSubject,
  context: QueryGridContext,
  config?: QueryGridConfig
): Promise<QueryGridResult> {
  const startedAt = Date.now();

  const templates = config?.templates ?? V2_TEMPLATES;
  const engines = config?.engines ?? DEFAULT_ENGINES;
  const reps = config?.reps ?? DEFAULT_REPS;
  const concurrency = config?.concurrency ?? DEFAULT_CONCURRENCY;

  // Build the cell list: (template × engine × rep_index). Templates that
  // return null for this subject (e.g. competitive when no competitor)
  // are skipped at this stage so we don't waste a slot.
  type Cell = {
    template: QueryTemplate;
    engine: LlmProviderName;
    repIndex: number;
    promptText: string;
  };

  const cells: Cell[] = [];
  for (const template of templates) {
    const promptText = template.build(subject);
    if (!promptText) continue; // template opted out
    for (const engine of engines) {
      for (let rep = 1; rep <= reps; rep++) {
        cells.push({ template, engine, repIndex: rep, promptText });
      }
    }
  }

  // Run with bounded concurrency.
  let successCount = 0;
  let errorCount = 0;
  let totalCostUsd = 0;

  await runWithConcurrency(cells.map((cell) => async () => {
    const callContext: LlmCallContext = {
      endpoint: "paid_pipeline_query",
      submissionId: context.submissionId,
      ip: context.ip ?? null,
    };
    const response = await llmCall(cell.engine, cell.promptText, callContext);

    const cost = estimateCost(
      response.model,
      response.tokensIn,
      response.tokensOut
    );
    if (cost !== null) totalCostUsd += cost;

    if (response.ok) successCount++; else errorCount++;

    // Persist the cell. Fail-open on the insert (logged via console);
    // the audit can still proceed with the cells that did persist.
    const { error } = await supabaseAdmin()
      .from("audit_query_responses")
      .insert({
        audit_id: context.auditId,
        query_id: cell.template.id,
        query_category: cell.template.category,
        query_text: cell.promptText,
        engine: cell.engine,
        rep_index: cell.repIndex,
        response_text: response.text ?? null,
        tokens_input: response.tokensIn ?? null,
        tokens_output: response.tokensOut ?? null,
        cost_usd: cost,
        duration_ms: response.latencyMs,
        status: response.ok ? "success" : "error",
        error_message: response.error ?? null,
      });
    if (error) {
      console.warn(
        "[query-grid] failed to persist audit_query_responses row:",
        error.message,
        {
          query_id: cell.template.id,
          engine: cell.engine,
          rep_index: cell.repIndex,
        }
      );
    }
  }), concurrency);

  const finishedAt = Date.now();

  return {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    totalDurationMs: finishedAt - startedAt,
    totalCells: cells.length,
    successCount,
    errorCount,
    totalCostUsd: round6(totalCostUsd),
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Run an array of async tasks with a maximum of `limit` in flight at once.
 * Pure utility — no external deps. Resolved when every task has settled.
 */
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= tasks.length) return;
      try {
        results[i] = await tasks[i]();
      } catch {
        // Errors are absorbed by the task itself (it should never throw
        // beyond llmCall / supabase insert which both fail-open).
      }
    }
  }

  const workers: Promise<void>[] = [];
  const actualLimit = Math.min(limit, tasks.length);
  for (let w = 0; w < actualLimit; w++) workers.push(worker());
  await Promise.all(workers);

  return results;
}

/**
 * Extract a readable competitor label from a URL.
 *   https://tryprofound.com → "tryprofound.com" → "Tryprofound"
 *   https://otterly.ai → "otterly.ai" → "Otterly"
 * Good enough for the v2 competitive template.
 */
function labelFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const firstPart = host.split(".")[0];
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
  } catch {
    return url;
  }
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
