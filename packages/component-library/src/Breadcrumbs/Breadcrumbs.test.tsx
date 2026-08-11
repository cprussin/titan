import { describe, expect, it } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders a plain, non-link crumb when href is omitted", () => {
    render(<Breadcrumbs crumbs={[{ label: "Strength" }]} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Strength").tagName).toBe("SPAN");
  });

  it("renders nothing for an empty trail", () => {
    const { container } = render(<Breadcrumbs crumbs={[]} />);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: "Show breadcrumbs" }),
    ).toBeNull();
  });

  describe("responsive collapse", () => {
    it("keeps the full inline trail for wide screens", () => {
      const { container } = render(<Breadcrumbs crumbs={CRUMBS} />);
      const trail = container.querySelector("[data-breadcrumb-trail]");
      expect(trail).not.toBeNull();
      expect(trail?.querySelectorAll("a")).toHaveLength(CRUMBS.length);
    });

    it("offers a menu button that reveals the ancestor links", async () => {
      const user = userEvent.setup();
      render(<Breadcrumbs crumbs={CRUMBS} />);
      await user.click(
        screen.getByRole("button", { name: "Show breadcrumbs" }),
      );
      const menu = within(
        screen.getByRole("navigation", { name: "Breadcrumbs" }),
      );
      expect(menu.getByRole("link", { name: "Programs" })).toHaveAttribute(
        "href",
        "/programs",
      );
      expect(menu.getByRole("link", { name: "Strength" })).toHaveAttribute(
        "href",
        "/programs/strength",
      );
    });

    it("routes the menu's links through a provided link component", async () => {
      const user = userEvent.setup();
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
      await user.click(
        screen.getByRole("button", { name: "Show breadcrumbs" }),
      );
      const menu = within(
        screen.getByRole("navigation", { name: "Breadcrumbs" }),
      );
      expect(menu.getByRole("link", { name: "Programs" })).toHaveAttribute(
        "data-custom",
      );
    });
  });
});
