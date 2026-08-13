import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement } from "react";
import { NavDrawerProvider } from "./NavDrawer";
import type { ProgramsData } from "./ProgramsContent";
import { ProgramsContent } from "./ProgramsContent";

const router = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

const wrap = (ui: ReactElement) =>
  render(
    <AppRouterContext.Provider value={router}>
      <NavDrawerProvider>{ui}</NavDrawerProvider>
    </AppRouterContext.Provider>,
  );

const data: ProgramsData = {
  active: {
    blocks: [
      {
        active: true,
        id: "block-1",
        meta: "8 weeks",
        name: "Base",
        versionId: "v1",
      },
    ],
    description: "A foundational block.",
    goals: ["Strength"],
    name: "Athletic Health Foundation",
    versionId: "v1",
  },
  others: [],
};

describe(ProgramsContent, () => {
  it("renders a program card linking to each block", () => {
    wrap(<ProgramsContent load={{ isLoading: false, value: data }} />);
    expect(
      screen.getByRole("heading", { name: "Athletic Health Foundation" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: /Base/ }).getAttribute("href"),
    ).toBe("/programs/v1/block/block-1");
  });

  it("shows the empty note when no programs are loaded", () => {
    wrap(
      <ProgramsContent
        load={{ isLoading: false, value: { active: undefined, others: [] } }}
      />,
    );
    expect(screen.getByText(/No programs loaded/)).toBeDefined();
  });

  it("fills the grid with placeholder cards while loading", () => {
    const { container } = wrap(<ProgramsContent load={{ isLoading: true }} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryByText("Athletic Health Foundation")).toBeNull();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });
});
