/**
 * Query Runner — pure code, no LLM judgment.
 *
 * 1. Loads templates from /queries/*.md
 * 2. Applies the 80/10/10 sampling rule (4 queries → 3 informational + 1 entity-specific)
 * 3. Substitutes subject metadata into placeholders
 * 4. Returns the prepared query list
 *
 * Templates are parsed from markdown. A new category file added to /queries/
 * is automatically discovered.
 */

import { readFile, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import type { PreparedQuery, QueryTemplate, Subject, QueryIntent, IntentSubtype } from './types';

/**
 * The queries/ dir lives at packages/avi/queries/. Different callers
 * invoke the pipeline from different cwds (CLI from packages/avi/,
 * console from apps/console/, site from apps/site/) so we resolve the
 * path defensively against a short list of candidates and cache the
 * first one that exists.
 */
let cachedQueryDir: string | null = null;

async function getQueryDir(): Promise<string> {
  if (cachedQueryDir) return cachedQueryDir;
  const cwd = process.cwd();
  const candidates = [
    join(cwd, 'queries'),
    join(cwd, 'packages', 'avi', 'queries'),
    join(cwd, '..', '..', 'packages', 'avi', 'queries'),
    join(cwd, '..', 'packages', 'avi', 'queries'),
  ];
  for (const dir of candidates) {
    try {
      await access(dir);
      cachedQueryDir = dir;
      return dir;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `Cannot locate packages/avi/queries directory. Tried: ${candidates.join(', ')}`
  );
}

export async function loadTemplates(): Promise<QueryTemplate[]> {
  const dir = await getQueryDir();
  const files = await readdir(dir);
  const templates: QueryTemplate[] = [];
  for (const file of files) {
    if (!file.endsWith('.md') || file === 'README.md') continue;
    const scope = file === 'UNIVERSAL.md' ? 'universal' : file.replace('.md', '').toLowerCase();
    const content = await readFile(join(dir, file), 'utf-8');
    templates.push(...parseTemplates(content, scope));
  }
  return templates;
}

/**
 * Parses templates from a markdown file. Format expected:
 *   ### `TEMPLATE_ID`
 *   **Query:** `the query with [PLACEHOLDERS]`
 *   **Tests:** description
 *   (under an h2 "## Informational" | "## Transactional" | "## Navigational")
 */
function parseTemplates(content: string, scope: string): QueryTemplate[] {
  const out: QueryTemplate[] = [];
  let currentIntent: QueryIntent = 'informational';

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match "## Informational", "## Informational — Factual", etc.
    const h2 = line.match(/^##\s+(Informational|Transactional|Navigational)/i);
    if (h2) {
      currentIntent = h2[1].toLowerCase() as QueryIntent;
      continue;
    }
    const idMatch = line.match(/^###\s+`([^`]+)`/);
    if (!idMatch) continue;
    const id = idMatch[1];
    // Look ahead for the Query and Intent subtype lines within the next 8 lines.
    let query = '';
    let tests = '';
    let expected = '';
    let subtype: IntentSubtype | undefined;
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      const q = lines[j].match(/^\*\*Query:\*\*\s+`([^`]+)`/);
      if (q) query = q[1];
      const s = lines[j].match(/^\*\*Intent subtype:\*\*\s+(factual|instrumental|exploratory)/i);
      if (s) subtype = s[1].toLowerCase() as IntentSubtype;
      const t = lines[j].match(/^\*\*Tests:\*\*\s+(.+)/);
      if (t) tests = t[1];
      const e = lines[j].match(/^\*\*Expected response type:\*\*\s+(.+)/);
      if (e) expected = e[1];
    }
    if (query) {
      out.push({
        id,
        query,
        intent: currentIntent,
        intent_subtype: currentIntent === 'informational' ? subtype : undefined,
        scope,
        tests,
        expected_response_type: expected,
      });
    }
  }
  return out;
}

/**
 * Build the audit's query grid. Default 4 queries: 3 informational + 1 entity-specific.
 *
 * Algorithm (deterministic — same subject + template library → same query set):
 *   1. Determine subject's category templates: use category-specific if the subject's
 *      `industry` matches; otherwise universal-only.
 *   2. Pick informational queries: sort universal-first by stable id; pick top 3.
 *      If the subject's category has informational templates, override slot 3 with one of those.
 *   3. Pick the entity-specific slot:
 *      - If `competitors` is non-empty AND a vs template exists → use it (transactional)
 *      - Else if subject_type === 'company' or 'personal_brand' → NAV_02 (subject reviews)
 *
 * The deterministic order means tests reproduce exactly.
 */
export function buildQueryGrid(
  subject: Subject,
  templates: QueryTemplate[],
  queryCount = 4
): PreparedQuery[] {
  if (queryCount !== 4) {
    throw new Error('Only queryCount=4 is implemented in v0.2 scaffold');
  }
  const categoryKey = inferCategoryKey(subject.industry);

  const universal = templates.filter((t) => t.scope === 'universal');
  const category = templates.filter((t) => t.scope === categoryKey);

  const uniInfo = universal.filter((t) => t.intent === 'informational').sort(byId);
  const catInfo = category.filter((t) => t.intent === 'informational').sort(byId);

  const picks: QueryTemplate[] = [];
  // 3 informational
  picks.push(uniInfo[0], uniInfo[1]);
  picks.push(catInfo[0] ?? uniInfo[2]);
  // 1 entity-specific
  const navTpl = universal.find((t) => t.id === 'NAV_02');
  const versusTpl = category.find((t) => /vs/i.test(t.query));
  if (subject.competitors && subject.competitors.length > 0 && versusTpl) {
    picks.push(versusTpl);
  } else if (navTpl) {
    picks.push(navTpl);
  }
  return picks.filter(Boolean).map((tpl) => ({
    template_id: tpl.id,
    query: substitute(tpl.query, subject),
    intent: tpl.intent,
    intent_subtype: tpl.intent_subtype,
  }));
}

function byId(a: QueryTemplate, b: QueryTemplate): number {
  return a.id.localeCompare(b.id);
}

function inferCategoryKey(industry: string): string {
  const s = industry.toLowerCase();
  if (s.includes('ai visibility') || s.includes('seo') || s.includes('marketing technology')) {
    return 'ai-visibility-saas';
  }
  if (s.includes('law') || s.includes('attorney') || s.includes('legal')) return 'law';
  if (s.includes('healthcare') || s.includes('medical') || s.includes('clinic')) return 'healthcare';
  if (s.includes('winery') || s.includes('wine')) return 'winery';
  if (s.includes('agency') || s.includes('consultancy')) return 'agency';
  return 'universal';
}

export function substitute(query: string, subject: Subject): string {
  const competitor = subject.competitors?.[0]?.canonical_name ?? '';
  return query
    .replace(/\[SUBJECT_NAME\]/g, subject.canonical_name)
    .replace(/\[CATEGORY\]/g, subject.industry)
    .replace(/\[LOCATION\]/g, subject.location ?? 'the United States')
    .replace(/\[BUYER_TYPE\]/g, subject.buyer_type ?? 'small business owner')
    .replace(/\[PROBLEM\]/g, subject.problem ?? `find a ${subject.industry}`)
    .replace(/\[COMPETITOR\]/g, competitor);
}
