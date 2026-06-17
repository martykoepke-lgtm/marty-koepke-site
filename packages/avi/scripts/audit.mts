#!/usr/bin/env -S npx tsx
/**
 * CLI: run a single AVI audit against one subject.
 *
 * Usage:
 *   npx tsx scripts/audit.mts <SUBJECT_JSON_PATH> [--mode=paid|free]
 *
 * Where SUBJECT_JSON_PATH points to a JSON file conforming to the Subject
 * shape in lib/avi/types.ts. Example: ./subjects/practical-informatics.json
 *
 * Outputs:
 *   ./audits/<audit_id>.json    — full audit record (machine-readable)
 *   ./audits/<audit_id>.html    — readable report
 *
 * Required env vars: ANTHROPIC_API_KEY, OPENAI_API_KEY, PERPLEXITY_API_KEY
 * (paid mode only), TAVILY_API_KEY (corroboration).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { runAudit } from '../src/orchestrator-v2';
import { renderReport } from '../src/render-v2';
import { loadSubject } from '../src/subject-loader';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/audit.mts <SUBJECT_JSON_PATH> [--mode=paid|free]');
    process.exit(1);
  }

  const subjectPath = resolve(args[0]);
  const modeArg = args.find((a) => a.startsWith('--mode='));
  const mode = (modeArg?.split('=')[1] ?? 'paid') as 'paid' | 'free';
  if (mode !== 'paid' && mode !== 'free') {
    console.error('--mode must be paid or free');
    process.exit(1);
  }

  console.log(`[audit] loading subject from ${subjectPath}`);
  const subject = await loadSubject(subjectPath);
  console.log(`[audit] subject: ${subject.canonical_name} (${subject.industry})`);
  console.log(`[audit] mode: ${mode}`);
  console.log(`[audit] starting pipeline...`);

  const start = Date.now();
  const audit = await runAudit(subject, { mode });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`[audit] pipeline complete in ${elapsed}s`);
  console.log(`[audit] composite: ${audit.composite.composite} (${audit.composite.tier})`);
  console.log(`[audit] driver bands: ${audit.driver_scores.map((d) => `${d.dimension_id}=${d.band}`).join(' ')}`);
  if (audit.visibility_outcome) {
    console.log(`[audit] visibility: ${(audit.visibility_outcome.composite * 100).toFixed(1)}/100`);
  }
  if (audit.errors.length > 0) {
    console.log(`[audit] errors logged: ${audit.errors.length}`);
  }

  const outDir = resolve('./audits');
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, `${audit.audit_id}.json`);
  const htmlPath = join(outDir, `${audit.audit_id}.html`);
  await writeFile(jsonPath, JSON.stringify(audit, null, 2));
  await writeFile(htmlPath, renderReport(audit));

  console.log(`[audit] wrote ${jsonPath}`);
  console.log(`[audit] wrote ${htmlPath}`);
  console.log(`\nOpen the report:\n  file://${htmlPath}\n`);
}

main().catch((err) => {
  console.error('[audit] fatal:', err);
  process.exit(1);
});
