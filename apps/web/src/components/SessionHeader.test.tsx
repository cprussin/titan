import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { SessionHeader } from "./SessionHeader";

describe(SessionHeader, () => {
  it("renders the session label and its summary", () => {
    render(
      <SessionHeader
        load={{
          isLoading: false,
          value: {
            label: "Logged session",
            summary: "5 exercises · 18 sets · 52 min · avg RPE 7.2",
          },
        }}
      />,
    );
    expect(screen.getByText("Logged session")).toBeDefined();
    expect(
      screen.getByText("5 exercises · 18 sets · 52 min · avg RPE 7.2"),
    ).toBeDefined();
  });

  it("stands in skeletons while loading", () => {
    const { container } = render(<SessionHeader load={{ isLoading: true }} />);
    expect(container.querySelectorAll("[data-skeleton]")).toHaveLength(2);
    expect(screen.queryByText("Logged session")).toBeNull();
  });
});
