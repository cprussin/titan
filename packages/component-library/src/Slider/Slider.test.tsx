import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Slider } from "./Slider";

describe(Slider, () => {
  describe("rendering", () => {
    it("renders a labeled slider over the given range at the given value", () => {
      render(<Slider aria-label="Volume" max={10} min={1} value={4} />);
      const slider = screen.getByRole("slider", { name: "Volume" });
      expect(slider).toHaveAttribute("min", "1");
      expect(slider).toHaveAttribute("max", "10");
      expect(slider).toHaveAttribute("aria-valuenow", "4");
    });
  });

  describe("interactions", () => {
    it("reports the stepped value when moved with the keyboard", async () => {
      const next = await new Promise<number>((resolve) => {
        render(
          <Slider
            aria-label="Volume"
            max={10}
            min={1}
            onValueChange={resolve}
            value={4}
          />,
        );
        fireEvent.keyDown(screen.getByRole("slider", { name: "Volume" }), {
          key: "ArrowRight",
        });
      });
      expect(next).toBe(5);
    });

    it("disables the control when disabled", () => {
      render(
        <Slider aria-label="Volume" disabled max={10} min={1} value={4} />,
      );
      expect(screen.getByRole("slider", { name: "Volume" })).toBeDisabled();
    });
  });
});
