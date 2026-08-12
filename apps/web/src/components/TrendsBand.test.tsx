import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import { TrendsBand } from "./TrendsBand";

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

const names = new Map([
  ["squat", "Back Squat"],
  ["bench", "Bench Press"],
]);

const bodyWeight = {
  lastWeighInLabel: "Yesterday",
  latestWeightLb: 184,
  series: [182, 184],
  weighedInToday: false,
};

describe(TrendsBand, () => {
  it("renders a labeled value per strength lift, row pace, and body weight", () => {
    withRouter(
      <TrendsBand
        bodyWeight={bodyWeight}
        names={names}
        rowPace={{ latestSplitSec: 112, values: [114, 112] }}
        strengthSeries={[
          { exerciseId: "squat", unit: "lb", values: [270, 272.5] },
          { exerciseId: "bench", unit: "lb", values: [205, 207.5] },
        ]}
      />,
    );
    expect(screen.getByText("Est. 1RM · Back Squat")).toBeDefined();
    expect(screen.getByText("272.5 lb")).toBeDefined();
    expect(screen.getByText("Est. 1RM · Bench Press")).toBeDefined();
    expect(screen.getByText("Row pace · 500m split")).toBeDefined();
    expect(screen.getByText("1:52.0")).toBeDefined();
    // Body weight is the weigh-in card.
    expect(screen.getByRole("button", { name: "Weigh in" })).toBeDefined();
    expect(screen.getByText("184 lb")).toBeDefined();
  });

  it("omits row pace and strength when there is no such data", () => {
    withRouter(
      <TrendsBand
        bodyWeight={bodyWeight}
        names={names}
        rowPace={undefined}
        strengthSeries={[]}
      />,
    );
    expect(screen.queryByText(/Row pace/)).toBeNull();
    expect(screen.queryByText(/Est. 1RM/)).toBeNull();
    expect(screen.getByText("184 lb")).toBeDefined();
  });
});
