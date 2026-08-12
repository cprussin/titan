import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { WeighInButton } from "./WeighInButton";
import { useWeighIn, WeighInProvider } from "./WeighInContext";

/** Surfaces the shared weigh-in state so the test can assert the button opened it. */
const Probe = () => {
  const { weighingIn } = useWeighIn();
  return <span data-testid="state">{weighingIn ? "open" : "closed"}</span>;
};

describe(WeighInButton, () => {
  it("opens the weigh-in editor when clicked", () => {
    render(
      <WeighInProvider>
        <WeighInButton weighedInToday={false} />
        <Probe />
      </WeighInProvider>,
    );
    expect(screen.getByTestId("state").textContent).toBe("closed");
    fireEvent.click(screen.getByRole("button", { name: "Weigh in" }));
    expect(screen.getByTestId("state").textContent).toBe("open");
  });

  it("hides once today's weigh-in is logged", () => {
    render(
      <WeighInProvider>
        <WeighInButton weighedInToday={true} />
      </WeighInProvider>,
    );
    expect(screen.queryByRole("button", { name: "Weigh in" })).toBeNull();
  });
});
