import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { ToggleGroup } from "./ToggleGroup";

const ITEMS = [
  { label: "Mon", value: "mon" },
  { label: "Tue", value: "tue" },
  { label: "Wed", value: "wed" },
] as const;

describe(ToggleGroup, () => {
  describe("rendering", () => {
    it("renders each item as a toggle button inside a named group", () => {
      render(<ToggleGroup aria-label="Weekday" items={ITEMS} value={[]} />);
      const group = screen.getByRole("group", { name: "Weekday" });
      for (const item of ITEMS) {
        expect(
          screen.getByRole("button", { name: item.label }),
        ).toBeInTheDocument();
      }
      expect(group).toBeInTheDocument();
    });

    it("marks the selected value's toggle as pressed", () => {
      render(
        <ToggleGroup aria-label="Weekday" items={ITEMS} value={["tue"]} />,
      );
      expect(screen.getByRole("button", { name: "Tue" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "Mon" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("disables an individual item without disabling the rest", () => {
      const items = [
        { label: "Mon", value: "mon" },
        { disabled: true, label: "Tue", value: "tue" },
      ] as const;
      render(<ToggleGroup aria-label="Weekday" items={items} value={[]} />);
      expect(screen.getByRole("button", { name: "Tue" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Mon" })).not.toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("reports the pressed values when a toggle is activated", async () => {
      const next = await new Promise<readonly string[]>((resolve) => {
        render(
          <ToggleGroup
            aria-label="Weekday"
            items={ITEMS}
            onValueChange={resolve}
            value={[]}
          />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Tue" }));
      });
      expect(next).toEqual(["tue"]);
    });

    it("clears the selection when the pressed toggle is activated again", async () => {
      const next = await new Promise<readonly string[]>((resolve) => {
        render(
          <ToggleGroup
            aria-label="Weekday"
            items={ITEMS}
            onValueChange={resolve}
            value={["tue"]}
          />,
        );
        fireEvent.click(screen.getByRole("button", { name: "Tue" }));
      });
      expect(next).toEqual([]);
    });
  });
});
