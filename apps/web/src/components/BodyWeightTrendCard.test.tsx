import { describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import { BodyWeightTrendCard } from "./BodyWeightTrendCard";

const stubRouter = (refresh: () => void): AppRouterInstance => ({
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh,
  replace: () => undefined,
});

const renderWithRouter = (
  ui: ReactElement,
  refresh: () => void = () => undefined,
) =>
  render(
    <AppRouterContext.Provider value={stubRouter(refresh)}>
      {ui}
    </AppRouterContext.Provider>,
  );

const noopSave = async () => undefined;

describe(BodyWeightTrendCard, () => {
  it("shows the latest weight and a weigh-in button in display mode", () => {
    renderWithRouter(
      <BodyWeightTrendCard
        lastWeighInLabel="Yesterday"
        latestWeightLb={184}
        save={noopSave}
        series={[182, 184]}
        weighedInToday={false}
      />,
    );
    expect(screen.getByText("184 lb")).toBeDefined();
    expect(screen.getByRole("button", { name: "Weigh in" })).toBeDefined();
    expect(screen.getByText(/Last weigh-in/i)).toBeDefined();
  });

  it("hides the weigh-in button once weighed in today", () => {
    renderWithRouter(
      <BodyWeightTrendCard
        lastWeighInLabel="Today"
        latestWeightLb={184}
        save={noopSave}
        series={[182, 184]}
        weighedInToday={true}
      />,
    );
    expect(screen.queryByRole("button", { name: "Weigh in" })).toBeNull();
  });

  it("reveals an input prefilled with the last weight when weighing in", () => {
    renderWithRouter(
      <BodyWeightTrendCard
        lastWeighInLabel="Yesterday"
        latestWeightLb={184}
        save={noopSave}
        series={[182, 184]}
        weighedInToday={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Weigh in" }));
    const input = screen.getByRole("spinbutton", {
      name: "Body weight in pounds",
    });
    expect((input as HTMLInputElement).value).toBe("184");
  });

  it("saves the entered weight and refreshes", async () => {
    const saved: number[] = [];
    const refreshed = new Promise<void>((resolve) => {
      renderWithRouter(
        <BodyWeightTrendCard
          lastWeighInLabel="Yesterday"
          latestWeightLb={184}
          save={async (weightLb) => {
            saved.push(weightLb);
          }}
          series={[182, 184]}
          weighedInToday={false}
        />,
        resolve,
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Weigh in" }));
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Body weight in pounds" }),
      { target: { value: "183.5" } },
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await refreshed;
    });
    expect(saved).toEqual([183.5]);
  });

  it("returns to display mode on cancel", () => {
    renderWithRouter(
      <BodyWeightTrendCard
        lastWeighInLabel="Yesterday"
        latestWeightLb={184}
        save={noopSave}
        series={[182, 184]}
        weighedInToday={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Weigh in" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("spinbutton", { name: "Body weight in pounds" }),
    ).toBeNull();
    expect(screen.getByText("184 lb")).toBeDefined();
  });
});
