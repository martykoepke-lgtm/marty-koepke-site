import type { CorroborationEvidence, ExtractorOutput, Subject } from '../types';
import type { V3SourceEvidence, V3SourceType } from './types';

export async function collectSourceEvidence(opts: {
  subject: Subject;
  extractions: ExtractorOutput[];
  corroboration: CorroborationEvidence;
}): Promise<V3SourceEvidence[]> {
  const urls = new Set<string>();

  for (const url of opts.subject.trusted_source_urls ?? []) {
    if (url) urls.add(url);
  }

  for (const extraction of opts.extractions) {
    for (const url of extraction.cited_urls_verified) urls.add(url);
  }

  for (const result of opts.corroboration.general_search.slice(0, 8)) {
    if (result.url) urls.add(result.url);
  }

  for (const platform of opts.corroboration.platform_filtered) {
    for (const result of platform.results.slice(0, 3)) {
      if (result.url) urls.add(result.url);
    }
  }

  const evidence: V3SourceEvidence[] = [];
  for (const url of Array.from(urls).slice(0, 30)) {
    evidence.push(await fetchSourceEvidence(url, opts.subject));
  }
  return evidence;
}

export async function fetchSourceEvidence(
  url: string,
  subject: Subject
): Promise<V3SourceEvidence> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'PracticalInformatics-AVI/3.0 (source-evidence)' },
    });
    clearTimeout(timeout);

    const html = await res.text();
    const text = normalizeText(html);
    const excerpt = focusedExcerpt(text, subject);
    return {
      url,
      source_type: classifySourceType(url, subject),
      fetched_at: new Date().toISOString(),
      fetch_status: res.status,
      title: extractTitle(html),
      excerpt,
      mentions_subject: subjectMentioned(text, subject),
      content_hash: String(hash(text.slice(0, 5000))),
    };
  } catch {
    return {
      url,
      source_type: classifySourceType(url, subject),
      fetched_at: new Date().toISOString(),
      fetch_status: 0,
      mentions_subject: false,
    };
  }
}

export function classifySourceType(url: string, subject: Subject): V3SourceType {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const subjectHost = new URL(subject.url).hostname.replace(/^www\./, '').toLowerCase();
    if (host === subjectHost || host.endsWith(`.${subjectHost}`)) return 'owned_site';
    if (host.includes('google.')) return 'google_business_profile';
    if (/(yelp|g2|clutch|capterra|avvo|bbb|tripadvisor)/.test(host)) return 'directory';
    if (/(linkedin|facebook|instagram|x\.com|twitter|youtube|reddit)/.test(host)) return 'social';
    if (/(podcast|spotify|apple)/.test(host)) return 'podcast';
    if (/(gov|sos\.ca\.gov|sec\.gov)/.test(host)) return 'official_registry';
    if (/(medium|substack|forbes|reuters|news|blog)/.test(host)) return 'article';
    return 'other';
  } catch {
    return 'other';
  }
}

function subjectMentioned(text: string, subject: Subject): boolean {
  const lower = text.toLowerCase();
  return [subject.canonical_name, ...(subject.aliases ?? [])]
    .filter(Boolean)
    .some((name) => lower.includes(name.toLowerCase()));
}

function focusedExcerpt(text: string, subject: Subject): string {
  const lower = text.toLowerCase();
  const needles = [subject.canonical_name, ...(subject.aliases ?? [])].filter(Boolean);
  const first = needles
    .map((needle) => lower.indexOf(needle.toLowerCase()))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (first === undefined) return text.slice(0, 1200);
  const start = Math.max(0, first - 400);
  return text.slice(start, start + 1600);
}

function normalizeText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim();
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}
