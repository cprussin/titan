import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { SessionAlternativePicker } from "./SessionAlternativePicker";

const ALTERNATIVES = [
  { id: "row", label: "Row — 75 min" },
  { id: "trail-run", label: "Trail Run — 60 min" },
  { id: "hike", label: "Mountain Hike — 90 min" },
];

describe(SessionAlternativePicker, () => {
  it("offers a toggle for every alternative within a named group", () => {
    render(
      <SessionAlternativePicker
        alternatives={ALTERNATIVES}
        onChange={() => undefined}
        value="row"
      />,
    );
    const group = screen.getByRole("group", { name: "Today's session" });
    for (const { label } of ALTERNATIVES) {
      expect(within(group).getByRole("button", { name: label })).toBeDefined();
    }
  });

  it("marks the chosen alternative as pressed", () => {
    render(
      <SessionAlternativePicker
        alternatives={ALTERNATIVES}
        onChange={() => undefined}
        value="hike"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Mountain Hike — 90 min" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Row — 75 min" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("reports the alternative the athlete taps", async () => {
    const chosen = await new Promise<string>((resolve) => {
      render(
        <SessionAlternativePicker
          alternatives={ALTERNATIVES}
          onChange={resolve}
          value="row"
        />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Trail Run — 60 min" }),
      );
    });
    expect(chosen).toBe("trail-run");
  });

  it("keeps the choice when the pressed alternative is tapped again", () => {
    // One of the alternatives always runs, so the group has no unchosen state
    // to fall back to: re-tapping the pressed one reports nothing.
    const reported: string[] = [];
    render(
      <SessionAlternativePicker
        alternatives={ALTERNATIVES}
        onChange={(id) => reported.push(id)}
        value="row"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Row — 75 min" }));
    expect(reported).toEqual([]);
  });
});
