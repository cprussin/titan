import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Sparkline } from "./Sparkline";

const values = [180, 184, 182];

/** The per-point hit targets, in series order. */
const points = (container: HTMLElement) => [
  ...container.querySelectorAll("[data-sparkline-point]"),
];

/** The one hit target for `index`, failing loudly when the chart has none. */
const point = (container: HTMLElement, index: number) => {
  const target = points(container).at(index);
  if (target === undefined) {
    throw new Error(`no hit target at ${index}`);
  } else {
    return target;
  }
};

/** The chart itself, the surface a pointer enters and leaves. */
const chart = () => screen.getByRole("img", { name: "Trend" });

describe(Sparkline, () => {
  it("reports the point the pointer lands on", async () => {
    const reported = await new Promise((resolve) => {
      const { container } = render(
        <Sparkline
          label="Trend"
          onActiveIndexChange={resolve}
          values={values}
        />,
      );
      fireEvent.pointerEnter(point(container, 1), { pointerType: "mouse" });
    });
    expect(reported).toBe(1);
  });

  it("ends the reading when the mouse leaves the chart", () => {
    const reported: (number | undefined)[] = [];
    const { container } = render(
      <Sparkline
        label="Trend"
        onActiveIndexChange={(index) => reported.push(index)}
        values={values}
      />,
    );
    fireEvent.pointerEnter(point(container, 1), { pointerType: "mouse" });
    fireEvent.pointerLeave(chart(), { pointerType: "mouse" });
    expect(reported).toEqual([1, undefined]);
  });

  it("holds the tapped point after the finger lifts", () => {
    const reported: (number | undefined)[] = [];
    const { container } = render(
      <Sparkline
        label="Trend"
        onActiveIndexChange={(index) => reported.push(index)}
        values={values}
      />,
    );
    fireEvent.pointerEnter(point(container, 2), { pointerType: "touch" });
    fireEvent.pointerLeave(chart(), { pointerType: "touch" });
    expect(reported).toEqual([2]);
  });

  it("marks the active point with a guide line", () => {
    const { container } = render(
      <Sparkline activeIndex={1} label="Trend" values={values} />,
    );
    expect(
      container.querySelector("[data-sparkline-guide]")?.getAttribute("x1"),
    ).toBe("50");
  });

  it("has no hit targets when no reader is listening", () => {
    const { container } = render(<Sparkline label="Trend" values={values} />);
    expect(points(container)).toEqual([]);
  });
});
