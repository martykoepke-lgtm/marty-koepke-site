/**
 * Inngest webhook route — where Inngest calls back to execute functions.
 *
 * URL: https://console.daizie.ai/api/inngest
 * On the Inngest dashboard, add this URL as an app endpoint so Inngest
 * can discover the registered functions and forward events to them.
 *
 * Signing key validates incoming webhooks; event key authorizes outbound
 * event dispatches from server actions. Both are set on Vercel per the
 * turbo.json build env allowlist.
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { runAuditFunction } from "@/lib/inngest/functions/run-audit";

// The Inngest function needs Node runtime (calls AVI orchestrator that
// uses Anthropic/OpenAI/Google/Perplexity/Tavily/Supabase SDKs).
export const runtime = "nodejs";
// IMPORTANT: Inngest executes each step.run() as a separate call BACK
// to this webhook. Each call is a Vercel serverless invocation, so the
// step body has to complete inside this timeout. 300s is the Vercel
// Pro maximum. Full 32-response audits (~8–15 min) still won't fit —
// that requires breaking runAuditV3 into smaller step.run() blocks
// (per-engine or per-query) so each individual invocation is short.
// Small runs (queryCount = 1–2, ~2–3 min) fit comfortably here.
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runAuditFunction],
});
