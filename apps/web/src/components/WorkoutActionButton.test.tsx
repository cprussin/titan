import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import type { WorkoutAction } from "../server/workout-action";
import { WorkoutActionButton } from "./WorkoutActionButton";

const start: WorkoutAction = { kind: "start" };

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
    it("floats the primary workout action with a secondary weigh-in beside it", () => {
      renderWithRouter(<WorkoutActionButton action={start} variant="fab" />);
      expect(
        screen.getByRole("button", { name: "Start workout" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /weigh in/i }),
      ).toBeInTheDocument();
    });
  });

  describe("sidebar", () => {
    it("docks the primary action alone — the weigh-in only floats", () => {
      renderWithRouter(
        <WorkoutActionButton action={start} variant="sidebar" />,
      );
      expect(
        screen.getByRole("button", { name: "Start workout" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /weigh in/i }),
      ).not.toBeInTheDocument();
    });
  });
});
