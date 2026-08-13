import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import type { CompleteData } from "./CompleteContent";
import { CompleteContent } from "./CompleteContent";
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

const data: CompleteData = {
  adaptations: [
    {
      exerciseName: "Bench Press",
      explanation: "Increase to 155 lb next volume session.",
      progressed: true,
      slotId: "slot-1",
    },
  ],
  exerciseNames: new Map(),
  personalRecords: [],
  results: [],
  scheduledDate: "2026-08-10",
  sessionId: "session-1",
  stats: { durationMin: 52, prCount: 0, totalSets: 18 },
};

describe(CompleteContent, () => {
  it("renders the session stats and next-session adaptations", () => {
    wrap(<CompleteContent load={{ isLoading: false, value: data }} />);
    expect(screen.getByText("52 min")).toBeDefined();
    expect(screen.getByText("Bench Press")).toBeDefined();
    expect(screen.getByText("Progressed")).toBeDefined();
  });

  it("stands in skeletons for the stats and next-session panel while loading", () => {
    const { container } = wrap(<CompleteContent load={{ isLoading: true }} />);
    expect(screen.getByRole("heading", { name: "Next session" })).toBeDefined();
    expect(screen.queryByText("52 min")).toBeNull();
    expect(screen.queryByText("Bench Press")).toBeNull();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });
});
