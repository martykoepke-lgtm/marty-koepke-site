/**
 * Subject loader — reads a subject JSON file and produces a v0.2 Subject.
 *
 * Accepts both shapes:
 *   - v0.2 shape: { canonical_name, aliases, industry, subject_type, url, ... }
 *   - legacy shape: { name, url, industry, location, subject_type, competitor_urls,
 *                     target_query, buyer_descriptor, pain_point, scenario, distinctive_term }
 *
 * The legacy shape was used in the 60+ test subjects under the old rubric. Both work.
 */

import { readFile } from 'node:fs/promises';
import type { Subject } from './types';

export async function loadSubject(path: string): Promise<Subject> {
  const raw = JSON.parse(await readFile(path, 'utf-8'));
  return normalizeSubject(raw);
}

export function normalizeSubject(raw: any): Subject {
  // Already v0.2?
  if (raw.canonical_name && raw.subject_type && raw.url) {
    return {
      canonical_name: raw.canonical_name,
      aliases: raw.aliases ?? [],
      industry: raw.industry ?? 'unspecified',
      subject_type: raw.subject_type,
      url: raw.url,
      location: raw.location,
      buyer_type: raw.buyer_type,
      problem: raw.problem,
      competitors: raw.competitors ?? [],
      known_differentiation_terms: raw.known_differentiation_terms ?? [],
      right_fit_situations: raw.right_fit_situations ?? [],
      wrong_fit_situations: raw.wrong_fit_situations ?? [],
      approved_claims: raw.approved_claims ?? [],
      prohibited_claims: raw.prohibited_claims ?? [],
      trusted_source_urls: raw.trusted_source_urls ?? [],
      distinctive_point_of_view: raw.distinctive_point_of_view,
      proof_points: raw.proof_points ?? [],
    };
  }

  // Legacy shape — adapt.
  const canonical_name = raw.name ?? raw.canonical_name ?? 'Unknown';
  const competitors = (raw.competitor_urls ?? []).map((url: string) => ({
    canonical_name: nameFromUrl(url),
    aliases: [],
  }));

  const subject_type =
    raw.subject_type === 'personal_brand' ? 'personal_brand' : 'company';

  return {
    canonical_name,
    aliases: raw.aliases ?? [],
    industry: raw.industry ?? 'unspecified',
    subject_type,
    url: raw.url,
    location: raw.location,
    buyer_type: raw.buyer_descriptor ?? raw.buyer_type,
    problem: raw.scenario ?? raw.pain_point ?? raw.problem,
    competitors,
    known_differentiation_terms:
      raw.known_differentiation_terms ??
      (raw.distinctive_term ? [raw.distinctive_term] : []),
    right_fit_situations: raw.right_fit_situations ?? [],
    wrong_fit_situations: raw.wrong_fit_situations ?? [],
    approved_claims: raw.approved_claims ?? [],
    prohibited_claims: raw.prohibited_claims ?? [],
    trusted_source_urls: raw.trusted_source_urls ?? [],
    distinctive_point_of_view: raw.distinctive_point_of_view,
    proof_points: raw.proof_points ?? [],
  };
}

function nameFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return url;
  }
}
