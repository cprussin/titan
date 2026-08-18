import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { RpePicker } from "./RpePicker";

const RPE_LABELS = Array.from({ length: 10 }, (_, index) => String(index + 1));

describe(RpePicker, () => {
  it("offers a 1-10 toggle button for each effort within a named group", () => {
    render(<RpePicker onChange={() => undefined} value={undefined} />);
    const group = screen.getByRole("group", { name: "RPE" });
    for (const label of RPE_LABELS) {
      expect(
        within(group).getByRole("button", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("reads out an em dash until a value is set, then the number", () => {
    // Scope the readout assertions to the field's <label>; the toggle buttons
    // carry the same digits, so an unscoped getByText("8") would be ambiguous.
    const readout = () => {
      const label = screen.getByText("RPE").closest("label");
      if (label === null) {
        throw new Error("RPE field label did not render as a <label>");
      }
      return within(label);
    };
    const { rerender } = render(
      <RpePicker onChange={() => undefined} value={undefined} />,
    );
    expect(readout().getByText("—")).toBeInTheDocument();
    rerender(<RpePicker onChange={() => undefined} value={8} />);
    expect(readout().getByText("8")).toBeInTheDocument();
    expect(readout().queryByText("—")).not.toBeInTheDocument();
  });

  it("marks the chosen effort's toggle as pressed", () => {
    render(<RpePicker onChange={() => undefined} value={8} />);
    expect(screen.getByRole("button", { name: "8" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "7" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports the chosen effort when a button is pressed", async () => {
    const chosen = await new Promise<number>((resolve) => {
      render(<RpePicker onChange={resolve} value={undefined} />);
      fireEvent.click(screen.getByRole("button", { name: "6" }));
    });
    expect(chosen).toBe(6);
  });

  it("keeps the effort when the selected button is tapped again", () => {
    // RPE is mandatory, so the group has no "unset" state to fall back to once
    // a value is chosen: re-tapping the pressed button reports nothing.
    const reported: number[] = [];
    render(
      <RpePicker
        onChange={(value) => {
          reported.push(value);
        }}
        value={6}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "6" }));
    expect(reported).toStrictEqual([]);
  });
});
