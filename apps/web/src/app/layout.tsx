import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { AppNav } from "../components/AppNav";
import { RegisterServiceWorker } from "../components/RegisterServiceWorker";
import { Provider } from "../ui";

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
      <Provider>
        <main className={mainStyles}>{children}</main>
        <AppNav />
        <RegisterServiceWorker />
      </Provider>
    </body>
  </html>
);

export default RootLayout;

const bodyStyles = css({
  color: "foreground",
  // Offset the fixed sidebar rail from `lg` up (the tab bar reflows to the
  // inline-start edge there); below `lg` the bar rides the bottom instead.
  lg: { paddingInlineStart: 60 },
  minBlockSize: "100dvh",
});

const mainStyles = css({
  // Fills the area beside the sidebar so the top bar and content run the full
  // width. Padding steps up with the viewport; on `lg` the sidebar replaces the
  // bottom bar, so the end padding shrinks.
  lg: { paddingBlock: 8, paddingInline: 8 },
  md: { paddingInline: 6 },
  paddingBlockEnd: 24,
  paddingBlockStart: 4,
  paddingInline: 4,
});
