import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { BodyWeightTrendCard } from "./BodyWeightTrendCard";

const dates = ["2026-01-05", "2026-01-12"];

describe(BodyWeightTrendCard, () => {
  it("shows the latest weight", () => {
    render(
      <BodyWeightTrendCard
        dates={dates}
        latestWeightLb={184}
        series={[182, 184]}
      />,
    );
    expect(screen.getByText("184 lb")).toBeDefined();
  });

  it("dates the trend at its newest weigh-in, then at the one being read", () => {
    const { container } = render(
      <BodyWeightTrendCard
        dates={dates}
        latestWeightLb={184}
        series={[182, 184]}
      />,
    );
    expect(screen.getByText("Jan 12, 2026")).toBeDefined();
    const point = container.querySelectorAll("[data-sparkline-point]")[0];
    if (point === undefined) {
      throw new Error("the trend line has no hit targets");
    }
    fireEvent.pointerEnter(point, { pointerType: "mouse" });
    expect(screen.getByText("Jan 5, 2026")).toBeDefined();
    expect(screen.getByText("182 lb")).toBeDefined();
  });
});
