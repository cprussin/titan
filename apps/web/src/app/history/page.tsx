import { listWorkoutSessions } from "@titan/db/workout-sessions";
import Link from "next/link";
import { css } from "../../../styled-system/css";
import { hstack, vstack } from "../../../styled-system/patterns";
import { requireAuth } from "../../auth/session";
import { Badge } from "../../components/Badge";
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
                  {session.status === "completed" ? (
                    <Badge tone="success">{`${sets} sets`}</Badge>
                  ) : (
                    <Badge tone="warning">In progress</Badge>
                  )}
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

// Two flat, hairline-ruled lists side by side on wider screens — column gap
// between them, no vertical gap so each column reads as one continuous list.
const listStyles = css({
  columnGap: 10,
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  rowGap: 0,
});

const rowStyles = hstack({
  // Hover only for a mouse-like pointer, so a tap on touch doesn't leave a
  // lingering tint. The negative inline margin lets the tint bleed to the row
  // edges while the hairline stays aligned to the text.
  _pointerFine: {
    _hover: {
      backgroundColor: "color-mix(in oklab, {colors.accent} 10%, transparent)",
    },
  },
  borderBlockEnd: "1px solid {colors.border}",
  borderRadius: "md",
  gap: 3,
  justifyContent: "space-between",
  marginInline: -2,
  paddingBlock: 3.5,
  paddingInline: 2,
  transition: "background-color {durations.fast} {easings.out}",
});

const nameStyles = css({ fontWeight: "medium" });

const metaStyles = css({
  color: "muted",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
});

const mutedStyles = css({ color: "muted" });
