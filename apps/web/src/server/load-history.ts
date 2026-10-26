import type { Db } from "@titan/db/client";
import { listWorkoutSessions } from "@titan/db/workout-sessions";
import type { WorkoutSession } from "@titan/domain/workout-session";
import type { HistoryData, HistoryRow } from "../components/HistoryContent";
import { templateNames } from "./template-names";

/** The history ledger: every logged session, newest first. Shared by the
 *  history page and the Android app's `/api/v1/history`. */
export const loadHistory = async (
  db: Db,
  userId: string,
): Promise<HistoryData> => {
  const [sessions, names] = await Promise.all([
    listWorkoutSessions(db, userId, 60),
    templateNames(db),
  ]);
  return { rows: sessions.map((session) => historyRow(session, names)) };
};

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
