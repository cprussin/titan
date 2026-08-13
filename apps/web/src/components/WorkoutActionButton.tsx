"use client";

import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { ScalesIcon } from "@phosphor-icons/react/dist/ssr/Scales";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { css, cva } from "../../styled-system/css";
import type { WorkoutAction } from "../server/workout-action";
import { Button } from "../ui";
import { WeighInDialog } from "./WeighInDialog";
import { WorkoutActionControl } from "./WorkoutActionControl";

type Props = {
  /** The day's workout action, or `undefined` when there's nothing to launch (a
   *  rest day or no program placed). The weigh-in affordance stands on its own
   *  and is offered regardless. */
  action?: WorkoutAction | undefined;
  /** `fab` floats above the page wherever the sidebar isn't permanent (phones
   *  and the `mdToLg` collapsed-drawer window); `sidebar` docks as full-width
   *  buttons in the permanent `lg` rail. Each is shown only at its own
   *  breakpoints, so the two instances never appear at once. */
  variant: "fab" | "sidebar";
};

/**
 * The app-wide chrome for logging bodyweight and launching the day's workout:
 * the weigh-in button is always offered, and — when there's one to launch — the
 * primary workout action rides alongside it (`continue` links into the
 * in-progress session, `start` opens the readiness check-in and creates today's
 * session).
 *
 * On phones the `fab` floats above the bottom bar as an Android-style stack:
 * icon-only circles centered on a shared vertical axis with their text labels
 * sitting to their left. The neutral secondary weigh-in keeps bodyweight one tap
 * away without competing with the accent primary; it sits on top with the
 * primary action below it, closest to the thumb. The `sidebar` docks the same
 * pair as full-width buttons in the wide-screen rail. Because the weigh-in never
 * depends on the workout action, both surfaces keep it once today's workout is
 * done (or on a rest day), where the launch control falls away.
 *
 * The launch control itself falls away once there's nothing to launch: while the
 * athlete is *on* their in-progress session's screen it would only duplicate
 * that screen's own controls (the FAB hides it entirely; the sidebar stands in a
 * same-size "Workout in progress" marker), and once today's workout is done
 * there's nothing left to start (the sidebar stands in a "Workout complete"
 * marker). Every other screen — including historical days — shows the real
 * action.
 */
export const WorkoutActionButton = ({ action, variant }: Props) => {
  const pathname = usePathname();
  const onActiveSession =
    action?.kind === "continue" &&
    isOnSessionScreen(pathname, action.sessionId);

  if (variant === "fab") {
    return onActiveSession ? undefined : (
      <div className={fabStyles}>
        <FabAction label="Weigh in">
          <WeighInDialog
            trigger={
              <Button label="Weigh in" rounded size="lg" variant="solid">
                <ScalesIcon size={18} />
              </Button>
            }
          />
        </FabAction>
        {(action?.kind === "start" || action?.kind === "continue") && (
          <FabAction
            label={
              action.kind === "continue" ? "Continue workout" : "Start workout"
            }
          >
            <WorkoutActionControl action={action} iconOnly rounded size="xl" />
          </FabAction>
        )}
      </div>
    );
  } else {
    return (
      <div className={sidebarStyles}>
        <SidebarWorkout action={action} onActiveSession={onActiveSession} />
        <WeighInDialog
          trigger={
            <Button beforeIcon={<ScalesIcon size={18} />} variant="outline">
              Weigh in
            </Button>
          }
        />
      </div>
    );
  }
};

/** The sidebar's workout portion above the weigh-in: a status marker when
 *  there's nothing to launch — the athlete is on their in-progress session's
 *  screen, or today's workout is already done — the live launch control when
 *  there's one, and nothing on a rest / no-program day. */
const SidebarWorkout = ({
  action,
  onActiveSession,
}: {
  action: WorkoutAction | undefined;
  onActiveSession: boolean;
}) => {
  if (onActiveSession) {
    return (
      <div className={markerStyles({ tone: "progress" })}>
        <span className={dotStyles} />
        Workout in progress
      </div>
    );
  } else if (action?.kind === "done") {
    return (
      <div className={markerStyles({ tone: "complete" })}>
        <CheckIcon size={16} weight="bold" />
        Workout complete
      </div>
    );
  } else if (action === undefined) {
    return undefined;
  } else {
    return <WorkoutActionControl action={action} />;
  }
};

type FabActionProps = {
  /** The visible text shown to the left of the icon-only button. It duplicates
   *  the button's own `aria-label`, so it's hidden from assistive tech. */
  label: string;
  children: ReactNode;
};

/** One row of the FAB stack: a floating text label sitting to the left of its
 *  icon-only button. The label and button are direct children of the stack's
 *  grid — the label right-aligns in the leading column, the button centers in
 *  the trailing column so every button shares one vertical axis (Android
 *  FAB-stack style). The button carries its own accessible name via
 *  `aria-label`; the visible label is decorative and `aria-hidden`. */
const FabAction = ({ label, children }: FabActionProps) => (
  <>
    <span aria-hidden className={labelStyles}>
      {label}
    </span>
    <span className={liftedStyles}>{children}</span>
  </>
);

/** Whether `pathname` is the workout screen for `sessionId` (the session's page
 *  or any of its sub-routes), matching on a full path segment so one id can't
 *  prefix-match another. */
const isOnSessionScreen = (pathname: string, sessionId: string): boolean => {
  const base = `/workout/${sessionId}`;
  return pathname === base || pathname.startsWith(`${base}/`);
};

// The floating action area: pinned to the bottom-end corner, lifted clear of
// the phone tab bar (and the OS safe-area inset below it). A two-column grid —
// labels in the leading column, buttons in the trailing one — so the secondary
// weigh-in stacks on top with the primary workout action below it (closest to
// the thumb) and every button's icon-only circle centers on one shared vertical
// axis while its text label sits to the left. Shown wherever the sidebar isn't
// permanently on screen: at the phone size (bottom-bar nav) and through the
// `mdToLg` window, where the sidebar is a collapsed off-canvas drawer and so
// carries no persistent workout action. Only from `lg` up — where the sidebar
// is always visible — does its docked button take over and the FAB hide.
const fabStyles = css({
  alignItems: "center",
  columnGap: 3,
  display: "grid",
  gridTemplateColumns: "auto auto",
  // At the phone size the FAB floats above the bottom tab bar, so it clears the
  // bar's height (plus the OS safe-area inset below it).
  insetBlockEnd: "calc(env(safe-area-inset-bottom) + {spacing.24})",
  insetInlineEnd: 4,
  lg: { display: "none" },
  // Through the `mdToLg` window there's no bottom bar — the nav is an off-canvas
  // drawer — so the FAB has nothing to clear and just sits its inline offset off
  // the bottom edge (still honoring the safe-area inset). Only the block-end
  // origin changes here; from `lg` up the FAB is hidden entirely.
  md: { insetBlockEnd: "calc(env(safe-area-inset-bottom) + {spacing.4})" },
  position: "fixed",
  rowGap: 3,
  zIndex: 8,
});

// The floating text label beside each button, on its own lifted surface so it
// reads as hovering with the button rather than sitting on the page. It fills
// the grid's leading column, right-aligned so every label's trailing edge lines
// up just to the left of the button axis.
const labelStyles = css({
  backgroundColor: "card",
  borderRadius: "full",
  boxShadow: "lifted",
  color: "foreground",
  fontSize: "sm",
  fontWeight: "medium",
  justifySelf: "end",
  paddingBlock: 1.5,
  paddingInline: 3,
  whiteSpace: "nowrap",
});

// Each floating button carries its own lifted shadow so it reads as hovering
// above the page; the full radius shapes that shadow to the rounded control it
// wraps. It centers in the grid's trailing column so buttons of different sizes
// (the `xl` primary and the smaller `lg` weigh-in) share one vertical axis.
const liftedStyles = css({
  borderRadius: "full",
  boxShadow: "lifted",
  display: "flex",
  justifySelf: "center",
});

// The sidebar counterpart: full-width buttons docked at the head of the nav
// rail, shown only from `lg` up where the sidebar is permanently on screen.
// Below `lg` the FAB stands in — including through the `mdToLg` window, where
// the sidebar collapses to an off-canvas drawer and would only surface these
// buttons while the drawer is open. Gating them to `lg` keeps them and the FAB
// mutually exclusive. `alignItems: stretch` fills the workout control (or its
// status marker) and the weigh-in button to the rail width; `gap` sets the two
// apart.
const sidebarStyles = css({
  alignItems: "stretch",
  display: "none",
  flexDirection: "column",
  gap: 2,
  lg: { display: "flex" },
  marginBlockEnd: 2,
});

// The status marker that stands in for the sidebar's workout control when
// there's nothing to launch. Sized to the `lg` control height (CONTROL_HEIGHT.lg)
// so swapping it for the button never shifts the rail, and tinted with a status
// language rather than looking like a disabled button: `progress` in the app's
// in-progress (warning) hue while the athlete is on that session's screen,
// `complete` in the success hue once today's workout is done.
const markerStyles = cva({
  base: {
    alignItems: "center",
    blockSize: 10,
    borderRadius: "lg",
    display: "flex",
    fontSize: "sm",
    fontWeight: "medium",
    gap: 2,
    justifyContent: "center",
  },
  variants: {
    tone: {
      complete: {
        backgroundColor:
          "color-mix(in oklab, {colors.success} 12%, {colors.background})",
        color: "color-mix(in oklab, {colors.success} 65%, {colors.foreground})",
      },
      progress: {
        backgroundColor:
          "color-mix(in oklab, {colors.warning} 12%, {colors.background})",
        color: "color-mix(in oklab, {colors.warning} 65%, {colors.foreground})",
      },
    },
  },
});

const dotStyles = css({
  backgroundColor: "warning",
  blockSize: 2,
  borderRadius: "full",
  flexShrink: 0,
  inlineSize: 2,
});
