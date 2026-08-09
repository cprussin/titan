import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { AppProviders } from "../components/AppProviders";
import { RegisterServiceWorker } from "../components/RegisterServiceWorker";

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Titan",
  },
  description:
    "An adaptive personal fitness coach that runs your training program.",
  manifest: "/manifest.webmanifest",
  title: "Titan",
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#0a0a0a",
  viewportFit: "cover",
  width: "device-width",
};

// The root layout is intentionally chrome-free: it wraps both the authenticated
// app and the login screen, so the primary navigation lives in the `(app)`
// route group's layout instead — nothing to show for a logged-out visitor.
const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
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
