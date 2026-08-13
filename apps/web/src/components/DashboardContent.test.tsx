import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import type { WeekDay } from "../server/week-schedule";
import type { DashboardData } from "./DashboardContent";
import { DashboardContent } from "./DashboardContent";
import { NavDrawerProvider } from "./NavDrawer";

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
      <NavDrawerProvider>{ui}</NavDrawerProvider>
    </AppRouterContext.Provider>,
  );

// Today flanked by a day on either side, so the ribbon's opening window is
// already covered and it prefetches nothing during this composition test.
const days: readonly WeekDay[] = [
  {
    date: "2026-08-10",
    dayOfWeek: 1,
    isPast: true,
    isToday: false,
    kind: "rest",
    label: "MON 10",
  },
  {
    date: "2026-08-11",
    dayOfWeek: 2,
    isPast: false,
    isToday: true,
    kind: "rest",
    label: "TUE 11",
  },
  {
    date: "2026-08-12",
    dayOfWeek: 3,
    isPast: false,
    isToday: false,
    kind: "rest",
    label: "WED 12",
  },
];

const data: DashboardData = {
  body: { copy: "Recover well today.", kind: "rest" },
  header: {
    eyebrow: {
      programName: "Athletic Health Foundation",
      status: { text: "Today · Rest", tone: "tertiary" },
      weekCount: "W1 / 8",
    },
    primary: { kind: "none" },
    title: "Recovery",
    weighedInToday: false,
  },
  names: new Map(),
  session: undefined,
  trends: {
    bodyWeight: { latestWeightLb: 184, series: [182, 184] },
    names: new Map(),
    rowPace: undefined,
    strengthSeries: [],
  },
  week: {
    days,
    selectedDate: "2026-08-11",
    today: "2026-08-11",
    weekOffset: 0,
  },
};

describe(DashboardContent, () => {
  it("renders the resolved dashboard", () => {
    wrap(<DashboardContent load={{ isLoading: false, value: data }} />);
    expect(screen.getByRole("heading", { name: "Recovery" })).toBeDefined();
    expect(screen.getByText("184 lb")).toBeDefined();
    expect(screen.getByText("Recover well today.")).toBeDefined();
  });

  it("renders skeletons in the same tree while loading", () => {
    const { container } = wrap(<DashboardContent load={{ isLoading: true }} />);
    // Same chrome (the Dashboard title bar) with no resolved content.
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Recovery" })).toBeNull();
    expect(screen.queryByText("184 lb")).toBeNull();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });
});
