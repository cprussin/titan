import type { ReactNode } from "react";
import { css } from "../../../styled-system/css";
import { requireAuth } from "../../auth/session";
import { AppNav } from "../../components/AppNav";
import { NavDrawerProvider } from "../../components/NavDrawer";
import { WorkoutActionButton } from "../../components/WorkoutActionButton";
import { dateIso } from "../../date";
import { db } from "../../db";
import { currentWorkoutAction } from "../../server/current-workout-action";
import { USER_ID } from "../../user";

/**
 * Layout for the authenticated app. Guards the whole section on login status —
 * an unauthenticated visitor is redirected to /login before any page or chrome
 * renders — and frames every page with the primary navigation and the app-wide
 * workout action (a floating button on phones, a sidebar button on wide
 * screens). The login screen lives outside this route group, so it renders no
 * nav.
 */
const AppLayout = async ({ children }: { children: ReactNode }) => {
  await requireAuth();
  const workoutAction = await currentWorkoutAction(db, USER_ID, dateIso());
  return (
    <NavDrawerProvider>
      <div className={contentStyles}>
        <main className={mainStyles}>{children}</main>
      </div>
      <AppNav workoutAction={workoutAction} />
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
  // width. Padding steps up with the viewport; from `md` up the rail replaces
  // the bottom bar, so the tall bottom padding it needed goes away.
  lg: { paddingBlock: 8, paddingInline: 8 },
  md: { paddingBlock: 6, paddingInline: 6 },
  paddingBlockEnd: 24,
  paddingBlockStart: 4,
  paddingInline: 4,
});
