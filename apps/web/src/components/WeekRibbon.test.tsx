import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { WeekDay } from "../server/week-schedule";
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

describe(WeekRibbon, () => {
  it("pages weeks with caret buttons", () => {
    render(<WeekRibbon days={days} selectedDate="2026-08-11" weekOffset={0} />);
    expect(
      screen.getByRole("link", { name: "Previous week" }).getAttribute("href"),
    ).toBe("/?week=-1");
    expect(
      screen.getByRole("link", { name: "Next week" }).getAttribute("href"),
    ).toBe("/?week=1");
  });

  it("marks today and links it back to the dashboard root", () => {
    render(<WeekRibbon days={days} selectedDate="2026-08-11" weekOffset={0} />);
    const today = screen.getByRole("link", { name: /TUE 11 · TODAY/ });
    expect(today.getAttribute("href")).toBe("/");
  });

  it("links a day by date, carrying the week offset", () => {
    render(<WeekRibbon days={days} selectedDate="2026-08-11" weekOffset={2} />);
    const friday = screen.getByRole("link", { name: /Heavy Upper/ });
    expect(friday.getAttribute("href")).toBe("/?week=2&date=2026-08-14");
    // Simplified cells: no per-day detail line.
    expect(friday).not.toHaveTextContent("Bench Press");
    expect(friday).not.toHaveTextContent("5 exercises");
  });

  it("marks the selected day and ticks a logged day; renders a rest day", () => {
    render(<WeekRibbon days={days} selectedDate="2026-08-10" weekOffset={0} />);
    expect(
      screen.getByRole("link", { name: /MON 10 · SELECTED/ }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: /Volume Upper ✓/ })).toBeDefined();
    expect(screen.getByRole("link", { name: /Rest/ })).toBeDefined();
  });
});
