import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { TitanMark } from "./TitanMark";

describe(TitanMark, () => {
  it("sizes the svg to the given size", () => {
    const { container } = render(<TitanMark size={20} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
  });

  it("is decorative, so it exposes no accessible content", () => {
    const { container } = render(<TitanMark size={96} />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });
});
