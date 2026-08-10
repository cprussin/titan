import type { MetadataRoute } from "next";
import { env } from "../env";
import { buildSitemap } from "../metadata/build-sitemap";

/** Served at `/sitemap.xml`. */
const sitemap = (): MetadataRoute.Sitemap => buildSitemap(env.AUTH_PROXY_URL);

export default sitemap;
