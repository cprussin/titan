import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { ErrorScreen } from "./ErrorScreen";

describe(ErrorScreen, () => {
  it("shows the 500 status and a link home", () => {
    render(<ErrorScreen reset={() => undefined} />);
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("invokes reset when the retry button is pressed", async () => {
    await new Promise<void>((resolve) => {
      render(<ErrorScreen reset={resolve} />);
      screen.getByRole("button", { name: /try again/i }).click();
    });
  });
});
