"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing password reset...");

  useEffect(() => {
    async function completeAuth() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const next = searchParams.get("next") ?? "/account/password";

      if (!url || !anonKey) {
        setMessage("Missing Supabase configuration.");
        return;
      }

      const supabase = createClient(url, anonKey);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = searchParams.get("code");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        router.replace(next);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
        router.replace(next);
        return;
      }

      setMessage("This reset link is missing its recovery token. Request a fresh password reset from Supabase.");
    }

    void completeAuth();
  }, [router, searchParams]);

  return (
    <div className="w-full max-w-sm border border-rule-strong bg-paper rounded-md p-6 text-sm text-charcoal">
      {message}
    </div>
  );
}
