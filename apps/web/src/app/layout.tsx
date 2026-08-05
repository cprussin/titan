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
  minBlockSize: "100dvh",
});

const mainStyles = css({
  marginInline: "auto",
  maxInlineSize: "32rem",
  paddingBlockEnd: 24,
  paddingBlockStart: 4,
  paddingInline: 4,
});
