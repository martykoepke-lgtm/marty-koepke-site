/**
 * Smoke test for the URGENT spend alert path.
 *
 * Usage:
 *   node scripts/smoke-test-spend-alert.mjs seed     # insert fake $30 anthropic
 *   node scripts/smoke-test-spend-alert.mjs cleanup  # delete it again
 *
 * Reads SUPABASE_URL + service role key from .env.local. Inserts (or deletes)
 * a row in api_calls tagged provider='anthropic', cost_estimated_usd=30.00,
 * endpoint='monitor_self_test' so it's clearly identifiable. After seeding,
 * curl /api/cron/check-spend — provider should be at 120% of $25 cap and
 * fire the URGENT alert email.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ENV_PATH = new URL("../.env.local", import.meta.url);
const env = parseEnv(readFileSync(ENV_PATH, "utf8"));

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

const FAKE_MARKER = "monitor_self_test_spend_alert_seed";

const cmd = process.argv[2] ?? "seed";

if (cmd === "seed") {
  const { data, error } = await supabase
    .from("api_calls")
    .insert({
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      endpoint: FAKE_MARKER,
      tokens_input: 1_000_000,
      tokens_output: 1_800_000,
      cost_estimated_usd: 30.0,
      duration_ms: 0,
      status: "success",
      request_id: null,
      ip: null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Insert failed:", error);
    process.exit(1);
  }
  console.log(`Seeded fake $30 anthropic row: id=${data.id}`);
} else if (cmd === "cleanup") {
  const { data, error } = await supabase
    .from("api_calls")
    .delete()
    .eq("endpoint", FAKE_MARKER)
    .select("id");

  if (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }
  console.log(`Deleted ${data.length} fake row(s)`);
} else {
  console.error(`Unknown command: ${cmd}. Use 'seed' or 'cleanup'.`);
  process.exit(1);
}

function parseEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}
