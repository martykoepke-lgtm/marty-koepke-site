import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter, renderMarkdown } from "./blog";

/**
 * Marketing pages — files-in-repo, same renderer as the blog. Source lives in
 * /content/marketing/<slug>.md with frontmatter mirroring the queued shape:
 *
 *   ---
 *   title: ...
 *   description: ...
 *   suggested_slug: ...
 *   ---
 *   Body in lightweight markdown...
 */

const MARKETING_DIR = path.join(process.cwd(), "content", "marketing");

export interface MarketingPage {
  slug: string;
  title: string;
  description: string;
  html: string;
}

export function getMarketingPage(slug: string): MarketingPage | null {
  const file = path.join(MARKETING_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    html: renderMarkdown(body),
  };
}
