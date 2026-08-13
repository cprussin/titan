import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { HistoryData } from "./HistoryContent";
import { HistoryContent } from "./HistoryContent";
import { NavDrawerProvider } from "./NavDrawer";

const wrap = (load: Parameters<typeof HistoryContent>[0]["load"]) =>
  render(
    <NavDrawerProvider>
      <HistoryContent load={load} />
    </NavDrawerProvider>,
  );

const data: HistoryData = {
  rows: [
    {
      badge: { text: "18 sets", tone: "success" },
      href: "/workout/s1/complete",
      id: "s1",
      meta: "2026-08-10 · Week 3",
      name: "Volume Upper",
    },
    {
      badge: { text: "In progress", tone: "warning" },
      href: "/workout/s2",
      id: "s2",
      meta: "2026-08-11 · Week 3",
      name: "Heavy Lower",
    },
  ],
};

describe(HistoryContent, () => {
  it("renders a linked row per session with its status badge", () => {
    wrap({ isLoading: false, value: data });
    const row = screen.getByRole("link", { name: /Volume Upper/ });
    expect(row.getAttribute("href")).toBe("/workout/s1/complete");
    expect(row).toHaveTextContent("18 sets");
    expect(screen.getByText("In progress")).toBeDefined();
  });

  it("shows the empty note when there are no sessions", () => {
    wrap({ isLoading: false, value: { rows: [] } });
    expect(screen.getByText(/No sessions yet/)).toBeDefined();
  });

  it("fills the ledger with placeholder rows while loading", () => {
    const { container } = wrap({ isLoading: true });
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryByText("Volume Upper")).toBeNull();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });
});
