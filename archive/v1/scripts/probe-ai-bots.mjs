/**
 * Probe each subject site with major AI crawler UAs and inspect robots.txt
 * for explicit AI-bot disallow rules. Output: HTTP-response table + robots.txt
 * policy summary. Used for the AI visibility consultant case study.
 *
 * Run: node scripts/probe-ai-bots.mjs
 */

const SITES = [
  // Category 1 — AI visibility consultants
  "practicalinformatics.com",
  "visibly-ai.com",
  "ericschwartzman.com",
  "thewrite-direction.com",
  "guthriegroup.com",
  "botsee.io",
  // Category 2 — AI agency coaches (Zubair excluded: no owned domain)
  "liamottley.com",
  "jp-middleton.com",
  "aifoundershq.com",
  "agency-launch.ai",
  // Category 3 — Small business insurance
  "hiscox.com",
  "thimble.com",
  "embroker.com",
  "vouch.us",
  "coalitioninc.com",
  // Category 4 — Ambient AI medical scribes
  "abridge.com",
  "suki.ai",
  "deepscribe.ai",
  "heidihealth.com",
  "getfreed.ai",
  // Category 5 — Mid-tier U.S. healthcare systems
  "bannerhealth.com",
  "my.clevelandclinic.org",
  "intermountainhealthcare.org",
  "ucsfhealth.org",
  "healthcare.ascension.org",
  // Category 6 — Clinical research organizations (CROs)
  "iqvia.com",
  "parexel.com",
  "iconplc.com",
  "syneoshealth.com",
  "medpace.com",
  // Category 7 — Large global consulting firms
  "mckinsey.com",
  "bcg.com",
  "bain.com",
  "www2.deloitte.com",
  "accenture.com",
  // Category 8 — Marketing agencies (real)
  "singlegrain.com",
  "nogood.io",
  "npdigital.com",
  "klientboost.com",
  "powerdigitalmarketing.com",
  // Category 9 — California foothills wineries
  "boegerwinery.com",
  "lavacap.com",
  "sobonwine.com",
  "noceto.com",
  "ironstonevineyards.com",
  "helwigwinery.com",
  "skinnervineyards.com",
  "nhvino.com",
  "davidgirardvineyards.com",
  "andiswines.com",
  // Category 10 — B2B SaaS startups
  "linear.app",
  "vanta.com",
  "apollo.io",
  "gong.io",
  "webflow.com",
  // Category 11 — CRM platforms
  "gohighlevel.com",
  "hubspot.com",
  "salesforce.com",
  "pipedrive.com",
  "close.com",
];

const BOTS = [
  [
    "GPTBot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  ],
  [
    "ClaudeBot",
    "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  ],
  [
    "PerplexityBot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://docs.perplexity.ai/guides/bots",
  ],
  ["CCBot", "CCBot/2.0 (https://commoncrawl.org/faq/)"],
];

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

async function probeOne(site, botName, ua) {
  const url = `https://${site}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": ua },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    return { site, botName, code: res.status };
  } catch (e) {
    const msg = e?.message ?? String(e);
    return { site, botName, code: `ERR`, err: msg.slice(0, 50) };
  }
}

function pad(s, n) {
  s = String(s);
  if (s.length >= n) return s.slice(0, n);
  return s + " ".repeat(n - s.length);
}

async function fetchRobotsPolicy(site) {
  const url = `https://${site}/robots.txt`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { site, status: res.status, blocks: [] };
    const text = await res.text();
    if (text.includes("<html") || text.includes("<!DOCTYPE")) {
      return {
        site,
        status: res.status,
        blocks: [],
        note: "robots.txt returned an HTML challenge page",
      };
    }
    const blocks = [];
    const checkBot = (name) => {
      const re = new RegExp(
        String.raw`User-agent:\s*${name}\b[\s\S]*?Disallow:\s*\/\s*(?:\n|$)`,
        "im"
      );
      if (re.test(text)) blocks.push(name);
    };
    for (const bot of [
      "GPTBot",
      "ClaudeBot",
      "Claude-Web",
      "anthropic-ai",
      "PerplexityBot",
      "Perplexity-User",
      "Google-Extended",
      "CCBot",
      "Bytespider",
      "ChatGPT-User",
    ]) {
      checkBot(bot);
    }
    return {
      site,
      status: res.status,
      blocks,
      bytes: text.length,
    };
  } catch (e) {
    const msg = e?.message ?? String(e);
    return { site, status: "ERR", blocks: [], err: msg.slice(0, 60) };
  }
}

async function main() {
  const probes = [];
  for (const site of SITES) {
    for (const [botName, ua] of BOTS) {
      probes.push(probeOne(site, botName, ua));
    }
  }
  const probeResults = await Promise.all(probes);

  console.log("=== HTTP response to AI bot UAs ===\n");
  const colWidth = 16;
  const header =
    pad("Site", 32) + BOTS.map(([n]) => pad(n, colWidth)).join("");
  console.log(header);
  console.log("-".repeat(header.length));
  for (const site of SITES) {
    const row = BOTS.map(([botName]) => {
      const r = probeResults.find(
        (x) => x.site === site && x.botName === botName
      );
      return pad(r ? r.code : "?", colWidth);
    });
    console.log(pad(site, 32) + row.join(""));
  }

  console.log("\n=== robots.txt: explicit AI-bot disallows ===\n");
  const robotsResults = await Promise.all(SITES.map(fetchRobotsPolicy));
  for (const r of robotsResults) {
    if (r.err) {
      console.log(`${pad(r.site, 32)} ERR ${r.err}`);
      continue;
    }
    if (r.note) {
      console.log(`${pad(r.site, 32)} (${r.note})`);
      continue;
    }
    const blocks = r.blocks.length ? r.blocks.join(", ") : "(none found)";
    console.log(`${pad(r.site, 32)} status=${r.status}  blocks: ${blocks}`);
  }
}

main().catch((e) => {
  console.error("[probe] fatal:", e);
  process.exit(1);
});
