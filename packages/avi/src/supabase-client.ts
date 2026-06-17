import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 *
 * Uses the service role key, which bypasses Row Level Security. ONLY use
 * this in API routes (anything under app/api/*) or server components —
 * never in client components or the browser. The service role key would
 * give an attacker full database access if exposed.
 *
 * The current schema has RLS enabled with no public policies, so this is
 * the only way our app reads or writes any of the AVI tables.
 */

let adminClient: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL — add it to .env.local and Vercel env vars."
    );
  }
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — add it to .env.local and Vercel env vars (server-side only, never prefix with NEXT_PUBLIC_)."
    );
  }

  adminClient = createClient(url, serviceKey, {
    auth: {
      // No user sessions on the server; we use the service role directly.
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

// ----------------------------------------------------------------------------
// Typed shape of a submissions row — keep in sync with the migration.
// ----------------------------------------------------------------------------
export type SubmissionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  url: string | null;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  industry: string;
  location: string | null;
  competitor_urls: string[] | null;
  find_competitors_for_me: boolean;
  target_query: string | null;
  preliminary_score: number | null;
  preliminary_tier: string | null;
  preliminary_findings: unknown; // jsonb
  status:
    | "new"
    | "teaser_sent"
    | "paid"
    | "report_sent"
    | "call_complete"
    | "sprint_sold"
    | "refunded";
  access_token: string;
};

// What we let a client submit (subset of the row).
export type SubmissionInput = {
  url?: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  industry: string;
  location?: string;
  competitor_urls?: string[];
  find_competitors_for_me?: boolean;
  target_query?: string;
};
