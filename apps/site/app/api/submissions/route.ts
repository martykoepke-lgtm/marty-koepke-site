import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@practical-informatics/avi";
import { runCrawler, normalizeUrl } from "@practical-informatics/avi";

/**
 * POST /api/submissions
 *
 * Receives the AVI scan form. Validates, runs the lightweight Crawler,
 * writes the row to Supabase, and returns the submission id + access
 * token so the frontend can navigate to /ai-visibility/results/[id].
 *
 * Total response time: ~5–12 seconds (most of it is the Crawler fetch).
 */

// Force Node runtime so we get the full fetch API + longer execution window
export const runtime = "nodejs";
export const maxDuration = 30; // seconds — Vercel allows up to 60 on Hobby

type SubmissionBody = {
  url?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  industry?: string;
  location?: string;
  competitor_1?: string;
  competitor_2?: string;
  find_competitors_for_me?: boolean;
  target_query?: string;
};

export async function POST(req: NextRequest) {
  let body: SubmissionBody;
  try {
    body = (await req.json()) as SubmissionBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // ---- Validation ----
  const v = validate(body);
  if (!v.ok) {
    return NextResponse.json(
      { ok: false, error: v.error, field: v.field },
      { status: 400 }
    );
  }

  const hasUrl =
    typeof body.url === "string" && body.url.trim() !== "";
  const url = hasUrl ? normalizeUrl(body.url!) : null;
  const competitor_urls = [body.competitor_1, body.competitor_2]
    .filter((s): s is string => typeof s === "string" && s.trim() !== "")
    .map(normalizeUrl);

  // ---- Run the Crawler (lightweight) — only if we have a URL ----
  // If there's no URL, we skip the website-readiness eval and rely entirely
  // on the AI Search Ranking eval (which runs in week 2 as the Query Agent).
  let crawler;
  if (url) {
    try {
      crawler = await runCrawler(url);
    } catch (e) {
      console.error("[/api/submissions] Crawler threw unexpectedly:", e);
      crawler = {
        url,
        fetchedAt: new Date().toISOString(),
        reachable: false,
        error: e instanceof Error ? e.message : "Crawler error",
        preliminaryScore: 0,
        preliminaryTier: "invisible" as const,
        preliminaryFindings: [
          {
            title: "We couldn't complete the scan",
            detail:
              "Something went wrong on our end while reading your site. Reply to your confirmation email and we'll run it by hand.",
            severity: "high" as const,
          },
        ],
      };
    }
  } else {
    // No URL → no website to scan. Preliminary state reflects that the
    // AI-search-ranking half of the audit will run later (Query Agent).
    crawler = {
      url: null,
      fetchedAt: new Date().toISOString(),
      reachable: false,
      preliminaryScore: 0,
      preliminaryTier: "invisible" as const,
      preliminaryFindings: [
        {
          title: "No website yet — we'll focus on AI search visibility",
          detail:
            "You didn't provide a URL, so we skipped the website-readiness check. The full paid audit can still test whether AI surfaces you in category searches for your industry and location.",
          severity: "medium" as const,
        },
      ],
    };
  }

  // ---- Insert into Supabase ----
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      url,
      email: body.email!.trim().toLowerCase(),
      first_name: body.first_name!.trim(),
      last_name: body.last_name!.trim(),
      company_name: body.company_name!.trim(),
      industry: body.industry!.trim(),
      location: body.location?.trim() || null,
      competitor_urls: competitor_urls.length ? competitor_urls : null,
      find_competitors_for_me: body.find_competitors_for_me === true,
      target_query: body.target_query?.trim() || null,
      preliminary_score: crawler.preliminaryScore,
      preliminary_tier: crawler.preliminaryTier,
      preliminary_findings: crawler.preliminaryFindings,
      status: "new",
    })
    .select("id, access_token")
    .single();

  if (error || !data) {
    console.error("[/api/submissions] Supabase insert failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "We couldn't save your submission. Please try again, or email marty.koepke@practicalinformatics.com.",
      },
      { status: 500 }
    );
  }

  // TODO (next sub-step): fire welcome email via Resend with the link to /results/[id]
  // For now, the frontend will navigate to results page directly.

  return NextResponse.json({
    ok: true,
    id: data.id,
    accessToken: data.access_token,
    redirectTo: `/ai-visibility/results/${data.id}?token=${data.access_token}`,
  });
}

// ============================================================================
// Validation
// ============================================================================

type ValidationResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

function validate(b: SubmissionBody): ValidationResult {
  // URL is OPTIONAL — but if provided, it must be syntactically valid.
  if (isNonEmptyString(b.url) && !isValidUrl(b.url)) {
    return {
      ok: false,
      error: "That doesn't look like a valid URL. Try https://yourbusiness.com — or leave it blank.",
      field: "url",
    };
  }
  if (!isNonEmptyString(b.email)) {
    return { ok: false, error: "Email is required.", field: "email" };
  }
  if (!isValidEmail(b.email)) {
    return {
      ok: false,
      error: "That doesn't look like a valid email address.",
      field: "email",
    };
  }
  if (!isNonEmptyString(b.first_name)) {
    return { ok: false, error: "First name is required.", field: "first_name" };
  }
  if (!isNonEmptyString(b.last_name)) {
    return { ok: false, error: "Last name is required.", field: "last_name" };
  }
  if (!isNonEmptyString(b.company_name)) {
    return { ok: false, error: "Company name is required.", field: "company_name" };
  }
  if (!isNonEmptyString(b.industry)) {
    return {
      ok: false,
      error: "Tell us what your business does in one line.",
      field: "industry",
    };
  }
  return { ok: true };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(normalizeUrl(v));
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

function isValidEmail(v: string): boolean {
  // Pragmatic email regex — not RFC-perfect, but catches obvious mistakes
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
