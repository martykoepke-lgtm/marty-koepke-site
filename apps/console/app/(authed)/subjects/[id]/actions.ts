"use server";

import { access, unlink } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function deleteSubjectAction(formData: FormData) {
  const subjectId = String(formData.get("subjectId") ?? "").trim();

  if (!/^[a-z0-9-]+$/.test(subjectId)) {
    throw new Error("Invalid business id.");
  }

  const dir = await findSubjectsDir();
  const path = resolve(join(dir, `${subjectId}.json`));
  const rel = relative(resolve(dir), path);

  if (rel.startsWith("..") || rel === "" || rel.includes(":")) {
    throw new Error("Refusing to delete a file outside the subjects directory.");
  }

  try {
    await access(path);
    await unlink(path);
  } catch {
    redirect(`/subjects?deleted=${encodeURIComponent(subjectId)}&missing=1`);
  }

  revalidatePath("/subjects");
  revalidatePath("/");
  redirect(`/subjects?deleted=${encodeURIComponent(subjectId)}`);
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
