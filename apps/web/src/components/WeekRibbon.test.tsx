import { describe, expect, it } from "bun:test";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { WeekDay } from "../server/week-day";
import { WeekRibbon } from "./WeekRibbon";

const days: readonly WeekDay[] = [
  {
    date: "2026-08-10",
    dayOfWeek: 1,
    isPast: true,
    isToday: false,
    kind: "logged",
    label: "MON 10",
    name: "Volume Upper",
    summary: "18 sets · 52 min",
  },
  {
    date: "2026-08-11",
    dayOfWeek: 2,
    isPast: false,
    isToday: true,
    kind: "planned",
    label: "TUE 11",
    name: "Heavy Lower",
    signature: "Back Squat 5×5",
    summary: "6 exercises · ~62 min",
  },
  {
    date: "2026-08-12",
    dayOfWeek: 3,
    isPast: false,
    isToday: false,
    kind: "rest",
    label: "WED 12",
  },
  {
    date: "2026-08-14",
    dayOfWeek: 5,
    isPast: false,
    isToday: false,
    kind: "planned",
    label: "FRI 14",
    name: "Heavy Upper",
    signature: "Bench Press 5×5",
    summary: "5 exercises · ~55 min",
  },
];

const loaded = (selectedDate: string, weekOffset: number) =>
  ({ isLoading: false, value: { days, selectedDate, weekOffset } }) as const;

/** A two-cell week whose cells name their offset, so a test can spot which week
 *  a lazily-loaded cell came from. */
const week = (offset: number): readonly WeekDay[] => [
  {
    date: `date-${offset}-a`,
    dayOfWeek: 1,
    isPast: false,
    isToday: false,
    kind: "planned",
    label: `LBL-${offset}-a`,
    name: `Week ${offset} Day A`,
    signature: undefined,
    summary: "sum",
  },
  {
    date: `date-${offset}-b`,
    dayOfWeek: 2,
    isPast: false,
    isToday: false,
    kind: "rest",
    label: `LBL-${offset}-b`,
  },
];

/** Captures the edge callbacks the ribbon registers so a test can fire them, and
 *  records which weeks the loader was asked for. */
const harness = () => {
  const requested: number[] = [];
  const edges: { onEarlier?: () => void; onLater?: () => void } = {};
  return {
    edges,
    loadWeek: (offset: number) => {
      requested.push(offset);
      return Promise.resolve(week(offset));
    },
    observeEdges: (args: {
      onEarlier: () => void;
      onLater: () => void;
    }): (() => void) => {
      edges.onEarlier = args.onEarlier;
      edges.onLater = args.onLater;
      return () => undefined;
    },
    requested,
  };
};

describe(WeekRibbon, () => {
  it("marks today and links it back to the dashboard root", () => {
    render(<WeekRibbon load={loaded("2026-08-11", 0)} />);
    const today = screen.getByRole("link", { name: /TUE 11 · TODAY/ });
    expect(today.getAttribute("href")).toBe("/");
  });

  it("links a day by date, carrying the week offset", () => {
    render(<WeekRibbon load={loaded("2026-08-11", 2)} />);
    const friday = screen.getByRole("link", { name: /Heavy Upper/ });
    expect(friday.getAttribute("href")).toBe("/?week=2&date=2026-08-14");
    // Simplified cells: no per-day detail line.
    expect(friday).not.toHaveTextContent("Bench Press");
    expect(friday).not.toHaveTextContent("5 exercises");
  });

  it("marks the selected day with aria-current and no textual badge", () => {
    render(<WeekRibbon load={loaded("2026-08-10", 0)} />);
    const monday = screen.getByRole("link", { name: /MON 10/ });
    expect(monday).toHaveAttribute("aria-current", "page");
    // The "SELECTED" badge is gone — only "TODAY" annotates a cell.
    expect(screen.queryByText(/SELECTED/)).toBeNull();
  });

  it("ticks a logged day and renders a rest day", () => {
    render(<WeekRibbon load={loaded("2026-08-10", 0)} />);
    expect(screen.getByRole("link", { name: /Volume Upper ✓/ })).toBeDefined();
    expect(screen.getByRole("link", { name: /Rest/ })).toBeDefined();
  });

  it("offers scroll buttons that never navigate, so the selected day stays put", () => {
    render(<WeekRibbon load={loaded("2026-08-11", 0)} />);
    const earlier = screen.getByRole("button", {
      name: "Scroll to earlier days",
    });
    const later = screen.getByRole("button", { name: "Scroll to later days" });
    // Buttons, not links: clicking them can only scroll — never change the URL,
    // and so never change which day is selected. No week-caret links exist.
    expect(earlier.tagName).toBe("BUTTON");
    expect(later.tagName).toBe("BUTTON");
    expect(
      screen.queryByRole("link", { name: /Previous week|Next week/ }),
    ).toBeNull();
  });

  it("fills the strip with skeleton cells while loading", () => {
    const { container } = render(<WeekRibbon load={{ isLoading: true }} />);
    // No day links until the schedule resolves.
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    // The scroll buttons stay, standing in for the scrollbar.
    expect(
      screen.getByRole("button", { name: "Scroll to earlier days" }),
    ).toBeDefined();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
  });

  it("appends the next week when the later edge comes into view", async () => {
    const { edges, loadWeek, observeEdges } = harness();
    render(
      <WeekRibbon
        load={loaded("date-0-a", 0)}
        loadWeek={loadWeek}
        observeEdges={observeEdges}
      />,
    );
    act(() => edges.onLater?.());
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Week 1 Day A/ })).toBeDefined(),
    );
  });

  it("prepends the previous week when the earlier edge comes into view", async () => {
    const { edges, loadWeek, observeEdges } = harness();
    render(
      <WeekRibbon
        load={loaded("date-0-a", 0)}
        loadWeek={loadWeek}
        observeEdges={observeEdges}
      />,
    );
    act(() => edges.onEarlier?.());
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Week -1 Day A/ })).toBeDefined(),
    );
  });

  it("does not refetch a week it is already loading", async () => {
    const { edges, loadWeek, observeEdges, requested } = harness();
    render(
      <WeekRibbon
        load={loaded("date-0-a", 0)}
        loadWeek={loadWeek}
        observeEdges={observeEdges}
      />,
    );
    act(() => {
      edges.onLater?.();
      edges.onLater?.();
    });
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Week 1 Day A/ })).toBeDefined(),
    );
    expect(requested).toEqual([1]);
  });
});
