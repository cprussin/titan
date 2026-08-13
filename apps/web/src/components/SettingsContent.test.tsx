import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { NavDrawerProvider } from "./NavDrawer";
import { SettingsContent } from "./SettingsContent";

const renderLoading = () =>
  render(
    <NavDrawerProvider>
      <SettingsContent load={{ isLoading: true }} />
    </NavDrawerProvider>,
  );

describe(SettingsContent, () => {
  it("keeps the fixed row titles while loading", () => {
    renderLoading();
    for (const title of [
      "Account",
      "Appearance",
      "Concept2 rowing",
      "Delete history",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeDefined();
    }
  });

  it("stands in skeletons for each row's description and control", () => {
    const { container } = renderLoading();
    // Two skeletons per row (description + control), four rows.
    expect(container.querySelectorAll("[data-skeleton]")).toHaveLength(8);
    expect(screen.queryByText(/Signed in as/)).toBeNull();
  });
});
