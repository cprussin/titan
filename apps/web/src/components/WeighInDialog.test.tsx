import { describe, expect, it, spyOn } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { BodyMetric } from "@titan/domain/body-metric";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Button } from "../ui";
import { WeighInDialog } from "./WeighInDialog";

const router: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

const metrics = [
  { date: "2026-01-12", id: "m2", userId: "default", weightLb: 182.5 },
] as BodyMetric[];

/** Mount the dialog with a loader that records every call it receives. */
const renderDialog = (load: () => Promise<readonly BodyMetric[]>) => {
  const calls: number[] = [];
  render(
    <AppRouterContext.Provider value={router}>
      <WeighInDialog
        loadWeighIns={() => {
          calls.push(calls.length);
          return load();
        }}
        trigger={<Button>Weigh in</Button>}
      />
    </AppRouterContext.Provider>,
  );
  return calls;
};

/** Open the dialog and let its history load settle. */
const open = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Weigh in" }));
    await Promise.resolve();
  });
};

describe(WeighInDialog, () => {
  it("offers today's entry form over the weigh-ins already on record", async () => {
    renderDialog(() => Promise.resolve(metrics));
    await open();
    expect(
      screen.getByRole("spinbutton", { name: "Bodyweight in pounds" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Past weigh-ins" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Jan 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("182.5 lb")).toBeInTheDocument();
  });

  it("reads the history only once the dialog is opened", async () => {
    const calls = renderDialog(() => Promise.resolve(metrics));
    expect(calls).toEqual([]);
    await open();
    expect(calls).toEqual([0]);
  });

  it("says the history could not be read rather than showing it as empty", async () => {
    const errorLog = spyOn(console, "error").mockImplementation(
      () => undefined,
    );
    try {
      renderDialog(() => Promise.reject(new Error("offline")));
      await open();
      expect(screen.getByText(/Couldn’t load/i)).toBeInTheDocument();
      expect(screen.queryByText(/No weigh-ins logged yet/i)).toBeNull();
      expect(errorLog).toHaveBeenCalled();
    } finally {
      errorLog.mockRestore();
    }
  });
});
