import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import type { DashboardHeaderData } from "./DashboardHeader";
import { DashboardHeader } from "./DashboardHeader";
import { WeighInProvider } from "./WeighInContext";

const router = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

const wrap = (ui: ReactElement) =>
  render(
    <AppRouterContext.Provider value={router}>
      <WeighInProvider>{ui}</WeighInProvider>
    </AppRouterContext.Provider>,
  );

const eyebrow = {
  programName: "Athletic Health Foundation",
  status: { text: "MON 10 · Logged", tone: "success" as const },
  weekCount: "W3 / 8",
};

const loaded = (value: DashboardHeaderData) =>
  ({ isLoading: false, value }) as const;

describe(DashboardHeader, () => {
  it("renders the three eyebrow segments and the title", () => {
    wrap(
      <DashboardHeader
        load={loaded({
          eyebrow,
          primary: { kind: "back-to-today" },
          title: "Volume Upper",
        })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Volume Upper" })).toBeDefined();
    expect(screen.getByText("Athletic Health Foundation")).toBeDefined();
    expect(screen.getByText("W3 / 8")).toBeDefined();
    expect(screen.getByText("MON 10 · Logged")).toBeDefined();
  });

  it("always offers a weigh-in button", () => {
    wrap(
      <DashboardHeader
        load={loaded({
          eyebrow,
          primary: { kind: "none" },
          title: "Heavy Lower",
        })}
      />,
    );
    expect(screen.getByRole("button", { name: "Weigh in" })).toBeDefined();
  });

  it("offers a back-to-today link as the primary action", () => {
    wrap(
      <DashboardHeader
        load={loaded({
          eyebrow,
          primary: { kind: "back-to-today" },
          title: "Heavy Upper",
        })}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Back to today" }).getAttribute("href"),
    ).toBe("/");
  });

  it("shows the launch control before today's workout", () => {
    wrap(
      <DashboardHeader
        load={loaded({
          eyebrow: { ...eyebrow, status: undefined },
          primary: { action: { kind: "start" }, kind: "start-workout" },
          title: "Heavy Lower",
        })}
      />,
    );
    expect(screen.getByRole("button", { name: "Start workout" })).toBeDefined();
  });

  it("stands in skeletons while loading, with no headline or actions", () => {
    const { container } = wrap(<DashboardHeader load={{ isLoading: true }} />);
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByRole("button", { name: "Weigh in" })).toBeNull();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });
});
