"use client";

import { ScalesIcon } from "@phosphor-icons/react/dist/ssr/Scales";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import type { WorkoutAction } from "../server/workout-action";
import { Button } from "../ui";
import { WeighInDialog } from "./WeighInDialog";
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
 * On phones the `fab` floats that action above the bottom bar as an Android-
 * style stack: icon-only circles aligned to the trailing edge with their text
 * labels sitting to their left. It pairs the primary with a smaller, neutral
 * secondary weigh-in button so logging bodyweight is one tap away without
 * competing with the accent primary. The `sidebar` docks the primary action
 * alone in the wide-screen rail.
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
        <FabAction
          label={
            action.kind === "continue" ? "Continue workout" : "Start workout"
          }
        >
          <WorkoutActionControl action={action} iconOnly rounded size="xl" />
        </FabAction>
        <FabAction label="Weigh in">
          <WeighInDialog
            trigger={
              <Button label="Weigh in" rounded size="lg" variant="solid">
                <ScalesIcon size={18} />
              </Button>
            }
          />
        </FabAction>
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

type FabActionProps = {
  /** The visible text shown to the left of the icon-only button. It duplicates
   *  the button's own `aria-label`, so it's hidden from assistive tech. */
  label: string;
  children: ReactNode;
};

/** One row of the FAB stack: a floating text label sitting to the left of its
 *  icon-only button, both aligned to the trailing edge (Android FAB-stack
 *  style). The button carries its own accessible name via `aria-label`; the
 *  visible label is decorative and `aria-hidden`. */
const FabAction = ({ label, children }: FabActionProps) => (
  <div className={rowStyles}>
    <span aria-hidden className={labelStyles}>
      {label}
    </span>
    <span className={liftedStyles}>{children}</span>
  </div>
);

/** Whether `pathname` is the workout screen for `sessionId` (the session's page
 *  or any of its sub-routes), matching on a full path segment so one id can't
 *  prefix-match another. */
const isOnSessionScreen = (pathname: string, sessionId: string): boolean => {
  const base = `/workout/${sessionId}`;
  return pathname === base || pathname.startsWith(`${base}/`);
};

// The floating action area: pinned to the bottom-end corner, lifted clear of
// the phone tab bar (and the OS safe-area inset below it). The primary workout
// action stacks on top with the secondary weigh-in below it — closest to the
// thumb — and every button's icon-only circle aligns to the trailing edge with
// its text label to the left. Shown only at the phone size, where that bottom
// bar is the nav; from `md` up — where the nav becomes a sidebar (a drawer
// through `mdToLg`, permanent at `lg`) — the sidebar button takes over.
const fabStyles = css({
  alignItems: "flex-end",
  display: "flex",
  flexDirection: "column",
  gap: 3,
  insetBlockEnd: "calc(env(safe-area-inset-bottom) + {spacing.20})",
  insetInlineEnd: 4,
  md: { display: "none" },
  position: "fixed",
  zIndex: 8,
});

// One stack row: the label and its button aligned on the vertical center, the
// button trailing so every button aligns on the stack's trailing edge while the
// labels extend leftward.
const rowStyles = hstack({ gap: 3 });

// The floating text label beside each button, on its own lifted surface so it
// reads as hovering with the button rather than sitting on the page.
const labelStyles = css({
  backgroundColor: "card",
  borderRadius: "full",
  boxShadow: "lifted",
  color: "foreground",
  fontSize: "sm",
  fontWeight: "medium",
  paddingBlock: 1.5,
  paddingInline: 3,
  whiteSpace: "nowrap",
});

// Each floating button carries its own lifted shadow so it reads as hovering
// above the page; the full radius shapes that shadow to the rounded control it
// wraps.
const liftedStyles = css({
  borderRadius: "full",
  boxShadow: "lifted",
  display: "flex",
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
