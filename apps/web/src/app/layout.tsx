import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { AppProviders } from "../components/AppProviders";
import { RegisterServiceWorker } from "../components/RegisterServiceWorker";
import { env } from "../env";

// Self-hosted via next/font so the faces are inlined at build time and no
// font request sits on the critical path. The CSS variables feed the Panda
// `condensed` / `sans` / `mono` font tokens.
const sans = Barlow({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const condensed = Barlow_Condensed({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-condensed",
  weight: ["400", "600", "700"],
});

const mono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

const DESCRIPTION =
  "An adaptive personal fitness coach that runs your training program.";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Titan",
  },
  description: DESCRIPTION,
  icons: {
    apple: { sizes: "180x180", url: "/apple-touch-icon.png" },
    icon: [
      { type: "image/svg+xml", url: "/favicon.svg" },
      { sizes: "any", url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
  // Resolves relative OG/Twitter image and canonical URLs to absolute ones. The
  // production origin is reused across every deployment (see `env.ts`), so
  // preview builds still emit valid absolute social-image URLs.
  metadataBase: new URL(env.AUTH_PROXY_URL),
  openGraph: {
    description: DESCRIPTION,
    siteName: "Titan",
    title: "Titan — Adaptive Fitness Coach",
    type: "website",
    url: "/",
  },
  title: {
    default: "Titan — Adaptive Fitness Coach",
    template: "%s · Titan",
  },
  twitter: {
    card: "summary_large_image",
    description: DESCRIPTION,
    title: "Titan — Adaptive Fitness Coach",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#0A0A0B",
  viewportFit: "cover",
  width: "device-width",
};

// The root layout is intentionally chrome-free: it wraps both the authenticated
// app and the login screen, so the primary navigation lives in the `(app)`
// route group's layout instead — nothing to show for a logged-out visitor.
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html
    className={`${sans.variable} ${condensed.variable} ${mono.variable}`}
    lang="en"
    suppressHydrationWarning
  >
    <body className={bodyStyles}>
      <AppProviders>
        {children}
        <RegisterServiceWorker />
      </AppProviders>
    </body>
  </html>
);

export default RootLayout;

const bodyStyles = css({
  color: "foreground",
  minBlockSize: "100dvh",
});
