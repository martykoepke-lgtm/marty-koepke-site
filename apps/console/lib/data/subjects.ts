/**
 * Subjects — read from the Supabase `subjects` table.
 *
 * The legacy filesystem-JSON store (packages/avi/subjects/v1/) was
 * unusable on Vercel serverless (read-only filesystem, writes failed
 * with 500). The DB is now the source of truth. If you need the old
 * 60-subject test cohort, seed it from the JSON files via a script.
 *
 * Row shape mirrors migration 0011 (+ audience_lane widened in 0025).
 * Fields present in the historical JSON but not in the DB
 * (right_fit_situations, wrong_fit_situations, approved_claims,
 * prohibited_claims, trusted_source_urls, distinctive_point_of_view,
 * proof_points) are dropped. The intake form doesn't collect them.
 */

import { supabaseAdmin } from "@practical-informatics/avi";

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
  competitors?: Array<{ canonical_name: string; aliases?: string[]; url?: string }>;
  known_differentiation_terms?: string[];
  audience_lane?: "local" | "services" | "product" | null;
};

type SubjectRow = {
  id: string;
  canonical_name: string;
  url: string | null;
  industry: string | null;
  subject_type: string | null;
  location: string | null;
  buyer_type: string | null;
  problem: string | null;
  aliases: string[] | null;
  competitors: unknown; // jsonb
  known_differentiation_terms: string[] | null;
  audience_lane: string | null;
};

const SELECT =
  "id, canonical_name, url, industry, subject_type, location, buyer_type, problem, aliases, competitors, known_differentiation_terms, audience_lane";

function rowToSubject(row: SubjectRow): SubjectJson {
  return {
    id: row.id,
    canonical_name: row.canonical_name,
    url: row.url ?? undefined,
    industry: row.industry ?? undefined,
    subject_type: row.subject_type ?? undefined,
    location: row.location ?? undefined,
    buyer_type: row.buyer_type ?? undefined,
    problem: row.problem ?? undefined,
    aliases: row.aliases ?? undefined,
    competitors: parseCompetitors(row.competitors),
    known_differentiation_terms: row.known_differentiation_terms ?? undefined,
    audience_lane: normalizeLane(row.audience_lane),
  };
}

function parseCompetitors(
  v: unknown
):
  | Array<{ canonical_name: string; aliases?: string[]; url?: string }>
  | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v as SubjectJson["competitors"];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function normalizeLane(v: string | null): SubjectJson["audience_lane"] {
  if (v === "local" || v === "services" || v === "product") return v;
  return null;
}

export async function listSubjects(): Promise<SubjectJson[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("subjects")
    .select(SELECT)
    .order("canonical_name", { ascending: true })
    .returns<SubjectRow[]>();
  if (error) {
    console.error("[console/subjects] listSubjects failed:", error);
    return [];
  }
  return (data ?? []).map(rowToSubject);
}

export async function getSubject(id: string): Promise<SubjectJson | null> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("subjects")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle<SubjectRow>();
  if (error) {
    console.error("[console/subjects] getSubject failed:", error);
    return null;
  }
  return data ? rowToSubject(data) : null;
}

/** Look up a subject id by canonical URL — used to wire the audit detail
 *  page's "Run another" buttons back through the same action. */
export async function getSubjectIdByUrl(url: string): Promise<string | null> {
  if (!url) return null;
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  const supabase = supabaseAdmin();
  // Case-insensitive match on the normalized (trailing-slash-stripped) URL.
  // Pull all rows because the DB does not store a normalized column.
  const { data, error } = await supabase
    .from("subjects")
    .select("id, url")
    .returns<Array<{ id: string; url: string | null }>>();
  if (error || !data) return null;
  const found = data.find((r) => normalizeUrl(r.url ?? "") === normalized);
  return found?.id ?? null;
}

function normalizeUrl(u?: string): string {
  if (!u) return "";
  return u.replace(/\/$/, "").toLowerCase();
}
