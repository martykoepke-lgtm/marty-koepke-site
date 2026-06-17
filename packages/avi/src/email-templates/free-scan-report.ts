/**
 * Free scan report email template.
 *
 * Renders the readiness check as an HTML email — tier headline, 7-dim
 * scorecard, 2–3 findings, upsell to the $697 paid Index Report, book-a-
 * call link, footer.
 *
 * Inline styles only — most email clients strip <style> blocks. Hex
 * colors are the brand palette from app/globals.css.
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
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.practicalinformatics.com";

const TIER_COPY: Record<
  Tier,
  { label: string; sentence: string; bg: string; fg: string }
> = {
  invisible: {
    label: "Invisible",
    sentence:
      "AI tools don't currently surface your business when buyers ask. Strong signals are missing, but the fixes are mostly cheap.",
    bg: "#FEE2E2",
    fg: "#7F1D1D",
  },
  hidden: {
    label: "Hidden",
    sentence:
      "AI tools can find you if pressed but won't recommend you on their own yet. A handful of structured fixes change that.",
    bg: "#FED7AA",
    fg: "#7C2D12",
  },
  "faintly-visible": {
    label: "Faintly Visible",
    sentence:
      "AI tools mention you sometimes, but inconsistently. You're in the conversation — not yet at the top of it.",
    bg: "#FEF08A",
    fg: "#713F12",
  },
  discoverable: {
    label: "Discoverable",
    sentence:
      "AI tools recognize you as a credible answer. Closing the remaining gaps moves you to a default recommendation.",
    bg: "#A7F3D0",
    fg: "#064E3B",
  },
  "agent-ready": {
    label: "Agent-Ready",
    sentence:
      "AI tools surface you confidently across the queries that matter. You're set up to compound visibility, not chase it.",
    bg: "#1F3A2E",
    fg: "#FAF6EE",
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
<title>Your AI Readiness report — ${escapeHtml(input.subjectDomain)}</title>
</head>
<body style="margin:0;padding:0;background:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2C2A26;line-height:1.6;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAF6EE;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#FAF6EE;">

          <!-- Eyebrow + title -->
          <tr>
            <td style="padding:0 0 8px 0;">
              <p style="margin:0;color:#A8893F;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">
                Free AI Readiness Check
              </p>
              <h1 style="margin:8px 0 0 0;font-family:Georgia,'Times New Roman',serif;color:#1F3A2E;font-size:28px;line-height:1.2;">
                Your report for ${escapeHtml(input.subjectName)}
              </h1>
            </td>
          </tr>

          <!-- Tier card -->
          <tr>
            <td style="padding:24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F2EBDC;border:1px solid #D8CCB4;border-radius:8px;">
                <tr>
                  <td style="padding:24px;">
                    <span style="display:inline-block;background:${t.bg};color:${t.fg};font-family:Georgia,serif;font-size:20px;font-weight:600;padding:6px 12px;border-radius:6px;">
                      ${t.label}
                    </span>
                    <span style="display:inline-block;margin-left:12px;font-family:Georgia,serif;font-size:24px;color:#1F3A2E;">
                      ${pct}/100
                    </span>
                    <p style="margin:16px 0 0 0;color:#2C2A26;font-size:15px;">
                      ${escapeHtml(t.sentence)}
                    </p>
                    <p style="margin:20px 0 0 0;">
                      <a href="${escapeHtml(input.reportUrl)}"
                         style="display:inline-block;background:#1F3A2E;color:#FAF6EE;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
                        View &amp; save your full report →
                      </a>
                    </p>
                    <p style="margin:8px 0 0 0;color:#5A6B5A;font-size:12px;">
                      Open the link, then File → Print → Save as PDF.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Seven dimensions -->
          <tr>
            <td style="padding:16px 0 0 0;">
              <h2 style="margin:0 0 12px 0;font-family:Georgia,serif;color:#1F3A2E;font-size:18px;">
                The seven dimensions
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
              <h2 style="margin:0 0 12px 0;font-family:Georgia,serif;color:#1F3A2E;font-size:18px;">
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
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#1F3A2E;border-radius:8px;">
                <tr>
                  <td style="padding:24px;color:#FAF6EE;">
                    <h2 style="margin:0;font-family:Georgia,serif;color:#FAF6EE;font-size:20px;">
                      Want to know if AI is actually finding you?
                    </h2>
                    <p style="margin:12px 0 0 0;color:#FAF6EE;font-size:15px;line-height:1.6;">
                      This report scored what's on your site. The paid
                      <strong style="color:#C9A961;">AI Visibility Index Report</strong>
                      ($697) measures what ChatGPT, Claude, Gemini, and Perplexity
                      actually say when buyers ask about your category — with a
                      45-minute walkthrough call. Fee credits 100% toward a Sprint
                      within 30 days.
                    </p>
                    <p style="margin:20px 0 0 0;">
                      <a href="https://www.practicalinformatics.com/ai-visibility"
                         style="display:inline-block;background:#C9A961;color:#1F3A2E;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">
                        See the AI Visibility Index →
                      </a>
                    </p>
                    <p style="margin:16px 0 0 0;font-size:13px;color:#FAF6EE;">
                      Or
                      <a href="https://tally.so/r/xXVPgo" style="color:#C9A961;text-decoration:underline;">
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
            <td style="padding:32px 0 0 0;border-top:1px solid #D8CCB4;margin-top:32px;">
              <p style="margin:24px 0 0 0;color:#5A6B5A;font-size:13px;">
                — Marty Koepke, Practical Informatics LLC<br />
                <a href="https://www.practicalinformatics.com" style="color:#5A6B5A;">www.practicalinformatics.com</a>
              </p>
              <p style="margin:16px 0 0 0;color:#5A6B5A;font-size:11px;">
                You're getting this because you scanned ${escapeHtml(input.subjectDomain)} on practicalinformatics.com.
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
          <td style="padding:0 0 4px 0;font-size:13px;color:#1F3A2E;">
            <strong><span style="color:#A8893F;">${escapeHtml(dim.id)}</span> — ${escapeHtml(dim.name)}</strong>
            <span style="float:right;color:#5A6B5A;">${typeof dim.score === "number" ? dim.score.toFixed(1) : "—"} / 5</span>
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#D8CCB4;border-radius:3px;">
              <tr>
                <td style="padding:0;height:8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${pct}%" style="background:#1F3A2E;border-radius:3px;">
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
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F2EBDC;border:1px solid #D8CCB4;border-radius:6px;margin-bottom:12px;">
    <tr>
      <td style="padding:16px;">
        <p style="margin:0;font-family:Georgia,serif;font-weight:600;color:#1F3A2E;font-size:14px;">
          ${escapeHtml(f.dimensionName)}
          <span style="margin-left:6px;color:#A8893F;font-weight:400;">(${score} / 5)</span>
        </p>
        <p style="margin:8px 0 0 0;color:#2C2A26;font-size:14px;line-height:1.6;">
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
