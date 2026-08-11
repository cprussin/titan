import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RpePicker } from "./RpePicker";

describe(RpePicker, () => {
  it("offers a 1-10 slider labeled by an associated field label", () => {
    render(<RpePicker onChange={() => undefined} value={undefined} />);
    const slider = screen.getByRole("slider", { name: "RPE (optional)" });
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "10");
    // The label is a real associated <label> (via Field), not a loose span.
    expect(
      screen.getByText("RPE (optional)").closest("label"),
    ).toBeInTheDocument();
  });

  it("reads out an em dash until a value is set, then the number", () => {
    const { rerender } = render(
      <RpePicker onChange={() => undefined} value={undefined} />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
    rerender(<RpePicker onChange={() => undefined} value={8} />);
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.queryByText("—")).not.toBeInTheDocument();
  });

  it("reports the chosen effort when the slider moves", async () => {
    const chosen = await new Promise<number>((resolve) => {
      render(<RpePicker onChange={resolve} value={5} />);
      fireEvent.keyDown(
        screen.getByRole("slider", { name: "RPE (optional)" }),
        {
          key: "ArrowRight",
        },
      );
    });
    expect(chosen).toBe(6);
  });
});
