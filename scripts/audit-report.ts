/**
 * Audit report renderer (Markdown).
 *
 * Usage:
 *   npm run audit:report -- <audit_id>
 *
 * Reads reports/<audit_id>.json (produced by `npm run audit`) and writes
 * reports/<audit_id>.md — a human-readable rendering of the same data.
 *
 * Designed for Marty's evaluation phase: open in any markdown viewer
 * (VSCode preview, GitHub, Obsidian) to read scores + justifications
 * inline instead of scrolling JSON.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ============================================================================
// Types matching the report JSON shape
// ============================================================================

type DimScore = {
  dimension_id: string;
  dimension_name: string;
  score: number | null;
  justification: string | null;
  evidence_pointers: Array<{ type: string; value: string; found: boolean }>;
};

type QueryResponse = {
  query_id: string;
  query_category: string;
  query_text: string;
  engine: string;
  rep_index: number;
  response_text: string | null;
  mentioned: boolean | null;
  cited_with_link: boolean | null;
  position_band: string | null;
  competitors_mentioned: string[] | null;
  evidence_text: string | null;
  status: string;
};

type ReportPayload = {
  audit_id: string;
  rubric_version: string;
  subject: {
    name: string;
    url?: string | null;
    industry: string;
    location?: string | null;
    subject_type: string;
    competitor_urls?: string[];
    target_query?: string | null;
  };
  scores: {
    composite: number | null;
    readiness: number | null;
    visibility: number | null;
    tier: string | null;
  };
  visibility_breakdown: {
    presence: number;
    citation: number;
    shareOfVoice: number;
    prominence: number;
  };
  dimension_scores: DimScore[];
  query_responses: QueryResponse[];
  crawler: Record<string, unknown> | null;
  corroboration: {
    wikidataPresent: boolean;
    wikidataUrl?: string;
    linkedinPresent: boolean;
    linkedinUrl?: string;
    mentions: Array<{
      url: string;
      title: string;
      domain: string;
      snippet: string;
    }>;
    totalCorroboratingDomains: number;
  } | null;
  total_spend_usd: number;
};

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const auditId = process.argv[2];
  if (!auditId) {
    console.error("Usage: npm run audit:report -- <audit_id>");
    process.exit(1);
  }

  const jsonPath = resolve(PROJECT_ROOT, "reports", `${auditId}.json`);
  if (!existsSync(jsonPath)) {
    console.error(`Report not found: ${jsonPath}`);
    console.error(`Did you run \`npm run audit -- subjects/<file>.json\` first?`);
    process.exit(1);
  }

  const payload = JSON.parse(readFileSync(jsonPath, "utf8")) as ReportPayload;
  const markdown = renderMarkdown(payload);

  const mdPath = resolve(PROJECT_ROOT, "reports", `${auditId}.md`);
  writeFileSync(mdPath, markdown, "utf8");
  console.log(`\nWritten: ${mdPath}\n`);
}

// ============================================================================
// Renderers
// ============================================================================

function renderMarkdown(p: ReportPayload): string {
  return [
    renderHeader(p),
    renderHeadline(p),
    renderVisibilityBreakdown(p),
    renderDimensions(p),
    renderPerQuery(p),
    renderCrawlerSignals(p),
    renderCorroboration(p),
    renderFailures(p),
    renderFooter(p),
  ].join("\n\n---\n\n");
}

function renderHeader(p: ReportPayload): string {
  const { subject } = p;
  return [
    `# AVI Audit — ${subject.name}`,
    ``,
    `| | |`,
    `|---|---|`,
    `| **Audit ID** | \`${p.audit_id}\` |`,
    `| **Rubric** | ${p.rubric_version} |`,
    `| **Subject type** | ${subject.subject_type} |`,
    `| **URL** | ${subject.url ?? "_(none)_"} |`,
    `| **Industry** | ${subject.industry} |`,
    `| **Location** | ${subject.location ?? "_(not specified)_"} |`,
    `| **Total LLM spend** | $${p.total_spend_usd.toFixed(3)} |`,
  ].join("\n");
}

function renderHeadline(p: ReportPayload): string {
  const { scores } = p;
  return [
    `## Headline`,
    ``,
    `| | |`,
    `|---|---|`,
    `| **Composite** | **${fmt(scores.composite)}** |`,
    `| **Tier** | **${scores.tier ?? "_(no tier)_"}** |`,
    `| Readiness _(X drivers)_ | ${fmt(scores.readiness)} |`,
    `| Visibility _(Y outcome)_ | ${fmt(scores.visibility)} |`,
    ``,
    `Composite is \`0.40 × Readiness + 0.60 × Visibility\`. Tier bands: ` +
      `Invisible 0–0.19, Hidden 0.20–0.39, Faintly Visible 0.40–0.59, ` +
      `Discoverable 0.60–0.79, Agent-Ready 0.80–1.00.`,
  ].join("\n");
}

function renderVisibilityBreakdown(p: ReportPayload): string {
  const v = p.visibility_breakdown;
  return [
    `## Visibility breakdown (the Y outcome)`,
    ``,
    `What AI search actually says when asked. Measured from the 80-cell query grid.`,
    ``,
    `| Sub-metric | Score | Reading |`,
    `|---|---|---|`,
    `| Presence | ${v.presence.toFixed(2)} | named in ${(v.presence * 100).toFixed(0)}% of responses |`,
    `| Citation | ${v.citation.toFixed(2)} | cited with link in ${(v.citation * 100).toFixed(0)}% |`,
    `| Share-of-Voice | ${v.shareOfVoice.toFixed(2)} | named vs. competitors when both appear |`,
    `| Prominence | ${v.prominence.toFixed(2)} | average position when named (1.0 = top, 0 = absent) |`,
    ``,
    `Weighted composite: \`0.20 × Presence + 0.30 × Citation + 0.30 × SoV + 0.20 × Prominence\``,
  ].join("\n");
}

function renderDimensions(p: ReportPayload): string {
  const lines: string[] = [`## Readiness — dimension scores (the X drivers)`, ``];

  // Sort D1..D7
  const sorted = [...p.dimension_scores].sort((a, b) =>
    a.dimension_id.localeCompare(b.dimension_id)
  );

  for (const dim of sorted) {
    lines.push(
      `### ${dim.dimension_id} — ${dim.dimension_name}: **${
        dim.score == null ? "—" : dim.score.toFixed(1)
      } / 5**`
    );
    lines.push(``);
    if (dim.justification) {
      lines.push(`> ${dim.justification.replace(/\n/g, "\n> ")}`);
    } else {
      lines.push(`> _(no justification)_`);
    }
    if (dim.evidence_pointers?.length) {
      lines.push(``);
      lines.push(`**Evidence pointers:**`);
      for (const ev of dim.evidence_pointers) {
        const checkmark = ev.found ? "✓" : "✗";
        lines.push(`- ${checkmark} \`${ev.type}\`: \`${ev.value}\``);
      }
    }
    lines.push(``);
  }

  return lines.join("\n").trimEnd();
}

function renderPerQuery(p: ReportPayload): string {
  // Group responses by query template, then by category.
  const lines: string[] = [
    `## Per-query summary`,
    ``,
    `Grouped by template. Each shows the mention rate (how often the subject was named) across the cells we ran.`,
    ``,
  ];

  // Build groups
  const byTemplate = new Map<string, QueryResponse[]>();
  for (const r of p.query_responses) {
    const arr = byTemplate.get(r.query_id) ?? [];
    arr.push(r);
    byTemplate.set(r.query_id, arr);
  }

  const categoryOrder = [
    "category-search",
    "name-search",
    "competitive",
    "buyer-scenario",
  ];

  // Sort templates by category, then template id
  const orderedTemplates = [...byTemplate.entries()].sort(([, a], [, b]) => {
    const aCat = a[0]?.query_category ?? "";
    const bCat = b[0]?.query_category ?? "";
    return (
      categoryOrder.indexOf(aCat) - categoryOrder.indexOf(bCat) ||
      a[0].query_id.localeCompare(b[0].query_id)
    );
  });

  let lastCategory: string | null = null;

  for (const [queryId, cells] of orderedTemplates) {
    const cat = cells[0]?.query_category ?? "uncategorized";
    if (cat !== lastCategory) {
      lines.push(`### ${prettyCategory(cat)}`);
      lines.push(``);
      lastCategory = cat;
    }

    const successCells = cells.filter((c) => c.status === "success" && c.mentioned !== null);
    const mentioned = successCells.filter((c) => c.mentioned === true).length;
    const cited = successCells.filter((c) => c.cited_with_link === true).length;
    const totalSuccess = successCells.length;
    const errored = cells.filter((c) => c.status !== "success").length;

    const sample = cells[0]?.query_text ?? "_(no rendered text)_";

    // Per-engine breakdown
    const engineBreakdown = summarizeByEngine(cells);

    // Mention rate
    const mentionPct =
      totalSuccess === 0 ? "—" : `${((mentioned / totalSuccess) * 100).toFixed(0)}%`;

    lines.push(`#### \`${queryId}\` — mention rate ${mentionPct} (${mentioned}/${totalSuccess})`);
    lines.push(``);
    lines.push(`**Rendered as:** _${sample}_`);
    lines.push(``);
    lines.push(`| Engine | Mentioned | Cited w/ link | Errored |`);
    lines.push(`|---|---|---|---|`);
    for (const [engine, stat] of engineBreakdown) {
      lines.push(
        `| ${engine} | ${stat.mentioned}/${stat.total} | ${stat.cited}/${stat.total} | ${stat.errored} |`
      );
    }

    // Best evidence text we have, if any
    const evidenceCell = successCells.find(
      (c) => c.mentioned && c.evidence_text && c.evidence_text.trim()
    );
    if (evidenceCell?.evidence_text) {
      lines.push(``);
      lines.push(`**Sample evidence:** > _"${evidenceCell.evidence_text.trim()}"_`);
    }

    // Top competitors named for this query
    const competitors = new Map<string, number>();
    for (const c of successCells) {
      for (const comp of c.competitors_mentioned ?? []) {
        competitors.set(comp, (competitors.get(comp) ?? 0) + 1);
      }
    }
    if (competitors.size > 0) {
      const top = [...competitors.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `${name} (${count}×)`)
        .join(", ");
      lines.push(``);
      lines.push(`**Competitors named:** ${top}`);
    }

    if (errored > 0) {
      lines.push(``);
      lines.push(`_${errored} cell${errored === 1 ? "" : "s"} errored on this template._`);
    }

    lines.push(``);
  }

  return lines.join("\n").trimEnd();
}

function renderCrawlerSignals(p: ReportPayload): string {
  if (!p.crawler) {
    return `## Crawler signals\n\n_(no crawler data — subject had no URL)_`;
  }
  const c = p.crawler as Record<string, unknown>;
  const reachable = c.reachable as boolean | undefined;
  const lines: string[] = [
    `## Crawler signals`,
    ``,
    `Read from the subject's own site (\`${(c.url as string) ?? "_(no url)_"}\`).`,
    ``,
    `| Signal | Status |`,
    `|---|---|`,
    `| Reachable | ${reachable ? "✓ yes" : "✗ no"} |`,
    `| Person schema | ${c.personSchemaPresent ? "✓ present" : "— absent"} |`,
    `| Organization schema | ${c.organizationSchemaPresent ? "✓ present" : "— absent"} |`,
    `| FAQ schema | ${c.faqSchemaPresent ? "✓ present" : "— absent"} |`,
    `| Service schema | ${c.serviceSchemaPresent ? "✓ present" : "— absent"} |`,
    `| llms.txt | ${c.llmsTxtPresent ? "✓ present" : "— absent"} |`,
    `| robots.txt | ${c.robotsTxtPresent ? "✓ present" : "— absent"} |`,
    `| Founder likely named | ${c.founderLikelyNamed ? "✓ yes" : "— no"} |`,
    `| Pricing likely visible | ${c.pricingLikelyVisible ? "✓ yes" : "— no"} |`,
  ];

  const schemaTypes = c.schemaTypes as string[] | undefined;
  if (schemaTypes && schemaTypes.length) {
    lines.push(``);
    lines.push(`**Schema types found:** ${schemaTypes.join(", ")}`);
  }

  const sameAs = c.sameAsLinks as string[] | undefined;
  if (sameAs && sameAs.length) {
    lines.push(``);
    lines.push(`**sameAs links:** ${sameAs.join(", ")}`);
  }

  return lines.join("\n");
}

function renderCorroboration(p: ReportPayload): string {
  if (!p.corroboration) {
    return `## Corroboration\n\n_(no corroboration data)_`;
  }
  const c = p.corroboration;
  const lines: string[] = [
    `## Cross-source corroboration`,
    ``,
    `External signals about the subject (Tavily searches).`,
    ``,
    `| Source | Status |`,
    `|---|---|`,
    `| LinkedIn profile | ${c.linkedinPresent ? `✓ found — ${c.linkedinUrl}` : "— not found"} |`,
    `| Wikidata entry | ${c.wikidataPresent ? `✓ found — ${c.wikidataUrl}` : "— not found"} |`,
    `| Total corroborating domains | **${c.totalCorroboratingDomains}** |`,
  ];

  if (c.mentions?.length) {
    lines.push(``);
    lines.push(`### Top mentions`);
    lines.push(``);
    for (const m of c.mentions.slice(0, 10)) {
      lines.push(`- **${m.domain}** — [${m.title}](${m.url})`);
      if (m.snippet) {
        lines.push(`  _"${m.snippet.slice(0, 240)}${m.snippet.length > 240 ? "…" : ""}"_`);
      }
    }
  }
  return lines.join("\n");
}

function renderFailures(p: ReportPayload): string {
  const failed = p.query_responses.filter((r) => r.status !== "success");
  if (failed.length === 0) {
    return `## Failures\n\n_None — every cell returned successfully._`;
  }

  const byEngine = new Map<string, number>();
  for (const f of failed) {
    byEngine.set(f.engine, (byEngine.get(f.engine) ?? 0) + 1);
  }

  const lines: string[] = [
    `## Failures`,
    ``,
    `${failed.length} of ${p.query_responses.length} cells errored ` +
      `(${((failed.length / p.query_responses.length) * 100).toFixed(1)}%).`,
    ``,
    `| Engine | Errored |`,
    `|---|---|`,
  ];
  for (const [engine, count] of [...byEngine.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${engine} | ${count} |`);
  }
  lines.push(``);
  lines.push(
    `For deeper inspection: \`npm run audit:errors -- ${p.audit_id}\``
  );
  return lines.join("\n");
}

function renderFooter(p: ReportPayload): string {
  return [
    `## Reading this report`,
    ``,
    `- **Composite** is the single headline number. Built from Readiness (X) and Visibility (Y).`,
    `- **Visibility** answers "are you actually being found?" Measured from live AI search responses.`,
    `- **Readiness** answers "are you built to be found?" Measured from the seven rubric dimensions.`,
    `- The dimension scores explain *why* the visibility number is what it is.`,
    `- The per-query section shows which questions Practical Informatics passes vs. fails — the long-tail ones are most actionable.`,
    `- The crawler + corroboration sections show what an AI engine could learn about the subject from web signals.`,
    ``,
    `Raw JSON: \`reports/${p.audit_id}.json\` — every cell + every evidence pointer + every justification verbatim.`,
  ].join("\n");
}

// ============================================================================
// Helpers
// ============================================================================

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(3);
}

function prettyCategory(cat: string): string {
  switch (cat) {
    case "category-search":
      return "Category-search queries _(do you get named?)_";
    case "name-search":
      return "Name-search queries _(when AI names you, what does it say?)_";
    case "competitive":
      return "Competitive queries _(how do you stack up?)_";
    case "buyer-scenario":
      return "Buyer scenario _(realistic decision context)_";
    default:
      return cat;
  }
}

type EngineStat = {
  total: number;
  mentioned: number;
  cited: number;
  errored: number;
};

function summarizeByEngine(cells: QueryResponse[]): Array<[string, EngineStat]> {
  const map = new Map<string, EngineStat>();
  for (const c of cells) {
    const stat = map.get(c.engine) ?? {
      total: 0,
      mentioned: 0,
      cited: 0,
      errored: 0,
    };
    stat.total++;
    if (c.status !== "success") stat.errored++;
    if (c.mentioned === true) stat.mentioned++;
    if (c.cited_with_link === true) stat.cited++;
    map.set(c.engine, stat);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

main();
