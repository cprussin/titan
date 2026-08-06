import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import type { AccordionItem } from "./Accordion";
import { Accordion } from "./Accordion";

const ITEMS: AccordionItem[] = [
  { content: <p>Squats</p>, trigger: "Monday", value: "mon" },
  { content: <p>Rows</p>, trigger: "Tuesday", value: "tue" },
];

describe(Accordion, () => {
  it("renders a trigger per item, all collapsed", () => {
    render(<Accordion items={ITEMS} />);
    expect(screen.getByRole("button", { name: "Monday" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: "Tuesday" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("reveals a panel when its trigger is clicked", () => {
    render(<Accordion items={ITEMS} />);
    const monday = screen.getByRole("button", { name: "Monday" });
    fireEvent.click(monday);
    expect(monday).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Squats")).toBeInTheDocument();
  });

  it("collapses the open panel when another opens (single-open)", () => {
    render(<Accordion items={ITEMS} />);
    const monday = screen.getByRole("button", { name: "Monday" });
    const tuesday = screen.getByRole("button", { name: "Tuesday" });
    fireEvent.click(monday);
    fireEvent.click(tuesday);
    expect(monday).toHaveAttribute("aria-expanded", "false");
    expect(tuesday).toHaveAttribute("aria-expanded", "true");
  });

  it("allows several panels open at once with multiple", () => {
    render(<Accordion items={ITEMS} multiple />);
    const monday = screen.getByRole("button", { name: "Monday" });
    const tuesday = screen.getByRole("button", { name: "Tuesday" });
    fireEvent.click(monday);
    fireEvent.click(tuesday);
    expect(monday).toHaveAttribute("aria-expanded", "true");
    expect(tuesday).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps a disabled item closed", () => {
    render(
      <Accordion
        items={[
          {
            content: <p>Squats</p>,
            disabled: true,
            trigger: "Monday",
            value: "mon",
          },
        ]}
      />,
    );
    const monday = screen.getByRole("button", { name: "Monday" });
    // base-ui keeps a disabled trigger focusable, so it flags `aria-disabled`
    // rather than the native `disabled` attribute; either way it can't open.
    expect(monday).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(monday);
    expect(monday).toHaveAttribute("aria-expanded", "false");
  });
});
