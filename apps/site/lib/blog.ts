import fs from "node:fs";
import path from "node:path";

/**
 * Markdown blog, files-in-repo. No headless CMS, no heavy deps — that is
 * the brief. Posts live in /content/blog/<slug>.md with simple frontmatter:
 *
 *   ---
 *   title: What is an AI assessment, really?
 *   date: 2026-06-01
 *   description: One sentence shown in lists and meta tags.
 *   ---
 *   Body in lightweight markdown...
 *
 * There are intentionally zero posts at launch. Do not add placeholder
 * content — the UI handles the empty state.
 */

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

export type Post = PostMeta & { html: string };

function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) data[key] = value;
  }
  return { data, body: match[2] };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /\[(.+?)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
      '<a href="$2" class="underline decoration-gold underline-offset-4 hover:text-forest">$1</a>',
    );
}

/** Minimal, safe markdown: headings, paragraphs, lists, blockquotes. */
function renderMarkdown(md: string): string {
  const blocks = md.trim().split(/\n{2,}/);
  const out: string[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    if (/^#{2,3}\s/.test(block)) {
      const level = block.startsWith("### ") ? 3 : 2;
      const text = block.replace(/^#{2,3}\s/, "");
      out.push(
        `<h${level} class="mt-10 mb-3 font-serif text-2xl text-forest">${inline(
          text,
        )}</h${level}>`,
      );
    } else if (lines.every((l) => /^[-*]\s/.test(l))) {
      const items = lines
        .map((l) => `<li>${inline(l.replace(/^[-*]\s/, ""))}</li>`)
        .join("");
      out.push(
        `<ul class="my-4 list-disc space-y-2 pl-6">${items}</ul>`,
      );
    } else if (lines.every((l) => l.startsWith("> "))) {
      out.push(
        `<blockquote class="my-6 border-l-2 border-gold pl-5 italic text-moss">${inline(
          lines.map((l) => l.slice(2)).join(" "),
        )}</blockquote>`,
      );
    } else {
      out.push(
        `<p class="my-5 leading-relaxed">${inline(block.replace(/\n/g, " "))}</p>`,
      );
    }
  }
  return out.join("\n");
}

function readDir(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllPostMeta(): PostMeta[] {
  return readDir()
    .map((slug) => {
      const raw = fs.readFileSync(
        path.join(BLOG_DIR, `${slug}.md`),
        "utf8",
      );
      const { data } = parseFrontmatter(raw);
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? "",
        description: data.description ?? "",
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | null {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    description: data.description ?? "",
    html: renderMarkdown(body),
  };
}

export function getAllSlugs(): string[] {
  return readDir();
}

export function formatDate(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
