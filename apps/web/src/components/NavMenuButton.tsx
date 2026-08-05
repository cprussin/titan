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
  _pointerFine: { _hover: { color: "foreground" } },
  alignItems: "center",
  color: "muted",
  cursor: "pointer",
  display: "none",
  flexShrink: 0,
  justifyContent: "center",
  marginInlineEnd: 0.5,
  mdToLg: { display: "flex" },
  transition: "color {durations.fast} {easings.out}",
});
