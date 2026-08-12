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
  it("marks today and links it back to the dashboard root", () => {
    render(<WeekRibbon days={days} selectedDate="2026-08-11" />);
    const today = screen.getByRole("link", { name: /TUE 11 · TODAY/ });
    expect(today.getAttribute("href")).toBe("/");
  });

  it("shows a collapsed planned day's signature and links it by date", () => {
    render(<WeekRibbon days={days} selectedDate="2026-08-11" />);
    const friday = screen.getByRole("link", { name: /Heavy Upper/ });
    expect(friday.getAttribute("href")).toBe("/?date=2026-08-14");
    expect(friday).toHaveTextContent("Bench Press 5×5");
    // Collapsed: the expanded count/duration summary is not shown.
    expect(friday).not.toHaveTextContent("5 exercises");
  });

  it("expands the selected day to its summary and labels it selected", () => {
    render(<WeekRibbon days={days} selectedDate="2026-08-14" />);
    const friday = screen.getByRole("link", { name: /FRI 14 · SELECTED/ });
    expect(friday).toHaveTextContent("5 exercises · ~55 min");
    // Today keeps its own label even when another day is selected.
    expect(screen.getByRole("link", { name: /TUE 11 · TODAY/ })).toBeDefined();
  });

  it("ticks a logged day and renders a rest day", () => {
    render(<WeekRibbon days={days} selectedDate="2026-08-11" />);
    expect(screen.getByRole("link", { name: /Volume Upper ✓/ })).toBeDefined();
    expect(screen.getByRole("link", { name: /Rest/ })).toBeDefined();
  });
});
