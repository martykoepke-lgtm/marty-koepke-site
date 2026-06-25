import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase Auth client for server components / server actions.
 * Uses the anon key with the visitor's session cookie, so reads/writes
 * via this client honor the visitor's identity (not service-role).
 *
 * For data queries that need to bypass RLS (i.e. everything in this
 * console, since console operators are the only ones reading our tables),
 * use `supabaseAdmin()` exported from `@practical-informatics/avi`.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items: { name: string; value: string; options?: any }[]) {
          try {
            for (const { name, value, options } of items) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll from a Server Component is a noop — the middleware refresh
            // path is what actually writes the cookie. This catch keeps RSC happy.
          }
        },
      },
    }
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Set it in .env.local.`);
  }
  return value;
}
