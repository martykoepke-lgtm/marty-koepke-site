/**
 * Audit error diagnostic — inspects an audit's failed cells.
 *
 * Usage:
 *   npm run audit:errors -- <audit_id>
 *
 * Pulls every audit_query_responses row for the given audit and reports:
 *   - Total cells vs. errored cells
 *   - Breakdown by engine (which provider is failing most?)
 *   - Breakdown by status (rate_limited, timeout, error)
 *   - Top error-message patterns
 *   - Sample errors per engine for deep dive
 *
 * Used during the evaluation phase when an audit comes back with 10–20%
 * error rate and you want to know whether it's "Perplexity is rate-limited"
 * or "one provider had an outage" or "we hit a real bug."
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { supabaseAdmin } from "@/lib/supabase";

type Row = {
  query_id: string;
  query_category: string;
  engine: string;
  rep_index: number;
  status: string;
  error_message: string | null;
  duration_ms: number | null;
};

async function main(): Promise<void> {
  const auditId = process.argv[2];
  if (!auditId) {
    console.error("Usage: npm run audit:errors -- <audit_id>");
    process.exit(1);
  }

  const { data, error } = await supabaseAdmin()
    .from("audit_query_responses")
    .select(
      "query_id, query_category, engine, rep_index, status, error_message, duration_ms"
    )
    .eq("audit_id", auditId)
    .returns<Row[]>();

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  const rows = data ?? [];
  const total = rows.length;
  const errors = rows.filter((r) => r.status !== "success");

  console.log("");
  console.log(`Audit:        ${auditId}`);
  console.log(`Total cells:  ${total}`);
  console.log(
    `Errors:       ${errors.length} (${total === 0 ? "0.0" : ((errors.length / total) * 100).toFixed(1)}%)`
  );
  console.log("");

  if (errors.length === 0) {
    console.log("No errors — every cell returned successfully.");
    return;
  }

  // --- By engine ---
  console.log("Errors by engine");
  console.log("----------------");
  const byEngine = countBy(errors, (r) => r.engine);
  const enginesByCount = sortMapDesc(byEngine);
  for (const [engine, count] of enginesByCount) {
    const engineTotal = rows.filter((r) => r.engine === engine).length;
    const pct = ((count / engineTotal) * 100).toFixed(0);
    console.log(`  ${engine.padEnd(12)} ${String(count).padStart(3)} of ${String(engineTotal).padStart(3)} cells failed (${pct}%)`);
  }
  console.log("");

  // --- By status ---
  console.log("Errors by status");
  console.log("----------------");
  const byStatus = countBy(errors, (r) => r.status);
  for (const [status, count] of sortMapDesc(byStatus)) {
    console.log(`  ${status.padEnd(15)} ${count}`);
  }
  console.log("");

  // --- By message pattern (first 100 chars) ---
  console.log("Errors by message pattern (top 10)");
  console.log("----------------------------------");
  const byMessage = countBy(errors, (r) =>
    (r.error_message ?? "(no message)").slice(0, 100)
  );
  for (const [msg, count] of sortMapDesc(byMessage).slice(0, 10)) {
    console.log(`  ${String(count).padStart(3)}×  ${msg}`);
  }
  console.log("");

  // --- Sample per engine ---
  console.log("Sample errors per engine (first 3 each)");
  console.log("---------------------------------------");
  const engines = [...new Set(errors.map((e) => e.engine))];
  for (const engine of engines) {
    const samples = errors.filter((e) => e.engine === engine).slice(0, 3);
    console.log(`\n  ${engine}:`);
    for (const s of samples) {
      const msg = (s.error_message ?? "(no message)").slice(0, 200);
      console.log(
        `    ${s.query_id} rep ${s.rep_index}  [${s.status}]  ${msg}`
      );
    }
  }
  console.log("");

  // --- Recommendations ---
  console.log("Likely causes by pattern");
  console.log("------------------------");
  const recs = recommend(byStatus, byMessage, enginesByCount);
  for (const rec of recs) console.log(`  - ${rec}`);
  console.log("");
}

function countBy<T>(arr: T[], keyFn: (item: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const item of arr) {
    const k = keyFn(item);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function sortMapDesc(m: Map<string, number>): Array<[string, number]> {
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function recommend(
  byStatus: Map<string, number>,
  byMessage: Map<string, number>,
  enginesByCount: Array<[string, number]>
): string[] {
  const out: string[] = [];

  if ((byStatus.get("rate_limited") ?? 0) > 0) {
    out.push(
      `${byStatus.get("rate_limited")} rate-limit errors — consider lowering concurrency in lib/avi/query.ts (currently DEFAULT_CONCURRENCY=10) or staggering retries.`
    );
  }
  if ((byStatus.get("timeout") ?? 0) > 0) {
    out.push(
      `${byStatus.get("timeout")} timeouts — raise PROVIDER_TIMEOUT_MS in lib/avi/llm-providers/types.ts (currently 45000) or accept slower providers.`
    );
  }
  for (const [msg, count] of byMessage.entries()) {
    if (/rate.?limit/i.test(msg)) {
      out.push(`"${msg.slice(0, 60)}..." × ${count} — this is a provider rate-limit; back off concurrency for that provider.`);
    } else if (/authentication|unauthorized|api.?key/i.test(msg)) {
      out.push(`"${msg.slice(0, 60)}..." × ${count} — likely API key issue. Check .env.local and Vercel env vars for the relevant provider.`);
    } else if (/timeout|timed.?out/i.test(msg)) {
      out.push(`"${msg.slice(0, 60)}..." × ${count} — provider was slow. Retry or raise the timeout.`);
    }
  }
  if (enginesByCount.length > 0) {
    const [worst, worstCount] = enginesByCount[0];
    if (worstCount >= 5) {
      out.push(
        `${worst} accounts for the most failures (${worstCount}). Check the provider's status page or temporarily exclude it from DEFAULT_ENGINES.`
      );
    }
  }
  if (out.length === 0) {
    out.push("No specific pattern detected — open the raw error_message values above and investigate individually.");
  }
  return out;
}

main().catch((e) => {
  console.error("[audit-errors] fatal:", e);
  process.exit(1);
});
