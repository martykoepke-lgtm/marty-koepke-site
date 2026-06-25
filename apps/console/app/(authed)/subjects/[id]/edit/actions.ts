"use server";

import { readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { runAudit, persistAudit } from "@practical-informatics/avi";

/**
 * Update a subject's JSON file with values from the edit form.
 *
 * Submit button "name=action" decides what happens after save:
 *   - "save"               → redirect back to the subject detail page
 *   - "save_and_run_free"  → save, then trigger a free scan with the
 *                            updated metadata, then redirect to the audit
 *                            detail page
 *
 * Past audits keep their snapshot — subject edits never rewrite history.
 */
export async function updateSubjectAction(formData: FormData) {
  const subjectId = String(formData.get("subjectId") ?? "");
  const action = String(formData.get("action") ?? "save");

  if (!subjectId) {
    throw new Error("Missing subjectId");
  }

  const canonical_name = String(formData.get("canonical_name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const subject_type =
    formData.get("subject_type") === "personal_brand" ? "personal_brand" : "company";

  if (!canonical_name || !url || !industry) {
    redirect(
      `/subjects/${subjectId}/edit?error=${encodeURIComponent(
        "Company name, website, and what the business does are required."
      )}`
    );
  }

  const location = strOrUndef(formData.get("location"));
  const buyer_type = strOrUndef(formData.get("buyer_type"));
  const problem = strOrUndef(formData.get("problem"));
  const aliases = splitLines(formData.get("aliases"));
  const known_differentiation_terms = splitLines(
    formData.get("known_differentiation_terms")
  );
  const competitors = parseCompetitors(formData.get("competitors"));

  const dir = await findSubjectsDir();
  const path = join(dir, `${subjectId}.json`);

  // Sanity check — the source file must exist.
  try {
    await access(path);
  } catch {
    redirect(
      `/subjects/${subjectId}/edit?error=${encodeURIComponent(
        `Source file ${subjectId}.json not found at ${dir}.`
      )}`
    );
  }

  // Preserve any keys we don't model (e.g., legacy field shapes we want
  // to keep around). Start with the raw parsed JSON, then overlay the
  // canonical fields.
  let existing: Record<string, unknown> = {};
  try {
    existing = JSON.parse(await readFile(path, "utf-8"));
  } catch {
    /* if existing is corrupt, start fresh */
  }

  const updated: Record<string, unknown> = {
    ...existing,
    canonical_name,
    aliases,
    industry,
    subject_type,
    url,
  };

  if (location) updated.location = location;
  else delete updated.location;

  if (buyer_type) updated.buyer_type = buyer_type;
  else delete updated.buyer_type;

  if (problem) updated.problem = problem;
  else delete updated.problem;

  if (competitors.length) updated.competitors = competitors;
  else delete updated.competitors;

  if (known_differentiation_terms.length)
    updated.known_differentiation_terms = known_differentiation_terms;
  else delete updated.known_differentiation_terms;

  await writeFile(path, JSON.stringify(updated, null, 2) + "\n", "utf-8");

  revalidatePath(`/subjects/${subjectId}`);
  revalidatePath("/subjects");
  revalidatePath("/");

  if (action === "save_and_run_free") {
    const subject = {
      canonical_name,
      aliases,
      industry,
      subject_type: subject_type as "company" | "personal_brand",
      url,
      location,
      buyer_type,
      problem,
      competitors,
      known_differentiation_terms,
    };
    console.log(`[console] updateSubjectAction: saved + running free scan for ${canonical_name}`);
    const audit = await runAudit(subject, { mode: "free" });
    const persist = await persistAudit(audit);
    console.log(
      `[console] post-edit free scan: ok=${persist.ok} composite=${audit.composite.composite}`
    );
    revalidatePath("/audits");
    revalidatePath("/compare");
    redirect(`/audits/${audit.audit_id}`);
  }

  redirect(`/subjects/${subjectId}/edit?saved=1`);
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
