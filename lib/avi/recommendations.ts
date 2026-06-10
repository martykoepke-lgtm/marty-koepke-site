/**
 * Recommendations service.
 *
 * One LLM call (Claude Sonnet) after Scoring. Reads the seven dimension
 * scores + justifications + evidence + crawler + corroboration + subject
 * info, returns 5–8 plain-English recommendations grouped by category.
 *
 * Persisted to audits.recommendations (jsonb).
 *
 * The hard rules for the LLM are in the system prompt — no jargon, no
 * "schema markup" / "JSON-LD," concrete actions, verifiable outcomes,
 * skip what the subject already does, match subject_type, prioritize by
 * impact-per-hour.
 *
 * Output schema:
 *
 *   {
 *     "recommendations": [
 *       {
 *         "title": "Make your offer crystal clear on your website",
 *         "category": "Pricing & offer definition",
 *         "why_it_matters": "...",
 *         "do_this": ["...", "...", "..."],
 *         "youll_know_it_worked": "...",
 *         "effort": "1hr",
 *         "dimensions_lifted": ["D7"],
 *         "estimated_delta": "+2.0",
 *         "priority": 1
 *       },
 *       ...
 *     ]
 *   }
 */

import { llmCall, type LlmCallContext } from "./llm";
import { estimateCost } from "./logging";
import type { LlmProviderName } from "./llm-providers/types";
import { supabaseAdmin } from "@/lib/supabase";

const RECOMMENDATIONS_PROVIDER: LlmProviderName = "anthropic";

export const CATEGORIES = [
  "Website fundamentals",
  "Pricing & offer definition",
  "LinkedIn",
  "External mentions",
  "Wikidata & knowledge graphs",
  "Content & authority",
] as const;

export type RecommendationCategory = (typeof CATEGORIES)[number];

export const EFFORT_LEVELS = [
  "15min",
  "1hr",
  "half day",
  "1day",
  "1week",
  "2+weeks",
] as const;

export type EffortLevel = (typeof EFFORT_LEVELS)[number];

export type Recommendation = {
  title: string;
  category: RecommendationCategory;
  why_it_matters: string;
  do_this: string[];
  youll_know_it_worked: string;
  effort: EffortLevel;
  dimensions_lifted: string[];
  estimated_delta: string;
  priority: number;
};

export type RecommendationsContext = {
  auditId: string;
  submissionId: string;
  ip?: string | null;
};

export type RecommendationsInput = {
  subjectName: string;
  subjectUrl?: string | null;
  subjectType: "personal_brand" | "company";
  industry?: string | null;
  location?: string | null;
  /** Plain object — the seven dim score rows from audit_dimension_scores. */
  dimensions: Array<{
    id: string;
    name: string;
    score: number | null;
    justification: string | null;
    evidence_pointers?: Array<{ type: string; value: string; found: boolean }>;
  }>;
  visibility?: {
    presence: number;
    citation: number;
    shareOfVoice: number;
    prominence: number;
  };
  crawler?: unknown;
  corroboration?: unknown;
};

export type RecommendationsResult = {
  recommendations: Recommendation[];
  costUsd: number;
  durationMs: number;
  parseOk: boolean;
};

// ============================================================================
// Entry point
// ============================================================================

export async function runRecommendations(
  input: RecommendationsInput,
  context: RecommendationsContext
): Promise<RecommendationsResult> {
  const prompt = buildPrompt(input);
  const callContext: LlmCallContext = {
    endpoint: "paid_pipeline_recommendations",
    submissionId: context.submissionId,
    ip: context.ip ?? null,
  };

  const startedAt = Date.now();
  const response = await llmCall(RECOMMENDATIONS_PROVIDER, prompt, callContext);
  const durationMs = Date.now() - startedAt;
  const cost = estimateCost(
    response.model,
    response.tokensIn,
    response.tokensOut
  );

  if (!response.ok) {
    return {
      recommendations: [],
      costUsd: cost ?? 0,
      durationMs,
      parseOk: false,
    };
  }

  const parsed = tryParse(response.text);
  if (!parsed) {
    return {
      recommendations: [],
      costUsd: cost ?? 0,
      durationMs,
      parseOk: false,
    };
  }

  // Persist
  await supabaseAdmin()
    .from("audits")
    .update({ recommendations: parsed })
    .eq("id", context.auditId);

  return {
    recommendations: parsed,
    costUsd: cost ?? 0,
    durationMs,
    parseOk: true,
  };
}

// ============================================================================
// Prompt construction
// ============================================================================

function buildPrompt(input: RecommendationsInput): string {
  const dimensionsBlock = input.dimensions
    .map((d) => {
      const score = d.score == null ? "—" : `${d.score.toFixed(1)}/5`;
      const evidence =
        (d.evidence_pointers ?? [])
          .map(
            (e) => `${e.found ? "[+]" : "[-]"} ${e.type}=${e.value}`
          )
          .join("; ") || "(no pointers)";
      return [
        `### ${d.id} — ${d.name}: ${score}`,
        `Judge said: ${d.justification ?? "(no justification)"}`,
        `Evidence: ${evidence}`,
      ].join("\n");
    })
    .join("\n\n");

  const visibilityBlock = input.visibility
    ? [
        `Presence: ${input.visibility.presence.toFixed(2)} (named in ${Math.round(
          input.visibility.presence * 100
        )}% of responses)`,
        `Citation: ${input.visibility.citation.toFixed(2)} (cited with link in ${Math.round(
          input.visibility.citation * 100
        )}%)`,
        `Share-of-Voice: ${input.visibility.shareOfVoice.toFixed(2)} (vs. competitors)`,
        `Prominence: ${input.visibility.prominence.toFixed(2)} (position when named)`,
      ].join("\n")
    : "(no visibility data)";

  const crawlerSummary = summarizeCrawler(input.crawler);
  const corroborationSummary = summarizeCorroboration(input.corroboration);

  return `You are writing the "What to do next" section of an AI Visibility Index audit report. The reader is a small-business owner — smart but NOT technical. Plain English only.

SUBJECT
- Name: ${input.subjectName}
- URL: ${input.subjectUrl ?? "(no URL)"}
- Subject type: ${input.subjectType}
- Industry: ${input.industry ?? "(unspecified)"}
- Location: ${input.location ?? "(unspecified)"}

DIMENSION SCORES + JUDGE FINDINGS
${dimensionsBlock}

VISIBILITY BREAKDOWN
${visibilityBlock}

CRAWLER FINDINGS (already true about the subject's site)
${crawlerSummary}

CROSS-SOURCE CORROBORATION
${corroborationSummary}

CATEGORIES (use these exact strings):
1. "Website fundamentals" — content, structure, machine-readable signals
2. "Pricing & offer definition" — pricing page, named methodology, defined deliverables
3. "LinkedIn" — profile completeness, founder/company linking, content
4. "External mentions" — directories, podcasts, press, conferences, industry sites
5. "Wikidata & knowledge graphs" — Wikidata entity, Google Knowledge Panel, Crunchbase
6. "Content & authority" — blog cadence, original statistics, downloadable resources

YOUR JOB

Produce 5 to 8 recommendations. Group them across at least 3 different categories so the work happens in multiple places, not just on the website.

HARD RULES
- PLAIN ENGLISH ONLY. Never write "schema markup," "JSON-LD," "structured data markup," "sameAs," "h1 tags." Translate. Say "machine-readable info tags" or "the kind of code search engines read." Say "your website's underlying signals." Better still, describe the OUTCOME: "make sure ChatGPT can find your company description."
- ACTIONABLE TODAY. The owner can start the work this week. No "hire an SEO consultant."
- VERIFIABLE. Every recommendation ends with an observable check — "ask ChatGPT this question two weeks from now and confirm it returns X."
- SKIP WHAT'S ALREADY DONE. If the crawler shows llms.txt is present, don't recommend adding llms.txt. If the corroboration shows real LinkedIn, don't recommend creating one.
- MATCH SUBJECT TYPE. For "${input.subjectType}", recommend appropriately. Personal brands need founder-signal moves; companies need methodology and pricing moves. Solo-founder companies need both.
- PRIORITIZE BY IMPACT-PER-HOUR. Item 1 is highest-impact-per-hour, not highest-impact overall. A 1-hour fix that moves a dim by 1.5 beats a 2-week fix that moves it by 2.0.
- Effort values MUST be one of: "15min", "1hr", "half day", "1day", "1week", "2+weeks".
- Estimated_delta is the score lift you expect on the named dimensions (e.g. "+1.5" or "+0.5 to +2.0").

OUTPUT
Return STRICT JSON only, no preamble, no markdown fences:

{
  "recommendations": [
    {
      "title": "Imperative, plain-English title (5-10 words)",
      "category": "<one of the 6 exact category strings>",
      "why_it_matters": "1-2 sentences. What problem this solves for the owner, in their language.",
      "do_this": ["Concrete step 1", "Concrete step 2", "Concrete step 3"],
      "youll_know_it_worked": "Observable success criterion (e.g. 'Ask ChatGPT \\"What is X\\" and you see Y, within 14 days.').",
      "effort": "1hr",
      "dimensions_lifted": ["D3", "D7"],
      "estimated_delta": "+1.5",
      "priority": 1
    }
  ]
}`;
}

// ============================================================================
// JSON parsing
// ============================================================================

function tryParse(text: string): Recommendation[] | null {
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
  const p = parsed as { recommendations?: unknown };
  if (!Array.isArray(p.recommendations)) return null;

  const out: Recommendation[] = [];
  for (const r of p.recommendations) {
    if (typeof r !== "object" || r === null) continue;
    const rr = r as Record<string, unknown>;

    if (typeof rr.title !== "string") continue;
    if (typeof rr.category !== "string") continue;
    if (!CATEGORIES.includes(rr.category as RecommendationCategory)) continue;
    if (typeof rr.why_it_matters !== "string") continue;
    if (!Array.isArray(rr.do_this)) continue;
    const doThis = rr.do_this.filter((s): s is string => typeof s === "string");
    if (doThis.length === 0) continue;
    if (typeof rr.youll_know_it_worked !== "string") continue;
    if (typeof rr.effort !== "string") continue;
    if (!EFFORT_LEVELS.includes(rr.effort as EffortLevel)) continue;
    if (!Array.isArray(rr.dimensions_lifted)) continue;
    const dims = rr.dimensions_lifted.filter(
      (s): s is string => typeof s === "string"
    );
    if (typeof rr.estimated_delta !== "string") continue;
    if (typeof rr.priority !== "number") continue;

    out.push({
      title: rr.title,
      category: rr.category as RecommendationCategory,
      why_it_matters: rr.why_it_matters,
      do_this: doThis,
      youll_know_it_worked: rr.youll_know_it_worked,
      effort: rr.effort as EffortLevel,
      dimensions_lifted: dims,
      estimated_delta: rr.estimated_delta,
      priority: rr.priority,
    });
  }

  // Sort by priority ascending (1 = highest)
  out.sort((a, b) => a.priority - b.priority);

  return out;
}

// ============================================================================
// Evidence summarizers (compact representation for the prompt)
// ============================================================================

function summarizeCrawler(crawler: unknown): string {
  if (!crawler || typeof crawler !== "object") return "(no crawler data)";
  const c = crawler as Record<string, unknown>;
  const checks: Array<[string, boolean]> = [
    ["Reachable", !!c.reachable],
    ["Person schema present", !!c.personSchemaPresent],
    ["Organization schema present", !!c.organizationSchemaPresent],
    ["FAQ schema present", !!c.faqSchemaPresent],
    ["Service schema present", !!c.serviceSchemaPresent],
    ["llms.txt present", !!c.llmsTxtPresent],
    ["robots.txt present", !!c.robotsTxtPresent],
    ["Founder likely named on site", !!c.founderLikelyNamed],
    ["Pricing likely visible on site", !!c.pricingLikelyVisible],
  ];
  return checks
    .map(([label, val]) => `${val ? "[YES]" : "[NO ]"} ${label}`)
    .join("\n");
}

function summarizeCorroboration(corroboration: unknown): string {
  if (!corroboration || typeof corroboration !== "object")
    return "(no corroboration data)";
  const c = corroboration as Record<string, unknown>;
  const lines: string[] = [];
  lines.push(
    `LinkedIn profile found: ${c.linkedinPresent ? "yes" : "no"}${
      c.linkedinUrl ? ` (${c.linkedinUrl})` : ""
    }`
  );
  lines.push(
    `Wikidata entry found: ${c.wikidataPresent ? "yes" : "no"}${
      c.wikidataUrl ? ` (${c.wikidataUrl})` : ""
    }`
  );
  lines.push(
    `Total external domains naming the subject: ${c.totalCorroboratingDomains ?? 0}`
  );
  return lines.join("\n");
}
