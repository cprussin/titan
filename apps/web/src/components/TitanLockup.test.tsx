import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { TitanLockup } from "./TitanLockup";

describe(TitanLockup, () => {
  it("sets the brand name as live text", () => {
    render(<TitanLockup />);
    expect(screen.getByText("TITAN")).toBeInTheDocument();
  });

  it("keeps the mark decorative so only the wordmark is announced", () => {
    const { container } = render(<TitanLockup orientation="stacked" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(screen.getByText("TITAN")).toBeInTheDocument();
  });
});
