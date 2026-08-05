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
 * The persistent primary navigation. A bottom tab bar on phone-sized screens; a
 * fixed left rail from `md` up — collapsed to icons at `md`, widening to a
 * full-width labeled sidebar at `lg`. Highlights the active section.
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
  // From `md` up the bar leaves the bottom edge and becomes a fixed rail on the
  // inline-start edge — collapsed to icons at `md`, widening to a full labeled
  // sidebar at `lg`. Content is offset by the rail width in the layout.
  lg: {
    inlineSize: 60,
    paddingInline: 3,
  },
  md: {
    alignItems: "stretch",
    backgroundColor: "background",
    borderBlockStart: "none",
    borderInlineEnd: "1px solid {colors.border}",
    flexDirection: "column",
    gap: 1,
    inlineSize: 16,
    insetBlockEnd: 0,
    insetBlockStart: 0,
    insetInlineEnd: "auto",
    insetInlineStart: 0,
    justifyContent: "flex-start",
    paddingBlock: 4,
    paddingInline: 2,
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
  listStyleType: "none",
  margin: 0,
  md: {
    flexDirection: "column",
    gap: 0.5,
    inlineSize: "100%",
  },
  padding: 0,
});

const itemWrapStyles = css({ md: { inlineSize: "100%" } });

const itemStyles = css({
  _pointerCoarse: { minBlockSize: 12 },
  // Hover tint only for a mouse-like pointer, so a tap on touch doesn't leave
  // a stuck highlight; on the rail (from `md` up) hover also fills a subtle
  // pill. A coarse pointer gets a taller tap target instead.
  _pointerFine: {
    _hover: {
      color: "foreground",
      md: { "&:not([aria-current='page'])": { backgroundColor: "card" } },
    },
  },
  alignItems: "center",
  borderRadius: "md",
  color: "muted",
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
  // The collapsed rail centers an icon-only pill; the full sidebar lays the
  // icon and its label out in a row.
  lg: {
    flexDirection: "row",
    gap: 3,
    justifyContent: "flex-start",
    paddingInline: 3,
  },
  md: {
    borderRadius: "lg",
    justifyContent: "center",
    minInlineSize: 0,
    paddingBlock: 2.5,
    paddingInline: 0,
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

// Shown under the icon in the phone tab bar and beside it in the full sidebar;
// hidden on the collapsed `md` rail, which is icons only.
const labelStyles = css({
  fontSize: "xs",
  fontWeight: "medium",
  lg: { display: "block", fontSize: "sm" },
  md: { display: "none" },
});
