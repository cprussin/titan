import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { BlockContent } from "./BlockContent";
import { NavDrawerProvider } from "./NavDrawer";

describe(BlockContent, () => {
  it("stands in a representative schedule with skeletons while loading", () => {
    const { container } = render(
      <NavDrawerProvider>
        <BlockContent load={{ isLoading: true }} />
      </NavDrawerProvider>,
    );
    // The Programs breadcrumb holds; the block title and control are skeletons.
    expect(screen.getByRole("link", { name: "Programs" })).toBeDefined();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });
});
