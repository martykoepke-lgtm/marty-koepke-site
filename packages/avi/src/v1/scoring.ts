/**
 * Scoring service — the X side of the rubric.
 *
 * Seven LLM-as-judge calls per audit: D1–D6 (universal) plus D7 (which
 * branches on subject_type: Founder & Author Signal for personal_brand,
 * Methodology & Offer Definition for company).
 *
 * Each call uses Claude Sonnet, temperature 0, JSON-mode-style strict
 * output, with the dimension's anchored 0–5 scale embedded in the
 * system prompt. The judge reads the subject's evidence package
 * (crawler output + corroboration + Visibility breakdown) and returns
 * { score, justification, evidence_pointers }.
 *
 * Per D002 the rubric is v2.0 (seven-dim subject-adaptive). Anchors
 * here are v0.1 starting drafts — calibrate after real audits.
 *
 * Read AVI_INDEX_REPORT.md §4.6 for the design.
 */

import { llmCall, type LlmCallContext } from "../llm";
import { estimateCost } from "../logging";
import type { LlmProviderName } from "../llm-providers/types";
import { supabaseAdmin } from "../supabase-client";

const SCORING_PROVIDER: LlmProviderName = "anthropic";

// ============================================================================
// Types
// ============================================================================

export type SubjectType = "personal_brand" | "company";

export type ScoringContext = {
  auditId: string;
  submissionId: string;
  ip?: string | null;
  /** e.g. "v2.0". Stamped on every audit_dimension_scores row. */
  rubricVersion: string;
  /**
   * Override the `endpoint` label attached to every llmCall fired by
   * this scoring run. The ops monitor (lib/avi/logging.ts) slices spend
   * and traffic per endpoint, so the free flow and the paid pipeline
   * need distinct labels even though they share this scoring code.
   *
   * Defaults to "paid_pipeline_score". The free /scan flow passes
   * "free_scan_score".
   */
  endpoint?: LlmCallContext["endpoint"];
};

export type ScoringEvidence = {
  subjectName: string;
  subjectUrl?: string | null;
  subjectType: SubjectType;
  /** Whatever the Crawler service returned. */
  crawler?: unknown;
  /** Whatever the Corroboration service returned. */
  corroboration?: unknown;
  /** Whatever the Aggregation service computed (Visibility sub-metrics). */
  visibility?: {
    presence: number;
    citation: number;
    shareOfVoice: number;
    prominence: number;
  };
};

export type ScoringResult = {
  startedAt: string;
  finishedAt: string;
  totalDurationMs: number;
  dimensionsScored: number;
  dimensionsFailed: number;
  totalCostUsd: number;
  /** 0.0–1.0; equal-weight average of dim scores / 5. */
  readinessScore: number | null;
  /** Per-dim summary for the report layer. */
  dimensions: Array<{
    id: string;
    name: string;
    score: number | null;
    justification: string | null;
  }>;
};

// ============================================================================
// The anchored scales — v0.1 starting drafts
// ============================================================================
//
// Format: 0 through 5, what "this score" looks like in concrete terms.
// Calibrate from real audits — if a dim is consistently scoring 4 across
// every audit, the anchors are too generous. If consistently 1, too strict.

const D1_SCALE = `0 — No clear entity name or About page; site has no consistent identity.
1 — Name appears in title but no About page; identity is implicit only.
2 — Name + brief About; name appears in <h1>; no structured entity markup.
3 — Name + About + Person OR Organization schema present and consistent across pages.
4 — Items in (3) plus tagline / positioning is unambiguous; AI can infer "who they are" from one page.
5 — Crystal clear: name, role, location, distinctive offering visible in 5 seconds; rich schema with sameAs identifiers.`;

const D2_SCALE = `0 — Zero external sources name the entity.
1 — A single external source (e.g. one LinkedIn profile, nothing else).
2 — Two to three external sources naming the entity.
3 — Four to seven external sources including at least one substantial (press, podcast, industry directory).
4 — Eight to fifteen well-distributed sources: LinkedIn + multiple directories + at least one press mention.
5 — Sixteen or more sources spanning categories: press, podcast, professional listings, Wikidata, conferences.`;

const D3_SCALE = `0 — No structured data anywhere on the site.
1 — Basic OG tags only (title, image).
2 — OG tags + minimal schema such as generic WebSite or BreadcrumbList.
3 — Person OR Organization schema present and valid; OG complete; basic robots.txt.
4 — Person + Organization + FAQPage or Service schema; llms.txt present; well-formed sitemap.
5 — Multiple schemas richly populated; llms.txt with content guidance; sameAs identifiers (Wikidata, LinkedIn) present; JSON-LD validates clean.`;

const D4_SCALE = `0 — Empty or boilerplate copy; no original content.
1 — Bare About + Contact only; nothing original.
2 — A few pages of original content but no named framework, methodology, or original statistic.
3 — Substantive original content; at least one named framework or methodology referenced.
4 — Multiple original frameworks, original statistics from own work, downloadable resources.
5 — Substantial original IP: named methodologies, published research, original data other sites cite, books or whitepapers.`;

const D5_SCALE = `0 — No clear topic focus.
1 — One topic, but only 1–2 pages of content on it.
2 — One topic with 3–5 pages of moderate depth.
3 — Clear topical focus; 5+ pages with consistent terminology; internal linking reinforces the topic.
4 — Deep coverage of a specific niche (10+ pages); content addresses subtopics with progression.
5 — Recognized authority: deep multi-faceted coverage; pillar content with cluster pages; cited by other sites in the niche.`;

const D6_SCALE = `0 — No external links pointing to the subject.
1 — One or two directory or social-profile listings.
2 — Three to five third-party mentions, mostly self-claimed (own LinkedIn, own social profiles).
3 — Six to ten mentions including at least one substantial third-party (press, podcast, industry directory).
4 — Ten or more diverse mentions spanning categories; at least two substantive third-party features.
5 — Wide distribution: 20+ mentions across press, podcasts, directories, conferences, professional listings.`;

const D7_PB_SCALE = `0 — No named founder or author visible anywhere on the site.
1 — Name in footer or About only; no bio, no photo.
2 — Named author with brief bio; no credentials, no schema, no photo of substance.
3 — Named author + bio + headshot + credentials listed; some Person schema markup.
4 — Strong founder signal: named in every relevant context; rich Person schema with sameAs; quoted in external sources; voice visible across blog/social.
5 — Founder = brand identity. Recognizable face and voice; multiple media appearances; books or original work tied to their name; recognized expert in the field.`;

const D7_CO_SCALE = `0 — No named methodology and no clear offer definition.
1 — Service list only; no named approach; pricing on request only.
2 — Service descriptions with general approach; pricing on request only.
3 — Named methodology with a proper noun; published pricing structure; defined deliverables.
4 — Named methodology + published pricing + clear scope + case studies tied to the methodology.
5 — Recognizable IP: methodology has a distinctive name, may be trademarked, taught externally, referenced by others in the industry as a defined approach.`;

// ============================================================================
// The dimension catalog (built per audit based on subject_type for D7)
// ============================================================================

type Dimension = { id: string; name: string; scale: string };

const UNIVERSAL_DIMENSIONS: Dimension[] = [
  { id: "D1", name: "Entity Clarity", scale: D1_SCALE },
  { id: "D2", name: "Cross-Source Corroboration", scale: D2_SCALE },
  { id: "D3", name: "Schema & Structured Data", scale: D3_SCALE },
  { id: "D4", name: "Information Gain", scale: D4_SCALE },
  { id: "D5", name: "Topical Authority", scale: D5_SCALE },
  { id: "D6", name: "Distribution Surface", scale: D6_SCALE },
];

const D7_PERSONAL_BRAND: Dimension = {
  id: "D7",
  name: "Founder & Author Signal",
  scale: D7_PB_SCALE,
};

const D7_COMPANY: Dimension = {
  id: "D7",
  name: "Methodology & Offer Definition",
  scale: D7_CO_SCALE,
};

function dimensionsFor(subjectType: SubjectType): Dimension[] {
  const d7 = subjectType === "personal_brand" ? D7_PERSONAL_BRAND : D7_COMPANY;
  return [...UNIVERSAL_DIMENSIONS, d7];
}

// ============================================================================
// Entry point
// ============================================================================

export async function runScoring(
  evidence: ScoringEvidence,
  context: ScoringContext,
  config?: { concurrency?: number }
): Promise<ScoringResult> {
  const startedAt = Date.now();
  const concurrency = config?.concurrency ?? 7;

  const dimensions = dimensionsFor(evidence.subjectType);
  let totalCostUsd = 0;

  const dimResults: ScoringResult["dimensions"] = new Array(dimensions.length);
  let dimensionsScored = 0;
  let dimensionsFailed = 0;

  await runWithConcurrency(
    dimensions.map((dim, index) => async () => {
      const prompt = buildScoringPrompt({ dim, evidence });
      const callContext: LlmCallContext = {
        endpoint: context.endpoint ?? "paid_pipeline_score",
        submissionId: context.submissionId,
        ip: context.ip ?? null,
      };

      const response = await llmCall(SCORING_PROVIDER, prompt, callContext);
      const cost = estimateCost(
        response.model,
        response.tokensIn,
        response.tokensOut
      );
      if (cost !== null) totalCostUsd += cost;

      if (!response.ok) {
        dimensionsFailed++;
        dimResults[index] = {
          id: dim.id,
          name: dim.name,
          score: null,
          justification: response.error ?? null,
        };
        return;
      }

      const parsed = tryParseDimScore(response.text);
      if (!parsed) {
        dimensionsFailed++;
        dimResults[index] = {
          id: dim.id,
          name: dim.name,
          score: null,
          justification: "extraction-parse-failed",
        };
        return;
      }

      // Persist immediately (upsert in case of retry).
      const persistErr = await persistDimensionScore({
        auditId: context.auditId,
        rubricVersion: context.rubricVersion,
        dim,
        score: parsed.score,
        justification: parsed.justification,
        evidencePointers: parsed.evidence_pointers,
        judgeModel: response.model,
        tokensInput: response.tokensIn ?? null,
        tokensOutput: response.tokensOut ?? null,
        costUsd: cost,
        durationMs: response.latencyMs,
      });
      if (persistErr) {
        dimensionsFailed++;
        dimResults[index] = {
          id: dim.id,
          name: dim.name,
          score: parsed.score,
          justification: `persist-failed: ${persistErr}`,
        };
        return;
      }

      dimensionsScored++;
      dimResults[index] = {
        id: dim.id,
        name: dim.name,
        score: parsed.score,
        justification: parsed.justification,
      };
    }),
    concurrency
  );

  // Compute Readiness composite — equal weight across 7 dims, normalized
  // to 0.0–1.0 by dividing by 5.
  const scored = dimResults.filter(
    (d): d is { id: string; name: string; score: number; justification: string | null } =>
      typeof d.score === "number"
  );
  const readinessScore =
    scored.length === 0
      ? null
      : round3(
          scored.reduce((sum, d) => sum + d.score, 0) / scored.length / 5
        );

  // Persist the readiness composite to the audits row. Composite + tier
  // happens in service #7 (orchestrator) after Visibility is also in place.
  if (readinessScore !== null) {
    const { error } = await supabaseAdmin()
      .from("audits")
      .update({
        readiness_score: readinessScore,
        rubric_version: context.rubricVersion,
        subject_type: evidence.subjectType,
      })
      .eq("id", context.auditId);
    if (error) {
      // Soft failure — the orchestrator will set composite + read it back anyway.
      console.warn(
        "[scoring] failed to update audits.readiness_score:",
        error.message
      );
    }
  }

  const finishedAt = Date.now();
  return {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    totalDurationMs: finishedAt - startedAt,
    dimensionsScored,
    dimensionsFailed,
    totalCostUsd: round6(totalCostUsd),
    readinessScore,
    dimensions: dimResults,
  };
}

// ============================================================================
// Prompt builder
// ============================================================================

function buildScoringPrompt(opts: {
  dim: Dimension;
  evidence: ScoringEvidence;
}): string {
  const { dim, evidence } = opts;

  // We pass the full evidence package even though most dims only need
  // part of it — the LLM-as-judge is told which signals to weigh, and
  // it costs us almost nothing to over-include.
  const evidenceJson = JSON.stringify(
    {
      subject_name: evidence.subjectName,
      subject_url: evidence.subjectUrl ?? null,
      subject_type: evidence.subjectType,
      crawler: evidence.crawler ?? null,
      corroboration: evidence.corroboration ?? null,
      visibility_breakdown: evidence.visibility ?? null,
    },
    null,
    2
  );

  return `You are scoring ONE dimension of the AI Visibility Index rubric.

DIMENSION: ${dim.id} — ${dim.name}

ANCHORED 0–5 SCALE (use these EXACT anchors, no half-credit philosophizing):
${dim.scale}

EVIDENCE PACKAGE:
${evidenceJson}

INSTRUCTIONS:
1. Read the evidence package. Focus on signals relevant to "${dim.name}". Ignore other dimensions.
2. Pick the integer score (0–5) that best matches the anchored scale. Use 0.5 increments only when the evidence sits squarely between two anchors. Default to integers.
3. Write a one-paragraph justification that names the SPECIFIC evidence you weighed and why it lands at that score.
4. Include 1–4 "evidence_pointers": short {type, value, found} triples pointing to the exact signals you used. Example: {"type":"schema","value":"Person","found":true}.

Return STRICT JSON only, no preamble, no markdown fences:

{
  "score": number,
  "justification": "string",
  "evidence_pointers": [
    { "type": "string", "value": "string", "found": boolean }
  ]
}`;
}

// ============================================================================
// JSON parsing
// ============================================================================

type ParsedDimScore = {
  score: number;
  justification: string;
  evidence_pointers: Array<{
    type: string;
    value: string;
    found: boolean;
  }>;
};

function tryParseDimScore(text: string): ParsedDimScore | null {
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

  const score = p.score;
  const justification = p.justification;
  const evidence = p.evidence_pointers;

  if (
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 5
  ) {
    return null;
  }
  if (typeof justification !== "string") return null;
  if (!Array.isArray(evidence)) return null;

  const ptrs: ParsedDimScore["evidence_pointers"] = [];
  for (const e of evidence) {
    if (typeof e !== "object" || e === null) continue;
    const er = e as Record<string, unknown>;
    if (
      typeof er.type === "string" &&
      typeof er.value === "string" &&
      typeof er.found === "boolean"
    ) {
      ptrs.push({ type: er.type, value: er.value, found: er.found });
    }
  }

  // Round score to 1 decimal so it fits numeric(3,1).
  return {
    score: Math.round(score * 10) / 10,
    justification,
    evidence_pointers: ptrs,
  };
}

// ============================================================================
// Persistence
// ============================================================================

async function persistDimensionScore(opts: {
  auditId: string;
  rubricVersion: string;
  dim: Dimension;
  score: number;
  justification: string;
  evidencePointers: ParsedDimScore["evidence_pointers"];
  judgeModel: string;
  tokensInput: number | null;
  tokensOutput: number | null;
  costUsd: number | null;
  durationMs: number;
}): Promise<string | null> {
  // Upsert by (audit_id, dimension_id) so retries don't break the
  // unique constraint defined in migration 0007.
  const { error } = await supabaseAdmin()
    .from("audit_dimension_scores")
    .upsert(
      {
        audit_id: opts.auditId,
        dimension_id: opts.dim.id,
        dimension_name: opts.dim.name,
        score: opts.score,
        justification: opts.justification,
        evidence_pointers: opts.evidencePointers,
        judge_model: opts.judgeModel,
        judge_tokens_input: opts.tokensInput,
        judge_tokens_output: opts.tokensOutput,
        judge_cost_usd: opts.costUsd,
        judge_duration_ms: opts.durationMs,
        rubric_version: opts.rubricVersion,
      },
      { onConflict: "audit_id,dimension_id" }
    );

  if (error) {
    console.warn(
      "[scoring] failed to upsert audit_dimension_scores row:",
      error.message,
      { auditId: opts.auditId, dim: opts.dim.id }
    );
    return error.message;
  }
  return null;
}

// ============================================================================
// Concurrency helper (private, same shape as the others)
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
        // task absorbs its own errors
      }
    }
  }
  const workers: Promise<void>[] = [];
  const actualLimit = Math.min(limit, tasks.length);
  for (let w = 0; w < actualLimit; w++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

function round3(n: number): number {
  return Math.round(n * 1_000) / 1_000;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
