import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Badge } from "./Badge";

describe(Badge, () => {
  it("renders its children", () => {
    render(<Badge>Primary</Badge>);
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  it("renders ReactNode children, not just strings", () => {
    render(
      <Badge>
        <span data-testid="dot">•</span> Live
      </Badge>,
    );
    expect(screen.getByTestId("dot")).toBeInTheDocument();
    expect(screen.getByText(/Live/)).toBeInTheDocument();
  });

  it("applies a different class per tone", () => {
    const { rerender } = render(<Badge tone="accent">Tag</Badge>);
    const accentClass = screen.getByText("Tag").className;
    rerender(<Badge tone="danger">Tag</Badge>);
    expect(screen.getByText("Tag").className).not.toBe(accentClass);
  });

  it("defaults to the neutral tone", () => {
    render(<Badge tone="neutral">Neutral</Badge>);
    const explicit = screen.getByText("Neutral").className;
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default").className).toBe(explicit);
  });
});
