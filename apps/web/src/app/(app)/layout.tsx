import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { css } from "../../../styled-system/css";
import { requireAuth } from "../../auth/session";
import { AppNav } from "../../components/AppNav";
import { NavDrawerProvider } from "../../components/NavDrawer";
import { TimezoneSync } from "../../components/TimezoneSync";
import { WorkoutActionButton } from "../../components/WorkoutActionButton";
import { db } from "../../db";
import { currentWorkoutAction } from "../../server/current-workout-action";
import { todayIso } from "../../server/local-date";
import { TIMEZONE_COOKIE } from "../../timezone";
import { USER_ID } from "../../user";

/**
 * Layout for the authenticated app. Guards the whole section on login status —
 * an unauthenticated visitor is redirected to /login before any page or chrome
 * renders — and frames every page with the primary navigation and the app-wide
 * workout action (a floating button until the sidebar is permanent at `lg`,
 * where it becomes a docked sidebar button). The login screen lives outside
 * this route group, so it renders no nav.
 */
// Everything in this route group is per-user and behind auth, so it carries no
// public, indexable content — keep it out of search results wholesale. Pages
// still set their own titles; only the robots directive is inherited.
export const metadata: Metadata = {
  robots: { follow: false, index: false },
};

const AppLayout = async ({ children }: { children: ReactNode }) => {
  const user = await requireAuth();
  const workoutAction = await currentWorkoutAction(
    db,
    USER_ID,
    await todayIso(),
  );
  const timeZone = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  return (
    <NavDrawerProvider>
      <TimezoneSync current={timeZone} />
      <div className={contentStyles}>
        <main className={mainStyles}>{children}</main>
      </div>
      <AppNav user={user} workoutAction={workoutAction} />
      {workoutAction !== undefined && (
        <WorkoutActionButton action={workoutAction} variant="fab" />
      )}
    </NavDrawerProvider>
  );
};

export default AppLayout;

// Reserve the sidebar's width from `lg` up, where the rail is permanent. In the
// `mdToLg` window the sidebar is an overlaid drawer, and below `md` it's the
// bottom bar — neither reserves inline space.
const contentStyles = css({ lg: { paddingInlineStart: 60 } });

const mainStyles = css({
  // Fills the area beside the rail so the top bar and content run the full
  // width. Padding steps up with the viewport; only from `lg` up — where the
  // permanent sidebar replaces the FAB with its docked button — does the tall
  // bottom padding the FAB needed go away.
  lg: { paddingBlock: 8, paddingInline: 8 },
  // Step the inline and block-start padding up at `md`, but leave the block-end
  // clearance alone: the FAB still floats through the `mdToLg` window, so the
  // tall base value has to survive until `lg` swaps in the sidebar button.
  md: { paddingBlockStart: 6, paddingInline: 6 },
  // The workout FAB stack floats over the page below `lg`, so the block-end
  // padding has to clear its whole height — otherwise the last of the content
  // scrolls under it. The stack (see `fabStyles` in WorkoutActionButton) sits
  // `env(safe-area-inset-bottom) + {spacing.24}` off the bottom and rises the
  // height of its two buttons above that: `xl` (12) + row gap (3) + `lg` (10).
  // Match that origin and add a little breathing room above the top button:
  // 24 + 12 + 3 + 10 + 4 = 53.
  paddingBlockEnd: "calc(env(safe-area-inset-bottom) + {spacing.53})",
  paddingBlockStart: 4,
  paddingInline: 4,
});
