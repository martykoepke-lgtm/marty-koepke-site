"use server";

import { writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Creates a new subject by writing a JSON file to
 * packages/avi/subjects/v1/<slug>.json. The slug is derived from the
 * canonical name (kebab-cased). Errors redirect back to the form with
 * an `error` query param.
 *
 * Note: file write only works in a writable filesystem (local dev or a
 * mounted volume in production). For Vercel serverless, subject creation
 * would need to write to the `subjects` table instead. That swap lands
 * with the DB-backed subjects loader.
 */
export async function createSubjectAction(formData: FormData) {
  const canonical_name = String(formData.get("canonical_name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const subject_type =
    formData.get("subject_type") === "personal_brand" ? "personal_brand" : "company";

  if (!canonical_name || !url || !industry) {
    redirect(
      `/subjects/new?error=${encodeURIComponent("Company name, website, and what the business does are required.")}`
    );
  }

  const slug = slugify(canonical_name);
  if (!slug) {
    redirect(
      `/subjects/new?error=${encodeURIComponent("Could not create a file name from the company name.")}`
    );
  }

  const dir = await findSubjectsDir();
  const path = join(dir, `${slug}.json`);

  // Refuse to overwrite an existing subject.
  try {
    await access(path);
    redirect(
      `/subjects/new?error=${encodeURIComponent(`A subject already exists at ${slug}.json — pick a different name or edit the existing one.`)}`
    );
  } catch {
    /* file doesn't exist — good */
  }

  const aliases = splitLines(formData.get("aliases"));
  const known_differentiation_terms = splitLines(
    formData.get("known_differentiation_terms")
  );
  const competitors = parseCompetitors(formData.get("competitors"));
  const location = strOrUndef(formData.get("location"));
  const buyer_type = strOrUndef(formData.get("buyer_type"));
  const problem = strOrUndef(formData.get("problem"));

  const subject: Record<string, unknown> = {
    canonical_name,
    aliases,
    industry,
    subject_type,
    url,
  };
  if (location) subject.location = location;
  if (buyer_type) subject.buyer_type = buyer_type;
  if (problem) subject.problem = problem;
  if (competitors.length) subject.competitors = competitors;
  if (known_differentiation_terms.length)
    subject.known_differentiation_terms = known_differentiation_terms;

  await writeFile(path, JSON.stringify(subject, null, 2) + "\n", "utf-8");

  revalidatePath("/subjects");
  revalidatePath("/");
  redirect(`/subjects/${slug}`);
}

async function findSubjectsDir(): Promise<string> {
  const cwd = process.cwd();
  const candidates = [
    resolve(cwd, "..", "..", "packages", "avi", "subjects", "v1"),
    resolve(cwd, "packages", "avi", "subjects", "v1"),
    resolve(cwd, "..", "packages", "avi", "subjects", "v1"),
  ];
  for (const d of candidates) {
    try {
      await access(d);
      return d;
    } catch {
      /* try next */
    }
  }
  return candidates[0];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function strOrUndef(v: FormDataEntryValue | null): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

function splitLines(v: FormDataEntryValue | null): string[] {
  if (v == null) return [];
  return String(v)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseCompetitors(
  v: FormDataEntryValue | null
): { canonical_name: string; aliases: string[] }[] {
  const lines = splitLines(v);
  return lines.map((line) => {
    const [name, aliasPart] = line.split("|").map((s) => s.trim());
    const aliases = aliasPart
      ? aliasPart
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];
    return { canonical_name: name, aliases };
  });
}
