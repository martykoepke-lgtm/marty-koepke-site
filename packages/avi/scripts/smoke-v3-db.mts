import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { persistAuditV3, supabaseAdmin } from '../src/index';
import { AVI_V3_RUBRIC_VERSION, type V3Audit } from '../src/v3/types';

loadEnv(resolve(process.cwd(), '../../.env.local'));
loadEnv(resolve(process.cwd(), '.env.local'));

const now = new Date().toISOString();
const auditId = crypto.randomUUID();
const claimId = crypto.randomUUID();
const testUrl = `https://v3-db-smoke-test.invalid/${auditId}`;

const audit: V3Audit = {
  audit_id: auditId,
  rubric_version: AVI_V3_RUBRIC_VERSION,
  created_at: now,
  mode: 'snapshot',
  subject: {
    canonical_name: 'V3 DB Smoke Test',
    aliases: ['V3 Smoke'],
    industry: 'AI visibility testing',
    subject_type: 'company',
    url: testUrl,
    location: 'Test City',
    buyer_type: 'Small business owner',
    problem: 'Validate V3 database persistence',
    competitors: [],
    known_differentiation_terms: ['AI Business Accuracy'],
  },
  protocol: {
    query_grid: [
      {
        template_id: 'v3-smoke-query',
        query: 'Who is V3 DB Smoke Test best for?',
        intent: 'informational',
        intent_subtype: 'factual',
      },
    ],
    engines: ['chatgpt'],
    reps_per_pair: 1,
    total_calls: 1,
  },
  evidence_package: {
    crawler: {
      url: testUrl,
      fetched_at: now,
      status: 200,
      title: 'V3 DB Smoke Test',
      meta_description: 'Synthetic evidence for V3 persistence testing.',
      h1: ['V3 DB Smoke Test'],
      schema_blocks: [],
      same_as_links: [],
      has_faq_schema: false,
      has_person_schema: false,
      has_organization_schema: true,
      raw_text_sample: 'V3 DB Smoke Test helps validate AI Business Accuracy persistence.',
      word_count: 9,
      keyword_stuffing_detected: false,
      differentiation_above_fold: true,
      meta_description_chars: 54,
      meta_description_has_action_verb: false,
      meta_description_names_category: true,
      og_description_present: true,
      title_has_descriptor: true,
    },
    corroboration: {
      general_search: [],
      platform_filtered: [],
    },
  },
  crawler: undefined,
  corroboration: undefined,
  engine_responses: [
    {
      template_id: 'v3-smoke-query',
      query: 'Who is V3 DB Smoke Test best for?',
      engine: 'chatgpt',
      raw_response:
        'V3 DB Smoke Test is a synthetic company used to validate AI Business Accuracy persistence.',
      captured_at: now,
    },
  ],
  extracted: [
    {
      template_id: 'v3-smoke-query',
      query: 'Who is V3 DB Smoke Test best for?',
      engine: 'chatgpt',
      mentioned: true,
      cited_with_link: true,
      cited_urls: [testUrl],
      cited_urls_verified: [testUrl],
      position: 'top',
      competitors_mentioned: [],
      sentiment: 'neutral',
      evidence_pointers: [],
      scent: {
        subject_in_opening: true,
        description_present: true,
        description_word_count: 12,
        category_named: true,
        differentiation_named: true,
      },
    },
  ],
  readiness_scores: [
    {
      driver_id: 'business_clarity',
      driver_name: 'Business Clarity',
      band: 4,
      score: 80,
      justification: 'Synthetic readiness row for persistence testing.',
      evidence_pointers: [],
      rubric_version: AVI_V3_RUBRIC_VERSION,
    },
    {
      driver_id: 'source_support',
      driver_name: 'Source Support',
      band: 4,
      score: 80,
      justification: 'Synthetic readiness row for persistence testing.',
      evidence_pointers: [],
      rubric_version: AVI_V3_RUBRIC_VERSION,
    },
    {
      driver_id: 'ai_readability',
      driver_name: 'AI Readability',
      band: 4,
      score: 80,
      justification: 'Synthetic readiness row for persistence testing.',
      evidence_pointers: [],
      rubric_version: AVI_V3_RUBRIC_VERSION,
    },
    {
      driver_id: 'distinctive_point_of_view',
      driver_name: 'Distinctive Point of View',
      band: 4,
      score: 80,
      justification: 'Synthetic readiness row for persistence testing.',
      evidence_pointers: [],
      rubric_version: AVI_V3_RUBRIC_VERSION,
    },
    {
      driver_id: 'recommendation_fit',
      driver_name: 'Recommendation Fit',
      band: 4,
      score: 80,
      justification: 'Synthetic readiness row for persistence testing.',
      evidence_pointers: [],
      rubric_version: AVI_V3_RUBRIC_VERSION,
    },
  ],
  claims: [
    {
      id: claimId,
      claim_text: 'V3 DB Smoke Test validates AI Business Accuracy persistence.',
      claim_type: 'service',
      subject_name: 'V3 DB Smoke Test',
      source_response_excerpt:
        'V3 DB Smoke Test is a synthetic company used to validate AI Business Accuracy persistence.',
      confidence: 0.99,
    },
  ],
  source_evidence: [
    {
      url: testUrl,
      source_type: 'owned_site',
      fetched_at: now,
      fetch_status: 200,
      title: 'V3 DB Smoke Test',
      excerpt: 'V3 DB Smoke Test validates AI Business Accuracy persistence.',
      mentions_subject: true,
      content_hash: auditId,
    },
  ],
  claim_verifications: [
    {
      claim_id: claimId,
      label: 'supported_by_owned_source',
      source_url: testUrl,
      source_type: 'owned_site',
      evidence_quote: 'V3 DB Smoke Test validates AI Business Accuracy persistence.',
      rationale: 'Synthetic source evidence directly supports the synthetic claim.',
      verifier: 'code',
      verified_at: now,
    },
  ],
  outcomes: {
    visibility: 1,
    representation_accuracy: 1,
    claim_support: 1,
    context_preservation: 1,
    recommendation_quality: 1,
    stability: 1,
  },
  public_scores: {
    ai_visibility_score: 100,
    ai_readiness_score: 80,
    ai_business_accuracy_score: 100,
    ai_business_accuracy_index: 92,
    tier: 'Agent-Ready',
  },
  errors: [],
};

const supabase = supabaseAdmin();
let subjectId: string | null = null;

try {
  const persisted = await persistAuditV3(audit);
  subjectId = persisted.subject_id || null;

  if (!persisted.ok) {
    throw new Error(`persistAuditV3 failed: ${JSON.stringify(persisted.errors, null, 2)}`);
  }

  const tableCounts: Record<string, number> = {};
  for (const table of [
    'audit_source_evidence',
    'audit_claims',
    'audit_claim_verifications',
    'audit_driver_scores',
    'audit_outcome_scores',
    'audit_engine_responses',
    'audit_extracted',
  ]) {
    const selectColumn =
      table === 'audit_outcome_scores'
        ? 'audit_id'
        : table === 'audit_extracted'
          ? 'engine_response_id'
          : 'id';
    const query =
      table === 'audit_claim_verifications'
        ? supabase.from(table).select(selectColumn, { count: 'exact', head: true }).eq('claim_id', claimId)
        : supabase.from(table).select(selectColumn, { count: 'exact', head: true }).eq('audit_id', auditId);

    const { count, error } = await query;
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    tableCounts[table] = count ?? 0;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        audit_id: auditId,
        subject_id: subjectId,
        steps_persisted: persisted.steps_persisted,
        table_counts: tableCounts,
      },
      null,
      2
    )
  );
} finally {
  await supabase.from('audits_v2').delete().eq('id', auditId);
  if (subjectId) {
    await supabase.from('subjects').delete().eq('id', subjectId).eq('url', testUrl);
  }
}

function loadEnv(path: string) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    if (process.env[key]) continue;
    process.env[key] = unquote(match[2].trim());
  }
}

function unquote(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
