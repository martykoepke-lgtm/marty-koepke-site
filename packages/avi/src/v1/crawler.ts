/**
 * Crawler Agent — lightweight version.
 *
 * Runs during the free scan. Fetches the customer's homepage + robots.txt
 * + llms.txt, parses for structured data and AI-readiness signals, and
 * returns a JSON summary plus a preliminary score (0-100).
 *
 * This is the cheap version: plain fetch + regex, no headless browser.
 * The paid audit later runs a heavier Puppeteer-based crawl on top.
 *
 * NEVER throws. Network errors, parse errors, weird HTML — all produce
 * a valid CrawlerOutput with `reachable: false` or partial data. The
 * teaser page should always have something to show.
 */

export type BotPermission = "allowed" | "disallowed" | "default";

export type CrawlerFinding = {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
};

export type CrawlerOutput = {
  url: string;
  fetchedAt: string;
  reachable: boolean;
  error?: string;
  status?: number;

  title?: string;
  metaDescription?: string;
  ogTags: Record<string, string>;

  schemaTypes: string[];
  organizationSchemaPresent: boolean;
  personSchemaPresent: boolean;
  faqSchemaPresent: boolean;
  serviceSchemaPresent: boolean;
  sameAsLinks: string[];

  llmsTxtPresent: boolean;
  robotsTxtPresent: boolean;
  agentBotsAllowed: {
    gptbot: BotPermission;
    claudebot: BotPermission;
    googleExtended: BotPermission;
    ccbot: BotPermission;
  };

  founderLikelyNamed: boolean;
  pricingLikelyVisible: boolean;

  preliminaryScore: number;            // 0-100
  preliminaryTier:
    | "agent-ready"
    | "discoverable"
    | "faintly-visible"
    | "hidden"
    | "invisible";
  preliminaryFindings: CrawlerFinding[];
};

const USER_AGENT = "MartyKoepkeBot/1.0 (+https://www.martykoepke.com)";
const FETCH_TIMEOUT_MS = 10_000;

// ============================================================================
// Top-level entry point
// ============================================================================

export async function runCrawler(rawUrl: string): Promise<CrawlerOutput> {
  const url = normalizeUrl(rawUrl);
  const fetchedAt = new Date().toISOString();

  const base: CrawlerOutput = {
    url,
    fetchedAt,
    reachable: false,
    ogTags: {},
    schemaTypes: [],
    organizationSchemaPresent: false,
    personSchemaPresent: false,
    faqSchemaPresent: false,
    serviceSchemaPresent: false,
    sameAsLinks: [],
    llmsTxtPresent: false,
    robotsTxtPresent: false,
    agentBotsAllowed: {
      gptbot: "default",
      claudebot: "default",
      googleExtended: "default",
      ccbot: "default",
    },
    founderLikelyNamed: false,
    pricingLikelyVisible: false,
    preliminaryScore: 0,
    preliminaryTier: "invisible",
    preliminaryFindings: [],
  };

  // Fetch the three URLs in parallel
  const origin = new URL(url).origin;
  const [pageResult, robotsResult, llmsResult] = await Promise.allSettled([
    fetchText(url),
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/llms.txt`),
  ]);

  // ---- Process homepage HTML ----
  if (pageResult.status === "fulfilled" && pageResult.value.ok) {
    base.reachable = true;
    base.status = pageResult.value.status;
    const html = pageResult.value.text;

    base.title = extractTitle(html);
    base.metaDescription = extractMetaContent(html, "description");
    base.ogTags = extractOgTags(html);

    const jsonLdBlocks = extractJsonLdBlocks(html);
    const schemaInfo = analyzeJsonLd(jsonLdBlocks);
    base.schemaTypes = schemaInfo.types;
    base.organizationSchemaPresent = schemaInfo.types.includes("Organization");
    base.personSchemaPresent = schemaInfo.types.includes("Person");
    base.faqSchemaPresent = schemaInfo.types.includes("FAQPage");
    base.serviceSchemaPresent = schemaInfo.types.includes("Service");
    base.sameAsLinks = schemaInfo.sameAs;

    base.founderLikelyNamed = detectFounderNamed(html, schemaInfo);
    base.pricingLikelyVisible = detectPricingVisible(html);
  } else {
    base.error =
      pageResult.status === "fulfilled"
        ? `HTTP ${pageResult.value.status}`
        : pageResult.reason instanceof Error
          ? pageResult.reason.message
          : "Could not reach this URL";
    base.preliminaryFindings.push({
      title: "We couldn't reach your URL",
      detail: `We tried to fetch ${url} but got: ${base.error}. Double-check the spelling and try again — or it may be temporarily down.`,
      severity: "high",
    });
    return scoreAndTier(base);
  }

  // ---- Process robots.txt ----
  if (robotsResult.status === "fulfilled" && robotsResult.value.ok) {
    base.robotsTxtPresent = true;
    base.agentBotsAllowed = parseRobotsTxt(robotsResult.value.text);
  }

  // ---- Process llms.txt ----
  if (llmsResult.status === "fulfilled" && llmsResult.value.ok) {
    base.llmsTxtPresent = true;
  }

  // ---- Compute findings + score ----
  collectFindings(base);
  return scoreAndTier(base);
}

// ============================================================================
// Fetching with timeout
// ============================================================================

async function fetchText(
  url: string
): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// URL helpers
// ============================================================================

export function normalizeUrl(input: string): string {
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`;
  }
  try {
    const u = new URL(s);
    return u.toString();
  } catch {
    return s;
  }
}

// ============================================================================
// HTML extraction (regex-based, light)
// ============================================================================

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : undefined;
}

function extractMetaContent(html: string, name: string): string | undefined {
  // Matches <meta name="description" content="..."> in either attribute order
  const re1 = new RegExp(
    `<meta\\s+[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const re2 = new RegExp(
    `<meta\\s+[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`,
    "i"
  );
  const m = html.match(re1) || html.match(re2);
  return m ? decodeEntities(m[1].trim()) : undefined;
}

function extractOgTags(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /<meta\s+[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']*)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    out[m[1]] = decodeEntities(m[2]);
  }
  // Also try the reversed attribute order
  const re2 = /<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:([^"']+)["']/gi;
  while ((m = re2.exec(html)) !== null) {
    out[m[2]] = decodeEntities(m[1]);
  }
  return out;
}

function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push(m[1].trim());
  }
  return blocks;
}

function analyzeJsonLd(blocks: string[]): { types: string[]; sameAs: string[] } {
  const types = new Set<string>();
  const sameAs = new Set<string>();

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block);
      const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object") {
          walkJsonLd(item as Record<string, unknown>, types, sameAs);
        }
      }
    } catch {
      // Some sites have malformed JSON-LD — skip silently
    }
  }

  return { types: [...types], sameAs: [...sameAs] };
}

function walkJsonLd(
  node: Record<string, unknown>,
  types: Set<string>,
  sameAs: Set<string>
) {
  const t = node["@type"];
  if (typeof t === "string") types.add(t);
  else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.add(x));

  const sa = node["sameAs"];
  if (typeof sa === "string") sameAs.add(sa);
  else if (Array.isArray(sa)) sa.forEach((x) => typeof x === "string" && sameAs.add(x));

  // Walk nested objects (e.g. @graph arrays)
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (v && typeof v === "object") {
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item && typeof item === "object") {
            walkJsonLd(item as Record<string, unknown>, types, sameAs);
          }
        }
      } else {
        walkJsonLd(v as Record<string, unknown>, types, sameAs);
      }
    }
  }
}

function detectFounderNamed(
  html: string,
  schemaInfo: { types: string[]; sameAs: string[] }
): boolean {
  // Founder named if Person schema OR "Founder" or "Founded by" appears in plain HTML
  if (schemaInfo.types.includes("Person")) return true;
  const text = stripTags(html).toLowerCase();
  return /\b(founder|founded by|owner|principal|ceo)\b/.test(text);
}

function detectPricingVisible(html: string): boolean {
  const text = stripTags(html);
  // Look for "$" followed by digits, or common pricing words
  return /\$\d{2,}/.test(text) || /\b(pricing|investment|fee|cost)\b/i.test(text);
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ============================================================================
// robots.txt parsing
// ============================================================================

const BOTS: { key: keyof CrawlerOutput["agentBotsAllowed"]; ua: string }[] = [
  { key: "gptbot", ua: "GPTBot" },
  { key: "claudebot", ua: "ClaudeBot" },
  { key: "googleExtended", ua: "Google-Extended" },
  { key: "ccbot", ua: "CCBot" },
];

function parseRobotsTxt(text: string): CrawlerOutput["agentBotsAllowed"] {
  const out: CrawlerOutput["agentBotsAllowed"] = {
    gptbot: "default",
    claudebot: "default",
    googleExtended: "default",
    ccbot: "default",
  };

  const lines = text.split(/\r?\n/);
  let currentUA: string | null = null;
  let blockIsForBot: keyof CrawlerOutput["agentBotsAllowed"] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const val = line.slice(colonIdx + 1).trim();

    if (key === "user-agent") {
      currentUA = val;
      const match = BOTS.find((b) => b.ua.toLowerCase() === val.toLowerCase());
      blockIsForBot = match ? match.key : null;
    } else if (blockIsForBot && (key === "disallow" || key === "allow")) {
      if (val === "/") {
        out[blockIsForBot] = key === "disallow" ? "disallowed" : "allowed";
      } else if (val === "" && key === "disallow") {
        // "Disallow: " (empty) means allow all
        out[blockIsForBot] = "allowed";
      } else if (key === "allow") {
        // Any explicit allow rule for this bot counts as "allowed" if we don't see disallow /
        out[blockIsForBot] = "allowed";
      }
    }
    // Avoid unused var lint: keep currentUA for future debugging
    void currentUA;
  }

  return out;
}

// ============================================================================
// Findings + scoring
// ============================================================================

function collectFindings(out: CrawlerOutput) {
  const f: CrawlerFinding[] = [];

  if (!out.organizationSchemaPresent) {
    f.push({
      title: "No Organization schema found on your homepage",
      detail:
        "AI agents use Organization schema to understand who you are. Without it, they have to guess from text — and they often guess wrong.",
      severity: "high",
    });
  }
  if (!out.personSchemaPresent) {
    f.push({
      title: "No Person schema for your founder",
      detail:
        "Person schema lets AI connect a real human (with credentials, history, and a name) to your business. Strongest signal of credibility for solo experts and small practices.",
      severity: "high",
    });
  }
  if (!out.faqSchemaPresent) {
    f.push({
      title: "No FAQ schema markup",
      detail:
        "FAQPage schema is one of the highest-leverage signals for AI chat answers. If you have FAQ content already, marking it up with the right schema makes it extractable.",
      severity: "medium",
    });
  }
  if (!out.serviceSchemaPresent) {
    f.push({
      title: "No Service schema with pricing",
      detail:
        "Service schema with offers + price lets AI quote your offering accurately when customers ask 'who should I hire for X?'",
      severity: "medium",
    });
  }
  if (!out.llmsTxtPresent) {
    f.push({
      title: "No llms.txt file",
      detail:
        "llms.txt is a structured plain-English summary written specifically for AI models. Adding one gives AI a canonical source to quote about your business.",
      severity: "medium",
    });
  }
  const blockedBots = Object.entries(out.agentBotsAllowed)
    .filter(([, v]) => v === "disallowed")
    .map(([k]) => k);
  if (blockedBots.length > 0) {
    f.push({
      title: `Your robots.txt blocks AI crawlers: ${blockedBots.join(", ")}`,
      detail:
        "If you're blocking AI bots from reading your site, those AI models can't update their understanding of you. Unblocking them is usually the right move for small businesses.",
      severity: "high",
    });
  }
  if (!out.founderLikelyNamed) {
    f.push({
      title: "No founder named on the homepage",
      detail:
        "Founder-led businesses get more credibility from AI when there's a real, named human attached. Naming the founder + linking to their LinkedIn unlocks Person-schema-grade signal.",
      severity: "medium",
    });
  }
  if (!out.pricingLikelyVisible) {
    f.push({
      title: "Pricing isn't visible on the homepage",
      detail:
        "AI agents quote prices from your site verbatim. Without visible pricing, they default to 'contact for quote,' which loses customers comparing options.",
      severity: "low",
    });
  }
  if (!out.metaDescription) {
    f.push({
      title: "Missing meta description",
      detail:
        "A 150-160 character meta description gives AI a clean one-line summary of your site. Cheap to add, high leverage.",
      severity: "low",
    });
  }

  // Take the top 3 by severity for the teaser
  const severityRank = { high: 0, medium: 1, low: 2 } as const;
  f.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  out.preliminaryFindings = f.slice(0, 3);
}

function scoreAndTier(out: CrawlerOutput): CrawlerOutput {
  let score = 0;

  if (out.reachable) {
    if (out.organizationSchemaPresent) score += 15;
    if (out.personSchemaPresent) score += 12;
    if (out.faqSchemaPresent) score += 8;
    if (out.serviceSchemaPresent) score += 8;
    if (out.llmsTxtPresent) score += 10;
    if (out.metaDescription) score += 5;
    if (Object.keys(out.ogTags).length >= 3) score += 5;
    if (out.sameAsLinks.length >= 2) score += 5;
    if (out.founderLikelyNamed) score += 8;
    if (out.pricingLikelyVisible) score += 4;

    const explicitlyAllowed = Object.values(out.agentBotsAllowed).filter(
      (v) => v === "allowed"
    ).length;
    score += explicitlyAllowed * 3; // up to +15 for all 5 bots

    const explicitlyBlocked = Object.values(out.agentBotsAllowed).filter(
      (v) => v === "disallowed"
    ).length;
    score -= explicitlyBlocked * 5; // each blocked bot is a real penalty
  }

  out.preliminaryScore = Math.max(0, Math.min(100, score));

  out.preliminaryTier =
    out.preliminaryScore >= 80
      ? "agent-ready"
      : out.preliminaryScore >= 60
        ? "discoverable"
        : out.preliminaryScore >= 40
          ? "faintly-visible"
          : out.preliminaryScore >= 20
            ? "hidden"
            : "invisible";

  return out;
}
