/**
 * Orchestrator v2 — the deterministic pipeline.
 *
 * No LLM autonomy. Code controls order. LLM roles called at bounded points only.
 *
 * Pipeline (paid):
 *   1. Crawler (pure code)
 *   2. Corroborator (pure code)
 *   3. Query Runner — buildQueryGrid + runQueryGrid (pure code + API calls)
 *   4. Extractor (LLM) — one call per response
 *   5. Citation verification (pure code: fetches each cited URL)
 *   6. Aggregator (pure code) — Visibility sub-metrics
 *   7. Driver Judge (LLM) — five calls, one per driver
 *   8. Composite + Tier (pure code)
 *   9. Recommender (LLM) — one call
 *
 * Free pipeline: skip steps 3–6 (no live engine queries, no Visibility).
 *
 * Per AVI_OPERATING_STANDARD.md §2 and §7.
 */

import { randomUUID } from 'node:crypto';

import { crawl } from './crawler-v2';
import { corroborate } from './corroboration-v2';
import { loadTemplates, buildQueryGrid } from './queries';
import { runQueryGrid } from './engine-clients';
import { extract, verifyCitations } from './extractor-v2';
import { aggregate } from './aggregator-v2';
import { judge } from './judge-v2';
import { compositeScore } from './composite-v2';
import { recommend } from './recommender-v2';

import {
  AVI_RUBRIC_VERSION,
  DRIVERS,
  ENGINES,
  type Audit,
  type AuditError,
  type ExtractorOutput,
  type Subject,
} from './types';

export interface RunAuditOptions {
  mode: 'free' | 'paid';
  queryCount?: number;
}

export async function runAudit(
  subject: Subject,
  options: RunAuditOptions = { mode: 'paid' }
): Promise<Audit> {
  const audit_id = randomUUID();
  const created_at = new Date().toISOString();
  const errors: AuditError[] = [];

  // 1. Crawler — pass industry + canonical_name so it can compute deterministic metadata-scent flags
  const crawler = await crawl(subject.url, subject.industry, subject.canonical_name);

  // 2. Corroborator
  const corroboration = await corroborate(subject);

  let engine_responses: any[] = [];
  let extracted: ExtractorOutput[] = [];
  let visibility_outcome: any | undefined;
  let query_grid: any[] = [];
  let nFixes: 2 | 3 = options.mode === 'paid' ? 3 : 2;

  if (options.mode === 'paid') {
    // 3. Query Runner
    const templates = await loadTemplates();
    query_grid = buildQueryGrid(subject, templates, options.queryCount ?? 4);
    engine_responses = await runQueryGrid(query_grid, ENGINES);

    // 4. Extractor (one call per engine response)
    for (const resp of engine_responses) {
      if (resp.error) {
        errors.push({ step: 'query_runner', message: `engine ${resp.engine}: ${resp.error}`, fatal: false });
        continue;
      }
      const ext = await extract(resp, subject);
      // 5. Citation verification
      const verified = await verifyCitations(ext, subject);
      extracted.push(verified);
    }

    // 6. Aggregator
    visibility_outcome = aggregate(extracted);
  }

  // Build the evidence package fed to the Driver Judge
  const evidence_package = { crawler, corroboration };

  // 7. Driver Judge (five calls — one per driver)
  const driver_scores = [];
  for (const dim of DRIVERS) {
    const score = await judge(dim, subject, evidence_package);
    driver_scores.push(score);
  }

  // 8. Composite + Tier
  const composite = compositeScore(driver_scores, visibility_outcome);

  // 9. Recommender
  const recommendations = await recommend(
    subject,
    driver_scores,
    visibility_outcome,
    composite.tier,
    nFixes
  );

  const audit: Audit = {
    audit_id,
    rubric_version: AVI_RUBRIC_VERSION,
    created_at,
    subject,
    mode: options.mode,
    protocol: {
      query_grid,
      engines: options.mode === 'paid' ? ENGINES : [],
      reps_per_pair: 1,
      total_calls: options.mode === 'paid' ? query_grid.length * ENGINES.length : 0,
      query_mix: { informational: 3, transactional: 0, navigational: 1 }, // 4-query default
    },
    evidence_package,
    engine_responses,
    extracted,
    visibility_outcome,
    driver_scores,
    recommendations,
    composite,
    api_calls_log: [], // Logging is handled inside llm.ts via Supabase. CLI path: see logging.ts.
    errors,
  };

  return audit;
}
