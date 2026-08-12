import { describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactNode } from "react";
import { BodyWeightTrendCard } from "./BodyWeightTrendCard";
import { useWeighIn, WeighInProvider } from "./WeighInContext";

const stubRouter = (refresh: () => void): AppRouterInstance => ({
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh,
  replace: () => undefined,
});

/** A trigger so tests can open the shared weigh-in state the headline owns. */
const Opener = () => {
  const { open } = useWeighIn();
  return (
    <button onClick={open} type="button">
      open weigh-in
    </button>
  );
};

const renderCard = (ui: ReactNode, refresh: () => void = () => undefined) =>
  render(
    <AppRouterContext.Provider value={stubRouter(refresh)}>
      <WeighInProvider>
        <Opener />
        {ui}
      </WeighInProvider>
    </AppRouterContext.Provider>,
  );

const noopSave = () => Promise.resolve();

const openEditor = () =>
  fireEvent.click(screen.getByRole("button", { name: "open weigh-in" }));

describe(BodyWeightTrendCard, () => {
  it("shows the latest weight in display mode with no editor", () => {
    renderCard(
      <BodyWeightTrendCard
        latestWeightLb={184}
        save={noopSave}
        series={[182, 184]}
      />,
    );
    expect(screen.getByText("184 lb")).toBeDefined();
    expect(
      screen.queryByRole("spinbutton", { name: "Body weight in pounds" }),
    ).toBeNull();
  });

  it("swaps into an input prefilled with the last weight when opened", () => {
    renderCard(
      <BodyWeightTrendCard
        latestWeightLb={184}
        save={noopSave}
        series={[182, 184]}
      />,
    );
    openEditor();
    const input = screen.getByRole("spinbutton", {
      name: "Body weight in pounds",
    });
    expect((input as HTMLInputElement).value).toBe("184");
  });

  it("saves the entered weight and refreshes", async () => {
    const saved: number[] = [];
    const refreshed = new Promise<void>((resolve) => {
      renderCard(
        <BodyWeightTrendCard
          latestWeightLb={184}
          save={(weightLb) => {
            saved.push(weightLb);
            return Promise.resolve();
          }}
          series={[182, 184]}
        />,
        resolve,
      );
    });
    openEditor();
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
    renderCard(
      <BodyWeightTrendCard
        latestWeightLb={184}
        save={noopSave}
        series={[182, 184]}
      />,
    );
    openEditor();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("spinbutton", { name: "Body weight in pounds" }),
    ).toBeNull();
    expect(screen.getByText("184 lb")).toBeDefined();
  });
});
