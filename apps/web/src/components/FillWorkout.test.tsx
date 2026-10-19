import { describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { FillWorkout } from "./FillWorkout";

const router = (push: (href: string) => void): AppRouterInstance => ({
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push,
  refresh: () => undefined,
  replace: () => undefined,
});

describe(FillWorkout, () => {
  it("starts a session dated to the missed day with the picked alternative, then opens it", async () => {
    const requests: unknown[] = [];
    const href = await new Promise<string>((resolve) => {
      render(
        <AppRouterContext.Provider value={router(resolve)}>
          <FillWorkout
            alternatives={[
              { id: "row", label: "Row" },
              { id: "hike", label: "Hike" },
            ]}
            date="2026-03-09"
            startFill={(request) => {
              requests.push(request);
              return Promise.resolve("s1");
            }}
          />
        </AppRouterContext.Provider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Log workout" }));
      fireEvent.click(screen.getByRole("button", { name: "Hike" }));
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Start logging" }));
      });
    });
    expect(requests).toEqual([{ alternativeId: "hike", date: "2026-03-09" }]);
    expect(href).toBe("/workout/s1");
  });
});
