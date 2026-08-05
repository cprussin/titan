import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { LinkProvider } from "../LinkProvider/LinkProvider";
import { Breadcrumbs } from "./Breadcrumbs";

const CRUMBS = [
  { href: "/programs", label: "Programs" },
  { href: "/programs/strength", label: "Strength" },
] as const;

describe(Breadcrumbs, () => {
  it("renders a link per crumb with its href", () => {
    render(<Breadcrumbs crumbs={CRUMBS} />);
    expect(screen.getByRole("link", { name: "Programs" })).toHaveAttribute(
      "href",
      "/programs",
    );
    expect(screen.getByRole("link", { name: "Strength" })).toHaveAttribute(
      "href",
      "/programs/strength",
    );
  });

  it("defaults to a plain anchor with no provider", () => {
    render(<Breadcrumbs crumbs={CRUMBS} />);
    expect(screen.getByRole("link", { name: "Programs" }).tagName).toBe("A");
  });

  it("routes links through a provided link component", () => {
    const CustomLink = ({
      children,
      href,
    }: {
      children: ReactNode;
      href: string;
    }) => (
      <a data-custom="" href={href}>
        {children}
      </a>
    );
    render(
      <LinkProvider link={CustomLink}>
        <Breadcrumbs crumbs={CRUMBS} />
      </LinkProvider>,
    );
    expect(screen.getByRole("link", { name: "Programs" })).toHaveAttribute(
      "data-custom",
    );
  });

  it("renders nothing for an empty trail", () => {
    const { container } = render(<Breadcrumbs crumbs={[]} />);
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });
});
