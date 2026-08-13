import { describe, expect, it } from "bun:test";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { WeekDay } from "../server/week-day";
import { WeekRibbon } from "./WeekRibbon";

const TODAY = "2026-08-13"; // A Thursday, so its ISO week runs Aug 10 → Aug 16.

/** The `YYYY-MM-DD` date `offset` days from today. */
const dateAt = (offset: number): string => {
  const date = new Date(`${TODAY}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

/** A planned day at a given offset from today, named so its link is findable. */
const dayAt = (offset: number, overrides: Partial<WeekDay> = {}): WeekDay => ({
  date: dateAt(offset),
  dayOfWeek: 1,
  isPast: offset < 0,
  isToday: offset === 0,
  kind: "planned",
  label: `DAY ${offset}`,
  name: `Session ${offset}`,
  signature: undefined,
  summary: "6 exercises · ~62 min",
  ...(overrides as WeekDay),
});

// The current ISO week (Aug 10 → 16), covering day offsets −3 … 3.
const currentWeek: readonly WeekDay[] = [
  dayAt(-3, { kind: "logged", label: "MON 10", name: "Volume Upper" }),
  dayAt(-2),
  dayAt(-1),
  dayAt(0, { name: "Heavy Lower" }),
  dayAt(1, { kind: "rest", label: "FRI 14", name: undefined }),
  dayAt(2, { name: "Heavy Upper" }),
  dayAt(3),
];

/** A contiguous seven-day week `weekOffset` weeks from today's week, each cell
 *  named after its offset so a test can tell which week a lazily-loaded cell
 *  came from. Today's week (offset 0) is the hand-built {@link currentWeek}. */
const weekDays = (weekOffset: number): readonly WeekDay[] => {
  if (weekOffset === 0) {
    return currentWeek;
  } else {
    const mondayOffset = -3 + weekOffset * 7;
    return Array.from({ length: 7 }, (_, index) =>
      dayAt(mondayOffset + index, {
        label: `W${weekOffset} D${index}`,
        name: `Week ${weekOffset} Day ${index}`,
      }),
    );
  }
};

const loaded = (selectedDate: string, weekOffset: number) =>
  ({
    isLoading: false,
    value: {
      days: weekDays(weekOffset),
      selectedDate,
      today: TODAY,
      weekOffset,
    },
  }) as const;

/** Records which weeks the loader was asked for and resolves each synchronously,
 *  so the strip's mount-time prefetch settles inside `waitFor`. */
const harness = () => {
  const requested: number[] = [];
  return {
    loadWeek: (offset: number) => {
      requested.push(offset);
      return Promise.resolve(weekDays(offset));
    },
    requested,
  };
};

/** The strip's transform position — the loaded-array index of its leftmost
 *  visible cell — read from the inline custom property that drives the slide. */
const leftIndex = (): number => {
  const track = document.querySelector("[data-strip-track]");
  if (!(track instanceof HTMLElement)) {
    throw new Error("strip track not found");
  }
  return Number(track.style.getPropertyValue("--left-index"));
};

describe(WeekRibbon, () => {
  it("marks today and links it back to the dashboard root", async () => {
    const { loadWeek } = harness();
    render(<WeekRibbon load={loaded(TODAY, 0)} loadWeek={loadWeek} />);
    const today = await screen.findByRole("link", { name: /Heavy Lower/ });
    expect(today.getAttribute("href")).toBe("/");
  });

  it("links a day by date, carrying the week offset", async () => {
    const { loadWeek } = harness();
    render(
      <WeekRibbon
        load={loaded(dateAt(14), 2)}
        loadWeek={loadWeek}
        measureVisibleDays={() => 3}
      />,
    );
    const day = await screen.findByRole("link", { name: /Week 2 Day 0/ });
    expect(day.getAttribute("href")).toBe(`/?week=2&date=${dateAt(11)}`);
    // Simplified cells: no per-day detail line.
    expect(day).not.toHaveTextContent("exercises");
  });

  it("marks the selected day with aria-current and no textual badge", async () => {
    const { loadWeek } = harness();
    render(<WeekRibbon load={loaded(dateAt(-3), 0)} loadWeek={loadWeek} />);
    const monday = await screen.findByRole("link", { name: /Volume Upper/ });
    expect(monday).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText(/SELECTED/)).toBeNull();
  });

  it("ticks a logged day and renders a rest day", async () => {
    const { loadWeek } = harness();
    render(<WeekRibbon load={loaded(TODAY, 0)} loadWeek={loadWeek} />);
    expect(
      await screen.findByRole("link", { name: /Volume Upper ✓/ }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: /Rest/ })).toBeDefined();
  });

  it("offers page arrows that never navigate, so the selected day stays put", async () => {
    const { loadWeek } = harness();
    render(<WeekRibbon load={loaded(TODAY, 0)} loadWeek={loadWeek} />);
    const earlier = await screen.findByRole("button", {
      name: "Show earlier days",
    });
    const later = screen.getByRole("button", { name: "Show later days" });
    expect(earlier.tagName).toBe("BUTTON");
    expect(later.tagName).toBe("BUTTON");
    expect(
      screen.queryByRole("link", { name: /Previous week|Next week/ }),
    ).toBeNull();
  });

  it("fills the strip with skeleton cells while loading and fetches nothing", () => {
    const { loadWeek, requested } = harness();
    const { container } = render(
      <WeekRibbon load={{ isLoading: true }} loadWeek={loadWeek} />,
    );
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Show earlier days" }),
    ).toBeDefined();
    expect(
      container.querySelectorAll("[data-skeleton]").length,
    ).toBeGreaterThan(0);
    expect(requested).toHaveLength(0);
  });

  it("prefetches the flanking weeks on mount so the first page is instant", async () => {
    const { loadWeek, requested } = harness();
    render(
      <WeekRibbon
        load={loaded(TODAY, 0)}
        loadWeek={loadWeek}
        measureVisibleDays={() => 3}
      />,
    );
    // A three-day window centred on today needs the prior and next pages ready;
    // those spill into the neighbouring weeks, so both get fetched.
    await waitFor(() => {
      expect([...requested].sort((a, b) => a - b)).toEqual([-1, 1]);
    });
  });

  it("advances a whole screenful into the future when the later arrow is pressed", async () => {
    const { loadWeek } = harness();
    render(
      <WeekRibbon
        load={loaded(TODAY, 0)}
        loadWeek={loadWeek}
        measureVisibleDays={() => 3}
      />,
    );
    const later = await screen.findByRole("button", {
      name: "Show later days",
    });
    await waitFor(() => {
      expect(leftIndex()).toBe(9); // leftOffset −1 against a min-offset of −10.
    });
    act(() => {
      fireEvent.click(later);
    });
    // Paged forward by exactly the three visible days.
    expect(leftIndex()).toBe(12);
  });

  it("retreats a whole screenful into the past when the earlier arrow is pressed", async () => {
    const { loadWeek } = harness();
    render(
      <WeekRibbon
        load={loaded(TODAY, 0)}
        loadWeek={loadWeek}
        measureVisibleDays={() => 3}
      />,
    );
    const earlier = await screen.findByRole("button", {
      name: "Show earlier days",
    });
    await waitFor(() => {
      expect(leftIndex()).toBe(9);
    });
    act(() => {
      fireEvent.click(earlier);
    });
    expect(leftIndex()).toBe(6);
  });

  it("prefetches the next set as paging approaches the loaded edge", async () => {
    const { loadWeek, requested } = harness();
    render(
      <WeekRibbon
        load={loaded(TODAY, 0)}
        loadWeek={loadWeek}
        measureVisibleDays={() => 3}
      />,
    );
    const later = await screen.findByRole("button", {
      name: "Show later days",
    });
    await waitFor(() => {
      expect(requested).toContain(1);
    });
    // Page forward until the buffer reaches past the already-loaded weeks.
    act(() => {
      fireEvent.click(later);
      fireEvent.click(later);
      fireEvent.click(later);
    });
    await waitFor(() => {
      expect(requested).toContain(2);
    });
    // No week is ever fetched twice.
    expect(new Set(requested).size).toBe(requested.length);
  });

  it("advances on a right-to-left swipe and retreats on a left-to-right swipe", async () => {
    const { loadWeek } = harness();
    const { container } = render(
      <WeekRibbon
        load={loaded(TODAY, 0)}
        loadWeek={loadWeek}
        measureVisibleDays={() => 3}
      />,
    );
    await screen.findByRole("button", { name: "Show later days" });
    await waitFor(() => {
      expect(leftIndex()).toBe(9);
    });
    const viewport = container.querySelector("[data-strip-viewport]");
    if (!(viewport instanceof HTMLElement)) {
      throw new Error("viewport not found");
    }
    act(() => {
      fireEvent.pointerDown(viewport, { clientX: 300, pointerId: 1 });
      fireEvent.pointerUp(viewport, { clientX: 100, pointerId: 1 });
    });
    expect(leftIndex()).toBe(12); // right-to-left → future.
    act(() => {
      fireEvent.pointerDown(viewport, { clientX: 100, pointerId: 1 });
      fireEvent.pointerUp(viewport, { clientX: 300, pointerId: 1 });
    });
    expect(leftIndex()).toBe(9); // left-to-right → back to the past.
  });
});
