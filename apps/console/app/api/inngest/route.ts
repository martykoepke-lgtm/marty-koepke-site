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
// Long default — Inngest itself doesn't need this since the function
// runs in its own container, but the discovery request should complete
// quickly. Set generously in case any startup work runs long.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runAuditFunction],
});
