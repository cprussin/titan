import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import { DashboardHeader } from "./DashboardHeader";

const router = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

const withRouter = (ui: ReactElement) =>
  render(
    <AppRouterContext.Provider value={router}>{ui}</AppRouterContext.Provider>,
  );

describe(DashboardHeader, () => {
  it("renders the eyebrow, title, and subtitle", () => {
    render(
      <DashboardHeader
        eyebrow="MON 10 · Logged · Athletic Health Foundation · Week 3 of 8"
        eyebrowTone="success"
        subtitle="5 exercises · 18 sets · 52 min · avg RPE 7.2"
        title="Volume Upper"
        trailing={{ kind: "back-to-today" }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Volume Upper" })).toBeDefined();
    expect(screen.getByText(/MON 10 · Logged/)).toBeDefined();
    expect(screen.getByText(/avg RPE 7.2/)).toBeDefined();
  });

  it("offers a back-to-today link", () => {
    render(
      <DashboardHeader
        eyebrow="FRI 14 · Projected"
        eyebrowTone="tertiary"
        subtitle={undefined}
        title="Heavy Upper"
        trailing={{ kind: "back-to-today" }}
      />,
    );
    const link = screen.getByRole("link", { name: "Back to today" });
    expect(link.getAttribute("href")).toBe("/");
  });

  it("shows the next session and recovery note when complete", () => {
    render(
      <DashboardHeader
        eyebrow="Today · Complete"
        eyebrowTone="success"
        subtitle="6 exercises · 22 sets · 58 min · avg RPE 7.5"
        title="Heavy Lower done"
        trailing={{
          kind: "completed",
          nextLabel: "Row Intervals · Thu 13",
          recovery: "Recover well — walk, stretch, or take an easy row.",
        }}
      />,
    );
    expect(screen.getByText(/Next: Row Intervals · Thu 13/)).toBeDefined();
    expect(screen.getByText(/Recover well/)).toBeDefined();
  });

  it("shows the launch control before a workout", () => {
    withRouter(
      <DashboardHeader
        eyebrow="Athletic Health Foundation · Week 3 of 8"
        eyebrowTone="accent"
        subtitle={undefined}
        title="Heavy Lower"
        trailing={{ action: { kind: "start" }, kind: "start-workout" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Start workout" })).toBeDefined();
  });
});
