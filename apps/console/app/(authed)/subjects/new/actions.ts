"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@practical-informatics/avi";

/**
 * Creates a new subject as a row in the Supabase `subjects` table.
 * Returns the new subject's UUID as the URL segment for the detail page.
 *
 * Errors redirect back to the form with an `error` query param.
 */
export async function createSubjectAction(formData: FormData) {
  const canonical_name = String(formData.get("canonical_name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const subject_type =
    formData.get("subject_type") === "personal_brand"
      ? "personal_brand"
      : "company";

  if (!canonical_name || !url || !industry) {
    redirect(
      `/subjects/new?error=${encodeURIComponent("Company name, website, and what the business does are required.")}`
    );
  }

  const aliases = splitLines(formData.get("aliases"));
  const known_differentiation_terms = splitLines(
    formData.get("known_differentiation_terms")
  );
  const competitors = parseCompetitors(formData.get("competitors"));
  const location = strOrUndef(formData.get("location"));
  const buyer_type = strOrUndef(formData.get("buyer_type"));
  const problem = strOrUndef(formData.get("problem"));

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("subjects")
    .insert({
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
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    console.error("[console/subjects/new] insert failed:", error);
    redirect(
      `/subjects/new?error=${encodeURIComponent(
        `Could not create the business: ${error?.message ?? "unknown error"}`
      )}`
    );
  }

  revalidatePath("/subjects");
  revalidatePath("/");
  redirect(`/subjects/${data.id}`);
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
