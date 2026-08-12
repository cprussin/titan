import { getAthleteState } from "@titan/db/athlete-state";
import type { Db } from "@titan/db/client";
import { getProgramVersion } from "@titan/db/program-versions";
import type { ProgramVersion, SessionTemplate } from "@titan/domain/program";
import type { ResolvedSession } from "@titan/program-engine/resolve-session";
import { resolveSession } from "@titan/program-engine/resolve-session";
import type { ProgramPosition } from "@titan/program-engine/schedule";
import { resolvePosition } from "@titan/program-engine/schedule";
import { isoDayOfWeek } from "../date";
import { buildSlotHistory, historyLookup } from "./slot-history";

/** What the athlete faces on a given day: a resolved workout, a rest day, or a
 *  signal that no active program is placed. A preview only — nothing is
 *  persisted until the workout is started. */
export type Today =
  | {
      dayOfWeek: number;
      kind: "workout";
      position: ProgramPosition;
      programVersion: ProgramVersion;
      resolved: ResolvedSession;
      scheduledDate: string;
      template: SessionTemplate;
    }
  | { kind: "rest" }
  | { kind: "no-program" };

/**
 * Resolve the athlete's day from their current program position and history.
 * Pure of side effects beyond reads; the resolution itself is deterministic
 * (see the program engine).
 */
export const resolveToday = async (
  db: Db,
  userId: string,
  scheduledDate: string,
): Promise<Today> => {
  const state = await getAthleteState(db, userId);
  return state === undefined
    ? { kind: "no-program" }
    : resolveScheduledDay(db, userId, state.absoluteWeek, scheduledDate);
};

/**
 * Resolve a day at an explicit absolute training week, rather than the athlete's
 * current one. The week picker uses this to preview a day of another week: the
 * same weekday in a different calendar week maps to a shifted absolute week, so
 * its projection reflects where the program will be then.
 */
export const resolveScheduledDay = async (
  db: Db,
  userId: string,
  absoluteWeek: number,
  scheduledDate: string,
): Promise<Today> => {
  const state = await getAthleteState(db, userId);
  if (state === undefined) {
    return { kind: "no-program" };
  } else {
    const programVersion = await getProgramVersion(db, state.programVersionId);
    return programVersion === undefined
      ? { kind: "no-program" }
      : resolveForVersion(
          db,
          userId,
          programVersion,
          absoluteWeek,
          scheduledDate,
        );
  }
};

const resolveForVersion = async (
  db: Db,
  userId: string,
  programVersion: ProgramVersion,
  absoluteWeek: number,
  scheduledDate: string,
): Promise<Today> => {
  const dayOfWeek = isoDayOfWeek(scheduledDate);
  const position = resolvePosition(programVersion, absoluteWeek, dayOfWeek);
  if (position === undefined || position.sessionTemplateId === undefined) {
    return position === undefined ? { kind: "no-program" } : { kind: "rest" };
  } else {
    const template = programVersion.sessionTemplates.find(
      (entry) => entry.id === position.sessionTemplateId,
    );
    if (template === undefined) {
      throw new Error(
        `session template ${position.sessionTemplateId} missing from program version ${programVersion.id}`,
      );
    } else {
      const history = await buildSlotHistory(db, userId);
      const resolved = resolveSession({
        historyBySlot: historyLookup(history),
        isDeloadWeek: position.isDeloadWeek,
        template,
        weekInBlock: position.weekInBlock,
      });
      return {
        dayOfWeek,
        kind: "workout",
        position,
        programVersion,
        resolved,
        scheduledDate,
        template,
      };
    }
  }
};
