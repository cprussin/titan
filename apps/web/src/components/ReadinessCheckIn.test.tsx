import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { ReadinessCheckIn } from "./ReadinessCheckIn";

const noop = () => undefined;

type Overrides = Partial<{
  availableMinutes: number;
  energy: number;
  onAvailableMinutesChange: (value: number) => void;
  onEnergyChange: (value: number) => void;
  onSleepQualityChange: (value: number) => void;
  onSorenessChange: (value: number) => void;
  sleepQuality: number;
  soreness: number;
}>;

const renderCheckIn = (overrides: Overrides = {}) =>
  render(
    <ReadinessCheckIn
      availableMinutes={overrides.availableMinutes ?? 60}
      energy={overrides.energy ?? 3}
      onAvailableMinutesChange={overrides.onAvailableMinutesChange ?? noop}
      onEnergyChange={overrides.onEnergyChange ?? noop}
      onSleepQualityChange={overrides.onSleepQualityChange ?? noop}
      onSorenessChange={overrides.onSorenessChange ?? noop}
      sleepQuality={overrides.sleepQuality ?? 3}
      soreness={overrides.soreness ?? 3}
    />,
  );

describe(ReadinessCheckIn, () => {
  it("labels each rating group and the time field via associated field labels", () => {
    renderCheckIn();
    for (const label of ["Energy", "Soreness (5 = fresh)", "Sleep quality"]) {
      expect(screen.getByText(label).closest("label")).toBeInTheDocument();
    }
    expect(
      screen.getByRole("spinbutton", { name: "Available time (min)" }),
    ).toBeInTheDocument();
  });

  it("reports the chosen rating from the right group when a button is clicked", async () => {
    const chosen = await new Promise<number>((resolve) => {
      renderCheckIn({ onSorenessChange: resolve });
      const group = screen
        .getByText("Soreness (5 = fresh)")
        .closest("[data-titan-field]") as HTMLElement;
      fireEvent.click(within(group).getByRole("button", { name: "5" }));
    });
    expect(chosen).toBe(5);
  });

  it("reports the available minutes as they are typed", async () => {
    const minutes = await new Promise<number>((resolve) => {
      renderCheckIn({ onAvailableMinutesChange: resolve });
      fireEvent.change(
        screen.getByRole("spinbutton", { name: "Available time (min)" }),
        { target: { value: "45" } },
      );
    });
    expect(minutes).toBe(45);
  });
});
