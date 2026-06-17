/**
 * Cross-category comparison across all 57 audits in the case study.
 * Reads each audit JSON, groups by category, computes per-dim patterns,
 * cross-category spreads, quadrant classification, and headline findings.
 *
 * Run: node scripts/cross-category-analysis.mjs
 */

import fs from "node:fs";
import path from "node:path";

const REPORTS_DIR = "reports";

const SUBJECTS = [
  // Category 1 — AI visibility consultants
  { name: "Practical Informatics", category: "AI visibility consultant", auditId: "7f3967b2-6a3c-4a33-ab9e-74ed6bfc4e00" },
  { name: "Visibly AI",            category: "AI visibility consultant", auditId: "328f6fbb-f272-4ab2-8364-ae73de9a768f" },
  { name: "Eric Schwartzman",      category: "AI visibility consultant", auditId: "5566ff07-4414-484f-8b74-eea2f3319c2d" },
  { name: "The Write Direction",   category: "AI visibility consultant", auditId: "a3edaa9b-31af-4b34-84cf-78f0b50de238" },
  { name: "Guthrie Group",         category: "AI visibility consultant", auditId: "52971aad-d762-4b95-983e-83e2b85e8db0" },
  { name: "BotSee",                category: "AI visibility consultant", auditId: "f61c6800-c63f-413d-8b53-881bb6b6d0a9" },
  // Category 2 — AI agency coaches
  { name: "Liam Ottley",           category: "AI agency coach", auditId: "7638ae39-50a0-4da9-86b4-a4f7aa253d8c" },
  { name: "Zubair Trabzada",       category: "AI agency coach", auditId: "38897163-7281-4c34-bc5a-0027360ac3fd" },
  { name: "JP Middleton",          category: "AI agency coach", auditId: "1c800332-96d9-4675-8144-8e560e6416dc" },
  { name: "AI Founders",           category: "AI agency coach", auditId: "872640c7-69a3-4ba6-9dc4-648b219f5bed" },
  { name: "Jordan Platten",        category: "AI agency coach", auditId: "8edeb807-fc6c-47cb-9eb1-020f683a0637" },
  // Category 3 — Small business insurance
  { name: "Hiscox",                category: "small business insurance", auditId: "598888b7-d0c6-4918-ad90-99d721155e95" },
  { name: "Thimble",               category: "small business insurance", auditId: "c8943d48-0b4a-49fb-aa84-b558451fc85b" },
  { name: "Embroker",              category: "small business insurance", auditId: "85bc9519-fcb6-43d2-8b26-68a85651128b" },
  { name: "Vouch",                 category: "small business insurance", auditId: "61c0144b-3c58-4352-b492-ab5ec8f9208b" },
  { name: "Coalition",             category: "small business insurance", auditId: "00e2ebdf-c50d-4b51-bccd-8cad796a211e" },
  // Category 4 — Ambient AI medical scribes
  { name: "Abridge",               category: "ambient AI medical scribe", auditId: "b34dae42-fea7-4c49-bf24-7d3f2c65ece4" },
  { name: "Suki",                  category: "ambient AI medical scribe", auditId: "48032b1e-ec8f-40d8-81a4-7ee84b3cbaea" },
  { name: "DeepScribe",            category: "ambient AI medical scribe", auditId: "b4ea1ae5-3e61-460b-8cb8-3326e20b91d5" },
  { name: "Heidi Health",          category: "ambient AI medical scribe", auditId: "5d11b957-5379-4a94-b753-a32c51cb8735" },
  { name: "Freed",                 category: "ambient AI medical scribe", auditId: "3fbde80e-ccb3-4670-8a3b-604d0998c988" },
  { name: "DAX Copilot",           category: "ambient AI medical scribe", auditId: "c7be717f-9e80-4619-b3ec-d51fa14f4770" },
  // Category 5 — Mid-tier U.S. healthcare systems
  { name: "Banner Health",         category: "U.S. healthcare system", auditId: "c584d717-8ba8-4da7-bb76-68b75090ae4b" },
  { name: "Cleveland Clinic",      category: "U.S. healthcare system", auditId: "0c6fa889-c213-4fb2-bcd8-43c5f8bc2f95" },
  { name: "Intermountain Health",  category: "U.S. healthcare system", auditId: "b2906be2-e1e9-4e31-9ee2-2c625c7bbb12" },
  { name: "UCSF Health",           category: "U.S. healthcare system", auditId: "581eab80-7090-43fe-bc71-10cca4d7f63f" },
  { name: "Ascension Health",      category: "U.S. healthcare system", auditId: "98400d08-7f43-43fc-8768-2f8e3feccce6" },
  // Category 6 — Clinical research organizations
  { name: "IQVIA",                 category: "clinical research organization", auditId: "8e58b9ba-9851-4a5f-afff-f5245f48b61c" },
  { name: "Parexel",               category: "clinical research organization", auditId: "d5070ecd-527f-43e0-a506-1f9aec36d1d5" },
  { name: "ICON plc",              category: "clinical research organization", auditId: "8d6bd247-7461-41c9-96a5-ec83353b322e" },
  { name: "Syneos Health",         category: "clinical research organization", auditId: "178be397-f1ec-4377-a6a0-b801f29f6b08" },
  { name: "Medpace",               category: "clinical research organization", auditId: "b417ce54-5e9d-47e2-b164-a25479b46d41" },
  // Category 7 — Large global consulting firms
  { name: "McKinsey & Company",    category: "global consulting firm", auditId: "ed011ac9-e6ff-4a7c-b609-9bc5f99c4cdb" },
  { name: "Boston Consulting Group", category: "global consulting firm", auditId: "0c0e5949-85cd-4c4c-9771-6b46121be021" },
  { name: "Bain & Company",        category: "global consulting firm", auditId: "297862a4-bc86-495e-92ba-b45b31f75042" },
  { name: "Deloitte",              category: "global consulting firm", auditId: "45d33423-3918-4daf-9243-7ea0d238afdd" },
  { name: "Accenture",             category: "global consulting firm", auditId: "b6fa66cf-1642-4e70-af97-b560d27956b3" },
  // Category 8 — Performance marketing agencies
  { name: "Single Grain",          category: "performance marketing agency", auditId: "c5d1e2d2-6e0d-4153-8dcd-1cc869045c1a" },
  { name: "NoGood",                category: "performance marketing agency", auditId: "bdc961fb-a33a-4be2-bebb-995450974cb1" },
  { name: "NP Digital",            category: "performance marketing agency", auditId: "190069c1-edc1-4a9e-b4cc-6d0ed052d252" },
  { name: "KlientBoost",           category: "performance marketing agency", auditId: "b2fe4625-962a-4431-91ab-26154fdab838" },
  { name: "Power Digital",         category: "performance marketing agency", auditId: "28345165-8de6-48ac-b5a7-705932dace6d" },
  // Category 9 — California foothills wineries
  { name: "Boeger Winery",         category: "California foothills winery", auditId: "a15d73f0-fc13-41b4-8f6c-eb5e9f53dab1" },
  { name: "Lava Cap Winery",       category: "California foothills winery", auditId: "0a6d9381-e53c-44ab-a9c4-5bb5754ca332" },
  { name: "Sobon Estate",          category: "California foothills winery", auditId: "1b1487d1-3aea-4849-8647-98613cd99016" },
  { name: "Vino Noceto",           category: "California foothills winery", auditId: "ea4c6a42-ff1f-416e-b520-b7e7b41609c2" },
  { name: "Ironstone Vineyards",   category: "California foothills winery", auditId: "5ec482cb-2543-4cf3-b22f-ed71cdff349b" },
  { name: "Helwig Winery",         category: "California foothills winery", auditId: "7f533163-3c6b-4937-bece-32537f31cab3" },
  { name: "Skinner Vineyards",     category: "California foothills winery", auditId: "83934f70-b704-4ad5-8796-eb005bc00a8e" },
  { name: "Newsome-Harlow Wines",  category: "California foothills winery", auditId: "a4fe3b0c-3e9a-49a4-9743-d6feffe86f16" },
  { name: "David Girard Vineyards", category: "California foothills winery", auditId: "83d06f20-64ac-4617-9caa-937b1f853f14" },
  { name: "Andis Wines",           category: "California foothills winery", auditId: "cf1039f0-f744-4cd4-bdc8-d219b456c4fc" },
  // Category 10 — B2B SaaS startups
  { name: "Linear",                category: "B2B SaaS platform", auditId: "1296e191-40b7-42fb-847d-6e02fd07c0e8" },
  { name: "Vanta",                 category: "B2B SaaS platform", auditId: "b1c08278-6f7b-4ad7-a513-07f25fdec18b" },
  { name: "Apollo.io",             category: "B2B SaaS platform", auditId: "d2262729-41d2-4abe-a738-1d07e9532036" },
  { name: "Gong",                  category: "B2B SaaS platform", auditId: "eafa1f06-8dc0-4f7b-a99e-e1cc4d3d7896" },
  { name: "Webflow",               category: "B2B SaaS platform", auditId: "81a09343-7728-4929-ac52-aa8a7e6366f4" },
  // Category 11 — CRM platforms
  { name: "GoHighLevel",           category: "CRM platform", auditId: "68e90c99-63fd-43cd-b649-f85e5bd7677f" },
  { name: "HubSpot",               category: "CRM platform", auditId: "973c88a9-6801-4b40-98a3-f8b4593712bf" },
  { name: "Salesforce",            category: "CRM platform", auditId: "87c90e87-de47-4c7c-b4e5-33298debbaf3" },
  { name: "Pipedrive",             category: "CRM platform", auditId: "fc91d3ad-0a8b-4322-b4b8-bcef20e93e40" },
  { name: "Close",                 category: "CRM platform", auditId: "d327a13e-1840-474e-ba58-e115079494c0" },
];

const CATEGORIES = [
  "AI visibility consultant",
  "AI agency coach",
  "small business insurance",
  "ambient AI medical scribe",
  "U.S. healthcare system",
  "clinical research organization",
  "global consulting firm",
  "performance marketing agency",
  "California foothills winery",
  "B2B SaaS platform",
  "CRM platform",
];

const DIM_NAMES = {
  D1: "Entity Clarity",
  D2: "Cross-Source Corroboration",
  D3: "Schema & Structured Data",
  D4: "Information Gain",
  D5: "Topical Authority",
  D6: "Distribution Surface",
  D7: "Method/Founder Signal",
};

function tierFor(score) {
  if (score < 0.2) return "Invisible";
  if (score < 0.4) return "Hidden";
  if (score < 0.6) return "Faintly Visible";
  if (score < 0.8) return "Discoverable";
  return "Agent-Ready";
}

function quadrantFor(readiness, visibility) {
  const rHi = readiness >= 0.5;
  const vHi = visibility >= 0.5;
  if (rHi && vHi) return "Discoverable";          // top-right
  if (rHi && !vHi) return "Emerging";              // top-left (built it, AI catching up)
  if (!rHi && vHi) return "Fragile";               // bottom-right (riding brand equity)
  return "Struggling";                              // bottom-left
}

function pad(s, n) {
  s = String(s);
  if (s.length >= n) return s.slice(0, n);
  return s + " ".repeat(n - s.length);
}

function loadReport(auditId) {
  const file = path.join(REPORTS_DIR, `${auditId}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const data = SUBJECTS.map((s) => {
  const r = loadReport(s.auditId);
  const dims = {};
  for (const d of r.dimension_scores) dims[d.dimension_id] = d.score;
  return {
    ...s,
    composite: r.scores.composite,
    readiness: r.scores.readiness,
    visibility: r.scores.visibility,
    tier: tierFor(r.scores.composite),
    quadrant: quadrantFor(r.scores.readiness, r.scores.visibility),
    presence: r.visibility_breakdown.presence,
    citation: r.visibility_breakdown.citation,
    shareOfVoice: r.visibility_breakdown.shareOfVoice,
    prominence: r.visibility_breakdown.prominence,
    dims,
    crawlerReachable: r.crawler?.reachable ?? null,
    crawlerError: r.crawler?.error ?? null,
  };
});

// ============ Table 1: All 57 subjects, sorted by composite ============
console.log("=== TABLE 1: All 57 subjects (sorted by composite desc) ===\n");
console.log(
  pad("Subject", 26) +
  pad("Category", 32) +
  pad("Comp", 7) +
  pad("Read", 7) +
  pad("Vis", 7) +
  pad("Tier", 18) +
  pad("Quadrant", 14) +
  pad("Crawler", 10)
);
console.log("-".repeat(121));
for (const d of [...data].sort((a, b) => b.composite - a.composite)) {
  console.log(
    pad(d.name, 26) +
    pad(d.category, 32) +
    pad(d.composite.toFixed(3), 7) +
    pad(d.readiness.toFixed(3), 7) +
    pad(d.visibility.toFixed(3), 7) +
    pad(d.tier, 18) +
    pad(d.quadrant, 14) +
    pad(d.crawlerReachable === false ? "BLOCKED" : "ok", 10)
  );
}

// ============ Table 2: Category-level means ============
console.log("\n\n=== TABLE 2: Category-level means (sorted by composite) ===\n");
console.log(
  pad("Category", 34) +
  pad("N", 4) +
  pad("Composite", 12) +
  pad("Readiness", 12) +
  pad("Visibility", 12) +
  "Tier distribution"
);
console.log("-".repeat(120));

const catSummaries = CATEGORIES.map((cat) => {
  const ds = data.filter((x) => x.category === cat);
  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const tiers = {};
  for (const d of ds) tiers[d.tier] = (tiers[d.tier] ?? 0) + 1;
  return {
    cat,
    n: ds.length,
    composite: mean(ds.map((d) => d.composite)),
    readiness: mean(ds.map((d) => d.readiness)),
    visibility: mean(ds.map((d) => d.visibility)),
    tierStr: Object.entries(tiers).map(([k, v]) => `${v}× ${k}`).join(", "),
  };
});
for (const s of [...catSummaries].sort((a, b) => b.composite - a.composite)) {
  console.log(
    pad(s.cat, 34) +
    pad(s.n, 4) +
    pad(s.composite.toFixed(3), 12) +
    pad(s.readiness.toFixed(3), 12) +
    pad(s.visibility.toFixed(3), 12) +
    s.tierStr
  );
}

// ============ Table 3: Per-dim category means ============
console.log("\n\n=== TABLE 3: Per-dim category means ===\n");
console.log(
  pad("Category", 34) +
  ["D1", "D2", "D3", "D4", "D5", "D6", "D7"].map((d) => pad(d, 6)).join("") +
  pad("Mean", 6)
);
console.log("-".repeat(34 + 48));
for (const cat of CATEGORIES) {
  const ds = data.filter((x) => x.category === cat);
  const means = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"].map((k) => {
    const vals = ds.map((d) => d.dims[k]).filter((v) => v != null);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  const overallMean = means.reduce((a, b) => a + b, 0) / means.length;
  console.log(
    pad(cat, 34) +
    means.map((m) => pad(m.toFixed(2), 6)).join("") +
    pad(overallMean.toFixed(2), 6)
  );
}

// ============ Table 4: Quadrant distribution ============
console.log("\n\n=== TABLE 4: Quadrant distribution (Readiness × Visibility) ===\n");
const quadrants = ["Discoverable", "Emerging", "Fragile", "Struggling"];
const qCounts = {};
for (const q of quadrants) qCounts[q] = 0;
for (const d of data) qCounts[d.quadrant]++;
console.log("Quadrant       Count  Composition (top 3 by composite)");
console.log("-".repeat(70));
for (const q of quadrants) {
  const inQ = data.filter((d) => d.quadrant === q).sort((a, b) => b.composite - a.composite);
  const top3 = inQ.slice(0, 3).map((d) => `${d.name} (${d.composite.toFixed(2)})`).join("; ");
  console.log(`${pad(q, 14)} ${pad(qCounts[q], 6)} ${top3}`);
}

// ============ Table 5: Crawler-blocked subjects ============
console.log("\n\n=== TABLE 5: Crawler-blocked subjects ===\n");
const blocked = data.filter((d) => d.crawlerReachable === false);
console.log(
  pad("Subject", 26) +
  pad("Category", 32) +
  pad("Comp", 7) +
  pad("Read", 7) +
  pad("Vis", 7) +
  pad("Quadrant", 14)
);
console.log("-".repeat(93));
for (const d of blocked.sort((a, b) => b.composite - a.composite)) {
  console.log(
    pad(d.name, 26) +
    pad(d.category, 32) +
    pad(d.composite.toFixed(3), 7) +
    pad(d.readiness.toFixed(3), 7) +
    pad(d.visibility.toFixed(3), 7) +
    pad(d.quadrant, 14)
  );
}

// ============ Highlights ============
console.log("\n\n=== HIGHLIGHTS ===\n");
const sorted = [...data].sort((a, b) => b.composite - a.composite);
console.log(`N = ${data.length} subjects across ${CATEGORIES.length} categories`);
console.log(`Top composite:    ${sorted[0].name.padEnd(26)} ${sorted[0].composite.toFixed(3)} (${sorted[0].category}, ${sorted[0].tier})`);
console.log(`Bottom composite: ${sorted[sorted.length - 1].name.padEnd(26)} ${sorted[sorted.length - 1].composite.toFixed(3)} (${sorted[sorted.length - 1].category}, ${sorted[sorted.length - 1].tier})`);

const tierCounts = {};
for (const d of data) tierCounts[d.tier] = (tierCounts[d.tier] ?? 0) + 1;
console.log(`\nTier distribution: ${JSON.stringify(tierCounts)}`);

const agentReady = data.filter((d) => d.tier === "Agent-Ready");
const discoverable = data.filter((d) => d.tier === "Discoverable");
console.log(`\nAgent-Ready (${agentReady.length}): ${agentReady.map((d) => `${d.name} (${d.composite.toFixed(2)})`).join(", ")}`);
console.log(`Discoverable (${discoverable.length}): ${discoverable.map((d) => `${d.name} (${d.composite.toFixed(2)})`).join(", ")}`);

console.log(`\nCrawler-blocked: ${blocked.length}/${data.length} (${blocked.map((d) => d.name).join(", ")})`);

// D5 + D7 means across all
const d5Mean = data.reduce((a, d) => a + (d.dims.D5 ?? 0), 0) / data.length;
const d7Mean = data.reduce((a, d) => a + (d.dims.D7 ?? 0), 0) / data.length;
console.log(`\nD5 Topical Authority — mean across all 57: ${d5Mean.toFixed(2)} / 5`);
console.log(`D7 Method/Founder Signal — mean across all 57: ${d7Mean.toFixed(2)} / 5`);
