import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { LinkProvider, useLink } from "./LinkProvider";

const Probe = () => {
  const Link = useLink();
  return <Link href="/here">Go</Link>;
};

describe(LinkProvider, () => {
  it("falls back to a plain anchor with no provider", () => {
    render(<Probe />);
    const link = screen.getByRole("link", { name: "Go" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/here");
  });

  it("supplies a provided link component to consumers", () => {
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
        <Probe />
      </LinkProvider>,
    );
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute(
      "data-custom",
    );
  });

  it("falls back to the default anchor when link is undefined", () => {
    render(
      <LinkProvider link={undefined}>
        <Probe />
      </LinkProvider>,
    );
    expect(screen.getByRole("link", { name: "Go" }).tagName).toBe("A");
  });
});
