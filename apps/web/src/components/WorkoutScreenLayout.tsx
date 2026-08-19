import { BarbellIcon } from "@phosphor-icons/react/dist/ssr/Barbell";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
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
// into the work area plus a standing session outline. Below `lg` it also fills
// the viewport height: the workout FAB is hidden on this route (see
// WorkoutActionButton), so reclaim main's FAB-clearance bottom padding with a
// matching negative margin and stretch down to just above the bottom tab bar.
// `dvh` accounts for mobile browser chrome; the reserved tab-bar band matches
// AppNav's height so the pinned action bar lands on top of the bar, not under
// it. This gives the action bar the room to drop all the way to the bottom of
// the screen when the set content is short.
const rootStyles = css({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  lg: {
    // From `lg` up the permanent sidebar replaces the FAB, main carries normal
    // padding, and the screen scrolls with the page again.
    marginBlockEnd: 0,
    minBlockSize: "auto",
  },
  marginBlockEnd: "calc(-1 * (env(safe-area-inset-bottom) + {spacing.53}))",
  md: {
    // The `mdToLg` window drops the phone tab bar (nav is an off-canvas drawer)
    // and steps main's block-start padding to 6 and its FAB clearance to 33.
    marginBlockEnd: "calc(-1 * (env(safe-area-inset-bottom) + {spacing.33}))",
    minBlockSize: "calc(100dvh - {spacing.6})",
  },
  minBlockSize:
    "calc(100dvh - {spacing.4} - max({spacing.18}, calc(env(safe-area-inset-bottom) + {spacing.16})))",
});

// One column on phones (outline hidden); a wide work area beside a narrower
// outline rail on desktop. Grows to fill the viewport-height root below `lg` so
// the work column can carry its action bar to the bottom of the screen.
const bodyStyles = css({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  gap: 4,
  lg: {
    alignItems: "start",
    display: "grid",
    flexGrow: 0,
    gap: 8,
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
  },
});

const mainColStyles = css({
  alignItems: "stretch",
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  gap: 4,
});

// The outline pane: hidden on phones, and on desktop it sticks in view while
// the work area scrolls through sets. It carries the logged sets too, so it
// scrolls within the viewport rather than running off the bottom on a long
// session.
const asideStyles = css({
  display: "none",
  lg: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    insetBlockStart: 8,
    maxBlockSize: "calc(100dvh - {spacing.16})",
    overflowY: "auto",
    position: "sticky",
  },
});
