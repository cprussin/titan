import { listWorkoutSessions } from "@titan/db/workout-sessions";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { grid, hstack, vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
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
    <div className={vstack({ alignItems: "stretch", gap: 4 })}>
      <h1 className={titleStyles}>History</h1>
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

const titleStyles = css({ fontSize: "3xl", fontWeight: "bold" });

const listStyles = grid({
  alignItems: "stretch",
  gap: 2,
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
});

const rowStyles = hstack({
  // Hover feedback only for a mouse-like pointer — on touch a tap shouldn't
  // leave a lingering border highlight.
  _pointerFine: { _hover: { borderColor: "borderStrong" } },
  backgroundColor: "card",
  blockSize: "100%",
  border: "1px solid {colors.border}",
  borderRadius: "lg",
  justifyContent: "space-between",
  padding: 3,
});

const nameStyles = css({ fontWeight: "medium" });

const metaStyles = css({ color: "muted", fontSize: "sm" });

const statusStyles = css({
  "&[data-status='in-progress']": { color: "accent" },
  color: "muted",
  fontSize: "sm",
});

const mutedStyles = css({ color: "muted" });
