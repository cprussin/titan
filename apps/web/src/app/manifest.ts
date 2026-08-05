import type { MetadataRoute } from "next";

/** The PWA web app manifest. Served at `/manifest.webmanifest`. */
const manifest = (): MetadataRoute.Manifest => ({
  background_color: "#0a0a0a",
  description:
    "An adaptive personal fitness coach that runs your training program.",
  display: "standalone",
  icons: [
    { purpose: "any", sizes: "any", src: "/icon.svg", type: "image/svg+xml" },
  ],
  name: "Titan — Adaptive Fitness Coach",
  short_name: "Titan",
  start_url: "/",
  theme_color: "#0a0a0a",
});

export default manifest;
