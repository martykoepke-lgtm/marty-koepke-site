import { supabaseAdmin } from '../supabase-client';
import type { V3Audit } from './types';

export interface PersistV3Result {
  ok: boolean;
  audit_id: string;
  subject_id: string;
  steps_persisted: string[];
  errors: { step: string; message: string }[];
}

export async function persistAuditV3(audit: V3Audit): Promise<PersistV3Result> {
  const supabase = supabaseAdmin();
  const result: PersistV3Result = {
    ok: true,
    audit_id: audit.audit_id,
    subject_id: '',
    steps_persisted: [],
    errors: [],
  };

  let subject_id: string;
  try {
    const { data: existing } = await supabase
      .from('subjects')
      .select('id')
      .eq('url', audit.subject.url)
      .maybeSingle();

    if (existing?.id) {
      subject_id = existing.id;
    } else {
      const { data, error } = await supabase
        .from('subjects')
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
        .select('id')
        .single();
      if (error || !data) throw new Error(error?.message ?? 'subject insert returned no row');
      subject_id = data.id;
    }
    result.subject_id = subject_id;
    result.steps_persisted.push('subjects');
  } catch (e) {
    result.ok = false;
    result.errors.push({ step: 'subjects', message: errMessage(e) });
    return result;
  }

  await safeStep(result, 'audits_v2', async () => {
    const { error } = await supabase.from('audits_v2').insert({
      id: audit.audit_id,
      subject_id,
      customer_id: null,
      mode: audit.mode === 'audit' ? 'paid' : audit.mode,
      rubric_version: audit.rubric_version,
      status: audit.errors.some((error) => error.fatal) ? 'failed' : 'complete',
      started_at: audit.created_at,
      completed_at: new Date().toISOString(),
      composite_score: audit.public_scores.ai_business_accuracy_index,
      readiness_score: audit.public_scores.ai_readiness_score,
      visibility_score: audit.public_scores.ai_visibility_score,
      tier: audit.public_scores.tier,
      query_count: audit.protocol.query_grid.length,
      engine_count: audit.protocol.engines.length,
      reps_per_pair: audit.protocol.reps_per_pair,
      query_mix: {},
      engines_used: audit.protocol.engines,
      errors: audit.errors,
      synthesis: null,
    });
    if (error) throw error;
  });
  if (!result.steps_persisted.includes('audits_v2')) return result;

  await safeStep(result, 'audit_subjects_snapshot', async () => {
    const { error } = await supabase.from('audit_subjects_snapshot').insert({
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

  await persistSourceEvidence(audit, result);
  await persistEngineResponsesAndExtractions(audit, result);
  await persistClaims(audit, result);
  await persistReadinessScores(audit, result);
  await persistOutcomeScores(audit, result);

  return result;
}

async function persistSourceEvidence(audit: V3Audit, result: PersistV3Result) {
  await safeStep(result, 'audit_source_evidence', async () => {
    if (audit.source_evidence.length === 0) return;
    const { error } = await supabaseAdmin().from('audit_source_evidence').insert(
      audit.source_evidence.map((source) => ({
        audit_id: audit.audit_id,
        url: source.url,
        source_type: source.source_type,
        fetched_at: source.fetched_at ?? new Date().toISOString(),
        fetch_status: source.fetch_status ?? null,
        title: source.title ?? null,
        excerpt: source.excerpt ?? null,
        mentions_subject: source.mentions_subject ?? null,
        content_hash: source.content_hash ?? null,
      }))
    );
    if (error) throw error;
  });
}

async function persistEngineResponsesAndExtractions(audit: V3Audit, result: PersistV3Result) {
  const responseIdMap = new Map<string, string>();
  const queryMap = new Map(audit.protocol.query_grid.map((query) => [query.template_id, query]));

  await safeStep(result, 'audit_engine_responses', async () => {
    const rows = audit.engine_responses.map((response) => {
      const id = crypto.randomUUID();
      const preparedQuery = queryMap.get(response.template_id);
      responseIdMap.set(`${response.template_id}:${response.engine}`, id);
      return {
        id,
        audit_id: audit.audit_id,
        template_id: response.template_id,
        query: response.query,
        intent: preparedQuery?.intent ?? 'informational',
        intent_subtype: preparedQuery?.intent_subtype ?? null,
        engine: response.engine,
        raw_response: response.raw_response ?? '',
        captured_at: response.captured_at,
        error: response.error ?? null,
        query_group_id: response.template_id,
        prompt_variant_id: 'default',
        rep_index: 1,
      };
    });
    if (rows.length === 0) return;
    const { error } = await supabaseAdmin().from('audit_engine_responses').insert(rows);
    if (error) throw error;
  });

  await safeStep(result, 'audit_extracted', async () => {
    const rows = audit.extracted
      .map((extraction) => {
        const responseId = responseIdMap.get(`${extraction.template_id}:${extraction.engine}`);
        if (!responseId) return null;
        return {
          engine_response_id: responseId,
          audit_id: audit.audit_id,
          mentioned: extraction.mentioned,
          cited_with_link: extraction.cited_with_link,
          cited_urls: extraction.cited_urls,
          cited_urls_verified: extraction.cited_urls_verified,
          position: extraction.position,
          competitors_mentioned: extraction.competitors_mentioned,
          sentiment: extraction.sentiment,
          evidence_pointers: extraction.evidence_pointers,
          scent_subject_in_opening: extraction.scent?.subject_in_opening ?? null,
          scent_description_present: extraction.scent?.description_present ?? null,
          scent_description_word_count: extraction.scent?.description_word_count ?? null,
          scent_category_named: extraction.scent?.category_named ?? null,
          scent_differentiation_named: extraction.scent?.differentiation_named ?? null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
    if (rows.length === 0) return;
    const { error } = await supabaseAdmin().from('audit_extracted').insert(rows);
    if (error) throw error;
  });
}

async function persistClaims(audit: V3Audit, result: PersistV3Result) {
  await safeStep(result, 'audit_claims', async () => {
    if (audit.claims.length === 0) return;
    const { error } = await supabaseAdmin().from('audit_claims').insert(
      audit.claims.map((claim) => ({
        id: claim.id,
        audit_id: audit.audit_id,
        engine_response_id: null,
        claim_text: claim.claim_text,
        claim_type: claim.claim_type,
        subject_name: claim.subject_name ?? audit.subject.canonical_name,
        source_response_excerpt: claim.source_response_excerpt ?? null,
        confidence: claim.confidence ?? null,
      }))
    );
    if (error) throw error;
  });

  await safeStep(result, 'audit_claim_verifications', async () => {
    if (audit.claim_verifications.length === 0) return;
    const { error } = await supabaseAdmin().from('audit_claim_verifications').insert(
      audit.claim_verifications.map((verification) => ({
        claim_id: verification.claim_id,
        label: verification.label,
        source_url: verification.source_url ?? null,
        source_type: verification.source_type ?? null,
        evidence_quote: verification.evidence_quote ?? null,
        rationale: verification.rationale,
        verifier: verification.verifier,
        verifier_model: null,
        verified_at: verification.verified_at,
      }))
    );
    if (error) throw error;
  });
}

async function persistReadinessScores(audit: V3Audit, result: PersistV3Result) {
  await safeStep(result, 'audit_driver_scores', async () => {
    const { error } = await supabaseAdmin().from('audit_driver_scores').insert(
      audit.readiness_scores.map((score) => ({
        audit_id: audit.audit_id,
        dimension_id: score.driver_id,
        rubric_version: score.rubric_version,
        band_value: typeof score.band === 'number' ? score.band : null,
        band_insufficient: score.band === 'insufficient_evidence',
        weight: null,
        justification: score.justification,
        evidence_pointers: score.evidence_pointers,
        sub_score_observations: [],
        cap_triggered: null,
        judged_at: audit.created_at,
        judge_model: 'v3-readiness-wrapper',
      }))
    );
    if (error) throw error;
  });
}

async function persistOutcomeScores(audit: V3Audit, result: PersistV3Result) {
  await safeStep(result, 'audit_outcome_scores', async () => {
    const outcomes = audit.outcomes;
    if (!outcomes) return;
    const { error } = await supabaseAdmin().from('audit_outcome_scores').insert({
      audit_id: audit.audit_id,
      visibility: outcomes.visibility,
      representation_accuracy: outcomes.representation_accuracy,
      claim_support: outcomes.claim_support,
      context_preservation: outcomes.context_preservation,
      recommendation_quality: outcomes.recommendation_quality,
      stability: outcomes.stability,
      ai_visibility_score: audit.public_scores.ai_visibility_score,
      ai_readiness_score: audit.public_scores.ai_readiness_score,
      ai_business_accuracy_score: audit.public_scores.ai_business_accuracy_score,
      ai_business_accuracy_index: audit.public_scores.ai_business_accuracy_index,
      tier: audit.public_scores.tier,
      rubric_version: audit.rubric_version,
    });
    if (error) throw error;
  });
}

async function safeStep(
  result: PersistV3Result,
  step: string,
  fn: () => Promise<void>
) {
  try {
    await fn();
    result.steps_persisted.push(step);
  } catch (e) {
    result.ok = false;
    result.errors.push({ step, message: errMessage(e) });
  }
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
