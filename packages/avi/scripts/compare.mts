#!/usr/bin/env -S npx tsx
/**
 * CLI: run AVI audits across multiple subjects and produce a comparison HTML.
 *
 * Usage:
 *   npx tsx scripts/compare.mts <SUBJECTS_DIR>
 *
 * Where SUBJECTS_DIR contains *.json files each conforming to the Subject
 * shape in lib/avi/types.ts.
 *
 * Outputs:
 *   ./audits/<audit_id>.json    — for each subject (machine-readable)
 *   ./audits/<audit_id>.html    — individual reports
 *   ./audits/comparison-<ts>.html — comparison table
 */

import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { runAudit } from '../src/orchestrator-v2';
import { renderReport, renderComparison } from '../src/render-v2';
import { loadSubject } from '../src/subject-loader';
import type { Audit } from '../src/types';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/compare.mts <SUBJECTS_DIR>');
    process.exit(1);
  }

  const subjectsDir = resolve(args[0]);
  console.log(`[compare] loading subjects from ${subjectsDir}`);

  const files = (await readdir(subjectsDir)).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('[compare] no .json subject files found');
    process.exit(1);
  }

  const outDir = resolve('./audits');
  await mkdir(outDir, { recursive: true });

  const audits: Audit[] = [];
  for (const file of files) {
    const subjectPath = join(subjectsDir, file);
    const subject = await loadSubject(subjectPath);
    console.log(`\n[compare] auditing ${subject.canonical_name}...`);
    const start = Date.now();
    try {
      const audit = await runAudit(subject, { mode: 'paid' });
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(
        `[compare] ${subject.canonical_name}: composite=${audit.composite.composite} (${audit.composite.tier}) in ${elapsed}s`
      );

      const jsonPath = join(outDir, `${audit.audit_id}.json`);
      const htmlPath = join(outDir, `${audit.audit_id}.html`);
      await writeFile(jsonPath, JSON.stringify(audit, null, 2));
      await writeFile(htmlPath, renderReport(audit));
      audits.push(audit);
    } catch (err) {
      console.error(`[compare] ${subject.canonical_name}: FAILED`, err);
    }
  }

  if (audits.length === 0) {
    console.error('[compare] no successful audits to compare');
    process.exit(1);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const comparisonPath = join(outDir, `comparison-${ts}.html`);
  await writeFile(comparisonPath, renderComparison(audits));
  console.log(`\n[compare] wrote comparison report:\n  file://${comparisonPath}\n`);
}

main().catch((err) => {
  console.error('[compare] fatal:', err);
  process.exit(1);
});
