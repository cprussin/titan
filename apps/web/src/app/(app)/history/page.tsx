import { listWorkoutSessions } from "@titan/db/workout-sessions";
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { Metadata } from "next";
import type { HistoryRow } from "../../../components/HistoryContent";
import { HistoryContent } from "../../../components/HistoryContent";
import { db } from "../../../db";
import { templateNames } from "../../../server/template-names";
import { USER_ID } from "../../../user";

export const metadata: Metadata = {
  description: "Every training session you've logged, most recent first.",
  title: "History",
};

const HistoryPage = async () => {
  const [sessions, names] = await Promise.all([
    listWorkoutSessions(db, USER_ID, 60),
    templateNames(db),
  ]);

  const rows = sessions.map((session) => historyRow(session, names));

  return <HistoryContent load={{ isLoading: false, value: { rows } }} />;
};

export default HistoryPage;

/** One session's ledger row: its name, date-and-week line, deep link, and status
 *  badge — completed sessions carry a set count, in-progress ones a warning. */
const historyRow = (
  session: WorkoutSession,
  names: ReadonlyMap<string, string>,
): HistoryRow => {
  const sets = session.results.reduce(
    (count, result) => count + result.sets.length,
    0,
  );
  return {
    badge:
      session.status === "completed"
        ? { text: `${sets} sets`, tone: "success" }
        : { text: "In progress", tone: "warning" },
    href:
      session.status === "completed"
        ? `/workout/${session.id}/complete`
        : `/workout/${session.id}`,
    id: session.id,
    meta: `${session.scheduledDate} · Week ${session.weekNumber}`,
    name: names.get(session.sessionTemplateId) ?? session.sessionTemplateId,
  };
};
