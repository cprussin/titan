import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import type { WorkoutAction } from "../server/workout-action";
import { WorkoutActionButton } from "./WorkoutActionButton";

const start: WorkoutAction = { kind: "start" };
const done: WorkoutAction = { kind: "done" };

// The workout action's trigger reads the app router on render, so mount the
// component inside a stub router context (the router is a Next.js platform
// global, not something the component injects).
const router: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

const renderWithRouter = (ui: ReactElement) =>
  render(
    <AppRouterContext.Provider value={router}>{ui}</AppRouterContext.Provider>,
  );

describe(WorkoutActionButton, () => {
  describe("fab", () => {
    it("stacks a secondary weigh-in above the primary workout action, each icon-only with an accessible name", () => {
      renderWithRouter(<WorkoutActionButton action={start} variant="fab" />);
      const weighIn = screen.getByRole("button", { name: /weigh in/i });
      const startWorkout = screen.getByRole("button", {
        name: "Start workout",
      });
      expect(weighIn).toBeInTheDocument();
      expect(startWorkout).toBeInTheDocument();
      // The weigh-in sits on top, the primary action below it (closest to the
      // thumb) — assert the DOM order the stack renders them in.
      expect(
        weighIn.compareDocumentPosition(startWorkout) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("keeps the weigh-in once today's workout is done, dropping only the launch control", () => {
      renderWithRouter(<WorkoutActionButton action={done} variant="fab" />);
      expect(
        screen.getByRole("button", { name: /weigh in/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Start workout" }),
      ).not.toBeInTheDocument();
    });

    it("keeps the weigh-in when there's no workout action (a rest day)", () => {
      renderWithRouter(<WorkoutActionButton variant="fab" />);
      expect(
        screen.getByRole("button", { name: /weigh in/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Start workout" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("sidebar", () => {
    it("docks a weigh-in button beside the primary action", () => {
      renderWithRouter(
        <WorkoutActionButton action={start} variant="sidebar" />,
      );
      expect(
        screen.getByRole("button", { name: "Start workout" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /weigh in/i }),
      ).toBeInTheDocument();
    });

    it("keeps the weigh-in beside a complete marker once today's workout is done", () => {
      renderWithRouter(<WorkoutActionButton action={done} variant="sidebar" />);
      expect(screen.getByText("Workout complete")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /weigh in/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Start workout" }),
      ).not.toBeInTheDocument();
    });

    it("keeps the weigh-in when there's no workout action (a rest day)", () => {
      renderWithRouter(<WorkoutActionButton variant="sidebar" />);
      expect(
        screen.getByRole("button", { name: /weigh in/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Start workout" }),
      ).not.toBeInTheDocument();
    });
  });
});
