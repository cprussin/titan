import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { NavDrawerProvider } from "./NavDrawer";
import { TopBar } from "./TopBar";

// The menu button reads the shared drawer state, so the bar has to mount inside
// a provider even when the drawer itself never opens.
const renderTopBar = () =>
  render(
    <NavDrawerProvider>
      <TopBar title="Dashboard" />
    </NavDrawerProvider>,
  );

describe(TopBar, () => {
  it("heads the bar with the Titan brand for the sizes where the sidebar isn't in view", () => {
    renderTopBar();
    expect(screen.getByText("TITAN")).toBeInTheDocument();
  });
});
