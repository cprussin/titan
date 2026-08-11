import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RpePicker } from "./RpePicker";

describe(RpePicker, () => {
  it("offers a 1-10 slider labeled for RPE", () => {
    render(<RpePicker onChange={() => undefined} value={undefined} />);
    const slider = screen.getByRole("slider", { name: "RPE" });
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "10");
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
      fireEvent.keyDown(screen.getByRole("slider", { name: "RPE" }), {
        key: "ArrowRight",
      });
    });
    expect(chosen).toBe(6);
  });
});
