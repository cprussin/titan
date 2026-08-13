import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { WorkoutAction } from "../server/workout-action";
import { WorkoutActionControl } from "./WorkoutActionControl";

const continueAction: WorkoutAction = {
  kind: "continue",
  sessionId: "session-123",
};

describe(WorkoutActionControl, () => {
  describe("continue", () => {
    it("links inline to the in-progress session with a visible label", () => {
      render(<WorkoutActionControl action={continueAction} />);
      const link = screen.getByRole("link", { name: "Continue workout" });
      expect(link).toHaveAttribute("href", "/workout/session-123");
    });

    it("links icon-only to the in-progress session, its name carried by the accessible label", () => {
      render(<WorkoutActionControl action={continueAction} iconOnly rounded />);
      const link = screen.getByRole("link", { name: "Continue workout" });
      expect(link).toHaveAttribute("href", "/workout/session-123");
    });
  });

  describe("done", () => {
    it("renders nothing — a finished day has no action to launch", () => {
      const { container } = render(
        <WorkoutActionControl action={{ kind: "done" }} />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });
});
