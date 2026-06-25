/**
 * Audit persistence — writes the in-memory Audit object to Supabase v2 tables.
 *
 * Called by both the CLI runners and the console after `runAudit()` completes.
 * Same data path either way — the only difference is who invokes it.
 *
 * Tables written, in FK-safe order:
 *   1. subjects                       (upsert if subject didn't already exist)
 *   2. audits_v2                      (the run record)
 *   3. audit_subjects_snapshot        (frozen subject metadata)
 *   4. audit_crawler_evidence         (crawler output)
 *   5. audit_corroboration            (N rows, one per Tavily result)
 *   6. audit_engine_responses         (paid mode only — 12 rows)
 *   7. audit_extracted                (paid mode only — one per engine response)
 *   8. audit_visibility_outcomes      (paid mode only)
 *   9. audit_driver_scores            (5 rows)
 *  10. audit_v2_recommendations       (1 row)
 *
 * All inserts use the service-role client (bypasses RLS).
 */

import { supabaseAdmin } from "./supabase-client";
import type { Audit, DriverScore } from "./types";

const JUDGE_MODEL_FALLBACK = "claude-sonnet-4-5";
const RECOMMENDER_MODEL_FALLBACK = "claude-sonnet-4-5";

export interface PersistResult {
  ok: boolean;
  audit_id: string;
  subject_id: string;
  steps_persisted: string[];
  errors: { step: string; message: string }[];
}

export async function persistAudit(audit: Audit): Promise<PersistResult> {
  const supabase = supabaseAdmin();
  const result: PersistResult = {
    ok: true,
    audit_id: audit.audit_id,
    subject_id: "",
    steps_persisted: [],
    errors: [],
  };

  // ---- 1. Subjects: upsert by URL ---------------------------------------
  // The pipeline doesn't carry a subject_id today (subjects are file-based).
  // We upsert by URL so re-running an audit on the same site lands on the
  // same subject_id. Once the console adds explicit subject management,
  // this will switch to insert-by-id.
  let subject_id: string;
  try {
    const { data: existing } = await supabase
      .from("subjects")
      .select("id")
      .eq("url", audit.subject.url)
      .maybeSingle();

    if (existing?.id) {
      subject_id = existing.id;
    } else {
      const { data: inserted, error } = await supabase
        .from("subjects")
        .insert({
          canonical_name: audit.subject.canonical_name,
          aliases: audit.subject.aliases,
          industry: audit.subject.industry,
          subject_type: audit.subject.subject_type,
          url: audit.subject.url,
          location: audit.subject.location ?? null,
          buyer_type: audit.subject.buyer_type ?? null,
          problem: audit.subject.problem ?? null,
          competitors: audit.subject.competitors ?? [],
          known_differentiation_terms: audit.subject.known_differentiation_terms ?? [],
        })
        .select("id")
        .single();
      if (error || !inserted) {
        throw new Error(error?.message ?? "subject insert returned no row");
      }
      subject_id = inserted.id;
    }
    result.subject_id = subject_id;
    result.steps_persisted.push("subjects");
  } catch (e) {
    result.ok = false;
    result.errors.push({ step: "subjects", message: errMessage(e) });
    return result; // FK dependency — nothing downstream is valid without a subject_id
  }

  // ---- 2. audits_v2 -----------------------------------------------------
  try {
    const totalCost = (audit.api_calls_log ?? []).reduce(
      (sum, c) => sum + (c.cost_usd_estimate ?? 0),
      0
    );
    const { error } = await supabase.from("audits_v2").insert({
      id: audit.audit_id,
      subject_id,
      customer_id: null,
      mode: audit.mode,
      rubric_version: audit.rubric_version,
      status: audit.errors.some((e) => e.fatal) ? "failed" : "complete",
      started_at: audit.created_at,
      completed_at: new Date().toISOString(),
      composite_score: round(audit.composite.composite),
      readiness_score: round(audit.composite.readiness),
      visibility_score:
        audit.composite.visibility != null ? round(audit.composite.visibility) : null,
      tier: audit.composite.tier,
      query_count: audit.protocol.query_grid.length,
      engine_count: audit.protocol.engines.length,
      reps_per_pair: audit.protocol.reps_per_pair,
      query_mix: audit.protocol.query_mix,
      engines_used: audit.protocol.engines,
      total_cost_usd: totalCost > 0 ? totalCost : null,
      errors: audit.errors,
      synthesis: audit.synthesis ?? null,
    });
    if (error) throw error;
    result.steps_persisted.push("audits_v2");
  } catch (e) {
    result.ok = false;
    result.errors.push({ step: "audits_v2", message: errMessage(e) });
    return result;
  }

  // ---- 3. audit_subjects_snapshot --------------------------------------
  await safeStep(result, "audit_subjects_snapshot", async () => {
    const { error } = await supabase.from("audit_subjects_snapshot").insert({
      audit_id: audit.audit_id,
      canonical_name: audit.subject.canonical_name,
      aliases: audit.subject.aliases,
      industry: audit.subject.industry,
      subject_type: audit.subject.subject_type,
      url: audit.subject.url,
      location: audit.subject.location ?? null,
      buyer_type: audit.subject.buyer_type ?? null,
      problem: audit.subject.problem ?? null,
      competitors: audit.subject.competitors ?? [],
      known_differentiation_terms: audit.subject.known_differentiation_terms ?? [],
    });
    if (error) throw error;
  });

  // ---- 4. audit_crawler_evidence ---------------------------------------
  await safeStep(result, "audit_crawler_evidence", async () => {
    const c = audit.evidence_package.crawler;
    const { error } = await supabase.from("audit_crawler_evidence").insert({
      audit_id: audit.audit_id,
      url: c.url,
      fetched_at: c.fetched_at,
      status: c.status,
      title: c.title ?? null,
      meta_description: c.meta_description ?? null,
      h1: c.h1,
      schema_blocks: c.schema_blocks,
      same_as_links: c.same_as_links,
      has_faq_schema: c.has_faq_schema,
      has_person_schema: c.has_person_schema,
      has_organization_schema: c.has_organization_schema,
      raw_text_sample: c.raw_text_sample ?? null,
      word_count: c.word_count,
      keyword_stuffing_detected: c.keyword_stuffing_detected,
      differentiation_above_fold: c.differentiation_above_fold,
      meta_description_chars: c.meta_description_chars,
      meta_description_has_action_verb: c.meta_description_has_action_verb,
      meta_description_names_category: c.meta_description_names_category,
      og_description_present: c.og_description_present,
      title_has_descriptor: c.title_has_descriptor,
    });
    if (error) throw error;
  });

  // ---- 5. audit_corroboration ------------------------------------------
  await safeStep(result, "audit_corroboration", async () => {
    const rows: any[] = [];
    audit.evidence_package.corroboration.general_search.forEach((r, i) => {
      rows.push({
        audit_id: audit.audit_id,
        platform: "general",
        result_index: i,
        title: r.title ?? null,
        url: r.url ?? null,
        snippet: r.snippet ?? null,
      });
    });
    for (const p of audit.evidence_package.corroboration.platform_filtered) {
      p.results.forEach((r, i) => {
        rows.push({
          audit_id: audit.audit_id,
          platform: p.platform,
          result_index: i,
          title: r.title ?? null,
          url: r.url ?? null,
          snippet: r.snippet ?? null,
        });
      });
    }
    if (rows.length === 0) return;
    const { error } = await supabase.from("audit_corroboration").insert(rows);
    if (error) throw error;
  });

  // ---- 6 + 7. audit_engine_responses + audit_extracted (paid only) -----
  if (audit.mode === "paid" && audit.engine_responses.length > 0) {
    // Map engine response template_id+engine to the new row's UUID so the
    // extractor rows can reference engine_response_id.
    const responseIdMap = new Map<string, string>();

    await safeStep(result, "audit_engine_responses", async () => {
      const rows = audit.engine_responses.map((r) => {
        const id = crypto.randomUUID();
        responseIdMap.set(`${r.template_id}:${r.engine}`, id);
        return {
          id,
          audit_id: audit.audit_id,
          template_id: r.template_id,
          query: r.query,
          intent: getIntent(audit, r.template_id),
          intent_subtype: getIntentSubtype(audit, r.template_id),
          engine: r.engine,
          raw_response: r.raw_response ?? "",
          captured_at: r.captured_at,
          error: r.error ?? null,
        };
      });
      const { error } = await supabase.from("audit_engine_responses").insert(rows);
      if (error) throw error;
    });

    if (audit.extracted.length > 0) {
      await safeStep(result, "audit_extracted", async () => {
        const rows = audit.extracted.map((e) => {
          const responseId = responseIdMap.get(`${e.template_id}:${e.engine}`);
          return {
            engine_response_id: responseId,
            audit_id: audit.audit_id,
            mentioned: e.mentioned,
            cited_with_link: e.cited_with_link,
            cited_urls: e.cited_urls,
            cited_urls_verified: e.cited_urls_verified,
            position: e.position,
            competitors_mentioned: e.competitors_mentioned,
            sentiment: e.sentiment,
            evidence_pointers: e.evidence_pointers,
            scent_subject_in_opening: e.scent?.subject_in_opening ?? null,
            scent_description_present: e.scent?.description_present ?? null,
            scent_description_word_count: e.scent?.description_word_count ?? null,
            scent_category_named: e.scent?.category_named ?? null,
            scent_differentiation_named: e.scent?.differentiation_named ?? null,
          };
        }).filter((r) => r.engine_response_id); // skip orphaned rows
        if (rows.length === 0) return;
        const { error } = await supabase.from("audit_extracted").insert(rows);
        if (error) throw error;
      });
    }
  }

  // ---- 8. audit_visibility_outcomes (paid only) ------------------------
  if (audit.mode === "paid" && audit.visibility_outcome) {
    await safeStep(result, "audit_visibility_outcomes", async () => {
      const v = audit.visibility_outcome!;
      const { error } = await supabase.from("audit_visibility_outcomes").insert({
        audit_id: audit.audit_id,
        presence: clamp01(v.presence),
        citation: clamp01(v.citation),
        share_of_voice: clamp01(v.share_of_voice),
        prominence: clamp01(v.prominence),
        composite: clamp01(v.composite),
      });
      if (error) throw error;
    });
  }

  // ---- 9. audit_driver_scores ------------------------------------------
  await safeStep(result, "audit_driver_scores", async () => {
    const rows = audit.driver_scores.map((d: DriverScore) => ({
      audit_id: audit.audit_id,
      dimension_id: d.dimension_id,
      rubric_version: d.rubric_version,
      band_value: d.band === "insufficient_evidence" ? null : (d.band as number),
      band_insufficient: d.band === "insufficient_evidence",
      weight: weightFor(d.dimension_id),
      justification: d.justification,
      evidence_pointers: d.evidence_pointers,
      sub_score_observations: d.sub_score_observations,
      cap_triggered: null,
      judged_at: audit.created_at,
      judge_model: JUDGE_MODEL_FALLBACK,
    }));
    const { error } = await supabase.from("audit_driver_scores").insert(rows);
    if (error) throw error;
  });

  // ---- 10. audit_v2_recommendations ------------------------------------
  await safeStep(result, "audit_v2_recommendations", async () => {
    const { error } = await supabase.from("audit_v2_recommendations").insert({
      audit_id: audit.audit_id,
      rubric_version: audit.recommendations.rubric_version,
      differentiation_candidates_observed:
        audit.recommendations.differentiation_candidates_observed,
      differentiation_candidates_suggested:
        audit.recommendations.differentiation_candidates_suggested,
      fixes: audit.recommendations.fixes,
      rank_aware_note: audit.recommendations.rank_aware_note ?? null,
      generated_at: new Date().toISOString(),
      recommender_model: RECOMMENDER_MODEL_FALLBACK,
    });
    if (error) throw error;
  });

  return result;
}

function getIntent(audit: Audit, template_id: string): string {
  const q = audit.protocol.query_grid.find((p) => p.template_id === template_id);
  return q?.intent ?? "informational";
}

function getIntentSubtype(audit: Audit, template_id: string): string | null {
  const q = audit.protocol.query_grid.find((p) => p.template_id === template_id);
  return q?.intent_subtype ?? null;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function weightFor(dim: string): number {
  const weights: Record<string, number> = {
    D1: 0.15,
    D2: 0.25,
    D3: 0.15,
    D4: 0.30,
    D6: 0.15,
  };
  return weights[dim] ?? 0;
}

async function safeStep(
  result: PersistResult,
  step: string,
  fn: () => Promise<void>
) {
  try {
    await fn();
    result.steps_persisted.push(step);
  } catch (e) {
    result.errors.push({ step, message: errMessage(e) });
    result.ok = false;
  }
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
