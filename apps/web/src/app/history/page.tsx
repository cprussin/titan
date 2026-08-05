import { listWorkoutSessions } from "@titan/db/workout-sessions";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { grid, hstack, vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { PageHeader } from "../../components/PageHeader";
import { db } from "../../db";
import { templateNames } from "../../server/template-names";
import { USER_ID } from "../../user";

const HistoryPage = async () => {
  await requireAuth();
  const [sessions, names] = await Promise.all([
    listWorkoutSessions(db, USER_ID, 60),
    templateNames(db),
  ]);

  return (
    <div className={vstack({ alignItems: "stretch", gap: 4, lg: { gap: 6 } })}>
      <PageHeader
        description={
          sessions.length === 0
            ? undefined
            : `${sessions.length} logged session${sessions.length === 1 ? "" : "s"}`
        }
        title="History"
      />
      {sessions.length === 0 ? (
        <p className={mutedStyles}>No sessions yet — start today's workout.</p>
      ) : (
        <ul className={listStyles}>
          {sessions.map((session) => {
            const sets = session.results.reduce(
              (count, result) => count + result.sets.length,
              0,
            );
            const href =
              session.status === "completed"
                ? `/workout/${session.id}/complete`
                : `/workout/${session.id}`;
            return (
              <li key={session.id}>
                <Link className={rowStyles} href={href}>
                  <div
                    className={vstack({ alignItems: "flex-start", gap: 0.5 })}
                  >
                    <span className={nameStyles}>
                      {names.get(session.sessionTemplateId) ??
                        session.sessionTemplateId}
                    </span>
                    <span className={metaStyles}>
                      {session.scheduledDate} · Week {session.weekNumber}
                    </span>
                  </div>
                  <span className={statusStyles} data-status={session.status}>
                    {session.status === "completed"
                      ? `${sets} sets`
                      : session.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default HistoryPage;

const listStyles = grid({
  alignItems: "stretch",
  gap: 2,
  gridTemplateColumns: {
    base: "1fr",
    md: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(3, minmax(0, 1fr))",
  },
  lg: { gap: 3 },
});

const rowStyles = hstack({
  // Hover feedback only for a mouse-like pointer — on touch a tap shouldn't
  // leave a lingering border highlight; a fine pointer also lifts the card.
  _pointerFine: {
    _hover: { backgroundColor: "card", borderColor: "borderStrong" },
  },
  backgroundColor: "card",
  blockSize: "100%",
  border: "1px solid {colors.border}",
  borderRadius: "xl",
  justifyContent: "space-between",
  lg: { padding: 4 },
  padding: 3,
  transition:
    "border-color {durations.fast} {easings.out}, background-color {durations.fast} {easings.out}",
});

const nameStyles = css({ fontWeight: "medium" });

const metaStyles = css({
  color: "muted",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
});

const statusStyles = css({
  "&[data-status='in-progress']": { color: "accent" },
  color: "muted",
  fontSize: "sm",
});

const mutedStyles = css({ color: "muted" });
