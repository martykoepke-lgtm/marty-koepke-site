/**
 * Free-scan report PDF generator.
 *
 * Usage:
 *   1. In one terminal: npm run dev
 *   2. In another:      npm run scan:pdf -- <submission_id>
 *
 * Resolves the submission's access_token from Supabase, navigates to
 * http://localhost:3000/scan/report/<submission_id>?t=<token>, waits
 * for the page to settle, and saves reports/scan-<submission_id>.pdf.
 *
 * Companion to scripts/audit-pdf.ts — same Puppeteer machinery, but
 * targets the public free-scan report instead of the admin paid-audit
 * report.
 */

import { resolve, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import puppeteer from "puppeteer";
import { supabaseAdmin } from "@/lib/supabase";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEV_PORT = process.env.PORT ?? "3000";

type SubmissionLookup = {
  id: string;
  access_token: string | null;
  company_name: string | null;
};

async function main(): Promise<void> {
  const submissionId = process.argv[2];
  if (!submissionId) {
    console.error("Usage: npm run scan:pdf -- <submission_id>");
    process.exit(1);
  }

  const supabase = supabaseAdmin();
  const { data: row, error } = await supabase
    .from("submissions")
    .select("id, access_token, company_name")
    .eq("id", submissionId)
    .single<SubmissionLookup>();

  if (error || !row) {
    console.error(
      `[scan-pdf] could not find submission ${submissionId}: ${error?.message ?? "(no data)"}`
    );
    process.exit(1);
  }
  if (!row.access_token) {
    console.error(`[scan-pdf] submission ${submissionId} has no access_token.`);
    process.exit(1);
  }

  const url = `http://localhost:${DEV_PORT}/scan/report/${row.id}?t=${encodeURIComponent(row.access_token)}`;
  console.log(`[scan-pdf] target URL: ${url}`);

  // Make sure the dev server is reachable before launching the browser.
  try {
    const probe = await fetch(`http://localhost:${DEV_PORT}/`, {
      method: "HEAD",
    });
    if (!probe.ok && probe.status !== 405) {
      throw new Error(`HEAD / responded ${probe.status}`);
    }
  } catch (e) {
    console.error(
      `[scan-pdf] Cannot reach http://localhost:${DEV_PORT}/. Is \`npm run dev\` running?`
    );
    console.error(`[scan-pdf] underlying error: ${(e as Error).message}`);
    process.exit(1);
  }

  const reportsDir = resolve(PROJECT_ROOT, "reports");
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const outPath = resolve(reportsDir, `scan-${row.id}.pdf`);

  console.log("[scan-pdf] launching headless Chromium…");
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1400 });
    console.log("[scan-pdf] navigating…");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });

    // Sanity check: the 404 page would render with a different h1.
    const h1 = await page
      .$eval("h1", (el) => el.textContent?.trim() ?? "")
      .catch(() => "");
    if (/Not Found|404/i.test(h1)) {
      throw new Error(
        "Report page returned 404 — submission_id / token mismatch."
      );
    }

    console.log("[scan-pdf] rendering PDF…");
    await page.pdf({
      path: outPath,
      format: "Letter",
      printBackground: true,
      margin: {
        top: "0.6in",
        bottom: "0.6in",
        left: "0.5in",
        right: "0.5in",
      },
    });
  } finally {
    await browser.close();
  }

  console.log(
    `\n[scan-pdf] Written: ${outPath}\n[scan-pdf] Subject: ${row.company_name ?? "(no name)"}\n`
  );
}

main().catch((e) => {
  console.error("[scan-pdf] fatal:", e);
  process.exit(1);
});
