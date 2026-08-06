import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { AppNav } from "../components/AppNav";
import { AppProviders } from "../components/AppProviders";
import { NavDrawerProvider } from "../components/NavDrawer";
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

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className={bodyStyles}>
      <AppProviders>
        <NavDrawerProvider>
          <main className={mainStyles}>{children}</main>
          <AppNav />
        </NavDrawerProvider>
        <RegisterServiceWorker />
      </AppProviders>
    </body>
  </html>
);

export default RootLayout;

const bodyStyles = css({
  color: "foreground",
  // Offset the content by the sidebar's width only from `lg` up, where the
  // sidebar is permanent. In the `mdToLg` window the sidebar is an overlaid
  // drawer, and below `md` it's the bottom bar — neither reserves inline space.
  lg: { paddingInlineStart: 60 },
  minBlockSize: "100dvh",
});

const mainStyles = css({
  // Fills the area beside the rail so the top bar and content run the full
  // width. Padding steps up with the viewport; from `md` up the rail replaces
  // the bottom bar, so the tall bottom padding it needed goes away.
  lg: { paddingBlock: 8, paddingInline: 8 },
  md: { paddingBlock: 6, paddingInline: 6 },
  paddingBlockEnd: 24,
  paddingBlockStart: 4,
  paddingInline: 4,
});
