import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { Skeleton } from "./Skeleton";

describe(Skeleton, () => {
  it("renders a decorative placeholder hidden from assistive tech", () => {
    const { container } = render(<Skeleton />);
    const placeholder = container.querySelector("[data-skeleton]");
    expect(placeholder).not.toBeNull();
    expect(placeholder).toHaveAttribute("aria-hidden");
  });

  it("sizes itself from explicit width and height", () => {
    const { container } = render(<Skeleton height="2rem" width="8rem" />);
    const placeholder = container.querySelector<HTMLElement>("[data-skeleton]");
    expect(placeholder?.style.inlineSize).toBe("8rem");
    expect(placeholder?.style.blockSize).toBe("2rem");
  });

  it("leaves the size to CSS when width and height are omitted", () => {
    const { container } = render(<Skeleton />);
    const placeholder = container.querySelector<HTMLElement>("[data-skeleton]");
    expect(placeholder?.style.inlineSize).toBe("");
    expect(placeholder?.style.blockSize).toBe("");
  });

  it("applies a different class per radius", () => {
    const { container: rounded } = render(<Skeleton radius="sm" />);
    const { container: circular } = render(<Skeleton radius="full" />);
    expect(rounded.querySelector("[data-skeleton]")?.className).not.toBe(
      circular.querySelector("[data-skeleton]")?.className,
    );
  });
});
