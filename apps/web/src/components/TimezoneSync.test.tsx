import { beforeEach, describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import { TimezoneSync } from "./TimezoneSync";

// happy-dom's global registrator, exposed by the shared test preload. Cookies
// only stick against a real origin, so tests point the document at one.
declare const happyDOM: { setURL: (url: string) => void };

// The refresh is the only router method under test; the rest are inert stubs.
// The router is a Next.js platform global supplied via context, not injected.
const stubRouter = (refresh: () => void): AppRouterInstance => ({
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh,
  replace: () => undefined,
});

const renderWithRouter = (ui: ReactElement, refresh: () => void) =>
  render(
    <AppRouterContext.Provider value={stubRouter(refresh)}>
      {ui}
    </AppRouterContext.Provider>,
  );

describe(TimezoneSync, () => {
  beforeEach(() => {
    happyDOM.setURL("https://app.test/");
    // happy-dom keeps one document across tests; expire any cookie left behind.
    // biome-ignore lint/suspicious/noDocumentCookie: reset the cookie the component writes
    document.cookie = "tz=; path=/; max-age=0";
  });

  it("writes the detected zone and refreshes when it differs from the server's", () => {
    let refreshed = false;
    renderWithRouter(
      <TimezoneSync current="UTC" detect={() => "America/New_York"} />,
      () => {
        refreshed = true;
      },
    );
    expect(document.cookie).toContain("tz=America/New_York");
    expect(refreshed).toBe(true);
  });

  it("stays quiet when the detected zone already matches the server's", () => {
    let refreshed = false;
    renderWithRouter(
      <TimezoneSync
        current="America/New_York"
        detect={() => "America/New_York"}
      />,
      () => {
        refreshed = true;
      },
    );
    expect(refreshed).toBe(false);
  });
});
