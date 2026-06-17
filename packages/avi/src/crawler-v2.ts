/**
 * Crawler v2 — pure code, CLI-friendly. No Supabase coupling.
 *
 * Fetches the subject's URL, parses HTML, extracts schema/meta/structure signals.
 * Detects keyword stuffing and above-the-fold differentiation heuristically.
 *
 * Output conforms to `CrawlerEvidence` in types.ts. Used by orchestrator-v2.
 * (The original `crawler.ts` continues to serve the public /scan flow.)
 */

import type { CrawlerEvidence } from './types';

const FETCH_TIMEOUT_MS = 20_000;
const RAW_TEXT_SAMPLE_CHARS = 2000;

/**
 * Canonical action-verb list used by both the Crawler (for meta_description_has_action_verb)
 * and the Extractor (for description_present in scent fields).
 * Keep these synchronized — both surfaces check the same vocabulary.
 */
export const ACTION_VERBS = [
  'is', 'are', 'helps', 'help', 'provides', 'provide', 'offers', 'offer',
  'tracks', 'track', 'measures', 'measure', 'builds', 'build',
  'creates', 'create', 'sells', 'sell', 'specializes', 'specialize',
  'focuses', 'focus', 'designs', 'design', 'manages', 'manage',
  'delivers', 'deliver', 'supplies', 'supply', 'supports', 'support',
  'enables', 'enable', 'lets', 'allows', 'allow', 'serves', 'serve',
  'develops', 'develop', 'produces', 'produce',
];

export async function crawl(url: string, industry?: string, canonicalName?: string): Promise<CrawlerEvidence> {
  const fetched_at = new Date().toISOString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html = '';
  let status = 0;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'PracticalInformatics-AVI/0.2' },
    });
    status = res.status;
    html = await res.text();
  } catch {
    return emptyEvidence(url, fetched_at, status);
  } finally {
    clearTimeout(timeout);
  }

  const title = extractTitle(html);
  const meta_description = extractMeta(html, 'description');
  const h1 = extractH1(html);
  const schema_blocks = extractSchemaBlocks(html);
  const same_as_links = extractSameAsLinks(schema_blocks);
  const has_faq_schema = schema_blocks.some((b) => containsType(b, 'FAQPage'));
  const has_person_schema = schema_blocks.some((b) => containsType(b, 'Person'));
  const has_organization_schema = schema_blocks.some((b) => containsType(b, 'Organization'));

  const body_text = stripTags(html);
  const raw_text_sample = body_text.slice(0, RAW_TEXT_SAMPLE_CHARS);
  const word_count = body_text.split(/\s+/).filter(Boolean).length;

  const keyword_stuffing_detected = detectKeywordStuffing(title, h1, body_text);
  const differentiation_above_fold = detectDifferentiationAboveFold(raw_text_sample);

  // Metadata-scent fields (deterministic)
  const og_description = extractMeta(html, 'og:description', 'property');
  const meta_description_chars = meta_description.length;
  const meta_description_has_action_verb = hasActionVerb(meta_description);
  const meta_description_names_category = industry
    ? namesCategory(meta_description, industry)
    : false;
  const og_description_present = og_description.length > 0;
  const title_has_descriptor = canonicalName
    ? hasDescriptorBeyondName(title, canonicalName)
    : title.split(/\s+/).filter(Boolean).length > 3;

  return {
    url,
    fetched_at,
    status,
    title,
    meta_description,
    h1,
    schema_blocks,
    same_as_links,
    has_faq_schema,
    has_person_schema,
    has_organization_schema,
    raw_text_sample,
    word_count,
    keyword_stuffing_detected,
    differentiation_above_fold,
    meta_description_chars,
    meta_description_has_action_verb,
    meta_description_names_category,
    og_description_present,
    title_has_descriptor,
  };
}

function emptyEvidence(url: string, fetched_at: string, status: number): CrawlerEvidence {
  return {
    url, fetched_at, status,
    title: '', meta_description: '', h1: [],
    schema_blocks: [], same_as_links: [],
    has_faq_schema: false, has_person_schema: false, has_organization_schema: false,
    raw_text_sample: '', word_count: 0,
    keyword_stuffing_detected: false, differentiation_above_fold: false,
    meta_description_chars: 0,
    meta_description_has_action_verb: false,
    meta_description_names_category: false,
    og_description_present: false,
    title_has_descriptor: false,
  };
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decode(m[1].trim()) : '';
}

function extractMeta(html: string, name: string, attr: 'name' | 'property' = 'name'): string {
  const re = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  return m ? decode(m[1].trim()) : '';
}

function extractH1(html: string): string[] {
  const matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  return matches.map((m) => decode(stripTags(m[1]).trim())).filter(Boolean);
}

function extractSchemaBlocks(html: string): any[] {
  const blocks: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      // malformed JSON-LD — count as no schema rather than fail the audit
    }
  }
  return blocks;
}

function containsType(block: any, type: string): boolean {
  if (!block) return false;
  if (Array.isArray(block)) return block.some((b) => containsType(b, type));
  if (block['@type'] === type) return true;
  if (Array.isArray(block['@type']) && block['@type'].includes(type)) return true;
  if (block['@graph']) return containsType(block['@graph'], type);
  return false;
}

function extractSameAsLinks(blocks: any[]): string[] {
  const links: string[] = [];
  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node === 'object') {
      if (node.sameAs) {
        const v = node.sameAs;
        if (Array.isArray(v)) links.push(...v);
        else if (typeof v === 'string') links.push(v);
      }
      Object.values(node).forEach(walk);
    }
  }
  walk(blocks);
  return Array.from(new Set(links));
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function detectKeywordStuffing(title: string, h1: string[], body: string): boolean {
  const titleWords = words(title);
  if (Object.values(freq(titleWords)).some((v) => v > 3)) return true;
  for (const h of h1) {
    if (Object.values(freq(words(h))).some((v) => v > 3)) return true;
  }
  const bodyWords = words(body);
  if (bodyWords.length < 200) return false;
  const bodyFreq = freq(bodyWords);
  const total = bodyWords.length;
  const sorted = Object.entries(bodyFreq).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0 && sorted[0][1] / total > 0.04) return true;
  const top3 = sorted.slice(0, 3).reduce((s, [, c]) => s + c, 0);
  return top3 / total > 0.12;
}

const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','in','on','at','to','for','with','by','from','as','is','are','was','were',
  'be','been','being','have','has','had','do','does','did','can','could','should','would','may','might','must',
  'this','that','these','those','it','its','itself','they','them','their','we','our','us','you','your','i','my','me',
  'if','then','than','so','not','no','yes','all','any','some','more','most','very','just','also','only','out','up',
  'down','about','into','over','under','one','two','three',
]);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function freq(arr: string[]): Record<string, number> {
  return arr.reduce<Record<string, number>>((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});
}

function detectDifferentiationAboveFold(sample: string): boolean {
  const head = sample.slice(0, 600);
  if (/\b\d{1,4}\s+(years?|months?|days?|minutes?|hours?|percent|%)/i.test(head)) return true;
  if (/\$\d/.test(head)) return true;
  if (/\(\d{4}\)/.test(head)) return true;
  if (/https?:\/\/\S+/.test(head)) return true;
  if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/.test(head)) return true;
  return false;
}

/**
 * Metadata-scent helpers. All deterministic boolean checks against literal
 * surface features. No interpretation; no judgment of "richness."
 */

function hasActionVerb(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  // Word-boundary check for each verb in the canonical list.
  return ACTION_VERBS.some((v) => new RegExp(`\\b${v}\\b`, 'i').test(lower));
}

function namesCategory(text: string, industry: string): boolean {
  if (!text || !industry) return false;
  const t = text.toLowerCase();
  const i = industry.toLowerCase();
  if (t.includes(i)) return true;
  // Near-paraphrase: spaces → hyphens (e.g. "AI visibility" → "ai-visibility")
  if (t.includes(i.replace(/\s+/g, '-'))) return true;
  // Or any individual industry word > 3 chars
  const tokens = i.split(/\s+/).filter((w) => w.length > 3);
  return tokens.some((w) => t.includes(w));
}

function hasDescriptorBeyondName(title: string, canonicalName: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  const n = canonicalName.toLowerCase();
  if (!t.includes(n)) {
    // Title doesn't contain the canonical name at all — definitely has other content.
    return title.trim().length > 0;
  }
  // Remove the canonical name and check what's left.
  const rest = t.replace(n, '').replace(/[|\-–—:·•]/g, ' ').trim();
  return rest.split(/\s+/).filter((w) => w.length > 2).length >= 2;
}
