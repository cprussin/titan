import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";
import { TopBar } from "./TopBar";

type Props = {
  /** The TopBar's trailing action — the cancel control, or a skeleton while
   *  loading. */
  actions: ReactNode;
  /** The desktop session-outline rail, hidden on phones. */
  aside: ReactNode;
  /** The work area: the current exercise and its logger, or their skeletons. */
  main: ReactNode;
  /** The progress track above the body. */
  progress: ReactNode;
};

/** The workout execution screen's layout scaffolding, shared by the live screen
 *  ({@link WorkoutExecution}) and its loading fallback: the fixed chrome, the
 *  progress track, and the two-column body — a wide work area beside the desktop
 *  outline rail. Owning the layout in one place keeps the loading placeholder
 *  from drifting from the live screen; each fills the same slots with real
 *  content or skeletons. */
export const WorkoutScreenLayout = ({
  actions,
  aside,
  main,
  progress,
}: Props) => (
  <div className={rootStyles}>
    <TopBar
      actions={actions}
      icon={<BarbellIcon size={18} />}
      title="Current Workout"
    />
    {progress}
    <div className={bodyStyles}>
      <div className={mainColStyles}>{main}</div>
      <aside className={asideStyles}>{aside}</aside>
    </div>
  </div>
);

// Fills the shared content width like every other page; on desktop it splits
// into the work area plus a standing session outline.
const rootStyles = vstack({ alignItems: "stretch", gap: 4 });

// One column on phones (outline hidden); a wide work area beside a narrower
// outline rail on desktop.
const bodyStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 4,
  lg: {
    alignItems: "start",
    display: "grid",
    gap: 8,
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
  },
});

const mainColStyles = vstack({
  alignItems: "stretch",
  gap: 4,
});

// The outline pane: hidden on phones, and on desktop it sticks in view while
// the work area scrolls through sets.
const asideStyles = css({
  display: "none",
  lg: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    insetBlockStart: 8,
    position: "sticky",
  },
});
