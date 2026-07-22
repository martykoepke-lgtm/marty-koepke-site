import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { getAllPostMeta } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // /blog only appears in the sitemap once at least one post exists.
  const posts = getAllPostMeta();
  const blogRoutes = posts.length > 0 ? ["/blog"] : [];
  const primary = [
    "",
    "/about",
    "/work",
    "/resources",
    "/ai-visibility",
    "/methodology",
    "/scan",
    "/ai-visibility/order",
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
          : path === "/work" || path === "/resources"
            ? 0.9
            : path === "/ai-visibility" || path === "/scan"
              ? 0.6
            : path === "/methodology"
              ? 0.8
              : 0.7,
    })),
    ...posts.map((post) => ({
      url: `${SITE.url}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...policy.map((path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
