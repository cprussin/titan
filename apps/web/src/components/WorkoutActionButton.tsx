"use client";

import { usePathname } from "next/navigation";
import { css } from "../../styled-system/css";
import type { WorkoutAction } from "../server/workout-action";
import { WorkoutActionControl } from "./WorkoutActionControl";

type Props = {
  action: WorkoutAction;
  /** `fab` floats above the bottom bar on phones and tablets; `sidebar` docks
   *  as a full-width button in the wide-screen rail. Each is shown only at its
   *  own breakpoints, so the two instances never appear at once. */
  variant: "fab" | "sidebar";
};

/**
 * The app-wide primary workout action: `continue` links into the in-progress
 * session, `start` opens the readiness check-in and creates today's session.
 *
 * While the athlete is *on* their in-progress session's screen the action would
 * only duplicate that screen's own controls, so the FAB hides and the sidebar
 * shows a same-size "Workout in progress" marker (keeping the rail from
 * shifting). Every other screen — including historical/completed workouts —
 * shows the real action.
 */
export const WorkoutActionButton = ({ action, variant }: Props) => {
  const pathname = usePathname();
  const onActiveSession =
    action.kind === "continue" && isOnSessionScreen(pathname, action.sessionId);

  if (variant === "fab") {
    return onActiveSession ? undefined : (
      <div className={fabStyles}>
        <WorkoutActionControl action={action} rounded size="xl" />
      </div>
    );
  } else {
    return (
      <div className={sidebarStyles}>
        {onActiveSession ? (
          <div className={inProgressStyles}>
            <span className={dotStyles} />
            Workout in progress
          </div>
        ) : (
          <WorkoutActionControl action={action} />
        )}
      </div>
    );
  }
};

/** Whether `pathname` is the workout screen for `sessionId` (the session's page
 *  or any of its sub-routes), matching on a full path segment so one id can't
 *  prefix-match another. */
const isOnSessionScreen = (pathname: string, sessionId: string): boolean => {
  const base = `/workout/${sessionId}`;
  return pathname === base || pathname.startsWith(`${base}/`);
};

// The floating action button: pinned to the bottom-end corner, lifted clear of
// the phone tab bar (and the OS safe-area inset below it). Shown only at the
// phone size, where that bottom bar is the nav; from `md` up — where the nav
// becomes a sidebar (a drawer through `mdToLg`, permanent at `lg`) — the sidebar
// button takes over. The pill's lifted shadow reads as floating.
const fabStyles = css({
  borderRadius: "full",
  boxShadow: "lifted",
  display: "flex",
  insetBlockEnd: "calc(env(safe-area-inset-bottom) + {spacing.20})",
  insetInlineEnd: 4,
  md: { display: "none" },
  position: "fixed",
  zIndex: 8,
});

// The sidebar counterpart: a full-width button docked at the head of the nav
// rail wherever the nav is a sidebar (from `md` up), so it rides inside the
// `mdToLg` drawer and the permanent `lg` rail alike. Below `md` the FAB stands
// in. `alignItems: stretch` fills the control (or the in-progress marker) to the
// rail width.
const sidebarStyles = css({
  alignItems: "stretch",
  display: "none",
  flexDirection: "column",
  marginBlockEnd: 2,
  md: { display: "flex" },
});

// The "workout in progress" marker that stands in for the action while the
// athlete is on that session's screen. Sized to the `lg` control height
// (CONTROL_HEIGHT.lg) so swapping it for the button never shifts the rail, and
// tinted with the app's in-progress (warning) language rather than looking like
// a disabled button.
const inProgressStyles = css({
  alignItems: "center",
  backgroundColor:
    "color-mix(in oklab, {colors.warning} 12%, {colors.background})",
  blockSize: 10,
  borderRadius: "lg",
  color: "color-mix(in oklab, {colors.warning} 65%, {colors.foreground})",
  display: "flex",
  fontSize: "sm",
  fontWeight: "medium",
  gap: 2,
  justifyContent: "center",
});

const dotStyles = css({
  backgroundColor: "warning",
  blockSize: 2,
  borderRadius: "full",
  flexShrink: 0,
  inlineSize: 2,
});
