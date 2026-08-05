"use client";

import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { css } from "../../styled-system/css";
import { Button } from "../ui";
import { useNavDrawer } from "./NavDrawer";

/**
 * The top-bar control that slides the nav drawer in from the inline-start edge.
 * Only shown in the `mdToLg` window, where the sidebar is hidden off-canvas —
 * on phones the bottom tab bar navigates, and from `lg` up the sidebar is
 * permanent, so neither needs it. A standard outline icon button; the wrapper
 * carries the responsive visibility and the gap from the page path.
 */
export const NavMenuButton = () => {
  const { setOpen } = useNavDrawer();
  return (
    <span className={wrapperStyles}>
      <Button
        label="Open navigation"
        onClick={() => {
          setOpen(true);
        }}
        size="sm"
        variant="outline"
      >
        <ListIcon size={18} />
      </Button>
    </span>
  );
};

const wrapperStyles = css({
  display: "none",
  marginInlineEnd: 2,
  mdToLg: { alignItems: "center", display: "inline-flex" },
});
