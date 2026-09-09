import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { BodyMetric } from "@titan/domain/body-metric";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import { WeighInHistory } from "./WeighInHistory";

// The delete control reads the app router on render, so mount inside a stub
// router context (the router is a Next.js platform global).
const router: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

const renderWithRouter = (ui: ReactElement) =>
  render(
    <AppRouterContext.Provider value={router}>{ui}</AppRouterContext.Provider>,
  );

const metric = (id: string, date: string, weightLb: number): BodyMetric =>
  ({ date, id, userId: "default", weightLb }) as BodyMetric;

describe(WeighInHistory, () => {
  it("lists each weigh-in's day and weight with a way to remove it", () => {
    renderWithRouter(
      <WeighInHistory
        metrics={[
          metric("m2", "2026-01-12", 182.5),
          metric("m1", "2026-01-05", 184),
        ]}
        onDeleted={() => undefined}
      />,
    );
    expect(screen.getByText("Jan 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("182.5 lb")).toBeInTheDocument();
    expect(screen.getByText("Jan 5, 2026")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Delete weigh-in" }),
    ).toHaveLength(2);
  });

  it("says so when nothing has been weighed in yet", () => {
    renderWithRouter(
      <WeighInHistory metrics={[]} onDeleted={() => undefined} />,
    );
    expect(screen.getByText(/No weigh-ins logged yet/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete weigh-in" }),
    ).not.toBeInTheDocument();
  });
});
