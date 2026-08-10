import type { MetadataRoute } from "next";

/**
 * The sitemap entries. Only the public entry points are listed — the training
 * app behind them is per-user and auth-gated, so it carries no crawlable,
 * indexable content. `siteUrl` is the deployment origin (no trailing slash).
 */
export const buildSitemap = (siteUrl: string): MetadataRoute.Sitemap => [
  {
    changeFrequency: "monthly",
    priority: 1,
    url: `${siteUrl}/`,
  },
  {
    changeFrequency: "yearly",
    priority: 0.5,
    url: `${siteUrl}/login`,
  },
];
