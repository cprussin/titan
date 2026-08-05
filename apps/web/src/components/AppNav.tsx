"use client";

import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import { HouseIcon } from "@phosphor-icons/react/dist/ssr/House";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { css, cx } from "../../styled-system/css";

const LINKS = [
  { href: "/", Icon: HouseIcon, label: "Today" },
  { href: "/programs", Icon: BarbellIcon, label: "Programs" },
  { href: "/history", Icon: ClockCounterClockwiseIcon, label: "History" },
  { href: "/analytics", Icon: ChartLineIcon, label: "Trends" },
  { href: "/settings", Icon: GearIcon, label: "Settings" },
] as const;

/**
 * The persistent primary navigation. A bottom tab bar on phone-sized screens
 * and a fixed left sidebar from `lg` up, where there's room to give each
 * section a full-width labeled row. Highlights the active section.
 */
export const AppNav = () => {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className={navStyles}>
      <span className={brandStyles}>Titan</span>
      <ul className={listStyles}>
        {LINKS.map(({ Icon, href, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li className={itemWrapStyles} key={href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cx(itemStyles, active ? activeStyles : undefined)}
                href={href}
              >
                <Icon size={22} weight={active ? "fill" : "regular"} />
                <span className={labelStyles}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

const navStyles = css({
  alignItems: "center",
  backgroundColor: "color-mix(in oklab, {colors.background} 80%, transparent)",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  flexDirection: "row",
  gap: 1,
  insetBlockEnd: 0,
  insetInline: 0,
  justifyContent: "center",
  // From `lg` up the bar becomes a full-height sidebar rail on the inline
  // start edge; content is offset by the rail width in the layout.
  lg: {
    alignItems: "stretch",
    backgroundColor: "background",
    borderBlockStart: "none",
    borderInlineEnd: "1px solid {colors.border}",
    flexDirection: "column",
    gap: 1,
    inlineSize: 60,
    insetBlockEnd: 0,
    insetBlockStart: 0,
    insetInlineEnd: "auto",
    insetInlineStart: 0,
    justifyContent: "flex-start",
    paddingBlock: 4,
    paddingInline: 3,
  },
  paddingBlock: 2,
  paddingInline: 3,
  position: "fixed",
  zIndex: 10,
});

// The wordmark heads the sidebar rail only — hidden in the phone tab bar,
// where every pixel of the row goes to the tab targets.
const brandStyles = css({
  display: "none",
  lg: {
    display: "block",
    fontSize: "xl",
    fontWeight: "bold",
    paddingBlockEnd: 4,
    paddingInline: 2,
  },
});

const listStyles = css({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "row",
  gap: 1,
  justifyContent: "center",
  lg: {
    flexDirection: "column",
    gap: 0.5,
    inlineSize: "100%",
  },
  listStyleType: "none",
  margin: 0,
  padding: 0,
});

const itemWrapStyles = css({ lg: { inlineSize: "100%" } });

const itemStyles = css({
  _pointerCoarse: { minBlockSize: 12 },
  // Hover tint only for a mouse-like pointer, so a tap on touch doesn't leave
  // a stuck highlight; on the desktop rail hover also fills a subtle pill. A
  // coarse pointer gets a taller tap target instead.
  _pointerFine: {
    _hover: {
      color: "foreground",
      lg: { "&:not([aria-current='page'])": { backgroundColor: "card" } },
    },
  },
  alignItems: "center",
  borderRadius: "md",
  color: "muted",
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  lg: {
    borderRadius: "lg",
    flexDirection: "row",
    gap: 3,
    justifyContent: "flex-start",
    minInlineSize: 0,
    paddingBlock: 2.5,
    paddingInline: 3,
    transition: "background-color {durations.fast} {easings.out}",
  },
  minInlineSize: 16,
  paddingBlock: 1,
});

// The active section: accent-colored, and carrying a faint accent fill at every
// size so the current page reads at a glance — a pill behind the phone tab and
// a bar on the desktop rail.
const activeStyles = css({
  backgroundColor:
    "color-mix(in oklab, {colors.accent} 14%, {colors.background})",
  color: "accent",
});

const labelStyles = css({
  fontSize: "xs",
  fontWeight: "medium",
  lg: { fontSize: "sm" },
});
