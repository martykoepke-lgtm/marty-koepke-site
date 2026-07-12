"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  runAudit,
  persistAudit,
  supabaseAdmin,
} from "@practical-informatics/avi";

/**
 * Update a subject's row in the Supabase `subjects` table.
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
    formData.get("subject_type") === "personal_brand"
      ? "personal_brand"
      : "company";

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

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("subjects")
    .update({
      canonical_name,
      aliases,
      industry,
      subject_type,
      url,
      location: location ?? null,
      buyer_type: buyer_type ?? null,
      problem: problem ?? null,
      competitors,
      known_differentiation_terms,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subjectId);

  if (error) {
    console.error("[console/subjects/edit] update failed:", error);
    redirect(
      `/subjects/${subjectId}/edit?error=${encodeURIComponent(
        `Could not save the business: ${error.message}`
      )}`
    );
  }

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
    console.log(
      `[console] updateSubjectAction: saved + running free scan for ${canonical_name}`
    );
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
