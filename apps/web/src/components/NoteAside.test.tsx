import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { NoteAside } from "./NoteAside";

describe(NoteAside, () => {
  it("renders one line per note", () => {
    render(
      <NoteAside
        notes={[
          "Increase Bench Press from 150 lb to 155 lb next volume session.",
          "Repeat Lat Pulldown 4×12 @ 120 lb: reps missed.",
        ]}
      />,
    );
    expect(
      screen.getByText(/Increase Bench Press from 150 lb to 155 lb/),
    ).toBeDefined();
    expect(screen.getByText(/Repeat Lat Pulldown/)).toBeDefined();
  });

  it("renders nothing when there are no notes", () => {
    const { container } = render(<NoteAside notes={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
