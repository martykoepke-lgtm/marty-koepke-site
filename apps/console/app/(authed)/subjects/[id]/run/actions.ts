"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@practical-informatics/avi";
import { inngest } from "@/lib/inngest/client";

/**
 * Runs an audit with parameters supplied by the form on the run page.
 * Lets the operator override subject fields for this single run without
 * touching the source JSON.
 */
export async function runAuditWithParamsAction(formData: FormData) {
  const subjectId = String(formData.get("subjectId") ?? "");
  const mode = (formData.get("mode") === "paid" ? "paid" : "free") as
    | "free"
    | "paid";

  const canonical_name = String(formData.get("canonical_name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const subject_type =
    formData.get("subject_type") === "personal_brand"
      ? "personal_brand"
      : "company";

  if (!canonical_name || !url || !industry) {
    throw new Error("Company name, website, and what the business does are required.");
  }

  const location = strOrUndef(formData.get("location"));
  const buyer_type = strOrUndef(formData.get("buyer_type"));
  const problem = strOrUndef(formData.get("problem"));

  const aliases = splitLines(formData.get("aliases"));
  const known_differentiation_terms = splitLines(
    formData.get("known_differentiation_terms")
  );
  const competitors = parseCompetitors(formData.get("competitors"));

  const parsedQueryCount = Number(formData.get("queryCount") ?? 8);
  const queryCount = Number.isFinite(parsedQueryCount) && parsedQueryCount > 0
    ? Math.floor(parsedQueryCount)
    : 8;

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

  // Persist edited metadata to the subjects table so it's remembered
  // next time. Toggleable via the "save_to_subject" checkbox; defaults on.
  const saveToSubject = formData.get("save_to_subject") === "1";
  if (saveToSubject && subjectId) {
    try {
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
      if (error) throw error;
      console.log(`[console] saved subject metadata for ${subjectId}`);
    } catch (e) {
      console.error(
        `[console] failed to save subject metadata: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
      // Don't block the run — just log and continue.
    }
  }

  console.log(
    `[console] runAuditWithParamsAction: subject=${canonical_name} mode=${mode} queryCount=${queryCount} — dispatching to Inngest`
  );

  // Dispatch to Inngest and return immediately. The background function
  // in lib/inngest/functions/run-audit.ts picks up the event and runs
  // the full pipeline outside the Vercel request-cycle timeout — that
  // fixes the 504 on full 32-response paid audits.
  try {
    await inngest.send({
      name: "avi/audit.run.requested",
      data: {
        subjectId,
        subject,
        mode: mode === "paid" ? "audit" : "free",
        queryCount,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[console] failed to dispatch Inngest event: ${message}`);
    redirect(
      `/subjects/${subjectId}/run?mode=${mode}&error=${encodeURIComponent(
        `Could not queue the ${mode === "paid" ? "assessment" : "scan"}: ${message}`
      )}`
    );
  }

  revalidatePath("/audits");
  revalidatePath("/compare");
  revalidatePath("/");
  revalidatePath(`/subjects/${subjectId}`);
  redirect(`/subjects/${subjectId}?queued=${mode}`);
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
): { canonical_name: string; aliases: string[]; url?: string }[] {
  const lines = splitLines(v).flatMap((line) =>
    line.includes("|")
      ? [line]
      : line
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
  );
  return lines.map((line) => {
    const parts = line.split("|").map((s) => s.trim()).filter(Boolean);
    const name = parts[0] ?? "";
    let url: string | undefined;
    let aliasParts: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!url && isUrlish(part)) {
        url = part.startsWith("http") ? part : `https://${part}`;
      } else {
        aliasParts.push(part);
      }
    }
    const aliases = aliasParts
      .join(",")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return url
      ? { canonical_name: name, aliases, url }
      : { canonical_name: name, aliases };
  });
}

function isUrlish(s: string): boolean {
  return (
    /^https?:\/\//i.test(s) ||
    /^www\./i.test(s) ||
    /\.[a-z]{2,}(\/|$)/i.test(s)
  );
}
