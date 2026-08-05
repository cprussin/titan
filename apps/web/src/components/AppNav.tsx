"use client";

import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { css, cx } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { ThemeSwitch } from "../ui";

const LINKS = [
  { href: "/", Icon: HouseIcon, label: "Today" },
  { href: "/history", Icon: ClockCounterClockwiseIcon, label: "History" },
  { href: "/analytics", Icon: ChartLineIcon, label: "Trends" },
] as const;

/** The persistent bottom navigation. Highlights the active section and hosts the
 *  theme toggle. */
export const AppNav = () => {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className={navStyles}>
      {LINKS.map(({ Icon, href, label }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cx(itemStyles, active ? activeStyles : undefined)}
            href={href}
            key={href}
          >
            <Icon size={22} weight={active ? "fill" : "regular"} />
            <span className={labelStyles}>{label}</span>
          </Link>
        );
      })}
      <div className={themeSlotStyles}>
        <ThemeSwitch />
      </div>
    </nav>
  );
};

const navStyles = hstack({
  backgroundColor: "color-mix(in oklab, {colors.background} 80%, transparent)",
  borderBlockStart: "1px solid {colors.border}",
  gap: 1,
  insetBlockEnd: 0,
  insetInline: 0,
  justifyContent: "center",
  paddingBlock: 2,
  paddingInline: 3,
  position: "fixed",
  zIndex: 10,
});

const itemStyles = cx(
  vstack({ gap: 0.5 }),
  css({
    _hover: { color: "foreground" },
    borderRadius: "md",
    color: "muted",
    minInlineSize: 16,
    paddingBlock: 1,
  }),
);

const activeStyles = css({ color: "accent" });

const labelStyles = css({ fontSize: "xs", fontWeight: "medium" });

const themeSlotStyles = css({ marginInlineStart: 2 });
