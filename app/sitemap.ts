import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { getAllPostMeta } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // /blog only appears in the sitemap once at least one post exists.
  const blogRoutes = getAllPostMeta().length > 0 ? ["/blog"] : [];
  const primary = [
    "",
    "/about",
    "/ai-visibility-index",
    "/scorecard",
    "/time-back-assessment",
    ...blogRoutes,
    "/contact",
  ];
  const policy = ["/privacy", "/terms", "/cookies", "/acceptable-use", "/returns"];
  return [
    ...primary.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: (path === "/blog" ? "weekly" : "monthly") as
        | "weekly"
        | "monthly",
      priority:
        path === ""
          ? 1
          : path === "/ai-visibility-index"
            ? 0.95
            : path === "/scorecard"
              ? 0.85
              : path === "/time-back-assessment"
                ? 0.7
                : 0.7,
    })),
    ...policy.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
