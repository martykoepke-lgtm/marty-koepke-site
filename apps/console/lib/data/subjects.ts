/**
 * Subjects read from the JSON files in packages/avi/subjects/v1/.
 *
 * The v1 subjects are the 60+ test cohort accumulated during pre-launch
 * scoring. They are the source of truth until the Supabase `subjects`
 * table is populated (today it exists but is empty per the v2 schema
 * migration). Once seeded, a follow-up swaps this loader to read from
 * the DB.
 */

import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

export type SubjectJson = {
  id: string;
  canonical_name: string;
  url?: string;
  industry?: string;
  subject_type?: string;
  location?: string;
  buyer_type?: string;
  problem?: string;
  aliases?: string[];
  competitors?: Array<{ canonical_name: string; aliases?: string[] }>;
  known_differentiation_terms?: string[];
  right_fit_situations?: string[];
  wrong_fit_situations?: string[];
  approved_claims?: string[];
  prohibited_claims?: string[];
  trusted_source_urls?: string[];
  distinctive_point_of_view?: string;
  proof_points?: string[];
};

// Resolve the subjects/v1 dir defensively across possible cwds.
let cachedSubjectsDir: string | null = null;
async function subjectsDir(): Promise<string> {
  if (cachedSubjectsDir) return cachedSubjectsDir;
  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, "..", "..", "packages", "avi", "subjects", "v1"),
    resolve(cwd, "packages", "avi", "subjects", "v1"),
    resolve(cwd, "..", "packages", "avi", "subjects", "v1"),
    resolve(cwd, "subjects", "v1"),
  ];
  for (const d of candidates) {
    try {
      await access(d);
      cachedSubjectsDir = d;
      return d;
    } catch {
      /* try next */
    }
  }
  // Last-resort fallback so this never throws — the caller will just see empty results.
  return candidates[0];
}

export async function listSubjects(): Promise<SubjectJson[]> {
  const dir = await subjectsDir();
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  const jsons = entries.filter((f) => f.endsWith(".json"));
  const out: SubjectJson[] = [];
  for (const file of jsons) {
    try {
      const raw = await readFile(join(dir, file), "utf-8");
      const parsed = JSON.parse(raw);
      out.push({
        id: file.replace(/\.json$/, ""),
        canonical_name: parsed.canonical_name ?? parsed.name ?? file,
        url: parsed.url,
        industry: parsed.industry,
        subject_type: parsed.subject_type,
        location: parsed.location,
        buyer_type: parsed.buyer_type ?? parsed.buyer_descriptor,
        problem: parsed.problem ?? parsed.pain_point,
        aliases: parsed.aliases,
        competitors: parsed.competitors,
        known_differentiation_terms:
          parsed.known_differentiation_terms ??
          (parsed.distinctive_term ? [parsed.distinctive_term] : undefined),
        right_fit_situations: parsed.right_fit_situations,
        wrong_fit_situations: parsed.wrong_fit_situations,
        approved_claims: parsed.approved_claims,
        prohibited_claims: parsed.prohibited_claims,
        trusted_source_urls: parsed.trusted_source_urls,
        distinctive_point_of_view: parsed.distinctive_point_of_view,
        proof_points: parsed.proof_points,
      });
    } catch {
      // skip malformed files
    }
  }
  return out.sort((a, b) =>
    a.canonical_name.localeCompare(b.canonical_name)
  );
}

export async function getSubject(id: string): Promise<SubjectJson | null> {
  const dir = await subjectsDir();
  try {
    const raw = await readFile(join(dir, `${id}.json`), "utf-8");
    const parsed = JSON.parse(raw);
    return {
      id,
      canonical_name: parsed.canonical_name ?? parsed.name ?? id,
      url: parsed.url,
      industry: parsed.industry,
      subject_type: parsed.subject_type,
      location: parsed.location,
      buyer_type: parsed.buyer_type ?? parsed.buyer_descriptor,
      problem: parsed.problem ?? parsed.pain_point,
      aliases: parsed.aliases,
      competitors: parsed.competitors,
      known_differentiation_terms:
        parsed.known_differentiation_terms ??
        (parsed.distinctive_term ? [parsed.distinctive_term] : undefined),
      right_fit_situations: parsed.right_fit_situations,
      wrong_fit_situations: parsed.wrong_fit_situations,
      approved_claims: parsed.approved_claims,
      prohibited_claims: parsed.prohibited_claims,
      trusted_source_urls: parsed.trusted_source_urls,
      distinctive_point_of_view: parsed.distinctive_point_of_view,
      proof_points: parsed.proof_points,
    };
  } catch {
    return null;
  }
}

/** Look up a subject's JSON file id by canonical URL — used to wire the
 *  audit detail page's "Run another" buttons back through the same action. */
export async function getSubjectIdByUrl(url: string): Promise<string | null> {
  if (!url) return null;
  const all = await listSubjects();
  const found = all.find((s) => normalizeUrl(s.url) === normalizeUrl(url));
  return found?.id ?? null;
}

function normalizeUrl(u?: string): string {
  if (!u) return "";
  return u.replace(/\/$/, "").toLowerCase();
}
