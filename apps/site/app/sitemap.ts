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
    "/ai-visibility",
    "/our-framework",
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
          : path === "/ai-visibility"
            ? 0.9
            : path === "/our-framework"
              ? 0.8
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
