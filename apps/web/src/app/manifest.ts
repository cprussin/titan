import type { MetadataRoute } from "next";

/** The PWA web app manifest. Served at `/manifest.webmanifest`. */
const manifest = (): MetadataRoute.Manifest => ({
  background_color: "#0A0A0B",
  description:
    "An adaptive personal fitness coach that runs your training program.",
  display: "standalone",
  icons: [
    { purpose: "any", sizes: "any", src: "/icon.svg", type: "image/svg+xml" },
    {
      purpose: "any",
      sizes: "192x192",
      src: "/icon-192.png",
      type: "image/png",
    },
    {
      purpose: "any",
      sizes: "512x512",
      src: "/icon-512.png",
      type: "image/png",
    },
    {
      purpose: "maskable",
      sizes: "512x512",
      src: "/icon-maskable-512.png",
      type: "image/png",
    },
  ],
  name: "Titan — Adaptive Fitness Coach",
  short_name: "Titan",
  start_url: "/",
  theme_color: "#0A0A0B",
});

export default manifest;
