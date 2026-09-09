import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WeighInButton } from "./WeighInButton";

const router = {
  back: () => undefined,
  forward: () => undefined,
  prefetch: () => undefined,
  push: () => undefined,
  refresh: () => undefined,
  replace: () => undefined,
};

// The dialog reads the weigh-in ledger over `fetch` as it opens. `fetch` is a
// platform global the button doesn't own, so stand in a response for it rather
// than letting the open hit the network (see TESTING.md on mocking globals).
const realFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = Object.assign(
    () =>
      Promise.resolve(
        new Response(JSON.stringify({ metrics: [] }), {
          headers: { "content-type": "application/json" },
        }),
      ),
    { preconnect: realFetch.preconnect },
  );
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe(WeighInButton, () => {
  it("opens the weigh-in dialog when clicked", async () => {
    render(
      <AppRouterContext.Provider value={router}>
        <WeighInButton />
      </AppRouterContext.Provider>,
    );
    expect(
      screen.queryByRole("spinbutton", { name: "Bodyweight in pounds" }),
    ).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Weigh in" }));
      await Promise.resolve();
    });
    expect(
      screen.getByRole("spinbutton", { name: "Bodyweight in pounds" }),
    ).toBeDefined();
  });
});
