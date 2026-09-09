import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
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
    fireEvent.click(screen.getByRole("button", { name: "Weigh in" }));
    expect(
      await screen.findByRole("spinbutton", { name: "Bodyweight in pounds" }),
    ).toBeDefined();
  });
});
