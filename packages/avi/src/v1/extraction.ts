/**
 * Extraction service.
 *
 * One LLM call per query response. Cheap model (GPT-4o-mini) — the job
 * is pure structured parsing of "did the AI mention the subject, where,
 * and how," not nuanced judgment. Updates the `audit_query_responses`
 * rows IN PLACE (no new rows).
 *
 * Idempotent: only operates on rows where `status='success'` AND
 * `mentioned IS NULL` (the not-yet-extracted state).
 *
 * Read AVI_INDEX_REPORT.md §4.4 for the design.
 */

import { llmCall, type LlmCallContext } from "../llm";
import { estimateCost } from "../logging";
import type { LlmProviderName } from "../llm-providers/types";
import { supabaseAdmin } from "../supabase-client";

// Use the cheap path for extraction. Pure parsing → small model is enough.
const EXTRACTION_PROVIDER: LlmProviderName = "openai";

const VALID_POSITION_BANDS = new Set([
  "top",
  "middle",
  "late",
  "not_named",
]);

export type ExtractionContext = {
  auditId: string;
  submissionId: string;
  ip?: string | null;
};

export type ExtractionInput = {
  subjectName: string;
  subjectUrl?: string | null;
  competitorUrls?: string[] | null;
};

export type ExtractionResult = {
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  rowsProcessed: number;
  rowsUpdated: number;
  rowsFailed: number;
  totalCostUsd: number;
};

type AuditQueryResponseRow = {
  id: string;
  query_text: string;
  response_text: string | null;
};

type ExtractedFields = {
  mentioned: boolean;
  cited_with_link: boolean;
  position_band: "top" | "middle" | "late" | "not_named";
  competitors_mentioned: string[];
  evidence_text: string;
};

export async function runExtraction(
  input: ExtractionInput,
  context: ExtractionContext,
  config?: { concurrency?: number }
): Promise<ExtractionResult> {
  const startedAt = Date.now();
  const concurrency = config?.concurrency ?? 10;

  const supabase = supabaseAdmin();

  // Pull cells that need extraction.
  const { data: rows, error } = await supabase
    .from("audit_query_responses")
    .select("id, query_text, response_text")
    .eq("audit_id", context.auditId)
    .eq("status", "success")
    .is("mentioned", null)
    .returns<AuditQueryResponseRow[]>();

  if (error) {
    throw new Error(
      `[extraction] failed to read audit_query_responses: ${error.message}`
    );
  }
  const toProcess = rows ?? [];

  let rowsUpdated = 0;
  let rowsFailed = 0;
  let totalCostUsd = 0;

  await runWithConcurrency(
    toProcess.map((row) => async () => {
      // Skip if response is blank — nothing to extract.
      if (!row.response_text?.trim()) {
        const fields: ExtractedFields = {
          mentioned: false,
          cited_with_link: false,
          position_band: "not_named",
          competitors_mentioned: [],
          evidence_text: "",
        };
        await persistExtraction(row.id, fields);
        rowsUpdated++;
        return;
      }

      const prompt = buildExtractionPrompt({
        subjectName: input.subjectName,
        subjectUrl: input.subjectUrl ?? null,
        competitorUrls: input.competitorUrls ?? [],
        queryText: row.query_text,
        responseText: row.response_text,
      });

      const callContext: LlmCallContext = {
        endpoint: "paid_pipeline_extract",
        submissionId: context.submissionId,
        ip: context.ip ?? null,
      };

      const llmResponse = await llmCall(
        EXTRACTION_PROVIDER,
        prompt,
        callContext
      );

      const cost = estimateCost(
        llmResponse.model,
        llmResponse.tokensIn,
        llmResponse.tokensOut
      );
      if (cost !== null) totalCostUsd += cost;

      if (!llmResponse.ok) {
        rowsFailed++;
        return;
      }

      // Try to parse JSON. Strict — no smart-quote tolerance for v1; the
      // model is asked for clean JSON and the extraction prompt is
      // explicit. If parse fails we mark the row as failed extraction
      // and the aggregation layer treats the cell as "not extracted."
      const fields = tryParseExtraction(llmResponse.text);
      if (!fields) {
        rowsFailed++;
        return;
      }

      const persistErr = await persistExtraction(row.id, fields);
      if (persistErr) {
        rowsFailed++;
        return;
      }

      rowsUpdated++;
    }),
    concurrency
  );

  const finishedAt = Date.now();
  return {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    totalDurationMs: finishedAt - startedAt,
    rowsProcessed: toProcess.length,
    rowsUpdated,
    rowsFailed,
    totalCostUsd: round6(totalCostUsd),
  };
}

// ============================================================================
// Prompt
// ============================================================================

function buildExtractionPrompt(opts: {
  subjectName: string;
  subjectUrl: string | null;
  competitorUrls: string[];
  queryText: string;
  responseText: string;
}): string {
  const subjectUrlLine = opts.subjectUrl
    ? `Subject URL: ${opts.subjectUrl}`
    : `Subject URL: (none on file)`;
  const competitorsLine = opts.competitorUrls.length
    ? `Known competitor URLs: ${opts.competitorUrls.join(", ")}`
    : `Known competitor URLs: (none on file)`;

  return `You extract structured signals from one AI assistant's response.

The subject we are testing: "${opts.subjectName}"
${subjectUrlLine}
${competitorsLine}

The AI assistant was asked:
"${opts.queryText}"

The AI assistant responded:
---
${opts.responseText}
---

Return STRICT JSON with these exact fields:

{
  "mentioned": boolean,
  "cited_with_link": boolean,
  "position_band": "top" | "middle" | "late" | "not_named",
  "competitors_mentioned": [string, ...],
  "evidence_text": string
}

Definitions:
- "mentioned": true if "${opts.subjectName}" (or a close variant — accept reasonable abbreviations and the founder's name if applicable) appears in the response.
- "cited_with_link": true if the subject's URL appears OR a substantial quote from the subject's own writing is reproduced.
- "position_band":
    "top" if the subject is first named in the first 25% of the response,
    "middle" if 25%–66%,
    "late" if 66%–100%,
    "not_named" if "mentioned" is false.
- "competitors_mentioned": names of OTHER businesses in the same category that appear in the response. Empty array if none.
- "evidence_text": the shortest verbatim quote (<= 280 characters) from the response that supports your classification. Empty string if "mentioned" is false.

Return ONLY the JSON object. No preamble, no explanation, no markdown fences.`;
}

// ============================================================================
// JSON parsing
// ============================================================================

function tryParseExtraction(text: string): ExtractedFields | null {
  // Strip any markdown fences the model might have added against instructions.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;

  const mentioned = p.mentioned;
  const cited = p.cited_with_link;
  const position = p.position_band;
  const competitors = p.competitors_mentioned;
  const evidence = p.evidence_text;

  if (typeof mentioned !== "boolean") return null;
  if (typeof cited !== "boolean") return null;
  if (typeof position !== "string" || !VALID_POSITION_BANDS.has(position)) {
    return null;
  }
  if (
    !Array.isArray(competitors) ||
    !competitors.every((c) => typeof c === "string")
  ) {
    return null;
  }
  if (typeof evidence !== "string") return null;

  return {
    mentioned,
    cited_with_link: cited,
    position_band: position as ExtractedFields["position_band"],
    competitors_mentioned: competitors,
    // Cap evidence at the schema-comment limit (280 chars).
    evidence_text: evidence.slice(0, 280),
  };
}

// ============================================================================
// Database update
// ============================================================================

async function persistExtraction(
  rowId: string,
  fields: ExtractedFields
): Promise<string | null> {
  const { error } = await supabaseAdmin()
    .from("audit_query_responses")
    .update({
      mentioned: fields.mentioned,
      cited_with_link: fields.cited_with_link,
      position_band: fields.position_band,
      competitors_mentioned: fields.competitors_mentioned,
      evidence_text: fields.evidence_text,
    })
    .eq("id", rowId);

  if (error) {
    console.warn(
      "[extraction] failed to update audit_query_responses row:",
      error.message,
      { rowId }
    );
    return error.message;
  }
  return null;
}

// ============================================================================
// Concurrency helper (private)
// ============================================================================

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
        // Tasks absorb their own errors; this is just a backstop.
      }
    }
  }

  const workers: Promise<void>[] = [];
  const actualLimit = Math.min(limit, tasks.length);
  for (let w = 0; w < actualLimit; w++) workers.push(worker());
  await Promise.all(workers);

  return results;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
