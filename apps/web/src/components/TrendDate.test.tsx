import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TrendDate } from "./TrendDate";

const dates = ["2026-01-05", "2026-01-12"];

describe(TrendDate, () => {
  it("names the newest point's date while no point is being read", () => {
    render(<TrendDate dates={dates} />);
    expect(screen.getByText("Jan 12, 2026")).toBeDefined();
  });

  it("names the read point's date instead", () => {
    render(<TrendDate activeIndex={0} dates={dates} />);
    expect(screen.getByText("Jan 5, 2026")).toBeDefined();
  });

  it("renders nothing for a series with no points", () => {
    const { container } = render(<TrendDate dates={[]} />);
    expect(container.textContent).toBe("");
  });
});
