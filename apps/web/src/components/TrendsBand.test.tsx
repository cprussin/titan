import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { TrendsBand } from "./TrendsBand";

const names = new Map([
  ["squat", "Back Squat"],
  ["bench", "Bench Press"],
]);

const bodyWeight = {
  dates: ["2026-01-02", "2026-02-14"],
  latestWeightLb: 184,
  series: [182, 184],
};

const full = (
  <TrendsBand
    load={{
      isLoading: false,
      value: {
        bodyWeight,
        names,
        rowPace: {
          dates: ["2026-03-03", "2026-04-04"],
          latestSplitSec: 112,
          values: [114, 112],
        },
        strengthSeries: [
          {
            dates: ["2026-05-05", "2026-06-06"],
            exerciseId: "squat",
            unit: "lb",
            values: [270, 272.5],
          },
          {
            dates: ["2026-07-07", "2026-08-08"],
            exerciseId: "bench",
            unit: "lb",
            values: [205, 207.5],
          },
        ],
      },
    }}
  />
);

/** The hit target for a point on the named chart. */
const chartPoint = (label: string, index: number) => {
  const target = [
    ...screen
      .getByRole("img", { name: label })
      .querySelectorAll("[data-sparkline-point]"),
  ].at(index);
  if (target === undefined) {
    throw new Error(`no point ${index} on ${label}`);
  } else {
    return target;
  }
};

describe(TrendsBand, () => {
  it("renders a labeled value per strength lift, row pace, and body weight", () => {
    render(full);
    expect(screen.getByText("Est. 1RM · Back Squat")).toBeDefined();
    expect(screen.getByText("272.5 lb")).toBeDefined();
    expect(screen.getByText("Est. 1RM · Bench Press")).toBeDefined();
    expect(screen.getByText("Row pace · 500m split")).toBeDefined();
    expect(screen.getByText("1:52.0")).toBeDefined();
    expect(screen.getByText("184 lb")).toBeDefined();
  });

  it("reads the picked point's value while a chart is being read", () => {
    render(full);
    const point = chartPoint("Est. 1RM · Back Squat trend", 0);
    fireEvent.pointerEnter(point, { pointerType: "mouse" });
    expect(screen.getByText("270 lb")).toBeDefined();
    expect(screen.queryByText("272.5 lb")).toBeNull();
  });

  it("dates a column at its newest point, then at the point being read", () => {
    render(full);
    expect(screen.getByText("Jun 6, 2026")).toBeDefined();
    fireEvent.pointerEnter(chartPoint("Est. 1RM · Back Squat trend", 0), {
      pointerType: "mouse",
    });
    expect(screen.getByText("May 5, 2026")).toBeDefined();
    expect(screen.queryByText("Jun 6, 2026")).toBeNull();
  });

  it("returns the column to its latest value when the mouse leaves", () => {
    render(full);
    const chart = screen.getByRole("img", {
      name: "Row pace · 500m split trend",
    });
    fireEvent.pointerEnter(chartPoint("Row pace · 500m split trend", 0), {
      pointerType: "mouse",
    });
    expect(screen.getByText("1:54.0")).toBeDefined();
    fireEvent.pointerLeave(chart, { pointerType: "mouse" });
    expect(screen.getByText("1:52.0")).toBeDefined();
  });

  it("reads the picked point's weight on the body-weight column", () => {
    render(full);
    fireEvent.pointerEnter(chartPoint("Body weight trend", 0), {
      pointerType: "touch",
    });
    expect(screen.getByText("182 lb")).toBeDefined();
    expect(screen.queryByText("184 lb")).toBeNull();
  });

  it("toggles the mobile show-more control", () => {
    render(full);
    const toggle = screen.getByRole("button", { name: /Show more/i });
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /Show less/i })).toBeDefined();
  });

  it("marks the extras region expanded as the toggle flips", () => {
    const { container } = render(full);
    const extras = container.querySelector("[data-trends-extras]");
    expect(extras?.getAttribute("data-expanded")).toBeNull();
    const toggle = screen.getByRole("button", { name: /Show more/i });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);
    expect(extras?.getAttribute("data-expanded")).toBe("");
    expect(
      screen
        .getByRole("button", { name: /Show less/i })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("has no toggle when there is only body weight to show", () => {
    render(
      <TrendsBand
        load={{
          isLoading: false,
          value: {
            bodyWeight,
            names,
            rowPace: undefined,
            strengthSeries: [],
          },
        }}
      />,
    );
    expect(screen.queryByRole("button", { name: /Show more/i })).toBeNull();
    expect(screen.getByText("184 lb")).toBeDefined();
  });

  it("fills every column with skeletons while loading", () => {
    const { container } = render(<TrendsBand load={{ isLoading: true }} />);
    expect(screen.queryByText("184 lb")).toBeNull();
    expect(screen.queryByText(/Est. 1RM/)).toBeNull();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });
});
