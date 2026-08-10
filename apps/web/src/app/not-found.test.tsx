import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import NotFound from "./not-found";

describe(NotFound, () => {
  it("shows the 404 status and a link back to the dashboard", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
