"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@practical-informatics/avi";

/** Subject id is a UUID (Postgres gen_random_uuid). Accept only that shape. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function deleteSubjectAction(formData: FormData) {
  const subjectId = String(formData.get("subjectId") ?? "").trim();

  if (!UUID_RE.test(subjectId)) {
    throw new Error("Invalid business id.");
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", subjectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("[console/subjects/delete] failed:", error);
    throw new Error(`Could not delete the business: ${error.message}`);
  }

  revalidatePath("/subjects");
  revalidatePath("/");

  if (!data) {
    // Row was already gone. Not an error — surface as "missing" like before.
    redirect(`/subjects?deleted=${encodeURIComponent(subjectId)}&missing=1`);
  }

  redirect(`/subjects?deleted=${encodeURIComponent(subjectId)}`);
}
