"use server";

import { readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  persistAudit,
  persistAuditV3,
  runAudit,
  runAuditV3,
} from "@practical-informatics/avi";

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

  // Persist edited metadata back to the JSON file so it's remembered
  // next time. Toggleable via the "save_to_subject" checkbox; defaults on.
  const saveToSubject = formData.get("save_to_subject") === "1";
  if (saveToSubject && subjectId) {
    try {
      const dir = await findSubjectsDir();
      const path = join(dir, `${subjectId}.json`);

      let existing: Record<string, unknown> = {};
      try {
        existing = JSON.parse(await readFile(path, "utf-8"));
      } catch {
        /* file doesn't exist or unparseable — start fresh */
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
      console.log(`[console] saved subject metadata to ${path}`);
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
    `[console] runAuditWithParamsAction: subject=${canonical_name} mode=${mode} queryCount=${queryCount}`
  );

  if (mode === "paid") {
    let audit: Awaited<ReturnType<typeof runAuditV3>>;
    try {
      audit = await runAuditV3(subject, {
        mode: "audit",
        queryCount,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[console] runAuditV3 failed before persistence: ${message}`);
      redirect(
        `/subjects/${subjectId}/run?mode=${mode}&error=${encodeURIComponent(
          `The assessment failed before it could be saved: ${message}`
        )}`
      );
    }

    console.log(
      `[console] runAuditV3 complete: index=${audit.public_scores.ai_business_accuracy_index} tier=${audit.public_scores.tier} errors=${audit.errors.length}`
    );

    const persist = await persistAuditV3(audit);
    console.log(
      `[console] persistAuditV3: ok=${persist.ok} steps=${persist.steps_persisted.join(",")} errors=${persist.errors.length}`
    );

    if (!persist.ok) {
      const firstErr = persist.errors[0];
      console.error(
        `[console] V3 persist failed at '${firstErr?.step}': ${firstErr?.message}`
      );
      redirect(
        `/subjects/${subjectId}/run?mode=${mode}&error=${encodeURIComponent(
          `The assessment ran, but the report could not be saved. Failed at ${firstErr?.step}: ${firstErr?.message}`
        )}`
      );
    }

    revalidatePath("/audits");
    revalidatePath("/compare");
    revalidatePath("/");
    revalidatePath(`/subjects/${subjectId}`);
    redirect(`/audits/${audit.audit_id}/v31`);
  }

  const audit = await runAudit(subject, {
    mode,
    queryCount: undefined,
  });

  console.log(
    `[console] runAudit complete: composite=${audit.composite.composite} tier=${audit.composite.tier} errors=${audit.errors.length}`
  );

  const persist = await persistAudit(audit);
  console.log(
    `[console] persistAudit: ok=${persist.ok} steps=${persist.steps_persisted.join(",")} errors=${persist.errors.length}`
  );

  if (!persist.ok) {
    const firstErr = persist.errors[0];
    console.error(
      `[console] persist failed at '${firstErr?.step}': ${firstErr?.message}`
    );
    redirect(
      `/subjects/${subjectId}/run?mode=${mode}&error=${encodeURIComponent(
        `The scan ran, but the report could not be saved. Failed at ${firstErr?.step}: ${firstErr?.message}`
      )}`
    );
  }

  revalidatePath("/audits");
  revalidatePath("/compare");
  revalidatePath("/");
  revalidatePath(`/subjects/${subjectId}`);
  redirect(`/audits/${audit.audit_id}`);
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
