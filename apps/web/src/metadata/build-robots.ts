import type { MetadataRoute } from "next";

/**
 * Crawl rules for the deployment. Everything user-facing is open to crawlers,
 * but the JSON API under `/api/` is kept out of the index — it serves data, not
 * pages. `siteUrl` is the deployment origin (no trailing slash) used to build an
 * absolute sitemap URL.
 */
export const buildRobots = (siteUrl: string): MetadataRoute.Robots => ({
  rules: {
    allow: "/",
    disallow: "/api/",
    userAgent: "*",
  },
  sitemap: `${siteUrl}/sitemap.xml`,
});
