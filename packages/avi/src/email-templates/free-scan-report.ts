/**
 * Free Daizie Readiness Check email template.
 *
 * Renders the readiness check as an HTML email in the Daizie palette:
 *   - Pure white surface
 *   - Deep forest (#173e2c) headings + text
 *   - Restrained forest+charcoal accents, no cream/tan tint anywhere
 *   - "Daizie" wordmark as SVG-safe text (Lora serif fallback)
 *   - Tier chip uses subdued semantic colors (no yellow, no gold)
 *
 * Inline styles only — most email clients strip <style> blocks. Hex
 * colors are the Daizie brand palette (matching apps/site/app/globals.css).
 */

import type { Tier } from "../free-scan";

type Dimension = { id: string; name: string; score: number | null };
type Finding = {
  dimensionId: string;
  dimensionName: string;
  score: number | null;
  summary: string;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.martykoepke.com";

// Semantic tier chips — muted, non-yellow, high contrast on white.
const TIER_COPY: Record<
  Tier,
  { label: string; sentence: string; chipBg: string; chipFg: string }
> = {
  invisible: {
    label: "Invisible",
    sentence:
      "AI tools don't currently surface your business when buyers ask. Strong signals are missing, but the fixes are mostly cheap.",
    chipBg: "#F8DBDB",
    chipFg: "#7C1E1E",
  },
  hidden: {
    label: "Hidden",
    sentence:
      "AI tools can find you if pressed but won't recommend you on their own yet. A handful of structured fixes change that.",
    chipBg: "#F1DFC5",
    chipFg: "#7A4B18",
  },
  "faintly-visible": {
    label: "Faintly Visible",
    sentence:
      "AI tools mention you sometimes, but inconsistently. You're in the conversation — not yet at the top of it.",
    chipBg: "#DDE7E1",
    chipFg: "#274734",
  },
  discoverable: {
    label: "Discoverable",
    sentence:
      "AI tools recognize you as a credible answer. Closing the remaining gaps moves you to a default recommendation.",
    chipBg: "#D6EBDD",
    chipFg: "#14523B",
  },
  "agent-ready": {
    label: "Agent-Ready",
    sentence:
      "AI tools surface you confidently across the queries that matter. You're set up to compound visibility, not chase it.",
    chipBg: "#173e2c",
    chipFg: "#FFFFFF",
  },
};

export type FreeScanEmailInput = {
  tier: Tier;
  readinessScore: number;
  subjectName: string;
  subjectDomain: string;
  dimensions: Dimension[];
  findings: Finding[];
  /** /scan/report/<id>?t=<token> — the customer's hosted view of this report. */
  reportUrl: string;
};

// Palette shortcuts — kept as constants so the template stays readable.
const FOREST = "#173e2c";
const FOREST_DARK = "#102b20";
const CHARCOAL = "#292821";
const MUTED = "#5A6B5A";
const RULE = "#E1E4DE";
const WHITE = "#FFFFFF";

export function renderFreeScanEmail(input: FreeScanEmailInput): string {
  const t = TIER_COPY[input.tier];
  const pct = Math.round(input.readinessScore * 100);

  const dimensionRows = input.dimensions
    .map((d) => dimensionRow(d))
    .join("");
  const findingBlocks = input.findings
    .map((f) => findingBlock(f))
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Your Daizie Readiness report — ${escapeHtml(input.subjectDomain)}</title>
</head>
<body style="margin:0;padding:0;background:${WHITE};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${CHARCOAL};line-height:1.6;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${WHITE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:${WHITE};">

          <!-- Daizie brand lockup -->
          <tr>
            <td style="padding:0 0 24px 0;border-bottom:1px solid ${RULE};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:14px;vertical-align:middle;">
                    <img src="${SITE_URL}/images/brand-2026/daizie-favicon.png"
                         width="48" height="48" alt=""
                         style="display:block;width:48px;height:48px;border-radius:12px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;color:${FOREST};font-size:26px;line-height:1;">
                      Daizie
                    </p>
                    <p style="margin:4px 0 0 0;color:${MUTED};font-size:12px;letter-spacing:0.02em;">
                      AI visibility, made clear
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Eyebrow + title -->
          <tr>
            <td style="padding:24px 0 4px 0;">
              <p style="margin:0;color:${FOREST};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;">
                Free Daizie Readiness Check
              </p>
              <h1 style="margin:10px 0 0 0;font-family:Georgia,'Times New Roman',serif;color:${FOREST};font-size:28px;line-height:1.2;font-weight:500;">
                Your report for ${escapeHtml(input.subjectName)}
              </h1>
              <p style="margin:8px 0 0 0;color:${MUTED};font-size:14px;">
                ${escapeHtml(input.subjectDomain)}
              </p>
            </td>
          </tr>

          <!-- Tier card -->
          <tr>
            <td style="padding:24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${WHITE};border:1px solid ${RULE};border-radius:12px;">
                <tr>
                  <td style="padding:24px;">
                    <span style="display:inline-block;background:${t.chipBg};color:${t.chipFg};font-family:Georgia,serif;font-size:20px;font-weight:600;padding:6px 14px;border-radius:999px;">
                      ${t.label}
                    </span>
                    <span style="display:inline-block;margin-left:14px;font-family:Georgia,serif;font-size:24px;color:${FOREST};">
                      ${pct}/100
                    </span>
                    <p style="margin:18px 0 0 0;color:${CHARCOAL};font-size:15px;">
                      ${escapeHtml(t.sentence)}
                    </p>
                    <p style="margin:22px 0 0 0;">
                      <a href="${escapeHtml(input.reportUrl)}"
                         style="display:inline-block;background:${FOREST};color:${WHITE};padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
                        View &amp; save your full report →
                      </a>
                    </p>
                    <p style="margin:10px 0 0 0;color:${MUTED};font-size:12px;">
                      This private report link is available for 30 days. Open the link, then File → Print → Save as PDF.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Readiness drivers -->
          <tr>
            <td style="padding:16px 0 0 0;">
              <h2 style="margin:0 0 14px 0;font-family:Georgia,serif;color:${FOREST};font-size:18px;font-weight:500;">
                The five readiness drivers
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${dimensionRows}
              </table>
            </td>
          </tr>

          <!-- Findings -->
          ${
            input.findings.length > 0
              ? `<tr>
            <td style="padding:24px 0 0 0;">
              <h2 style="margin:0 0 12px 0;font-family:Georgia,serif;color:${FOREST};font-size:18px;font-weight:500;">
                What stood out
              </h2>
              ${findingBlocks}
            </td>
          </tr>`
              : ""
          }

          <!-- Upsell -->
          <tr>
            <td style="padding:32px 0 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${FOREST};border-radius:12px;">
                <tr>
                  <td style="padding:26px;color:${WHITE};">
                    <p style="margin:0;color:${WHITE};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;opacity:0.85;">
                      The next step
                    </p>
                    <h2 style="margin:8px 0 0 0;font-family:Georgia,serif;color:${WHITE};font-size:22px;font-weight:500;line-height:1.25;">
                      Want to know what AI is actually saying about you?
                    </h2>
                    <p style="margin:14px 0 0 0;color:${WHITE};font-size:15px;line-height:1.6;opacity:0.92;">
                      This report scored what's on your site. The paid
                      <strong>Daizie AI Visibility Assessment</strong>
                      ($895) tests ChatGPT, Claude, Perplexity, and Gemini,
                      captures 32 live AI responses, verifies factual claims
                      against your real sources, and plots you against two
                      competitors you name. Includes a 30-minute review call.
                    </p>
                    <p style="margin:22px 0 0 0;">
                      <a href="${SITE_URL}/ai-visibility"
                         style="display:inline-block;background:${WHITE};color:${FOREST};padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;font-size:15px;">
                        See the Assessment →
                      </a>
                    </p>
                    <p style="margin:16px 0 0 0;font-size:13px;color:${WHITE};opacity:0.85;">
                      Or
                      <a href="https://tally.so/r/xXVPgo" style="color:${WHITE};text-decoration:underline;">
                        book a free 20-minute conversation
                      </a>
                      and we'll walk through this report together.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0 0;">
              <p style="margin:24px 0 0 0;color:${MUTED};font-size:13px;">
                — Marty Koepke<br />
                <a href="${SITE_URL}" style="color:${FOREST};text-decoration:none;">martykoepke.com</a>
              </p>
              <p style="margin:16px 0 0 0;color:${MUTED};font-size:11px;">
                You're getting this because you scanned ${escapeHtml(input.subjectDomain)} on martykoepke.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// Pieces
// ============================================================================

function dimensionRow(dim: Dimension): string {
  const score = typeof dim.score === "number" ? dim.score : 0;
  const pct = Math.round((score / 5) * 100);
  return `<tr>
    <td style="padding:6px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:0 0 6px 0;font-size:13px;color:${FOREST};">
            <strong style="font-family:Georgia,serif;font-weight:500;">${escapeHtml(dim.name)}</strong>
            <span style="float:right;color:${MUTED};">${typeof dim.score === "number" ? dim.score.toFixed(1) : "—"} / 5</span>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${RULE};border-radius:999px;">
              <tr>
                <td style="padding:0;height:8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${pct}%" style="background:${FOREST};border-radius:999px;">
                    <tr><td style="height:8px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function findingBlock(f: Finding): string {
  const score = typeof f.score === "number" ? f.score.toFixed(1) : "—";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${WHITE};border:1px solid ${RULE};border-radius:10px;margin-bottom:12px;">
    <tr>
      <td style="padding:16px 18px;">
        <p style="margin:0;font-family:Georgia,serif;font-weight:500;color:${FOREST};font-size:15px;">
          ${escapeHtml(f.dimensionName)}
          <span style="margin-left:6px;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;font-size:12px;font-weight:400;">${score} / 5</span>
        </p>
        <p style="margin:10px 0 0 0;color:${CHARCOAL};font-size:14px;line-height:1.6;">
          ${escapeHtml(f.summary)}
        </p>
      </td>
    </tr>
  </table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
