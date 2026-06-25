"use server";

import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 12) {
    redirect(`/account/password?error=${encodeURIComponent("Use at least 12 characters.")}`);
  }
  if (password !== confirm) {
    redirect(`/account/password?error=${encodeURIComponent("Passwords do not match.")}`);
  }

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/account/password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/account/password?saved=1`);
}
