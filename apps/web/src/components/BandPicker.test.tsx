import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BandLevel } from "@titan/domain/band";

import { BandPicker } from "./BandPicker";

const noop = () => undefined;

const COMBINATION_LABELS = [
  "Red",
  "Black",
  "Purple",
  "Green",
  "Green + Red",
  "Green + Black",
  "Green + Purple",
  "Green + Purple + Red",
  "Green + Purple + Black",
  "Green + Purple + Black + Red",
];

const openPicker = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "Band" }));
  return user;
};

/** Collects what the picker reports. The clicks that drive the dropdown have to
 *  be awaited — an un-awaited one updates React outside `act` — so the reports
 *  are gathered as they arrive rather than raced against a promise. */
const reports = (): {
  onChange: (bands: readonly BandLevel[] | undefined) => void;
  reported: readonly (readonly BandLevel[] | undefined)[];
} => {
  const reported: (readonly BandLevel[] | undefined)[] = [];
  return {
    onChange: (bands) => {
      reported.push(bands);
    },
    reported,
  };
};

describe(BandPicker, () => {
  it("offers every combination the athlete's band set makes", async () => {
    render(<BandPicker onChange={noop} value={undefined} />);
    await openPicker();
    for (const label of COMBINATION_LABELS) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });

  it("reports the bands behind the chosen combination", async () => {
    const { onChange, reported } = reports();
    render(<BandPicker onChange={onChange} value={undefined} />);
    const user = await openPicker();
    await user.click(screen.getByRole("option", { name: "Green + Red" }));
    expect(reported).toEqual([["green", "red"]]);
  });

  it("shows the bands already recorded", () => {
    render(<BandPicker onChange={noop} value={["green", "purple"]} />);
    expect(
      screen.getByRole("combobox", { name: "Band" }).textContent,
    ).toContain("Green + Purple");
  });

  it("records nothing when the athlete has not chosen a band", () => {
    render(<BandPicker onChange={noop} value={undefined} />);
    expect(
      screen.getByRole("combobox", { name: "Band" }).textContent,
    ).toContain("Not recorded");
  });

  it("clears the bands when the athlete picks no band at all", async () => {
    const { onChange, reported } = reports();
    render(<BandPicker onChange={onChange} value={["green"]} />);
    const user = await openPicker();
    await user.click(screen.getByRole("option", { name: "Not recorded" }));
    expect(reported).toEqual([undefined]);
  });
});
