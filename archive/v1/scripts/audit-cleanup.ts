/**
 * Audit data cleanup — drops heavy detail older than a threshold while
 * keeping the lightweight scoring history forever.
 *
 * Usage:
 *   npm run audit:cleanup                              # dry-run, defaults to 60d
 *   npm run audit:cleanup -- --older-than=90d          # dry-run, custom threshold
 *   npm run audit:cleanup -- --older-than=60d --apply  # actually delete
 *
 * What gets DELETED (when --apply):
 *   - audit_query_responses for audits older than threshold (heavy text)
 *   - api_calls older than threshold (per-call log)
 *
 * What is KEPT regardless:
 *   - submissions (one row per customer, ~1 KB each)
 *   - audits (composite, tier, scores, breakdown, recommendations, ~5 KB)
 *   - audit_dimension_scores (7 rows per audit, prose justifications)
 *
 * Recoverable: if you delete query responses for an audit, you can always
 * re-run `npm run audit` against the same subject to regenerate them.
 * The historical scores in audits stay queryable indefinitely so re-audits
 * can compare "did the score move?" without the bulky text overhead.
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { supabaseAdmin } from "@/lib/supabase";

type Args = {
  olderThanDays: number;
  apply: boolean;
};

function parseArgs(): Args {
  let olderThanDays = 60;
  let apply = false;

  for (const arg of process.argv.slice(2)) {
    if (arg === "--apply") {
      apply = true;
    } else if (arg.startsWith("--older-than=")) {
      const raw = arg.slice("--older-than=".length);
      const match = raw.match(/^(\d+)d$/);
      if (!match) {
        console.error(
          `Invalid --older-than value '${raw}'. Use the form '60d' (days).`
        );
        process.exit(1);
      }
      olderThanDays = parseInt(match[1], 10);
    }
  }
  return { olderThanDays, apply };
}

async function main(): Promise<void> {
  const { olderThanDays, apply } = parseArgs();
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString();

  console.log("");
  console.log(`Cutoff: ${cutoffIso}`);
  console.log(`Threshold: ${olderThanDays} days`);
  console.log(`Mode: ${apply ? "APPLY (will delete)" : "DRY RUN (no changes)"}`);
  console.log("");

  const supabase = supabaseAdmin();

  // 1. Identify candidate audits (created before cutoff).
  const { data: oldAudits, error: auditErr } = await supabase
    .from("audits")
    .select("id, submission_id, created_at, tier, composite_score")
    .lt("created_at", cutoffIso);

  if (auditErr) {
    console.error("Failed to query audits:", auditErr.message);
    process.exit(1);
  }
  const oldAuditIds = (oldAudits ?? []).map((a) => a.id);

  console.log(`Audits older than cutoff: ${oldAuditIds.length}`);
  if (oldAuditIds.length === 0) {
    console.log("Nothing to clean up.\n");
    return;
  }

  // 2. Count audit_query_responses to drop
  const { count: queryRowsCount, error: qrCountErr } = await supabase
    .from("audit_query_responses")
    .select("*", { count: "exact", head: true })
    .in("audit_id", oldAuditIds);
  if (qrCountErr) {
    console.error("Failed to count audit_query_responses:", qrCountErr.message);
    process.exit(1);
  }

  // 3. Count old api_calls
  const { count: apiCallsCount, error: acCountErr } = await supabase
    .from("api_calls")
    .select("*", { count: "exact", head: true })
    .lt("created_at", cutoffIso);
  if (acCountErr) {
    console.error("Failed to count api_calls:", acCountErr.message);
    process.exit(1);
  }

  // 4. Quick sample of which audits would be affected, for human review.
  const sample = (oldAudits ?? []).slice(0, 5);
  console.log("");
  console.log("Affected audit sample (up to 5):");
  for (const a of sample) {
    console.log(
      `  ${a.id.slice(0, 8)}…  created ${a.created_at}  tier=${a.tier ?? "—"}  composite=${a.composite_score?.toFixed(3) ?? "—"}`
    );
  }
  if (oldAuditIds.length > sample.length) {
    console.log(`  … and ${oldAuditIds.length - sample.length} more`);
  }

  console.log("");
  console.log("Will delete:");
  console.log(
    `  ${queryRowsCount ?? 0} audit_query_responses rows (~80 per audit)`
  );
  console.log(`  ${apiCallsCount ?? 0} api_calls rows`);
  console.log("");
  console.log("Will KEEP:");
  console.log(
    `  ${oldAuditIds.length} audits rows (scores + tier + recommendations)`
  );
  console.log(
    `  ~${oldAuditIds.length * 7} audit_dimension_scores rows (justifications)`
  );
  console.log(`  All submissions rows (customer records)`);
  console.log("");

  if (!apply) {
    console.log("Re-run with --apply to actually delete.\n");
    return;
  }

  // ---- APPLY ----
  console.log("Applying…");

  const { error: delQR } = await supabase
    .from("audit_query_responses")
    .delete()
    .in("audit_id", oldAuditIds);
  if (delQR) {
    console.error("audit_query_responses delete failed:", delQR.message);
    process.exit(1);
  }
  console.log(`  ✓ audit_query_responses cleared`);

  const { error: delAC } = await supabase
    .from("api_calls")
    .delete()
    .lt("created_at", cutoffIso);
  if (delAC) {
    console.error("api_calls delete failed:", delAC.message);
    process.exit(1);
  }
  console.log(`  ✓ api_calls cleared`);

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error("[cleanup] fatal:", e);
  process.exit(1);
});
