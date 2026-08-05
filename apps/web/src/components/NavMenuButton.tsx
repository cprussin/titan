"use client";

import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { css } from "../../styled-system/css";
import { useNavDrawer } from "./NavDrawer";

/**
 * The top-bar control that slides the nav drawer in from the inline-start edge.
 * Only shown in the `mdToLg` window, where the sidebar is hidden off-canvas —
 * on phones the bottom tab bar navigates, and from `lg` up the sidebar is
 * permanent, so neither needs it.
 */
export const NavMenuButton = () => {
  const { setOpen } = useNavDrawer();
  return (
    <button
      aria-label="Open navigation"
      className={buttonStyles}
      onClick={() => {
        setOpen(true);
      }}
      type="button"
    >
      <ListIcon size={20} />
    </button>
  );
};

const buttonStyles = css({
  // A bordered icon button, set apart from the page's icon and breadcrumbs by a
  // wider gap so it reads as separate chrome rather than part of the path.
  _pointerFine: {
    _hover: {
      backgroundColor: "color-mix(in oklab, {colors.accent} 8%, {colors.card})",
      borderColor: "color-mix(in oklab, {colors.accent} 50%, {colors.border})",
      color: "foreground",
    },
  },
  alignItems: "center",
  border: "1px solid {colors.border}",
  borderRadius: "md",
  color: "muted",
  cursor: "pointer",
  display: "none",
  flexShrink: 0,
  justifyContent: "center",
  marginInlineEnd: 3,
  mdToLg: { display: "flex" },
  padding: 1.5,
  transition:
    "border-color {durations.fast} {easings.out}, background-color {durations.fast} {easings.out}, color {durations.fast} {easings.out}",
});
