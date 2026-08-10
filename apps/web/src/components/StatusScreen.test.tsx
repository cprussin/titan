import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { StatusScreen } from "./StatusScreen";

describe(StatusScreen, () => {
  it("renders the code, title, and message", () => {
    render(
      <StatusScreen
        action={<a href="/">Home</a>}
        code="404"
        message="We couldn't find that page."
        title="Page not found"
      />,
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("We couldn't find that page.")).toBeInTheDocument();
  });

  it("renders the provided action", () => {
    render(
      <StatusScreen
        action={<a href="/">Take me home</a>}
        code="500"
        message="Something went wrong."
        title="Unexpected error"
      />,
    );
    expect(screen.getByRole("link", { name: "Take me home" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
