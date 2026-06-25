"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, synthesize, type Synthesis } from "@practical-informatics/avi";

/**
 * Generate (or regenerate) the plain-English synthesis for an existing
 * audit and persist it back to audits_v2.synthesis.
 *
 * Used when:
 *   - An audit ran before the Synthesizer existed (no synthesis row)
 *   - The operator wants to iterate on the prompt and see a fresh take
 */
export async function regenerateSynthesisAction(formData: FormData) {
  const auditId = String(formData.get("auditId") ?? "");
  if (!auditId) throw new Error("Missing auditId");

  const supabase = supabaseAdmin();

  const { data: audit, error: auditErr } = await supabase
    .from("audits_v2")
    .select("*")
    .eq("id", auditId)
    .maybeSingle();

  if (auditErr || !audit) {
    throw new Error(`Audit ${auditId} not found: ${auditErr?.message ?? "no row"}`);
  }

  const { data: snapshot } = await supabase
    .from("audit_subjects_snapshot")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();

  const { data: drivers } = await supabase
    .from("audit_driver_scores")
    .select("*")
    .eq("audit_id", auditId)
    .order("dimension_id");

  const { data: visibility } = await supabase
    .from("audit_visibility_outcomes")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();

  const { data: recs } = await supabase
    .from("audit_v2_recommendations")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle();

  if (!snapshot || !drivers || !recs) {
    throw new Error(
      `Cannot synthesize ${auditId}: missing snapshot, drivers, or recommendations.`
    );
  }

  const subject = {
    canonical_name: snapshot.canonical_name,
    aliases: snapshot.aliases ?? [],
    industry: snapshot.industry,
    subject_type: snapshot.subject_type as "company" | "personal_brand",
    url: snapshot.url,
    location: snapshot.location ?? undefined,
    buyer_type: snapshot.buyer_type ?? undefined,
    problem: snapshot.problem ?? undefined,
    competitors: snapshot.competitors ?? [],
    known_differentiation_terms: snapshot.known_differentiation_terms ?? [],
  };

  const driverScores = drivers.map((d: any) => ({
    dimension_id: d.dimension_id,
    band: d.band_insufficient ? "insufficient_evidence" : d.band_value,
    justification: d.justification ?? "",
    evidence_pointers: d.evidence_pointers ?? [],
    sub_score_observations: d.sub_score_observations ?? [],
    rubric_version: d.rubric_version,
  })) as any;

  const visibilityOutcome = visibility
    ? {
        presence: Number(visibility.presence),
        citation: Number(visibility.citation),
        share_of_voice: Number(visibility.share_of_voice),
        prominence: Number(visibility.prominence),
        composite: Number(visibility.composite),
      }
    : undefined;

  const composite = {
    composite: Number(audit.composite_score ?? 0),
    readiness: Number(audit.readiness_score ?? 0),
    visibility:
      audit.visibility_score != null ? Number(audit.visibility_score) : undefined,
    tier: audit.tier as any,
  };

  const recommendations = {
    differentiation_candidates_observed:
      recs.differentiation_candidates_observed ?? [],
    differentiation_candidates_suggested:
      recs.differentiation_candidates_suggested ?? [],
    fixes: recs.fixes ?? [],
    rank_aware_note: recs.rank_aware_note ?? undefined,
    rubric_version: recs.rubric_version,
  };

  console.log(`[console] regenerating synthesis for audit ${auditId}`);
  const synthesisResult: Synthesis | null = await synthesize(
    subject,
    driverScores,
    visibilityOutcome,
    composite,
    recommendations
  );

  if (!synthesisResult) {
    throw new Error("Synthesizer returned no usable output. Check Anthropic logs.");
  }

  const { error: updateErr } = await supabase
    .from("audits_v2")
    .update({ synthesis: synthesisResult })
    .eq("id", auditId);

  if (updateErr) {
    throw new Error(`Failed to save synthesis: ${updateErr.message}`);
  }

  revalidatePath(`/audits/${auditId}`);
  revalidatePath("/audits");
}
