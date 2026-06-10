/**
 * PDF generator for an AVI audit report.
 *
 * Usage:
 *   1. In one terminal: npm run dev
 *   2. In another:      npm run audit:pdf -- <audit_id>
 *
 * Launches headless Chromium, navigates to
 * http://localhost:3000/admin/audits/<id>?secret=<CRON_SECRET>, waits for
 * the page to settle, and saves reports/<audit_id>.pdf.
 *
 * The same HTML/CSS lives at the admin URL, so the PDF is a literal
 * snapshot of the styled web view. One source of truth, two outputs.
 */

import { resolve, dirname } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import puppeteer from "puppeteer";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEV_PORT = process.env.PORT ?? "3000";

async function main(): Promise<void> {
  const auditId = process.argv[2];
  if (!auditId) {
    console.error("Usage: npm run audit:pdf -- <audit_id>");
    process.exit(1);
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "CRON_SECRET is not set in .env.local — the admin route can't authorize."
    );
    process.exit(1);
  }

  const url = `http://localhost:${DEV_PORT}/admin/audits/${auditId}?secret=${encodeURIComponent(cronSecret)}`;
  console.log(`[pdf] target URL: ${url}`);

  // Sanity check that the dev server is reachable before launching the browser.
  try {
    const probe = await fetch(`http://localhost:${DEV_PORT}/`, {
      method: "HEAD",
    });
    if (!probe.ok && probe.status !== 405) {
      throw new Error(`HEAD / responded ${probe.status}`);
    }
  } catch (e) {
    console.error(
      `[pdf] Cannot reach http://localhost:${DEV_PORT}/. Is \`npm run dev\` running?`
    );
    console.error(`[pdf] underlying error: ${(e as Error).message}`);
    process.exit(1);
  }

  // Make sure reports/ exists.
  const reportsDir = resolve(PROJECT_ROOT, "reports");
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
  const outPath = resolve(reportsDir, `${auditId}.pdf`);

  console.log("[pdf] launching headless Chromium…");
  const browser = await puppeteer.launch({
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 1400 });
    console.log("[pdf] navigating…");
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });

    // Make sure the unauthorized page didn't render.
    const title = await page.$eval("h1", (el) =>
      el.textContent?.trim() ?? ""
    );
    if (/^Unauthorized$/i.test(title)) {
      throw new Error(
        "Admin page returned Unauthorized — CRON_SECRET mismatch between .env.local and the running dev server."
      );
    }

    console.log("[pdf] rendering PDF…");
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

  console.log(`\n[pdf] Written: ${outPath}\n`);
}

main().catch((e) => {
  console.error("[pdf] fatal:", e);
  process.exit(1);
});
