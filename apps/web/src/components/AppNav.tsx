"use client";

import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { GaugeIcon } from "@phosphor-icons/react/dist/ssr/Gauge";
import { GearIcon } from "@phosphor-icons/react/dist/ssr/Gear";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { css, cx } from "../../styled-system/css";
import { isActiveNavSection } from "../active-nav-section";
import type { SessionUser } from "../auth/token";
import type { WorkoutAction } from "../server/workout-action";
import { Avatar } from "../ui";
import { LogOutButton } from "./LogOutButton";
import { useNavDrawer } from "./NavDrawer";
import { TitanLockup } from "./TitanLockup";
import { WorkoutActionButton } from "./WorkoutActionButton";

const LINKS = [
  { href: "/", Icon: GaugeIcon, label: "Dashboard" },
  { href: "/programs", Icon: BarbellIcon, label: "Programs" },
  { href: "/history", Icon: ClockCounterClockwiseIcon, label: "History" },
  { href: "/settings", Icon: GearIcon, label: "Settings" },
] as const;

type Props = {
  /** The signed-in athlete, shown with a sign-out control in the sidebar
   *  footer. */
  user: SessionUser;
  /** The primary workout action to dock in the wide-screen rail, or `undefined`
   *  when there's nothing to launch (a rest day, or no program placed). */
  workoutAction?: WorkoutAction | undefined;
};

/**
 * The persistent primary navigation. A bottom tab bar on phone-sized screens; a
 * full left sidebar from `lg` up. In between (`mdToLg`) the same sidebar is
 * hidden off-canvas and slides in as a drawer — opened by the top-bar menu
 * button, dismissed by the scrim behind it or by picking a destination.
 * Highlights the active section.
 */
export const AppNav = ({ user, workoutAction }: Props) => {
  const pathname = usePathname();
  const { close, open } = useNavDrawer();
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className={scrimStyles}
          onClick={close}
          type="button"
        />
      )}
      <nav
        aria-label="Primary"
        className={navStyles}
        data-open={open ? "true" : undefined}
      >
        <span className={brandStyles}>
          <TitanLockup />
        </span>
        {workoutAction !== undefined && (
          <WorkoutActionButton action={workoutAction} variant="sidebar" />
        )}
        <ul className={listStyles}>
          {LINKS.map(({ Icon, href, label }) => {
            const active = isActiveNavSection(href, pathname);
            return (
              <li className={itemWrapStyles} key={href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cx(itemStyles, active ? activeStyles : undefined)}
                  href={href}
                  onClick={close}
                >
                  <Icon size={22} weight={active ? "fill" : "regular"} />
                  <span className={labelStyles}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className={footerStyles}>
          <div className={userStyles}>
            <Avatar name={user.name} size="sm" src={user.picture} />
            <span className={userTextStyles}>
              <span className={userNameStyles}>{user.name}</span>
              <span className={userEmailStyles}>{user.email}</span>
            </span>
          </div>
          <LogOutButton />
        </div>
      </nav>
    </>
  );
};

// The page-dimming backdrop behind the open drawer. Only meaningful in the
// `mdToLg` drawer window; below it there's no drawer and from `lg` up the
// sidebar is part of the layout, so it never shows there.
const scrimStyles = css({
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "none",
  inset: 0,
  mdToLg: { display: "block" },
  position: "fixed",
  zIndex: 9,
});

const navStyles = css({
  "&[data-open='true']": { mdToLg: { transform: "translateX(0)" } },
  alignItems: "center",
  // The phone tab bar floats over scrolling page content on a translucent
  // fill; frost the backdrop so that content reads as a blur behind the bar
  // rather than bleeding through it legibly. From `md` up the bar is a solid
  // sidebar, so the blur is switched off there.
  backdropFilter: "blur({spacing.2})",
  backgroundColor: "color-mix(in oklab, {colors.background} 80%, transparent)",
  borderBlockStart: "1px solid {colors.border}",
  display: "flex",
  flexDirection: "row",
  gap: 1,
  insetBlockEnd: 0,
  insetInline: 0,
  justifyContent: "center",
  // From `md` up the bar becomes a full-height sidebar on the inline-start
  // edge. In the `mdToLg` window it's hidden off-canvas and slides in as a
  // drawer (translated by `data-open`); from `lg` up it sits in the layout,
  // which offsets the content by its width.
  md: {
    alignItems: "stretch",
    backdropFilter: "none",
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
  mdToLg: {
    boxShadow: "2xl",
    transform: "translateX(-100%)",
    transition: "transform {durations.normal} {easings.out}",
  },
  // Pad the block-start normally, but on the block-end honor the OS safe-area
  // inset (home indicator / gesture bar) so the tab bar never sits under it.
  paddingBlockEnd: "max({spacing.2}, env(safe-area-inset-bottom))",
  paddingBlockStart: 2,
  paddingInline: 3,
  position: "fixed",
  zIndex: 10,
});

// The brand lockup heads the sidebar — hidden in the phone tab bar, where every
// pixel of the row goes to the tab targets. Typography and the mark live in
// `TitanLockup`; this wrapper only handles the show/hide and its seat.
const brandStyles = css({
  display: "none",
  md: {
    display: "flex",
    paddingBlockEnd: 4,
    paddingInline: 2,
  },
});

const listStyles = css({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "row",
  gap: 1,
  // On phone the row spans the full bar so each tab can grow to fill it; the
  // sidebar keeps the same full-width column.
  inlineSize: "100%",
  justifyContent: "center",
  listStyleType: "none",
  margin: 0,
  md: {
    flexDirection: "column",
    gap: 0.5,
  },
  padding: 0,
});

// Each phone tab grows equally to fill the bar; the sidebar rows just span its
// width instead (growing would stretch them down the column).
const itemWrapStyles = css({
  flex: 1,
  md: { flex: "none", inlineSize: "100%" },
});

const itemStyles = css({
  // Hover tint only for a mouse-like pointer, so a tap on touch doesn't leave
  // a stuck highlight; on the sidebar hover also fills a subtle pill.
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
  // Fill the grown wrapper so the whole tab is a tap target, and stand tall
  // enough to be a comfortable one on touch.
  inlineSize: "100%",
  justifyContent: "center",
  // The phone tab stacks icon over label; the sidebar lays them in a row.
  md: {
    borderRadius: "lg",
    flexDirection: "row",
    gap: 3,
    justifyContent: "flex-start",
    minBlockSize: "auto",
    minInlineSize: 0,
    paddingBlock: 2.5,
    paddingInline: 3,
    transition: "background-color {durations.fast} {easings.out}",
  },
  minBlockSize: 14,
  paddingBlock: 1,
});

// The active section: accent-colored, and carrying a faint accent fill at every
// size so the current page reads at a glance — a pill behind the phone tab and
// a bar on the sidebar.
const activeStyles = css({
  backgroundColor:
    "color-mix(in oklab, {colors.accent} 14%, {colors.background})",
  color: "accent",
});

// Shown under the icon in the phone tab bar and beside it in the sidebar.
const labelStyles = css({
  fontSize: "xs",
  fontWeight: "medium",
  md: { fontSize: "sm" },
});

// The signed-in athlete and sign-out control, anchored to the foot of the
// sidebar. Like the wordmark, it's meaningless in the phone tab bar (a single
// tight row of destinations) — logout lives on the settings screen there — so
// it only appears from `md` up, and `marginBlockStart: auto` pushes it to the
// bottom of the rail.
const footerStyles = css({
  display: "none",
  md: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginBlockStart: "auto",
    paddingBlockStart: 4,
    paddingInline: 2,
  },
});

const userStyles = css({
  alignItems: "center",
  display: "flex",
  gap: 2.5,
  minInlineSize: 0,
});

const userTextStyles = css({
  display: "flex",
  flexDirection: "column",
  minInlineSize: 0,
});

const userNameStyles = css({
  fontSize: "sm",
  fontWeight: "medium",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const userEmailStyles = css({
  color: "muted",
  fontSize: "xs",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
