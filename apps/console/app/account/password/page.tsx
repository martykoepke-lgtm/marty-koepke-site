"use client";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function PasswordPage() {
  const [status, setStatus] = useState("Checking reset session...");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    return createClient(url, anonKey);
  }, []);

  useEffect(() => {
    async function prepareSession() {
      if (!supabase) {
        setStatus("Missing Supabase configuration.");
        return;
      }

      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          setStatus(sessionError.message);
          return;
        }
        window.history.replaceState(null, "", "/account/password");
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("This reset link did not create a recovery session. Request a fresh reset email from Supabase.");
        return;
      }

      setReady(true);
      setStatus("");
    }

    void prepareSession();
  }, [supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);

    if (!supabase) {
      setError("Missing Supabase configuration.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (password.length < 12) {
      setError("Use at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-xl font-semibold text-paper tracking-tight">
            Practical Informatics
          </div>
          <div className="text-sm text-paper/65 mt-1">Change password</div>
        </div>

        <form
          onSubmit={onSubmit}
          className="border border-rule-strong bg-paper rounded-md p-6 space-y-4"
        >
          {!ready && (
            <div className="text-xs text-charcoal bg-paper-dim border border-rule-strong rounded-md px-3 py-2">
              {status}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              New password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={12}
              disabled={!ready}
              autoComplete="new-password"
              className="w-full border border-rule-strong rounded-md px-3 py-2 text-sm bg-paper-dim focus:bg-paper focus:outline-none focus:border-forest disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">
              Confirm password
            </label>
            <input
              name="confirm"
              type="password"
              required
              minLength={12}
              disabled={!ready}
              autoComplete="new-password"
              className="w-full border border-rule-strong rounded-md px-3 py-2 text-sm bg-paper-dim focus:bg-paper focus:outline-none focus:border-forest disabled:opacity-60"
            />
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          {saved && (
            <div className="text-xs text-forest-dark bg-forest/5 border border-forest/20 rounded-md px-3 py-2">
              Password updated. You can now sign in.
            </div>
          )}

          <button
            type="submit"
            disabled={!ready}
            className="w-full bg-forest text-cream rounded-md py-2 text-sm font-medium hover:bg-forest-dark transition-colors disabled:opacity-60"
          >
            Update password
          </button>
        </form>

        <p className="text-xs text-paper/58 text-center mt-6">
          <Link href="/login" className="hover:text-paper">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
