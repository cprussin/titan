import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { SessionHeader } from "./SessionHeader";

describe(SessionHeader, () => {
  it("renders the session label and its summary", () => {
    render(
      <SessionHeader
        label="Logged session"
        summary="5 exercises · 18 sets · 52 min · avg RPE 7.2"
      />,
    );
    expect(screen.getByText("Logged session")).toBeDefined();
    expect(
      screen.getByText("5 exercises · 18 sets · 52 min · avg RPE 7.2"),
    ).toBeDefined();
  });
});
